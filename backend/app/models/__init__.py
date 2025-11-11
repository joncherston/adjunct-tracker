"""Database models for the SUSCC Adjunct Tracker"""

from app.models.user import User
from app.models.campus import Campus
from app.models.department_chair import DepartmentChair
from app.models.department import Department
from app.models.semester import Semester, SemesterRequest
from app.models.adjunct import (
    AdjunctInstructor,
    SemesterAdjunctAssignment,
    AdjunctCampusAssignment,
    Course,
    AdjunctCourseAssignment
)

__all__ = [
    "User",
    "Campus",
    "DepartmentChair",
    "Department",
    "Semester",
    "SemesterRequest",
    "AdjunctInstructor",
    "SemesterAdjunctAssignment",
    "AdjunctCampusAssignment",
    "Course",
    "AdjunctCourseAssignment",
]
