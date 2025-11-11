"""
Test script for Campus CRUD operations
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

def get_all_campuses(token):
    """Get all campuses"""
    print("\n=== Testing GET All Campuses ===")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/admin/campuses", headers=headers)

    if response.status_code == 200:
        campuses = response.json()
        print(f"✓ Retrieved {len(campuses)} campuses:")
        for campus in campuses:
            print(f"  - {campus['name']} (ID: {campus['id']}, Active: {campus['is_active']})")
        return campuses
    else:
        print(f"✗ Failed to get campuses: {response.status_code} - {response.text}")
        return []

def create_campus(token, name):
    """Create a new campus"""
    print(f"\n=== Testing CREATE Campus: {name} ===")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{BASE_URL}/admin/campuses", headers=headers, json={"name": name})

    if response.status_code == 201:
        campus = response.json()
        print(f"✓ Created campus: {campus['name']} (ID: {campus['id']})")
        return campus
    else:
        print(f"✗ Failed to create campus: {response.status_code} - {response.text}")
        return None

def create_duplicate_campus(token, name):
    """Test creating duplicate campus (should fail)"""
    print(f"\n=== Testing CREATE Duplicate Campus: {name} (should fail) ===")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{BASE_URL}/admin/campuses", headers=headers, json={"name": name})

    if response.status_code == 400:
        print(f"✓ Correctly rejected duplicate campus: {response.json()['detail']}")
        return True
    else:
        print(f"✗ Unexpected response: {response.status_code} - {response.text}")
        return False

def get_single_campus(token, campus_id):
    """Get a single campus by ID"""
    print(f"\n=== Testing GET Single Campus (ID: {campus_id}) ===")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/admin/campuses/{campus_id}", headers=headers)

    if response.status_code == 200:
        campus = response.json()
        print(f"✓ Retrieved campus: {campus['name']} (ID: {campus['id']})")
        return campus
    else:
        print(f"✗ Failed to get campus: {response.status_code} - {response.text}")
        return None

def update_campus(token, campus_id, new_name):
    """Update a campus"""
    print(f"\n=== Testing UPDATE Campus (ID: {campus_id}) to: {new_name} ===")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.put(f"{BASE_URL}/admin/campuses/{campus_id}", headers=headers, json={"name": new_name})

    if response.status_code == 200:
        campus = response.json()
        print(f"✓ Updated campus: {campus['name']} (ID: {campus['id']})")
        return campus
    else:
        print(f"✗ Failed to update campus: {response.status_code} - {response.text}")
        return None

def delete_campus(token, campus_id):
    """Delete (soft delete) a campus"""
    print(f"\n=== Testing DELETE Campus (ID: {campus_id}) ===")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.delete(f"{BASE_URL}/admin/campuses/{campus_id}", headers=headers)

    if response.status_code == 204:
        print(f"✓ Deleted campus (soft delete)")
        return True
    else:
        print(f"✗ Failed to delete campus: {response.status_code} - {response.text}")
        return False

def test_without_auth():
    """Test accessing campuses without authentication (should fail)"""
    print("\n=== Testing Access Without Auth (should fail) ===")
    response = requests.get(f"{BASE_URL}/admin/campuses")

    if response.status_code == 403:
        print(f"✓ Correctly rejected request without authentication")
        return True
    else:
        print(f"✗ Unexpected response: {response.status_code}")
        return False

def main():
    print("=" * 60)
    print("CAMPUS CRUD TESTING")
    print("=" * 60)

    # Test authentication first
    token = login()
    if not token:
        print("\n✗ Cannot continue without authentication")
        return

    # Test getting existing campuses
    existing_campuses = get_all_campuses(token)

    # Test creating a new campus
    new_campus = create_campus(token, "Auburn")

    # Test duplicate creation (should fail)
    if new_campus:
        create_duplicate_campus(token, "Auburn")

    # Test getting single campus
    if new_campus:
        get_single_campus(token, new_campus['id'])

    # Test updating campus
    if new_campus:
        update_campus(token, new_campus['id'], "Auburn Campus")

    # Get all campuses again to see the updated list
    get_all_campuses(token)

    # Test deleting campus
    if new_campus:
        delete_campus(token, new_campus['id'])

    # Verify it's marked as inactive
    print("\n=== Verifying Soft Delete (include_inactive=True) ===")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/admin/campuses?include_inactive=true", headers=headers)
    if response.status_code == 200:
        all_campuses = response.json()
        inactive = [c for c in all_campuses if not c['is_active']]
        print(f"✓ Found {len(inactive)} inactive campus(es)")
        for campus in inactive:
            print(f"  - {campus['name']} (ID: {campus['id']}, Active: {campus['is_active']})")

    # Test without authentication
    test_without_auth()

    print("\n" + "=" * 60)
    print("TESTING COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    main()
