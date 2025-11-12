"""
Reports Routes
Admin endpoints for viewing reports
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.user import User
from app.models.semester import Semester, SemesterRequest
from app.models.adjunct import SemesterAdjunctAssignment, AdjunctInstructor
from app.models.department import Department
from app.schemas.reports import SemesterReportResponse
from app.utils.dependencies import get_current_active_user

router = APIRouter()


@router.get("/semester/{semester_id}", response_model=SemesterReportResponse)
async def get_semester_report(
    semester_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get comprehensive report for a semester showing all adjuncts by department

    Returns all submitted adjunct data organized for reporting
    """
    # Get semester
    semester = db.query(Semester).filter(Semester.id == semester_id).first()

    if not semester:
        raise HTTPException(status_code=404, detail="Semester not found")

    # Get all assignments for this semester with related data
    assignments = db.query(SemesterAdjunctAssignment).join(
        SemesterRequest
    ).options(
        joinedload(SemesterAdjunctAssignment.adjunct),
        joinedload(SemesterAdjunctAssignment.department),
        joinedload(SemesterAdjunctAssignment.semester_request).joinedload(SemesterRequest.semester)
    ).filter(
        SemesterRequest.semester_id == semester_id,
        SemesterRequest.is_submitted == True  # Only show submitted data
    ).order_by(
        Department.name,
        AdjunctInstructor.full_name
    ).all()

    # Get all requests for this semester to show submission stats
    requests = db.query(SemesterRequest).options(
        joinedload(SemesterRequest.department)
    ).filter(
        SemesterRequest.semester_id == semester_id
    ).all()

    # Count unique adjuncts and detect multi-department instructors
    adjunct_counts = {}
    for assignment in assignments:
        adj_id = assignment.adjunct.id
        if adj_id not in adjunct_counts:
            adjunct_counts[adj_id] = {
                'adjunct': assignment.adjunct,
                'departments': set(),
                'count': 0
            }
        adjunct_counts[adj_id]['departments'].add(assignment.department.name)
        adjunct_counts[adj_id]['count'] += 1

    # Identify multi-department instructors
    multi_dept_adjuncts = [
        adj_id for adj_id, data in adjunct_counts.items()
        if len(data['departments']) > 1
    ]

    return {
        'semester': semester,
        'requests': requests,
        'assignments': assignments,
        'total_adjuncts': len(adjunct_counts),
        'multi_department_adjunct_ids': multi_dept_adjuncts
    }
