"""
Pydantic schemas for bulk import operations
"""
from typing import List
from pydantic import BaseModel


class BulkAdjunctImportRow(BaseModel):
    """Single row for bulk import"""
    full_name: str
    department_name: str
    campus_name: str
    email: str | None = None


class BulkAdjunctImportRequest(BaseModel):
    """Request for bulk importing adjuncts with semester assignments"""
    semester_name: str  # e.g., "Fall 2025"
    rows: List[BulkAdjunctImportRow]


class BulkImportResult(BaseModel):
    """Result of bulk import operation"""
    success_count: int
    error_count: int
    errors: List[str]
    created_instructors: int
    existing_instructors: int
