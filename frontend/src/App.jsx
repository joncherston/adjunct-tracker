import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './components/auth/LoginPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Dashboard from './components/dashboard/Dashboard';
import CampusManagement from './components/admin/CampusManagement';
import DepartmentChairManagement from './components/admin/DepartmentChairManagement';
import DepartmentManagement from './components/admin/DepartmentManagement';
import SemesterTracking from './components/admin/SemesterTracking';
import CreateSemesterRequest from './components/admin/CreateSemesterRequest';
import ChairSubmissionPage from './components/submit/ChairSubmissionPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#030F3C',
            },
            success: {
              iconTheme: {
                primary: '#27AE60',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#E74C3C',
                secondary: '#fff',
              },
            },
          }}
        />

        {/* Routes */}
        <Routes>
          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Login Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Dashboard Route */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected Campus Management Route */}
          <Route
            path="/campuses"
            element={
              <ProtectedRoute>
                <CampusManagement />
              </ProtectedRoute>
            }
          />

          {/* Protected Department Chair Management Route */}
          <Route
            path="/chairs"
            element={
              <ProtectedRoute>
                <DepartmentChairManagement />
              </ProtectedRoute>
            }
          />

          {/* Protected Department Management Route */}
          <Route
            path="/departments"
            element={
              <ProtectedRoute>
                <DepartmentManagement />
              </ProtectedRoute>
            }
          />

          {/* Protected Semester Tracking Route */}
          <Route
            path="/semesters"
            element={
              <ProtectedRoute>
                <SemesterTracking />
              </ProtectedRoute>
            }
          />

          {/* Protected Create Semester Request Route */}
          <Route
            path="/semesters/create"
            element={
              <ProtectedRoute>
                <CreateSemesterRequest />
              </ProtectedRoute>
            }
          />

          {/* Public Department Chair Submission Route (token-based access) */}
          <Route path="/submit/:token" element={<ChairSubmissionPage />} />

          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
