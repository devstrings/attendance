import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// ✅ FIXED: correct path (Employee folder)
import OvertimeRequest from './components/Employee/OvertimeRequest';

import NotificationCenter from './components/Common/NotificationCenter';
import LeaveRequestForm from './components/Employee/LeaveRequestForm';
import CorrectionRequestForm from './components/Employee/CorrectionRequestForm';
import MyRequests from './components/Employee/MyRequests';
import { NotificationProvider } from './context/NotificationContext';

import useAuth from './hooks/useAuth';

import EmployeeNotifications from './components/Employee/EmployeeNotifications';
import ManagerNotifications from './components/Manager/ManagerNotifications';

import ManagerProfile from './components/Manager/ManagerProfile';
import ManagerDashboard from './components/Manager/ManagerDashboard';
import MarkAttendance from './components/Manager/MarkAttendance';
import MyEmployees from './components/Manager/MyEmployees';
import EmployeeAttendanceHistory from './components/Manager/EmployeeAttendanceHistory';
import ClockInOut from './components/Manager/ClockInOut';
import OvertimeManagement from './components/Manager/OvertimeManagement';

import EmployeeDashboard from './components/Employee/EmployeeDashboard';
import MyProfile from './components/Employee/MyProfile';
import MyAttendance from './components/Employee/MyAttendance';
import AttendanceHistory from './components/Employee/AttendanceHistory';
import ProfileSettings from './components/Employee/ProfileSettings';

import ProtectedRoute from './components/Common/ProtectedRoute';
import NotFound from './components/Common/NotFound';
import Unauthorized from './components/Common/Unauthorized';
import Loader from './components/Common/Loader';
import LandingPage from './components/Common/LandingPage';

import Login from './components/Auth/Login';
import ForgotPassword from './components/Auth/ForgotPassword';
import VerifyOTP from './components/Auth/VerifyOTP';
import ResetPassword from './components/Auth/ResetPassword';
import ChangePassword from './components/Auth/ChangePassword';

// ✅ Smart redirect
const SmartRedirect = ({ loginPath, dashboardPath, role }) => {
  const token = localStorage.getItem(`${role}_token`);
  const userStr = localStorage.getItem(`${role}_user`);
  let userRole = null;
  try { userRole = JSON.parse(userStr)?.role; } catch (e) {}

  if (token && userRole === role) {
    return <Navigate to={dashboardPath} replace />;
  }
  return <Navigate to={loginPath} replace />;
};

// ✅ Login guard
const LoginRoute = ({ userType, children }) => {
  const token = localStorage.getItem(`${userType}_token`);
  const userStr = localStorage.getItem(`${userType}_user`);
  let userRole = null;

  try { userRole = JSON.parse(userStr)?.role; } catch (e) {}

  if (token && userRole === userType) {
    return <Navigate to={`/${userType}/dashboard`} replace />;
  }
  return children;
};

function App() {
  const { loading } = useAuth();

  if (loading) {
    return <Loader message="Loading..." fullScreen />;
  }

  return (
    <NotificationProvider>
      <div className="App">
        <Routes>

          {/* HOME */}
          <Route path="/" element={<LandingPage />} />

          {/* LOGIN */}
          <Route path="/manager/login" element={
            <LoginRoute userType="manager">
              <Login userType="manager" />
            </LoginRoute>
          } />

          <Route path="/employee/login" element={
            <LoginRoute userType="employee">
              <Login userType="employee" />
            </LoginRoute>
          } />

          {/* PASSWORD */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/employee/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/employee/verify-otp" element={<VerifyOTP />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/employee/reset-password" element={<ResetPassword />} />

          {/* ERRORS */}
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* MANAGER */}
          <Route path="/manager/dashboard" element={<ProtectedRoute allowedRoles={['manager']}><ManagerDashboard /></ProtectedRoute>} />
          <Route path="/manager/profile" element={<ProtectedRoute allowedRoles={['manager']}><ManagerProfile /></ProtectedRoute>} />
          <Route path="/manager/mark-attendance" element={<ProtectedRoute allowedRoles={['manager']}><MarkAttendance /></ProtectedRoute>} />
          <Route path="/manager/my-employees" element={<ProtectedRoute allowedRoles={['manager']}><MyEmployees /></ProtectedRoute>} />
          <Route path="/manager/clock-in-out" element={<ProtectedRoute allowedRoles={['manager']}><ClockInOut /></ProtectedRoute>} />
          <Route path="/manager/attendance-history/:employeeId" element={<ProtectedRoute allowedRoles={['manager']}><EmployeeAttendanceHistory /></ProtectedRoute>} />
          <Route path="/manager/attendance-history" element={<ProtectedRoute allowedRoles={['manager']}><EmployeeAttendanceHistory /></ProtectedRoute>} />
          <Route path="/manager/notifications" element={<ProtectedRoute allowedRoles={['manager']}><ManagerNotifications /></ProtectedRoute>} />
          <Route path="/manager/overtime" element={<ProtectedRoute allowedRoles={['manager']}><OvertimeManagement isManager={true} /></ProtectedRoute>} />

          {/* EMPLOYEE */}
          <Route path="/employee/dashboard" element={<ProtectedRoute allowedRoles={['employee']}><EmployeeDashboard /></ProtectedRoute>} />
          <Route path="/employee/profile" element={<ProtectedRoute allowedRoles={['employee']}><MyProfile /></ProtectedRoute>} />
          <Route path="/employee/my-attendance" element={<ProtectedRoute allowedRoles={['employee']}><MyAttendance /></ProtectedRoute>} />
          <Route path="/employee/attendance-history" element={<ProtectedRoute allowedRoles={['employee']}><AttendanceHistory /></ProtectedRoute>} />
          <Route path="/employee/profile-settings" element={<ProtectedRoute allowedRoles={['employee']}><ProfileSettings /></ProtectedRoute>} />
          <Route path="/employee/request-leave" element={<ProtectedRoute allowedRoles={['employee']}><LeaveRequestForm /></ProtectedRoute>} />
          <Route path="/employee/report-issue" element={<ProtectedRoute allowedRoles={['employee']}><CorrectionRequestForm /></ProtectedRoute>} />
          <Route path="/employee/my-requests" element={<ProtectedRoute allowedRoles={['employee']}><MyRequests /></ProtectedRoute>} />
          <Route path="/employee/notifications" element={<ProtectedRoute allowedRoles={['employee']}><EmployeeNotifications /></ProtectedRoute>} />

          {/* ✅ FIXED (correct placement only here) */}
          <Route path="/employee/overtime-requests" element={
            <ProtectedRoute allowedRoles={['employee']}>
              <OvertimeRequest />
            </ProtectedRoute>
          } />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </div>
    </NotificationProvider>
  );
}

export default App;