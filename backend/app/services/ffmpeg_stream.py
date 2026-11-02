import asyncio
from asyncio.subprocess import Process
from typing import AsyncIterator, Optional

FRAME_BYTES = 1024  # 512 samples x 2 bytes, required by Gnani


class FFmpegAudioStream:
    """
    Persistent WebM/Opus -> PCM s16le 16 kHz mono decoder.

    stdout and stderr are drained continuously in background tasks so FFmpeg
    never blocks on a full pipe. Complete PCM frames are published to an
    internal queue as soon as they are decoded.
    """

    def __init__(self, frame_bytes: int = FRAME_BYTES):
        self.frame_bytes = frame_bytes
        self.process: Optional[Process] = None
        self._pending = bytearray()
        self._frames: asyncio.Queue[Optional[bytes]] = asyncio.Queue()
        self._stdout_task: Optional[asyncio.Task] = None
        self._stderr_task: Optional[asyncio.Task] = None
        self._stderr = bytearray()
        self.output_buffer = bytearray()  # every PCM byte decoded, for debugging

    async def start(self) -> None:
        if self.process is not None:
            raise RuntimeError("FFmpeg is already running")

        self.process = await asyncio.create_subprocess_exec(
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-f",
            "webm",
            "-i",
            "pipe:0",
            "-f",
            "s16le",
            "-acodec",
            "pcm_s16le",
            "-ac",
            "1",
            "-ar",
            "16000",
            "-flush_packets",
            "1",
            "pipe:1",
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        self._stdout_task = asyncio.create_task(self._read_stdout())
        self._stderr_task = asyncio.create_task(self._read_stderr())

    async def write(self, webm_chunk: bytes) -> None:
        if self.process is None or self.process.stdin is None:
            raise RuntimeError("FFmpeg is not running")

        self.process.stdin.write(webm_chunk)
        await self.process.stdin.drain()

    async def frames(self) -> AsyncIterator[bytes]:
        """Yield complete PCM frames as they are decoded, until the stream closes."""
        while True:
            frame = await self._frames.get()
            if frame is None:
                return
            yield frame

    async def close(self) -> None:
        if self.process is None:
            return

        process = self.process

        if process.stdin is not None:
            process.stdin.close()
            try:
                await process.stdin.wait_closed()
            except (BrokenPipeError, ConnectionResetError):
                pass

        if self._stdout_task is not None:
            await self._stdout_task
        if self._stderr_task is not None:
            await self._stderr_task

        returncode = await process.wait()

        # Flush the final partial frame, padded with silence.
        if self._pending:
            self._pending.extend(b"\x00" * (self.frame_bytes - len(self._pending)))
            await self._emit(bytes(self._pending))
            self._pending.clear()

        await self._frames.put(None)

        self.process = None
        self._stdout_task = None
        self._stderr_task = None

        if returncode != 0:
            raise RuntimeError(self._stderr.decode(errors="replace"))

    async def _read_stdout(self) -> None:
        assert self.process is not None and self.process.stdout is not None
        stdout = self.process.stdout

        while True:
            data = await stdout.read(4096)
            if not data:
                break

            self.output_buffer.extend(data)
            self._pending.extend(data)

            while len(self._pending) >= self.frame_bytes:
                frame = bytes(self._pending[: self.frame_bytes])
                del self._pending[: self.frame_bytes]
                await self._emit(frame)

    async def _read_stderr(self) -> None:
        assert self.process is not None and self.process.stderr is not None
        stderr = self.process.stderr

        while True:
            data = await stderr.read(4096)
            if not data:
                break
            self._stderr.extend(data)

    async def _emit(self, frame: bytes) -> None:
        await self._frames.put(frame)
