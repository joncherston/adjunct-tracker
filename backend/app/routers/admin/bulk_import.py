"""
Bulk Import Routes
Admin endpoints for bulk importing adjunct data
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.adjunct import AdjunctInstructor, SemesterAdjunctAssignment, AdjunctCampusAssignment
from app.models.semester import Semester, SemesterRequest
from app.models.department import Department
from app.models.campus import Campus
from app.schemas.bulk_import import BulkAdjunctImportRequest, BulkImportResult
from app.utils.dependencies import get_current_active_user

router = APIRouter()


@router.post("/adjuncts", response_model=BulkImportResult)
async def bulk_import_adjuncts(
    import_data: BulkAdjunctImportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Bulk import adjunct instructors with semester assignments

    Creates or finds:
    - Adjunct instructors
    - Semester
    - Semester requests for each department
    - Assignments linking instructors to departments and campuses
    """
    errors = []
    success_count = 0
    created_instructors = 0
    existing_instructors = 0

    # Parse semester name (e.g., "Fall 2025" -> type="Fall", year=2025)
    semester_parts = import_data.semester_name.strip().split()
    if len(semester_parts) != 2:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid semester name format. Expected 'Season YYYY' (e.g., 'Fall 2025'), got '{import_data.semester_name}'"
        )

    semester_type = semester_parts[0]
    try:
        semester_year = int(semester_parts[1])
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid year in semester name: '{semester_parts[1]}'"
        )

    # Get or create semester
    semester = db.query(Semester).filter(
        Semester.semester_type == semester_type,
        Semester.year == semester_year
    ).first()

    if not semester:
        # Need to get current user for created_by_user_id
        semester = Semester(
            semester_type=semester_type,
            year=semester_year,
            is_active=True,
            created_by_user_id=current_user.id
        )
        db.add(semester)
        db.commit()
        db.refresh(semester)

    # Process each row
    for idx, row in enumerate(import_data.rows, start=1):
        try:
            # Find or create adjunct instructor
            adjunct = db.query(AdjunctInstructor).filter(
                AdjunctInstructor.full_name == row.full_name
            ).first()

            if not adjunct:
                adjunct = AdjunctInstructor(
                    full_name=row.full_name,
                    email=row.email.lower() if row.email else None
                )
                db.add(adjunct)
                db.commit()
                db.refresh(adjunct)
                created_instructors += 1
            else:
                existing_instructors += 1

            # Find department
            department = db.query(Department).filter(
                Department.name.ilike(row.department_name)
            ).first()

            if not department:
                errors.append(f"Row {idx}: Department '{row.department_name}' not found")
                continue

            # Find campus
            campus = db.query(Campus).filter(
                Campus.name.ilike(row.campus_name)
            ).first()

            if not campus:
                errors.append(f"Row {idx}: Campus '{row.campus_name}' not found")
                continue

            # Get or create semester request for this department
            semester_request = db.query(SemesterRequest).filter(
                SemesterRequest.semester_id == semester.id,
                SemesterRequest.department_id == department.id
            ).first()

            if not semester_request:
                # Create a semester request automatically for bulk import
                semester_request = SemesterRequest(
                    semester_id=semester.id,
                    department_id=department.id,
                    access_token=str(uuid.uuid4()),
                    is_submitted=True  # Mark as submitted since we're importing data
                )
                db.add(semester_request)
                db.commit()
                db.refresh(semester_request)

            # Check if assignment already exists
            existing_assignment = db.query(SemesterAdjunctAssignment).filter(
                SemesterAdjunctAssignment.semester_request_id == semester_request.id,
                SemesterAdjunctAssignment.adjunct_instructor_id == adjunct.id,
                SemesterAdjunctAssignment.department_id == department.id
            ).first()

            if existing_assignment:
                # Assignment already exists, skip
                success_count += 1
                continue

            # Create assignment
            assignment = SemesterAdjunctAssignment(
                semester_request_id=semester_request.id,
                adjunct_instructor_id=adjunct.id,
                department_id=department.id
            )
            db.add(assignment)
            db.commit()
            db.refresh(assignment)

            # Create campus assignment
            campus_assignment = AdjunctCampusAssignment(
                assignment_id=assignment.id,
                campus_id=campus.id
            )
            db.add(campus_assignment)
            db.commit()

            success_count += 1

        except Exception as e:
            errors.append(f"Row {idx}: {str(e)}")
            db.rollback()
            continue

    return BulkImportResult(
        success_count=success_count,
        error_count=len(errors),
        errors=errors,
        created_instructors=created_instructors,
        existing_instructors=existing_instructors
    )
