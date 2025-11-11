"""Seed initial data for the application"""

from sqlalchemy.orm import Session
from app.database import SessionLocal, init_db
from app.models.campus import Campus
from app.models.user import User
from app.utils.security import hash_password


def seed_campuses(db: Session):
    """Seed initial campus data"""
    campuses = ["Wadley", "Opelika", "Valley"]

    for campus_name in campuses:
        # Check if campus already exists
        existing = db.query(Campus).filter(Campus.name == campus_name).first()
        if not existing:
            campus = Campus(name=campus_name)
            db.add(campus)
            print(f"✓ Created campus: {campus_name}")
        else:
            print(f"⊙ Campus already exists: {campus_name}")

    db.commit()


def seed_admin_user(db: Session):
    """Seed initial admin user"""
    admin_email = "admin@suscc.edu"

    # Check if admin already exists
    existing = db.query(User).filter(User.email == admin_email).first()
    if not existing:
        admin = User(
            email=admin_email,
            password_hash=hash_password("ChangeMe123!"),
            full_name="Admin User"
        )
        db.add(admin)
        db.commit()
        print(f"✓ Created admin user: {admin_email}")
        print("  Default password: ChangeMe123!")
        print("  ⚠️  IMPORTANT: Change this password immediately after first login!")
    else:
        print(f"⊙ Admin user already exists: {admin_email}")


def main():
    """Main seed function"""
    print("=== Seeding Database ===\n")

    # Initialize database (create tables if they don't exist)
    init_db()
    print("✓ Database initialized\n")

    # Create session
    db = SessionLocal()

    try:
        # Seed data
        print("Seeding campuses...")
        seed_campuses(db)

        print("\nSeeding admin user...")
        seed_admin_user(db)

        print("\n=== Seeding Complete! ===")
        print("\nYou can now start the application:")
        print("  uvicorn app.main:app --reload\n")

    except Exception as e:
        print(f"\n❌ Error seeding data: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
