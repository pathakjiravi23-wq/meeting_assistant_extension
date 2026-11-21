import uuid
from datetime import datetime

from sqlalchemy import String, Float, Integer, ForeignKey, Text, TIMESTAMP, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Meeting(Base):
    __tablename__ = "meetings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    title: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False
    )
    ended_at: Mapped[datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="recording")
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=datetime.utcnow
    )

    segments: Mapped[list["Segment"]] = relationship(
        "Segment", back_populates="meeting", cascade="all, delete"
    )
    speakers: Mapped[list["Speaker"]] = relationship(
        "Speaker", back_populates="meeting", cascade="all, delete"
    )
    summary: Mapped["Summary | None"] = relationship(
        "Summary", back_populates="meeting", cascade="all, delete", uselist=False
    )
    flashcards: Mapped[list["Flashcard"]] = relationship(
        "Flashcard", back_populates="meeting", cascade="all, delete"
    )
    tasks: Mapped[list["Task"]] = relationship(
        "Task", back_populates="meeting", cascade="all, delete"
    )


class Speaker(Base):
    __tablename__ = "speakers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    meeting_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("meetings.id", ondelete="CASCADE")
    )
    speaker_index: Mapped[int] = mapped_column(
        Integer, nullable=False
    )  # Deepgram's 0,1,2,3
    name: Mapped[str | None] = mapped_column(Text, nullable=True)  # user-assigned later
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=datetime.utcnow
    )

    meeting: Mapped["Meeting"] = relationship("Meeting", back_populates="speakers")


class Segment(Base):
    __tablename__ = "segments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    meeting_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("meetings.id", ondelete="CASCADE")
    )
    speaker_index: Mapped[int] = mapped_column(Integer, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)  # raw transcript
    start_time: Mapped[float] = mapped_column(
        Float, nullable=False
    )  # Deepgram result.start
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=datetime.utcnow
    )

    meeting: Mapped["Meeting"] = relationship("Meeting", back_populates="segments")


class Summary(Base):
    __tablename__ = "summaries"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    meeting_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("meetings.id", ondelete="CASCADE"), unique=True
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    model_used: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=datetime.utcnow
    )

    meeting: Mapped["Meeting"] = relationship("Meeting", back_populates="summary")


class Flashcard(Base):
    __tablename__ = "flashcards"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    meeting_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("meetings.id", ondelete="CASCADE")
    )
    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=datetime.utcnow
    )

    meeting: Mapped["Meeting"] = relationship("Meeting", back_populates="flashcards")


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    meeting_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("meetings.id", ondelete="CASCADE")
    )
    type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # email | jira | slack
    status: Mapped[str] = mapped_column(
        String(50), default="pending"
    )  # pending | running | done | failed
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)  # flexible task data
    result: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), default=datetime.utcnow
    )
    executed_at: Mapped[datetime | None] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True
    )

    meeting: Mapped["Meeting"] = relationship("Meeting", back_populates="tasks")
