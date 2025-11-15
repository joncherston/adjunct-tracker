#!/bin/bash
# Diagnostic script to check semester request and chair data

echo "======================================"
echo "Semester Tracking Diagnostics"
echo "======================================"
echo ""

docker compose exec backend python -c "
import sqlite3
conn = sqlite3.connect('/app/data/adjunct_tracker.db')
cursor = conn.cursor()

print('=== DEPARTMENT CHAIRS ===')
cursor.execute('''
    SELECT d.id, d.name, d.chair_id, dc.full_name, dc.email
    FROM departments d
    LEFT JOIN department_chairs dc ON d.chair_id = dc.id
    ORDER BY d.name
''')
for row in cursor.fetchall():
    chair_status = f'{row[3]} ({row[4]})' if row[2] else 'NO CHAIR ASSIGNED'
    print(f'{row[1]}: {chair_status}')

print('')
print('=== SEMESTER REQUESTS WITH CHAIR INFO ===')
cursor.execute('''
    SELECT
        sr.id,
        s.semester_type || ' ' || s.year as semester,
        d.name as dept,
        sr.is_submitted,
        dc.full_name as chair_name,
        dc.email as chair_email
    FROM semester_requests sr
    JOIN semesters s ON sr.semester_id = s.id
    JOIN departments d ON sr.department_id = d.id
    LEFT JOIN department_chairs dc ON d.chair_id = dc.id
    ORDER BY s.id, d.name
''')
for row in cursor.fetchall():
    submitted = 'YES' if row[3] else 'NO'
    chair = row[4] if row[4] else 'NO CHAIR'
    print(f'Request #{row[0]}: {row[1]} - {row[2]} - Submitted: {submitted} - Chair: {chair}')

conn.close()
"

echo ""
echo "======================================"
echo "If chairs are assigned in database but not showing in UI:"
echo "1. Hard refresh browser (Ctrl+Shift+R)"
echo "2. Check browser console for errors (F12)"
echo "3. Verify backend is running: docker compose ps"
echo "======================================"
