#!/usr/bin/env python3
"""
Run all database migrations in order
"""
import os
import sys

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(__file__))

# Import migrations
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'migrations'))
import _001_make_email_optional as migration_001

def main():
    """Run all migrations"""
    print("=" * 60)
    print("Running Database Migrations")
    print("=" * 60)

    migrations = [
        ("001_make_email_optional", migration_001.migrate),
    ]

    for name, migrate_func in migrations:
        print(f"\n[{name}]")
        try:
            migrate_func()
        except Exception as e:
            print(f"ERROR: Migration {name} failed: {e}")
            sys.exit(1)

    print("\n" + "=" * 60)
    print("All migrations completed successfully!")
    print("=" * 60)

if __name__ == "__main__":
    main()
