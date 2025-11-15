"""
Semester Assignment Management Routes
Admin endpoints for managing semester adjunct assignments
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User
from app.models.semester import Semester, SemesterRequest
from app.models.adjunct import (
    SemesterAdjunctAssignment,
    AdjunctInstructor,
    AdjunctCampusAssignment,
    AdjunctCourseAssignment,
    Course
)
from app.models.department import Department
from app.models.campus import Campus
from app.utils.dependencies import get_current_active_user

router = APIRouter()


class UpdateAssignmentRequest(BaseModel):
    """Schema for updating an assignment"""
    campus_ids: List[int]
    course_names: List[str]


class AddAssignmentRequest(BaseModel):
    """Schema for adding a new assignment"""
    adjunct_id: int
    department_id: int
    campus_ids: List[int]
    course_names: List[str] = []


@router.get("/{semester_id}/assignments")
async def get_semester_assignments(
    semester_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all adjunct assignments for a semester with full details
    """
    # Verify semester exists
    semester = db.query(Semester).filter(Semester.id == semester_id).first()
    if not semester:
        raise HTTPException(status_code=404, detail="Semester not found")

    # Get all assignments with related data
    assignments = db.query(SemesterAdjunctAssignment).join(
        SemesterRequest
    ).options(
        joinedload(SemesterAdjunctAssignment.adjunct),
        joinedload(SemesterAdjunctAssignment.department),
        joinedload(SemesterAdjunctAssignment.semester_request),
        joinedload(SemesterAdjunctAssignment.campus_assignments).joinedload(AdjunctCampusAssignment.campus),
        joinedload(SemesterAdjunctAssignment.course_assignments).joinedload(AdjunctCourseAssignment.course)
    ).filter(
        SemesterRequest.semester_id == semester_id
    ).order_by(
        SemesterAdjunctAssignment.department_id,
        AdjunctInstructor.full_name
    ).all()

    return {
        "semester": semester,
        "assignments": assignments
    }


@router.put("/{semester_id}/assignments/{assignment_id}")
async def update_assignment(
    semester_id: int,
    assignment_id: int,
    data: UpdateAssignmentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update an assignment's campuses and courses
    """
    # Get the assignment
    assignment = db.query(SemesterAdjunctAssignment).options(
        joinedload(SemesterAdjunctAssignment.semester_request),
        joinedload(SemesterAdjunctAssignment.campus_assignments),
        joinedload(SemesterAdjunctAssignment.course_assignments)
    ).filter(
        SemesterAdjunctAssignment.id == assignment_id
    ).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Verify it belongs to the semester
    if assignment.semester_request.semester_id != semester_id:
        raise HTTPException(status_code=400, detail="Assignment does not belong to this semester")

    # Update campus assignments
    # Remove existing
    for ca in assignment.campus_assignments:
        db.delete(ca)
    db.flush()

    # Add new campus assignments
    for campus_id in data.campus_ids:
        campus = db.query(Campus).filter(Campus.id == campus_id).first()
        if not campus:
            raise HTTPException(status_code=400, detail=f"Campus {campus_id} not found")

        campus_assignment = AdjunctCampusAssignment(
            assignment_id=assignment.id,
            campus_id=campus_id
        )
        db.add(campus_assignment)

    # Update course assignments
    # Remove existing
    for course_assignment in assignment.course_assignments:
        db.delete(course_assignment)
    db.flush()

    # Add new course assignments
    for course_name in data.course_names:
        if not course_name.strip():
            continue

        # Find or create course
        course = db.query(Course).filter(Course.course_name == course_name.strip()).first()
        if not course:
            course = Course(course_name=course_name.strip())
            db.add(course)
            db.flush()

        course_assignment = AdjunctCourseAssignment(
            assignment_id=assignment.id,
            course_id=course.id
        )
        db.add(course_assignment)

    db.commit()
    db.refresh(assignment)

    return {"message": "Assignment updated successfully"}


@router.post("/{semester_id}/assignments")
async def add_assignment(
    semester_id: int,
    data: AddAssignmentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Add a new adjunct assignment to a semester
    """
    # Verify semester exists
    semester = db.query(Semester).filter(Semester.id == semester_id).first()
    if not semester:
        raise HTTPException(status_code=404, detail="Semester not found")

    # Verify adjunct exists
    adjunct = db.query(AdjunctInstructor).filter(AdjunctInstructor.id == data.adjunct_id).first()
    if not adjunct:
        raise HTTPException(status_code=404, detail="Adjunct not found")

    # Verify department exists
    department = db.query(Department).filter(Department.id == data.department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")

    # Get or create semester request for this department
    semester_request = db.query(SemesterRequest).filter(
        SemesterRequest.semester_id == semester_id,
        SemesterRequest.department_id == data.department_id
    ).first()

    if not semester_request:
        import uuid
        semester_request = SemesterRequest(
            semester_id=semester_id,
            department_id=data.department_id,
            access_token=str(uuid.uuid4()),
            is_submitted=True
        )
        db.add(semester_request)
        db.commit()
        db.refresh(semester_request)

    # Check if assignment already exists
    existing = db.query(SemesterAdjunctAssignment).filter(
        SemesterAdjunctAssignment.semester_request_id == semester_request.id,
        SemesterAdjunctAssignment.adjunct_instructor_id == data.adjunct_id,
        SemesterAdjunctAssignment.department_id == data.department_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="This adjunct is already assigned to this department for this semester")

    # Create assignment
    assignment = SemesterAdjunctAssignment(
        semester_request_id=semester_request.id,
        adjunct_instructor_id=data.adjunct_id,
        department_id=data.department_id
    )
    db.add(assignment)
    db.flush()

    # Add campus assignments
    for campus_id in data.campus_ids:
        campus = db.query(Campus).filter(Campus.id == campus_id).first()
        if not campus:
            raise HTTPException(status_code=400, detail=f"Campus {campus_id} not found")

        campus_assignment = AdjunctCampusAssignment(
            assignment_id=assignment.id,
            campus_id=campus_id
        )
        db.add(campus_assignment)

    # Add course assignments
    for course_name in data.course_names:
        if not course_name.strip():
            continue

        course = db.query(Course).filter(Course.course_name == course_name.strip()).first()
        if not course:
            course = Course(course_name=course_name.strip())
            db.add(course)
            db.flush()

        course_assignment = AdjunctCourseAssignment(
            assignment_id=assignment.id,
            course_id=course.id
        )
        db.add(course_assignment)

    db.commit()

    return {"message": "Assignment added successfully", "assignment_id": assignment.id}


@router.delete("/{semester_id}/assignments/{assignment_id}")
async def delete_assignment(
    semester_id: int,
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete an adjunct assignment from a semester
    """
    # Get the assignment
    assignment = db.query(SemesterAdjunctAssignment).options(
        joinedload(SemesterAdjunctAssignment.semester_request)
    ).filter(
        SemesterAdjunctAssignment.id == assignment_id
    ).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Verify it belongs to the semester
    if assignment.semester_request.semester_id != semester_id:
        raise HTTPException(status_code=400, detail="Assignment does not belong to this semester")

    db.delete(assignment)
    db.commit()

    return {"message": "Assignment deleted successfully"}
