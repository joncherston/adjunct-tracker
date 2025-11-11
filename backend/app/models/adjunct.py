"""Adjunct instructor and related assignment models"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class AdjunctInstructor(Base):
    """AdjunctInstructor model - represents an adjunct instructor"""

    __tablename__ = "adjunct_instructors"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    assignments = relationship("SemesterAdjunctAssignment", back_populates="adjunct")

    def __repr__(self):
        return f"<AdjunctInstructor(id={self.id}, full_name='{self.full_name}', email='{self.email}')>"


class SemesterAdjunctAssignment(Base):
    """SemesterAdjunctAssignment model - links an adjunct to a semester request"""

    __tablename__ = "semester_adjunct_assignments"

    id = Column(Integer, primary_key=True, index=True)
    semester_request_id = Column(Integer, ForeignKey("semester_requests.id"), nullable=False, index=True)
    adjunct_instructor_id = Column(Integer, ForeignKey("adjunct_instructors.id"), nullable=False, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    semester_request = relationship("SemesterRequest", back_populates="assignments")
    adjunct = relationship("AdjunctInstructor", back_populates="assignments")
    department = relationship("Department")
    campus_assignments = relationship("AdjunctCampusAssignment", back_populates="assignment", cascade="all, delete-orphan")
    course_assignments = relationship("AdjunctCourseAssignment", back_populates="assignment", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<SemesterAdjunctAssignment(id={self.id}, semester_request_id={self.semester_request_id}, adjunct_id={self.adjunct_instructor_id})>"


class AdjunctCampusAssignment(Base):
    """AdjunctCampusAssignment model - links an assignment to a campus"""

    __tablename__ = "adjunct_campus_assignments"
    __table_args__ = (
        UniqueConstraint('assignment_id', 'campus_id', name='uq_assignment_campus'),
    )

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("semester_adjunct_assignments.id"), nullable=False)
    campus_id = Column(Integer, ForeignKey("campuses.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    assignment = relationship("SemesterAdjunctAssignment", back_populates="campus_assignments")
    campus = relationship("Campus")

    def __repr__(self):
        return f"<AdjunctCampusAssignment(id={self.id}, assignment_id={self.assignment_id}, campus_id={self.campus_id})>"


class Course(Base):
    """Course model - represents a course that can be taught"""

    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    course_name = Column(String, unique=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def __repr__(self):
        return f"<Course(id={self.id}, course_name='{self.course_name}')>"


class AdjunctCourseAssignment(Base):
    """AdjunctCourseAssignment model - links an assignment to a course"""

    __tablename__ = "adjunct_course_assignments"
    __table_args__ = (
        UniqueConstraint('assignment_id', 'course_id', name='uq_assignment_course'),
    )

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("semester_adjunct_assignments.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    assignment = relationship("SemesterAdjunctAssignment", back_populates="course_assignments")
    course = relationship("Course")

    def __repr__(self):
        return f"<AdjunctCourseAssignment(id={self.id}, assignment_id={self.assignment_id}, course_id={self.course_id})>"
