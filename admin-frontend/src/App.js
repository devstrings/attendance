import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import { SidebarProvider } from './context/SidebarContext';


import AdminMonthlySummary from './components/Admin/AdminMonthlySummary';

import { NotificationProvider } from './context/NotificationContext';
import ErrorBoundary from './components/Common/ErrorBoundary';

import SmtpSettings from './components/Admin/SmtpSettings';
import LeaveRequestManagement from './components/Admin/LeaveRequestManagement';
import CorrectionRequestManagement from './components/Admin/CorrectionRequestManagement';
import NotificationHistory from './components/Admin/NotificationHistory';
import AttendanceDetails from './components/Admin/AttendanceDetails';
import AdminProfile from './components/Admin/AdminProfile';
import OvertimeManagement from './components/Admin/OvertimeManagement';

import useAuth from './hooks/useAuth';
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

import AdminDashboard from './components/Admin/AdminDashboard';
import CreateManager from './components/Admin/CreateManager';
import CreateEmployee from './components/Admin/CreateEmployee';
import EditUser from './components/Admin/EditUser';
import ViewUser from './components/Admin/ViewUser';
import EmployeeList from './components/Admin/EmployeeList';
import ManagerList from './components/Admin/ManagerList';
import AttendanceView from './components/Admin/AttendanceView';
import Report from './components/Admin/Report';
import ManagementPanel from './components/Admin/ManagementPanel';
import Settings from './components/Admin/Settings';

// ✅ Login guard — already logged in hai to dashboard pe bhejo
const LoginRoute = ({ children }) => {
  const token = localStorage.getItem('admin_token');
  const userStr = localStorage.getItem('admin_user');
  let userRole = null;
  try { userRole = JSON.parse(userStr)?.role; } catch (e) {}
  if (token && userRole === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return children;
};

// ✅ Smart redirect — logged in hai to dashboard, nahi to login
const AdminRootRedirect = () => {
  const token = localStorage.getItem('admin_token');
  const userStr = localStorage.getItem('admin_user');
  let userRole = null;
  try { userRole = JSON.parse(userStr)?.role; } catch (e) {}
  if (token && userRole === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <Navigate to="/admin/login" replace />;
};

function App() {
  const { loading } = useAuth();

  if (loading) {
    return <Loader message="Loading..." fullScreen />;
  }

  return (
    <ErrorBoundary>
      <NotificationProvider>
        <SidebarProvider>          {/* ← ADD */}
        <div className="App">
          <Routes>

            {/* ===== HOME ===== */}
            <Route path="/" element={<LoginRoute><LandingPage /></LoginRoute>} />

            {/* ===== /admin — smart redirect ===== */}
            <Route path="/admin" element={<AdminRootRedirect />} />

            {/* ===== LOGIN ===== */}
            <Route path="/admin/login" element={
              <LoginRoute>
                <Login userType="admin" />
              </LoginRoute>
            } />
            {/* ✅ NEW — company-prefixed login URL, e.g. /devstrings/admin/login */}
            <Route path="/:companyCode/admin/login" element={
              <LoginRoute>
                <Login userType="admin" />
              </LoginRoute>
            } />

           <Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/admin/forgot-password" element={<ForgotPassword />} />
<Route path="/verify-otp" element={<VerifyOTP />} />
<Route path="/admin/verify-otp" element={<VerifyOTP />} />
<Route path="/reset-password" element={<ResetPassword />} />
<Route path="/admin/reset-password" element={<ResetPassword />} />

            {/* ===== ADMIN ROUTES ===== */}
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/profile" element={<ProtectedRoute allowedRoles={['admin']}><AdminProfile /></ProtectedRoute>} />
            <Route path="/admin/create-manager" element={<ProtectedRoute allowedRoles={['admin']}><CreateManager /></ProtectedRoute>} />
            <Route path="/admin/create-employee" element={<ProtectedRoute allowedRoles={['admin']}><CreateEmployee /></ProtectedRoute>} />
            <Route path="/admin/view-user/:userId/:userType" element={<ProtectedRoute allowedRoles={['admin']}><ViewUser /></ProtectedRoute>} />
            <Route path="/admin/edit-user/:userId/:userType" element={<ProtectedRoute allowedRoles={['admin']}><EditUser /></ProtectedRoute>} />
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
            <Route path="/admin/employee-attendance/:employeeId" element={<ProtectedRoute allowedRoles={['admin']}><AttendanceDetails /></ProtectedRoute>} />
            <Route path="/admin/overtime" element={<ProtectedRoute allowedRoles={['admin']}><OvertimeManagement isManager={false} /></ProtectedRoute>} />
            <Route path="/admin/employee-attendance/:employeeId" element={<ProtectedRoute allowedRoles={['admin']}><AttendanceDetails /></ProtectedRoute>} />

<Route path="/admin/overtime" element={<ProtectedRoute allowedRoles={['admin']}><OvertimeManagement isManager={false} /></ProtectedRoute>} />
<Route path="/admin/monthly-summary" element={<ProtectedRoute allowedRoles={['admin']}><AdminMonthlySummary /></ProtectedRoute>} />

{/* ===== 404 ===== */}
<Route path="*" element={<NotFound />} />


          </Routes>
        </div>
        </SidebarProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;