"""
Test script for Department CRUD operations
Tests departments with optional chair assignments
"""
import requests
import json

BASE_URL = "http://localhost:8000/api"

def login():
    """Login and get access token"""
    print("\n=== Testing Login ===")
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "admin@suscc.edu",
        "password": "ChangeMe123!"
    })

    if response.status_code == 200:
        data = response.json()
        print(f"✓ Login successful: {data['user']['full_name']}")
        return data['access_token']
    else:
        print(f"✗ Login failed: {response.status_code} - {response.text}")
        return None

def create_test_chair(token):
    """Create a test department chair for testing"""
    print("\n=== Creating Test Department Chair ===")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(
        f"{BASE_URL}/admin/chairs",
        headers=headers,
        json={"full_name": "Dr. Test Chair", "email": "testchair@suscc.edu"}
    )

    if response.status_code == 201:
        chair = response.json()
        print(f"✓ Created test chair: {chair['full_name']} (ID: {chair['id']})")
        return chair
    elif response.status_code == 400:
        # Chair might already exist from previous test
        print(f"Note: Chair already exists, fetching all chairs...")
        response = requests.get(f"{BASE_URL}/admin/chairs", headers=headers)
        if response.status_code == 200:
            chairs = response.json()
            for chair in chairs:
                if chair['email'] == "testchair@suscc.edu":
                    print(f"✓ Using existing test chair (ID: {chair['id']})")
                    return chair
        return None
    else:
        print(f"✗ Failed to create chair: {response.status_code} - {response.text}")
        return None

def get_all_departments(token):
    """Get all departments"""
    print("\n=== Testing GET All Departments ===")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/admin/departments", headers=headers)

    if response.status_code == 200:
        departments = response.json()
        print(f"✓ Retrieved {len(departments)} departments:")
        for dept in departments:
            chair_info = f" (Chair: {dept['chair']['full_name']})" if dept.get('chair') else " (No chair)"
            print(f"  - {dept['name']}{chair_info} - Active: {dept['is_active']}")
        return departments
    else:
        print(f"✗ Failed to get departments: {response.status_code} - {response.text}")
        return []

def create_department(token, name, chair_id=None):
    """Create a new department"""
    chair_text = f" with chair ID {chair_id}" if chair_id else " (no chair)"
    print(f"\n=== Testing CREATE Department: {name}{chair_text} ===")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(
        f"{BASE_URL}/admin/departments",
        headers=headers,
        json={"name": name, "chair_id": chair_id}
    )

    if response.status_code == 201:
        dept = response.json()
        chair_info = f" (Chair: {dept['chair']['full_name']})" if dept.get('chair') else " (No chair)"
        print(f"✓ Created department: {dept['name']}{chair_info} - ID: {dept['id']}")
        return dept
    else:
        print(f"✗ Failed to create department: {response.status_code} - {response.text}")
        return None

def update_department(token, dept_id, name, chair_id=None):
    """Update a department"""
    print(f"\n=== Testing UPDATE Department (ID: {dept_id}) ===")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.put(
        f"{BASE_URL}/admin/departments/{dept_id}",
        headers=headers,
        json={"name": name, "chair_id": chair_id}
    )

    if response.status_code == 200:
        dept = response.json()
        chair_info = f" (Chair: {dept['chair']['full_name']})" if dept.get('chair') else " (No chair)"
        print(f"✓ Updated department: {dept['name']}{chair_info}")
        return dept
    else:
        print(f"✗ Failed to update department: {response.status_code} - {response.text}")
        return None

def delete_department(token, dept_id):
    """Delete (soft delete) a department"""
    print(f"\n=== Testing DELETE Department (ID: {dept_id}) ===")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.delete(f"{BASE_URL}/admin/departments/{dept_id}", headers=headers)

    if response.status_code == 204:
        print(f"✓ Deleted department (soft delete)")
        return True
    else:
        print(f"✗ Failed to delete department: {response.status_code} - {response.text}")
        return False

def test_invalid_chair(token):
    """Test creating department with invalid chair ID (should fail)"""
    print(f"\n=== Testing CREATE with Invalid Chair ID (should fail) ===")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(
        f"{BASE_URL}/admin/departments",
        headers=headers,
        json={"name": "Test Dept", "chair_id": 99999}  # Non-existent chair
    )

    if response.status_code == 400:
        print(f"✓ Correctly rejected invalid chair ID")
        return True
    else:
        print(f"✗ Unexpected response: {response.status_code} - {response.text}")
        return False

def main():
    print("=" * 70)
    print("DEPARTMENT CRUD TESTING (with Chair Relationships)")
    print("=" * 70)

    # Test authentication first
    token = login()
    if not token:
        print("\n✗ Cannot continue without authentication")
        return

    # Create a test chair for department assignment
    test_chair = create_test_chair(token)

    # Test getting existing departments
    existing_departments = get_all_departments(token)

    # Test creating department without chair
    dept1 = create_department(token, "Computer Science")

    # Test creating department with chair
    if test_chair:
        dept2 = create_department(token, "Mathematics", test_chair['id'])
    else:
        dept2 = create_department(token, "Mathematics")

    # Test creating duplicate (should fail)
    if dept1:
        print("\n=== Testing Duplicate Department (should fail) ===")
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(
            f"{BASE_URL}/admin/departments",
            headers=headers,
            json={"name": "Computer Science", "chair_id": None}
        )
        if response.status_code == 400:
            print(f"✓ Correctly rejected duplicate: {response.json()['detail']}")

    # Test invalid chair ID
    test_invalid_chair(token)

    # Test updating department - add chair
    if dept1 and test_chair:
        update_department(token, dept1['id'], "Computer Science", test_chair['id'])

    # Test updating department - change name and remove chair
    if dept2:
        update_department(token, dept2['id'], "Applied Mathematics", None)

    # Get all departments to see updates
    get_all_departments(token)

    # Test deleting department
    if dept1:
        delete_department(token, dept1['id'])

    # Verify soft delete
    print("\n=== Verifying Soft Delete (include_inactive=True) ===")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/admin/departments?include_inactive=true", headers=headers)
    if response.status_code == 200:
        all_departments = response.json()
        inactive = [d for d in all_departments if not d['is_active']]
        print(f"✓ Found {len(inactive)} inactive department(s)")
        for dept in inactive:
            chair_info = f" (Chair: {dept['chair']['full_name']})" if dept.get('chair') else " (No chair)"
            print(f"  - {dept['name']}{chair_info} - Active: {dept['is_active']}")

    print("\n" + "=" * 70)
    print("TESTING COMPLETE")
    print("=" * 70)

if __name__ == "__main__":
    main()
