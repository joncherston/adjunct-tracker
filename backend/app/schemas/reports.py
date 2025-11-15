"""
Pydantic schemas for Reports
"""
from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel


class AdjunctInfo(BaseModel):
    """Adjunct instructor info"""
    id: int
    full_name: str
    email: Optional[str] = None  # Made optional

    model_config = {
        "from_attributes": True
    }


class DepartmentInfo(BaseModel):
    """Department info"""
    id: int
    name: str

    model_config = {
        "from_attributes": True
    }


class SemesterInfo(BaseModel):
    """Semester info"""
    id: int
    semester_type: str
    year: int
    display_name: str

    model_config = {
        "from_attributes": True
    }


class CampusInfo(BaseModel):
    """Campus info"""
    id: int
    name: str

    model_config = {
        "from_attributes": True
    }


class CourseInfo(BaseModel):
    """Course info"""
    id: int
    course_name: str

    model_config = {
        "from_attributes": True
    }


class CampusAssignmentInfo(BaseModel):
    """Campus assignment info"""
    id: int
    campus: CampusInfo

    model_config = {
        "from_attributes": True
    }


class CourseAssignmentInfo(BaseModel):
    """Course assignment info"""
    id: int
    course: CourseInfo

    model_config = {
        "from_attributes": True
    }


class AssignmentInfo(BaseModel):
    """Assignment info for reports"""
    id: int
    adjunct: AdjunctInfo
    department: DepartmentInfo
    campus_assignments: List[CampusAssignmentInfo] = []
    course_assignments: List[CourseAssignmentInfo] = []

    model_config = {
        "from_attributes": True
    }


class RequestInfo(BaseModel):
    """Request info for stats"""
    id: int
    department: DepartmentInfo
    is_submitted: bool
    submitted_at: Optional[datetime]

    model_config = {
        "from_attributes": True
    }


class SemesterReportResponse(BaseModel):
    """Comprehensive semester report"""
    semester: SemesterInfo
    requests: List[RequestInfo]
    assignments: List[AssignmentInfo]
    total_adjuncts: int
    multi_department_adjunct_ids: List[int]

    model_config = {
        "from_attributes": True
    }
