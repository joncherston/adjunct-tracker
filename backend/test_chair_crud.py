"""
Test script for Department Chair CRUD operations
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

def get_all_chairs(token):
    """Get all department chairs"""
    print("\n=== Testing GET All Department Chairs ===")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/admin/chairs", headers=headers)

    if response.status_code == 200:
        chairs = response.json()
        print(f"✓ Retrieved {len(chairs)} department chairs:")
        for chair in chairs:
            print(f"  - {chair['full_name']} ({chair['email']}) - Active: {chair['is_active']}")
        return chairs
    else:
        print(f"✗ Failed to get chairs: {response.status_code} - {response.text}")
        return []

def create_chair(token, full_name, email):
    """Create a new department chair"""
    print(f"\n=== Testing CREATE Department Chair: {full_name} ===")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(
        f"{BASE_URL}/admin/chairs",
        headers=headers,
        json={"full_name": full_name, "email": email}
    )

    if response.status_code == 201:
        chair = response.json()
        print(f"✓ Created chair: {chair['full_name']} ({chair['email']}) - ID: {chair['id']}")
        return chair
    else:
        print(f"✗ Failed to create chair: {response.status_code} - {response.text}")
        return None

def create_duplicate_chair(token, full_name, email):
    """Test creating duplicate chair (should fail)"""
    print(f"\n=== Testing CREATE Duplicate Chair Email: {email} (should fail) ===")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(
        f"{BASE_URL}/admin/chairs",
        headers=headers,
        json={"full_name": full_name, "email": email}
    )

    if response.status_code == 400:
        print(f"✓ Correctly rejected duplicate email: {response.json()['detail']}")
        return True
    else:
        print(f"✗ Unexpected response: {response.status_code} - {response.text}")
        return False

def get_single_chair(token, chair_id):
    """Get a single department chair by ID"""
    print(f"\n=== Testing GET Single Chair (ID: {chair_id}) ===")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/admin/chairs/{chair_id}", headers=headers)

    if response.status_code == 200:
        chair = response.json()
        print(f"✓ Retrieved chair: {chair['full_name']} ({chair['email']})")
        return chair
    else:
        print(f"✗ Failed to get chair: {response.status_code} - {response.text}")
        return None

def update_chair(token, chair_id, full_name, email):
    """Update a department chair"""
    print(f"\n=== Testing UPDATE Chair (ID: {chair_id}) ===")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.put(
        f"{BASE_URL}/admin/chairs/{chair_id}",
        headers=headers,
        json={"full_name": full_name, "email": email}
    )

    if response.status_code == 200:
        chair = response.json()
        print(f"✓ Updated chair: {chair['full_name']} ({chair['email']})")
        return chair
    else:
        print(f"✗ Failed to update chair: {response.status_code} - {response.text}")
        return None

def delete_chair(token, chair_id):
    """Delete (soft delete) a department chair"""
    print(f"\n=== Testing DELETE Chair (ID: {chair_id}) ===")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.delete(f"{BASE_URL}/admin/chairs/{chair_id}", headers=headers)

    if response.status_code == 204:
        print(f"✓ Deleted chair (soft delete)")
        return True
    else:
        print(f"✗ Failed to delete chair: {response.status_code} - {response.text}")
        return False

def test_invalid_email(token):
    """Test creating chair with invalid email (should fail)"""
    print(f"\n=== Testing CREATE Chair with Invalid Email (should fail) ===")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(
        f"{BASE_URL}/admin/chairs",
        headers=headers,
        json={"full_name": "Test User", "email": "not-an-email"}
    )

    if response.status_code == 422:  # Validation error
        print(f"✓ Correctly rejected invalid email format")
        return True
    else:
        print(f"✗ Unexpected response: {response.status_code} - {response.text}")
        return False

def test_without_auth():
    """Test accessing chairs without authentication (should fail)"""
    print("\n=== Testing Access Without Auth (should fail) ===")
    response = requests.get(f"{BASE_URL}/admin/chairs")

    if response.status_code == 403:
        print(f"✓ Correctly rejected request without authentication")
        return True
    else:
        print(f"✗ Unexpected response: {response.status_code}")
        return False

def main():
    print("=" * 60)
    print("DEPARTMENT CHAIR CRUD TESTING")
    print("=" * 60)

    # Test authentication first
    token = login()
    if not token:
        print("\n✗ Cannot continue without authentication")
        return

    # Test getting existing chairs
    existing_chairs = get_all_chairs(token)

    # Test creating a new chair
    new_chair = create_chair(token, "Dr. Sarah Johnson", "sjohnson@suscc.edu")

    # Test duplicate creation (should fail)
    if new_chair:
        create_duplicate_chair(token, "Another Name", "sjohnson@suscc.edu")

    # Test invalid email format (should fail)
    test_invalid_email(token)

    # Test getting single chair
    if new_chair:
        get_single_chair(token, new_chair['id'])

    # Test updating chair
    if new_chair:
        update_chair(token, new_chair['id'], "Dr. Sarah M. Johnson", "sarah.johnson@suscc.edu")

    # Get all chairs again to see the updated list
    get_all_chairs(token)

    # Test deleting chair
    if new_chair:
        delete_chair(token, new_chair['id'])

    # Verify it's marked as inactive
    print("\n=== Verifying Soft Delete (include_inactive=True) ===")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/admin/chairs?include_inactive=true", headers=headers)
    if response.status_code == 200:
        all_chairs = response.json()
        inactive = [c for c in all_chairs if not c['is_active']]
        print(f"✓ Found {len(inactive)} inactive chair(s)")
        for chair in inactive:
            print(f"  - {chair['full_name']} ({chair['email']}) - Active: {chair['is_active']}")

    # Test without authentication
    test_without_auth()

    print("\n" + "=" * 60)
    print("TESTING COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    main()
