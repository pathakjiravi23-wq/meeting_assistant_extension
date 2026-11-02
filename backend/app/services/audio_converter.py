import asyncio


async def convert_webm_to_pcm(webm_data: bytes) -> bytes:

    process = await asyncio.create_subprocess_exec(
        "ffmpeg",
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
        "pipe:1",
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )

    pcm_data, error = await process.communicate(webm_data)

    if process.returncode != 0:
        raise RuntimeError(error.decode())

    return pcm_data
