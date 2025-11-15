"""
Migration: Make email optional in adjunct_instructors table

SQLite doesn't support ALTER COLUMN, so we need to recreate the table
"""
import sqlite3
import os

def migrate():
    """Make email column nullable in adjunct_instructors table"""

    # Get database path
    db_path = os.getenv('DATABASE_URL', 'sqlite:///./adjunct_tracker.db').replace('sqlite:///', '')

    print(f"Connecting to database: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Check if migration is needed
        cursor.execute("PRAGMA table_info(adjunct_instructors)")
        columns = cursor.fetchall()
        email_col = next((col for col in columns if col[1] == 'email'), None)

        if email_col and email_col[3] == 1:  # notnull = 1
            print("Migration needed: email column is NOT NULL")

            # Start transaction
            cursor.execute("BEGIN TRANSACTION")

            # Create new table with nullable email
            cursor.execute("""
                CREATE TABLE adjunct_instructors_new (
                    id INTEGER PRIMARY KEY,
                    full_name VARCHAR NOT NULL,
                    email VARCHAR,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
                )
            """)

            # Copy data from old table
            cursor.execute("""
                INSERT INTO adjunct_instructors_new (id, full_name, email, created_at, updated_at)
                SELECT id, full_name, email, created_at, updated_at
                FROM adjunct_instructors
            """)

            # Drop old table
            cursor.execute("DROP TABLE adjunct_instructors")

            # Rename new table
            cursor.execute("ALTER TABLE adjunct_instructors_new RENAME TO adjunct_instructors")

            # Recreate index
            cursor.execute("CREATE INDEX ix_adjunct_instructors_email ON adjunct_instructors (email)")
            cursor.execute("CREATE INDEX ix_adjunct_instructors_id ON adjunct_instructors (id)")

            # Commit transaction
            conn.commit()
            print("✓ Migration completed successfully")
        else:
            print("✓ Migration not needed: email column is already nullable")

    except Exception as e:
        conn.rollback()
        print(f"✗ Migration failed: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
