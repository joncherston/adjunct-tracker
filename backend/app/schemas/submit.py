"""
Pydantic schemas for Department Chair Submission
"""
from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, EmailStr


class SubmitAdjunctData(BaseModel):
    """Schema for adding an adjunct to a semester request"""
    full_name: str
    email: EmailStr
    campus_ids: List[int] = []  # Multiple campuses
    course_names: List[str] = []  # Multiple courses


class AdjunctSubmissionResponse(BaseModel):
    """Response after adding an adjunct"""
    message: str
    adjunct_id: int
    assignment_id: int


class AdjunctInfo(BaseModel):
    """Nested schema for adjunct instructor info"""
    id: int
    full_name: str
    email: str

    model_config = {
        "from_attributes": True
    }


class CampusInfo(BaseModel):
    """Nested schema for campus info"""
    id: int
    name: str

    model_config = {
        "from_attributes": True
    }


class CourseInfo(BaseModel):
    """Nested schema for course info"""
    id: int
    course_name: str

    model_config = {
        "from_attributes": True
    }


class CampusAssignmentInfo(BaseModel):
    """Schema for campus assignment"""
    id: int
    campus: CampusInfo

    model_config = {
        "from_attributes": True
    }


class CourseAssignmentInfo(BaseModel):
    """Schema for course assignment"""
    id: int
    course: CourseInfo

    model_config = {
        "from_attributes": True
    }


class SemesterAdjunctAssignmentInfo(BaseModel):
    """Schema for semester adjunct assignment"""
    id: int
    adjunct_instructor_id: int
    adjunct: AdjunctInfo
    campus_assignments: List[CampusAssignmentInfo] = []
    course_assignments: List[CourseAssignmentInfo] = []

    model_config = {
        "from_attributes": True
    }


class SemesterInfo(BaseModel):
    """Nested schema for semester info"""
    id: int
    semester_type: str
    year: int
    deadline: Optional[date]
    custom_message: Optional[str]
    display_name: str

    model_config = {
        "from_attributes": True
    }


class DepartmentChairInfo(BaseModel):
    """Nested schema for department chair"""
    id: int
    full_name: str
    email: str

    model_config = {
        "from_attributes": True
    }


class DepartmentInfo(BaseModel):
    """Nested schema for department"""
    id: int
    name: str
    chair: Optional[DepartmentChairInfo]

    model_config = {
        "from_attributes": True
    }


class SemesterRequestDetailResponse(BaseModel):
    """Detailed response for semester request accessed by token"""
    id: int
    access_token: str
    is_submitted: bool
    submitted_at: Optional[datetime]
    semester: SemesterInfo
    department: DepartmentInfo
    assignments: List[SemesterAdjunctAssignmentInfo]

    model_config = {
        "from_attributes": True
    }


class PreviousSemesterInfo(BaseModel):
    """Info about a previous semester for copy functionality"""
    semester_id: int
    semester_display_name: str
    adjunct_count: int
    submitted_at: datetime


class CopyFromPreviousResponse(BaseModel):
    """Response after copying from previous semester"""
    message: str
    copied_count: int
    skipped_count: int
