"""
Department Chair Submission Routes
Public endpoints for department chairs to submit adjunct data using access tokens
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_

from app.database import get_db
from app.models.semester import Semester, SemesterRequest
from app.models.department import Department
from app.models.adjunct import AdjunctInstructor, SemesterAdjunctAssignment
from app.schemas.submit import (
    SemesterRequestDetailResponse,
    SubmitAdjunctData,
    AdjunctSubmissionResponse,
    PreviousSemesterInfo,
    CopyFromPreviousResponse
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


@router.get("/{access_token}/previous-semesters", response_model=List[PreviousSemesterInfo])
async def get_previous_semesters(
    access_token: str,
    db: Session = Depends(get_db)
):
    """
    Get list of previous semesters where this department submitted adjunct data

    Used for the "Copy from Previous Semester" feature
    """
    # Verify access token and get current request
    current_request = db.query(SemesterRequest).options(
        joinedload(SemesterRequest.semester)
    ).filter(SemesterRequest.access_token == access_token).first()

    if not current_request:
        raise HTTPException(status_code=404, detail="Invalid access token")

    if current_request.is_submitted:
        raise HTTPException(status_code=400, detail="This request has already been submitted")

    # Find all previous submitted requests for this department
    # Exclude current semester
    previous_requests = db.query(SemesterRequest).options(
        joinedload(SemesterRequest.semester)
    ).filter(
        and_(
            SemesterRequest.department_id == current_request.department_id,
            SemesterRequest.is_submitted == True,
            SemesterRequest.semester_id != current_request.semester_id
        )
    ).order_by(SemesterRequest.semester_id.desc()).all()

    # Build response with adjunct counts
    result = []
    for req in previous_requests:
        adjunct_count = db.query(SemesterAdjunctAssignment).filter(
            SemesterAdjunctAssignment.semester_request_id == req.id
        ).count()

        result.append({
            "semester_id": req.semester_id,
            "semester_display_name": req.semester.display_name,
            "adjunct_count": adjunct_count,
            "submitted_at": req.submitted_at
        })

    return result


@router.post("/{access_token}/copy-from/{semester_id}", response_model=CopyFromPreviousResponse)
async def copy_from_previous_semester(
    access_token: str,
    semester_id: int,
    db: Session = Depends(get_db)
):
    """
    Copy all adjunct instructors from a previous semester

    This creates new assignments for the current semester based on a previous submission
    """
    # Verify access token and get current request
    current_request = db.query(SemesterRequest).filter(
        SemesterRequest.access_token == access_token
    ).first()

    if not current_request:
        raise HTTPException(status_code=404, detail="Invalid access token")

    if current_request.is_submitted:
        raise HTTPException(status_code=400, detail="This request has already been submitted and cannot be modified")

    # Find the previous semester request
    previous_request = db.query(SemesterRequest).filter(
        and_(
            SemesterRequest.semester_id == semester_id,
            SemesterRequest.department_id == current_request.department_id,
            SemesterRequest.is_submitted == True
        )
    ).first()

    if not previous_request:
        raise HTTPException(
            status_code=404,
            detail="Previous semester submission not found for this department"
        )

    # Get all assignments from previous semester
    previous_assignments = db.query(SemesterAdjunctAssignment).filter(
        SemesterAdjunctAssignment.semester_request_id == previous_request.id
    ).all()

    if not previous_assignments:
        raise HTTPException(
            status_code=400,
            detail="No adjuncts found in the previous semester"
        )

    # Copy assignments to current semester
    copied_count = 0
    skipped_count = 0

    for prev_assignment in previous_assignments:
        # Check if this adjunct is already assigned in current semester
        existing = db.query(SemesterAdjunctAssignment).filter(
            and_(
                SemesterAdjunctAssignment.semester_request_id == current_request.id,
                SemesterAdjunctAssignment.adjunct_instructor_id == prev_assignment.adjunct_instructor_id
            )
        ).first()

        if not existing:
            # Create new assignment
            new_assignment = SemesterAdjunctAssignment(
                semester_request_id=current_request.id,
                adjunct_instructor_id=prev_assignment.adjunct_instructor_id,
                department_id=current_request.department_id
            )
            db.add(new_assignment)
            copied_count += 1
        else:
            skipped_count += 1

    db.commit()

    return {
        "message": f"Successfully copied {copied_count} adjunct(s) from previous semester",
        "copied_count": copied_count,
        "skipped_count": skipped_count
    }


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
