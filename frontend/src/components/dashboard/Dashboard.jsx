/**
 * Admin Dashboard Component
 * Main dashboard for admin users
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Home, Users, Building2, GraduationCap, Calendar, UserCircle } from 'lucide-react';
import ProfileModal from '../admin/ProfileModal';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [departmentCount, setDepartmentCount] = useState(0);
  const [campusCount, setCampusCount] = useState(0);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const response = await fetch('/api/admin/departments', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setDepartmentCount(data.length);
        }
      } catch (error) {
        console.error('Error loading departments:', error);
      }
    };

    const loadCampuses = async () => {
      try {
        const response = await fetch('/api/admin/campuses', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setCampusCount(data.length);
        }
      } catch (error) {
        console.error('Error loading campuses:', error);
      }
    };

    loadDepartments();
    loadCampuses();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip to main content for accessibility */}
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>

      {/* Navigation Bar */}
      <nav className="bg-suscc-blue shadow-lg" role="navigation" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <img
                  src="https://jonathanherston.com/wp-content/uploads/2025/11/SU-Logo-1.png"
                  alt="Southern Union State Community College"
                  className="h-10 w-auto"
                />
                <span className="ml-3 text-white font-bold text-lg sm:text-xl hidden xs:inline">
                  Adjunct Tracker
                </span>
                <span className="ml-2 text-white font-bold text-base xs:hidden">
                  AT
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-white text-sm sm:text-base hidden md:inline">
                {user?.full_name}
              </span>
              <button
                onClick={() => setShowProfileModal(true)}
                className="flex items-center space-x-1 sm:space-x-2 bg-suscc-gold text-suscc-blue-dark px-3 sm:px-4 py-2 rounded-md hover:bg-suscc-gold-dark transition-colors text-sm sm:text-base font-semibold"
                aria-label="Edit profile"
              >
                <UserCircle className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Profile</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 sm:space-x-2 bg-white text-suscc-blue px-3 sm:px-4 py-2 rounded-md hover:bg-gray-100 transition-colors text-sm sm:text-base"
                aria-label="Logout from admin panel"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-suscc-blue">
            Welcome, {user?.full_name}!
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            Manage adjunct instructor data for Southern Union State Community College
          </p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Active Request Card */}
          <div className="card hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-suscc-blue-light p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Active Requests
            </h3>
            <p className="text-3xl font-bold text-suscc-blue mb-2">
              0
            </p>
            <p className="text-sm text-gray-600">
              No active semester requests
            </p>
          </div>

          {/* Campuses Card */}
          <div className="card hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-suscc-gold p-3 rounded-lg">
                <Building2 className="h-6 w-6 text-suscc-blue-dark" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Campuses
            </h3>
            <p className="text-3xl font-bold text-suscc-blue mb-2">
              {campusCount}
            </p>
            <p className="text-sm text-gray-600">
              {campusCount === 0 ? 'No campuses configured' : `${campusCount} campus${campusCount === 1 ? '' : 'es'} configured`}
            </p>
          </div>

          {/* Departments Card */}
          <div className="card hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-success p-3 rounded-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Departments
            </h3>
            <p className="text-3xl font-bold text-suscc-blue mb-2">
              {departmentCount}
            </p>
            <p className="text-sm text-gray-600">
              {departmentCount === 0 ? 'No departments configured' : `${departmentCount} department${departmentCount === 1 ? '' : 's'} configured`}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-xl font-bold text-suscc-blue mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/semesters/create')}
              className="btn-primary"
            >
              Create Semester Request
            </button>
            <button
              onClick={() => navigate('/semesters')}
              className="btn-secondary"
            >
              Track Semesters
            </button>
            <button
              onClick={() => navigate('/reports')}
              className="btn-secondary"
            >
              View Reports
            </button>
            <button
              onClick={() => navigate('/campuses')}
              className="btn-secondary"
            >
              Manage Campuses
            </button>
            <button
              onClick={() => navigate('/chairs')}
              className="btn-secondary"
            >
              Manage Chairs
            </button>
            <button
              onClick={() => navigate('/departments')}
              className="btn-secondary"
            >
              Manage Departments
            </button>
            <button
              onClick={() => navigate('/users')}
              className="btn-secondary"
            >
              Manage Users
            </button>
            <button
              onClick={() => navigate('/adjuncts')}
              className="btn-secondary"
            >
              Manage Adjunct Instructors
            </button>
          </div>
        </div>

        {/* System Status */}
        <div className="mt-8 bg-white rounded-lg p-6 border-l-4 border-success">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-success flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">
                System Online
              </h3>
              <p className="text-sm text-gray-600">
                All systems operational. Ready to manage adjunct data.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal onClose={() => setShowProfileModal(false)} />
      )}
    </div>
  );
};

export default Dashboard;
