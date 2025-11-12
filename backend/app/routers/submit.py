"""
Department Chair Submission Routes
Public endpoints for department chairs to submit adjunct data using access tokens
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.semester import Semester, SemesterRequest
from app.models.department import Department
from app.models.adjunct import AdjunctInstructor, SemesterAdjunctAssignment
from app.schemas.submit import (
    SemesterRequestDetailResponse,
    SubmitAdjunctData,
    AdjunctSubmissionResponse
)

router = APIRouter()


@router.get("/{access_token}", response_model=SemesterRequestDetailResponse)
async def get_semester_request_by_token(
    access_token: str,
    db: Session = Depends(get_db)
):
    """
    Get semester request details by access token

    This is the public endpoint that department chairs use to access their submission form
    No authentication required - the token IS the authentication
    """
    semester_request = db.query(SemesterRequest).options(
        joinedload(SemesterRequest.semester),
        joinedload(SemesterRequest.department).joinedload(Department.chair),
        joinedload(SemesterRequest.assignments).joinedload(SemesterAdjunctAssignment.adjunct)
    ).filter(SemesterRequest.access_token == access_token).first()

    if not semester_request:
        raise HTTPException(status_code=404, detail="Invalid or expired access token")

    return semester_request


@router.post("/{access_token}/adjuncts", response_model=AdjunctSubmissionResponse)
async def add_or_update_adjunct(
    access_token: str,
    adjunct_data: SubmitAdjunctData,
    db: Session = Depends(get_db)
):
    """
    Add or update an adjunct instructor for this semester request

    If an adjunct with the same email exists, update their information
    Otherwise, create a new adjunct instructor
    """
    # Verify access token
    semester_request = db.query(SemesterRequest).filter(
        SemesterRequest.access_token == access_token
    ).first()

    if not semester_request:
        raise HTTPException(status_code=404, detail="Invalid access token")

    if semester_request.is_submitted:
        raise HTTPException(status_code=400, detail="This request has already been submitted and cannot be modified")

    # Check if adjunct exists by email (case-insensitive)
    adjunct = db.query(AdjunctInstructor).filter(
        AdjunctInstructor.email.ilike(adjunct_data.email)
    ).first()

    if not adjunct:
        # Create new adjunct
        adjunct = AdjunctInstructor(
            full_name=adjunct_data.full_name,
            email=adjunct_data.email.lower()
        )
        db.add(adjunct)
        db.flush()

    # Check if assignment already exists
    assignment = db.query(SemesterAdjunctAssignment).filter(
        SemesterAdjunctAssignment.semester_request_id == semester_request.id,
        SemesterAdjunctAssignment.adjunct_instructor_id == adjunct.id
    ).first()

    if assignment:
        raise HTTPException(
            status_code=400,
            detail=f"Adjunct {adjunct.full_name} has already been added to this request"
        )

    # Create semester assignment
    assignment = SemesterAdjunctAssignment(
        semester_request_id=semester_request.id,
        adjunct_instructor_id=adjunct.id,
        department_id=semester_request.department_id
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    return {
        "message": f"Adjunct {adjunct.full_name} added successfully",
        "adjunct_id": adjunct.id,
        "assignment_id": assignment.id
    }


@router.delete("/{access_token}/adjuncts/{assignment_id}", status_code=204)
async def remove_adjunct(
    access_token: str,
    assignment_id: int,
    db: Session = Depends(get_db)
):
    """Remove an adjunct from this semester request"""
    # Verify access token
    semester_request = db.query(SemesterRequest).filter(
        SemesterRequest.access_token == access_token
    ).first()

    if not semester_request:
        raise HTTPException(status_code=404, detail="Invalid access token")

    if semester_request.is_submitted:
        raise HTTPException(status_code=400, detail="This request has already been submitted and cannot be modified")

    # Find and delete assignment
    assignment = db.query(SemesterAdjunctAssignment).filter(
        SemesterAdjunctAssignment.id == assignment_id,
        SemesterAdjunctAssignment.semester_request_id == semester_request.id
    ).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    db.delete(assignment)
    db.commit()

    return None


@router.post("/{access_token}/submit", status_code=200)
async def submit_request(
    access_token: str,
    db: Session = Depends(get_db)
):
    """
    Mark the semester request as submitted

    Once submitted, no further changes can be made
    """
    semester_request = db.query(SemesterRequest).filter(
        SemesterRequest.access_token == access_token
    ).first()

    if not semester_request:
        raise HTTPException(status_code=404, detail="Invalid access token")

    if semester_request.is_submitted:
        raise HTTPException(status_code=400, detail="This request has already been submitted")

    # Mark as submitted
    from datetime import datetime
    semester_request.is_submitted = True
    semester_request.submitted_at = datetime.utcnow()

    db.commit()

    return {
        "message": "Submission completed successfully",
        "submitted_at": semester_request.submitted_at
    }
