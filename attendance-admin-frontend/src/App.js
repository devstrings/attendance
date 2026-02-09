import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';

import AttendanceDetails from './components/Admin/AttendanceDetails';

// Context & Hooks
import useAuth from './hooks/useAuth';

import AdminProfile from './components/Admin/AdminProfile';

// Common Components
import ProtectedRoute from './components/Common/ProtectedRoute';
import NotFound from './components/Common/NotFound';
import Unauthorized from './components/Common/Unauthorized';
import Loader from './components/Common/Loader';
import LandingPage from './components/Common/LandingPage';

// Auth Components
import Login from './components/Auth/Login';
import ForgotPassword from './components/Auth/ForgotPassword';
import VerifyOTP from './components/Auth/VerifyOTP';
import ResetPassword from './components/Auth/ResetPassword';
import ChangePassword from './components/Auth/ChangePassword';

// Admin Components
import AdminDashboard from './components/Admin/AdminDashboard';
import CreateManager from './components/Admin/CreateManager';
import CreateEmployee from './components/Admin/CreateEmployee';
import EditUser from './components/Admin/EditUser';
import EmployeeList from './components/Admin/EmployeeList';
import ManagerList from './components/Admin/ManagerList';
import AttendanceView from './components/Admin/AttendanceView';
// import AdminMarkAttendance from './components/Admin/AdminMarkAttendance';
import Report from './components/Admin/Report';

import ManagementPanel from './components/Admin/ManagementPanel';
import Settings from './components/Admin/Settings';

function App() {
  const { loading } = useAuth();

  if (loading) {
    return <Loader message="Loading..." fullScreen={true} />;
  }

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin/login" element={<Login userType="admin" />} />
        
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/change-password" element={<ChangePassword />} />
        
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/404" element={<NotFound />} />

        <Route 
          path="/admin/attendance-details/:attendanceId" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AttendanceDetails />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/profile" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminProfile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/create-manager" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <CreateManager />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/create-employee" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <CreateEmployee />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/edit-user/:userId/:userType" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <EditUser />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/edit-employee/:userId" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <EditUser />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/employee/:userId" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <EditUser />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/manager/:userId" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <EditUser />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/edit-manager/:userId" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <EditUser />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/employees" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <EmployeeList />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/managers" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ManagerList />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/attendance-view" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AttendanceView />
            </ProtectedRoute>
          } 
        />
        {/* <Route 
          path="/admin/mark-attendance" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminMarkAttendance />
            </ProtectedRoute>
          } 
        /> */}
        <Route 
          path="/admin/attendance-details" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AttendanceView />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/reports" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Report />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/employee-attendance/:employeeId" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AttendanceDetails />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/management-panel" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ManagementPanel />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/settings" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Settings />
            </ProtectedRoute>
          } 
        />

        <Route path="*" element={<NotFound />} />

      </Routes>
    </div>
  );
}

export default App;