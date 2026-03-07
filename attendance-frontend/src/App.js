import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';

// ===== NEW IMPORTS =====
import NotificationCenter from './components/Common/NotificationCenter';
import LeaveRequestForm from './components/Employee/LeaveRequestForm';
import CorrectionRequestForm from './components/Employee/CorrectionRequestForm';
import MyRequests from './components/Employee/MyRequests';
import { NotificationProvider } from './context/NotificationContext';

// Context & Hooks
import useAuth from './hooks/useAuth';


import EmployeeNotifications from './components/Employee/EmployeeNotifications';
import ManagerNotifications from './components/Manager/ManagerNotifications';


// Manager
import ManagerProfile from './components/Manager/ManagerProfile';
import ManagerDashboard from './components/Manager/ManagerDashboard';
import MarkAttendance from './components/Manager/MarkAttendance';
import MyEmployees from './components/Manager/MyEmployees';
import EmployeeAttendanceHistory from './components/Manager/EmployeeAttendanceHistory';
import ClockInOut from './components/Manager/ClockInOut';

// Employee
import EmployeeDashboard from './components/Employee/EmployeeDashboard';
import MyProfile from './components/Employee/MyProfile';
import MyAttendance from './components/Employee/MyAttendance';
import AttendanceHistory from './components/Employee/AttendanceHistory';
import ProfileSettings from './components/Employee/ProfileSettings';

// Common
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

function App() {
  const { loading } = useAuth();

  if (loading) {
    return <Loader message="Loading..." fullScreen />;
  }

  return (
    <NotificationProvider>
      <div className="App">
        <Routes>
          {/* ===== HOME ===== */}
          <Route path="/" element={<LandingPage />} />

          {/* ===== LOGIN ===== */}
          <Route path="/manager/login" element={<Login userType="manager" />} />
          <Route path="/employee/login" element={<Login userType="employee" />} />

          {/* ===== PASSWORD ===== */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/change-password" element={<ChangePassword />} />

          {/* ===== ERRORS ===== */}
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* ===== MANAGER ROUTES ===== */}
          <Route
            path="/manager/dashboard"
            element={
              <ProtectedRoute allowedRoles={['manager']}>
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/employee/notifications" element={
  <ProtectedRoute allowedRoles={['employee']}>
    <EmployeeNotifications />
  </ProtectedRoute>
} />

<Route
  path="/manager/notifications"
  element={
    <ProtectedRoute allowedRoles={['manager']}>
      <ManagerNotifications />
    </ProtectedRoute>
  }
/>
          <Route
            path="/manager/profile"
            element={
              <ProtectedRoute allowedRoles={['manager']}>
                <ManagerProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/mark-attendance"
            element={
              <ProtectedRoute allowedRoles={['manager']}>
                <MarkAttendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/my-employees"
            element={
              <ProtectedRoute allowedRoles={['manager']}>
                <MyEmployees />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/clock-in-out"
            element={
              <ProtectedRoute allowedRoles={['manager']}>
                <ClockInOut />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/attendance-history/:employeeId"
            element={
              <ProtectedRoute allowedRoles={['manager']}>
                <EmployeeAttendanceHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/attendance-history"
            element={
              <ProtectedRoute allowedRoles={['manager']}>
                <EmployeeAttendanceHistory />
              </ProtectedRoute>
            }
          />

          {/* ===== EMPLOYEE ROUTES ===== */}
          <Route
            path="/employee/dashboard"
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/profile"
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <MyProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/my-attendance"
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <MyAttendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/attendance-history"
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <AttendanceHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/profile-settings"
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <ProfileSettings />
              </ProtectedRoute>
            }
          />

          {/* ===== NEW EMPLOYEE REQUEST ROUTES ===== */}
          <Route
            path="/employee/request-leave"
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <LeaveRequestForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/report-issue"
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <CorrectionRequestForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/my-requests"
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <MyRequests />
              </ProtectedRoute>
            }
          />

          {/* ===== 404 ===== */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </NotificationProvider>
  );
}

export default App;
