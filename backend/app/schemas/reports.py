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
    email: str

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


class AssignmentInfo(BaseModel):
    """Assignment info for reports"""
    id: int
    adjunct: AdjunctInfo
    department: DepartmentInfo

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
