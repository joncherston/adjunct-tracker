"""Semester and SemesterRequest models"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Semester(Base):
    """Semester model - represents an academic semester"""

    __tablename__ = "semesters"
    __table_args__ = (
        UniqueConstraint('semester_type', 'year', name='uq_semester_year'),
    )

    id = Column(Integer, primary_key=True, index=True)
    semester_type = Column(String, nullable=False)  # 'Fall', 'Spring', 'Summer'
    year = Column(Integer, nullable=False)
    deadline = Column(Date, nullable=True)
    custom_message = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    created_by = relationship("User")
    requests = relationship("SemesterRequest", back_populates="semester", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Semester(id={self.id}, semester_type='{self.semester_type}', year={self.year})>"

    @property
    def display_name(self):
        """Returns a formatted display name like 'Fall 2025'"""
        return f"{self.semester_type} {self.year}"


class SemesterRequest(Base):
    """SemesterRequest model - represents a request for a department to submit adjunct data for a semester"""

    __tablename__ = "semester_requests"
    __table_args__ = (
        UniqueConstraint('semester_id', 'department_id', name='uq_semester_department'),
    )

    id = Column(Integer, primary_key=True, index=True)
    semester_id = Column(Integer, ForeignKey("semesters.id"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    access_token = Column(String, unique=True, nullable=False, index=True)  # UUID for secure access
    is_submitted = Column(Boolean, default=False, nullable=False)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    last_reminded_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    semester = relationship("Semester", back_populates="requests")
    department = relationship("Department")
    assignments = relationship("SemesterAdjunctAssignment", back_populates="semester_request", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<SemesterRequest(id={self.id}, semester_id={self.semester_id}, department_id={self.department_id}, is_submitted={self.is_submitted})>"
