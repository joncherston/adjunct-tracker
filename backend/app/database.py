"""Database configuration and session management"""

from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

# Create database engine
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
    echo=settings.DEBUG
)

# Enable foreign key constraints for SQLite
if "sqlite" in settings.DATABASE_URL:
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_conn, connection_record):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db():
    """
    Dependency function to get database session.
    Used in FastAPI route dependencies.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database - create all tables"""
    Base.metadata.create_all(bind=engine)


def create_default_admin():
    """Create default admin user if it doesn't exist"""
    from app.models.user import User
    from app.utils.security import hash_password

    db = SessionLocal()
    try:
        # Check if admin user already exists
        admin = db.query(User).filter(User.email == settings.DEFAULT_ADMIN_EMAIL).first()

        if not admin:
            # Create default admin user
            admin = User(
                email=settings.DEFAULT_ADMIN_EMAIL,
                name=settings.DEFAULT_ADMIN_NAME,
                password_hash=hash_password(settings.DEFAULT_ADMIN_PASSWORD),
                is_active=True,
                is_admin=True
            )
            db.add(admin)
            db.commit()
            print(f"✓ Created default admin user: {settings.DEFAULT_ADMIN_EMAIL}")
        else:
            print(f"✓ Default admin user already exists: {settings.DEFAULT_ADMIN_EMAIL}")
    except Exception as e:
        print(f"✗ Error creating default admin user: {e}")
        db.rollback()
    finally:
        db.close()
