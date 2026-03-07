import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';

import { NotificationProvider } from './context/NotificationContext';
import ErrorBoundary from './components/Common/ErrorBoundary';

import NotificationCenter from './components/Admin/NotificationCenter';
import SmtpSettings from './components/Admin/SmtpSettings';
import LeaveRequestManagement from './components/Admin/LeaveRequestManagement';
import CorrectionRequestManagement from './components/Admin/CorrectionRequestManagement';
import NotificationHistory from './components/Admin/NotificationHistory';

import AttendanceDetails from './components/Admin/AttendanceDetails';
import useAuth from './hooks/useAuth';
import AdminProfile from './components/Admin/AdminProfile';

import ProtectedRoute from './components/Common/ProtectedRoute';
import NotFound from './components/Common/NotFound';
import Unauthorized from './components/Common/Unauthorized';
import Loader from './components/Common/Loader';
import LandingPage from './components/Common/LandingPage';

// Auth
import Login from './components/Auth/Login';
import ForgotPassword from './components/Auth/ForgotPassword';
import VerifyOTP from './components/Auth/VerifyOTP';
import ResetPassword from './components/Auth/ResetPassword';
import ChangePassword from './components/Auth/ChangePassword';

// Admin
import AdminDashboard from './components/Admin/AdminDashboard';
import CreateManager from './components/Admin/CreateManager';
import CreateEmployee from './components/Admin/CreateEmployee';
import EditUser from './components/Admin/EditUser';
import ViewUser from './components/Admin/ViewUser'; // ✅ NEW
import EmployeeList from './components/Admin/EmployeeList';
import ManagerList from './components/Admin/ManagerList';
import AttendanceView from './components/Admin/AttendanceView';
import Report from './components/Admin/Report';
import ManagementPanel from './components/Admin/ManagementPanel';
import Settings from './components/Admin/Settings';

function App() {
  const { loading } = useAuth();

  if (loading) {
    return <Loader message="Loading..." fullScreen />;
  }

  return (
    <ErrorBoundary>
      <NotificationProvider>
        <div className="App">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/admin/login" element={<Login userType="admin" />} />

            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-otp" element={<VerifyOTP />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* ===== ADMIN ROUTES ===== */}
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/profile" element={<ProtectedRoute allowedRoles={['admin']}><AdminProfile /></ProtectedRoute>} />
            <Route path="/admin/create-manager" element={<ProtectedRoute allowedRoles={['admin']}><CreateManager /></ProtectedRoute>} />
            <Route path="/admin/create-employee" element={<ProtectedRoute allowedRoles={['admin']}><CreateEmployee /></ProtectedRoute>} />

            {/* ✅ FIXED: View route - employee/manager detail page */}
            <Route
              path="/admin/view-user/:userId/:userType"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ViewUser />
                </ProtectedRoute>
              }
            />

            {/* ✅ Edit route - already existed */}
            <Route
              path="/admin/edit-user/:userId/:userType"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <EditUser />
                </ProtectedRoute>
              }
            />

            <Route path="/admin/employees" element={<ProtectedRoute allowedRoles={['admin']}><EmployeeList /></ProtectedRoute>} />
            <Route path="/admin/managers" element={<ProtectedRoute allowedRoles={['admin']}><ManagerList /></ProtectedRoute>} />

            <Route path="/admin/attendance-view" element={<ProtectedRoute allowedRoles={['admin']}><AttendanceView /></ProtectedRoute>} />
            <Route path="/admin/attendance-details/:attendanceId" element={<ProtectedRoute allowedRoles={['admin']}><AttendanceDetails /></ProtectedRoute>} />

            <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin']}><Report /></ProtectedRoute>} />
            <Route path="/admin/management-panel" element={<ProtectedRoute allowedRoles={['admin']}><ManagementPanel /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><Settings /></ProtectedRoute>} />

            <Route path="/admin/smtp-settings" element={<ProtectedRoute allowedRoles={['admin']}><SmtpSettings /></ProtectedRoute>} />
            <Route path="/admin/leave-requests" element={<ProtectedRoute allowedRoles={['admin']}><LeaveRequestManagement /></ProtectedRoute>} />
            <Route path="/admin/correction-requests" element={<ProtectedRoute allowedRoles={['admin']}><CorrectionRequestManagement /></ProtectedRoute>} />
            <Route path="/admin/notifications" element={<ProtectedRoute allowedRoles={['admin']}><NotificationHistory /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;