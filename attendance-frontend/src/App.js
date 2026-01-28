// import React from 'react';
// import { Routes, Route, Navigate } from 'react-router-dom';
// import './App.css';

// import AttendanceDetails from './components/Admin/AttendanceDetails'; // ✅ Imp

// // Context & Hooks
// import useAuth from './hooks/useAuth';

// import AdminProfile from './components/Admin/AdminProfile';
// import ManagerProfile from './components/Manager/ManagerProfile';

// // Common Components
// import ProtectedRoute from './components/Common/ProtectedRoute';
// import NotFound from './components/Common/NotFound';
// import Unauthorized from './components/Common/Unauthorized';
// import Loader from './components/Common/Loader';
// import LandingPage from './components/Common/LandingPage';

// // Auth Components
// import Login from './components/Auth/Login';
// import ForgotPassword from './components/Auth/ForgotPassword';
// import VerifyOTP from './components/Auth/VerifyOTP';
// import ResetPassword from './components/Auth/ResetPassword';
// import ChangePassword from './components/Auth/ChangePassword';

// // Admin Components
// import AdminDashboard from './components/Admin/AdminDashboard';
// import CreateManager from './components/Admin/CreateManager';
// import CreateEmployee from './components/Admin/CreateEmployee';
// import EditUser from './components/Admin/EditUser';
// import EmployeeList from './components/Admin/EmployeeList';
// import ManagerList from './components/Admin/ManagerList';
// import AttendanceView from './components/Admin/AttendanceView';
// import SummaryReport from './components/Admin/SummaryReport';
// import MonthlyReport from './components/Admin/MonthlyReport';
// import ManagementPanel from './components/Admin/ManagementPanel';
// import Settings from './components/Admin/Settings';

// // Manager Components
// import ManagerDashboard from './components/Manager/ManagerDashboard';
// import MarkAttendance from './components/Manager/MarkAttendance';
// import MyEmployees from './components/Manager/MyEmployees';
// import EmployeeAttendanceHistory from './components/Manager/EmployeeAttendanceHistory';
// import ClockInOut from './components/Manager/ClockInOut';

// // Employee Components
// import EmployeeDashboard from './components/Employee/EmployeeDashboard';
// import MyProfile from './components/Employee/MyProfile';
// import MyAttendance from './components/Employee/MyAttendance';
// import AttendanceHistory from './components/Employee/AttendanceHistory';
// import ProfileSettings from './components/Employee/ProfileSettings';

// function App() {
//   const { loading } = useAuth();

//   if (loading) {
//     return <Loader message="Loading..." fullScreen={true} />;
//   }

//   return (
//     <div className="App">
//       <Routes>
//         {/* ✅ HOME - Landing Page */}
//         <Route path="/" element={<LandingPage />} />
        
//         {/* ✅ ROLE-BASED LOGIN ROUTES */}
//         <Route path="/admin/login" element={<Login userType="admin" />} />
//         <Route path="/manager/login" element={<Login userType="manager" />} />
//         <Route path="/employee/login" element={<Login userType="employee" />} />
        
//         {/* Password Recovery */}
//         <Route path="/forgot-password" element={<ForgotPassword />} />
//         <Route path="/verify-otp" element={<VerifyOTP />} />
//         <Route path="/reset-password" element={<ResetPassword />} />
//         <Route path="/change-password" element={<ChangePassword />} />
        
//         {/* Error Routes */}
//         <Route path="/unauthorized" element={<Unauthorized />} />
//         <Route path="/404" element={<NotFound />} />

//         {/* ============ ADMIN ROUTES ============ */}
//         <Route 
//   path="/admin/attendance-details/:attendanceId" 
//   element={
//     <ProtectedRoute allowedRoles={['admin']}>
//       <AttendanceDetails />
//     </ProtectedRoute>
//   } 
// />
//         <Route 
//           path="/admin/dashboard" 
//           element={
//             <ProtectedRoute allowedRoles={['admin']}>
//               <AdminDashboard />
//             </ProtectedRoute>
//           } 
//         />
//         <Route 
//           path="/admin/profile" 
//           element={
//             <ProtectedRoute allowedRoles={['admin']}>
//               <AdminProfile />
//             </ProtectedRoute>
//           } 
//         />
//         <Route 
//           path="/admin/create-manager" 
//           element={
//             <ProtectedRoute allowedRoles={['admin']}>
//               <CreateManager />
//             </ProtectedRoute>
//           } 
//         />
//         <Route 
//           path="/admin/create-employee" 
//           element={
//             <ProtectedRoute allowedRoles={['admin']}>
//               <CreateEmployee />
//             </ProtectedRoute>
//           } 
//         />
//         <Route 
//           path="/admin/edit-user/:userId/:userType" 
//           element={
//             <ProtectedRoute allowedRoles={['admin']}>
//               <EditUser />
//             </ProtectedRoute>
//           } 
//         />
//         <Route 
//           path="/admin/edit-employee/:userId" 
//           element={
//             <ProtectedRoute allowedRoles={['admin']}>
//               <EditUser />
//             </ProtectedRoute>
//           } 
//         />
//         <Route 
//           path="/admin/employee/:userId" 
//           element={
//             <ProtectedRoute allowedRoles={['admin']}>
//               <EditUser />
//             </ProtectedRoute>
//           } 
//         />
//         <Route 
//           path="/admin/manager/:userId" 
//           element={
//             <ProtectedRoute allowedRoles={['admin']}>
//               <EditUser />
//             </ProtectedRoute>
//           } 
//         />
//         <Route 
//           path="/admin/edit-manager/:userId" 
//           element={
//             <ProtectedRoute allowedRoles={['admin']}>
//               <EditUser />
//             </ProtectedRoute>
//           } 
//         />
//         <Route 
//           path="/admin/employees" 
//           element={
//             <ProtectedRoute allowedRoles={['admin']}>
//               <EmployeeList />
//             </ProtectedRoute>
//           } 
//         />
//         <Route 
//           path="/admin/managers" 
//           element={
//             <ProtectedRoute allowedRoles={['admin']}>
//               <ManagerList />
//             </ProtectedRoute>
//           } 
//         />
//         <Route 
//           path="/admin/attendance-view" 
//           element={
//             <ProtectedRoute allowedRoles={['admin']}>
//               <AttendanceView />
//             </ProtectedRoute>
//           } 
//         />
//         <Route 
//           path="/admin/attendance-details" 
//           element={
//             <ProtectedRoute allowedRoles={['admin']}>
//               <AttendanceView />
//             </ProtectedRoute>
//           } 
//         />
//         <Route 
//           path="/admin/summary" 
//           element={
//             <ProtectedRoute allowedRoles={['admin']}>
//               <SummaryReport />
//             </ProtectedRoute>
//           } 
//         />
//         <Route 
//           path="/admin/monthly-report" 
//           element={
//             <ProtectedRoute allowedRoles={['admin']}>
//               <MonthlyReport />
//             </ProtectedRoute>
//           } 
//         />
//         <Route 
//           path="/admin/management-panel" 
//           element={
//             <ProtectedRoute allowedRoles={['admin']}>
//               <ManagementPanel />
//             </ProtectedRoute>
//           } 
//         />
//         <Route 
//           path="/admin/settings" 
//           element={
//             <ProtectedRoute allowedRoles={['admin']}>
//               <Settings />
//             </ProtectedRoute>
//           } 
//         />

//         {/* ============ MANAGER ROUTES ============ */}
//         <Route 
//           path="/manager/dashboard" 
//           element={
//             <ProtectedRoute allowedRoles={['manager']}>
//               <ManagerDashboard />
//             </ProtectedRoute>
//           } 
//         />
//         <Route 
//           path="/manager/profile" 
//           element={
//             <ProtectedRoute allowedRoles={['manager']}>
//               <ManagerProfile />
//             </ProtectedRoute>
//           } 
//         />
//         <Route 
//           path="/manager/mark-attendance" 
//           element={
//             <ProtectedRoute allowedRoles={['manager']}>
//               <MarkAttendance />
//             </ProtectedRoute>
//           } 
//         />
//         <Route 
//           path="/manager/my-employees" 
//           element={
//             <ProtectedRoute allowedRoles={['manager']}>
//               <MyEmployees />
//             </ProtectedRoute>
//           } 
//         />
//         <Route 
//           path="/manager/clock-in-out" 
//           element={
//             <ProtectedRoute allowedRoles={['manager']}>
//               <ClockInOut />
//             </ProtectedRoute>
//           } 
//         />
//         {/* ✅ FIXED: Attendance History Route */}
//         <Route 
//           path="/manager/attendance-history/:employeeId" 
//           element={
//             <ProtectedRoute allowedRoles={['manager']}>
//               <EmployeeAttendanceHistory />
//             </ProtectedRoute>
//           } 
//         />
//         {/* ✅ NEW: General Attendance History (without specific employee) */}
//         <Route 
//           path="/manager/attendance-history" 
//           element={
//             <ProtectedRoute allowedRoles={['manager']}>
//               <EmployeeAttendanceHistory />
//             </ProtectedRoute>
//           } 
//         />

//         {/* ============ EMPLOYEE ROUTES ============ */}
//         <Route 
//           path="/employee/dashboard" 
//           element={
//             <ProtectedRoute allowedRoles={['employee']}>
//               <EmployeeDashboard />
//             </ProtectedRoute>
//           } 
//         />
//         <Route 
//           path="/employee/profile" 
//           element={
//             <ProtectedRoute allowedRoles={['employee']}>
//               <MyProfile />
//             </ProtectedRoute>
//           } 
//         />
//         <Route 
//           path="/employee/my-attendance" 
//           element={
//             <ProtectedRoute allowedRoles={['employee']}>
//               <MyAttendance />
//             </ProtectedRoute>
//           } 
//         />
//         <Route 
//           path="/employee/attendance-history" 
//           element={
//             <ProtectedRoute allowedRoles={['employee']}>
//               <AttendanceHistory />
//             </ProtectedRoute>
//           } 
//         />
//         <Route 
//           path="/employee/profile-settings" 
//           element={
//             <ProtectedRoute allowedRoles={['employee']}>
//               <ProfileSettings />
//             </ProtectedRoute>
//           } 
//         />

//         {/* Catch all - 404 */}
//         <Route path="*" element={<NotFound />} />

//       </Routes>
//     </div>
//   );
// }

// export default App;



import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Context & Hooks
import useAuth from './hooks/useAuth';

import ManagerProfile from './components/Manager/ManagerProfile';

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

// Manager Components
import ManagerDashboard from './components/Manager/ManagerDashboard';
import MarkAttendance from './components/Manager/MarkAttendance';
import MyEmployees from './components/Manager/MyEmployees';
import EmployeeAttendanceHistory from './components/Manager/EmployeeAttendanceHistory';
import ClockInOut from './components/Manager/ClockInOut';

// Employee Components
import EmployeeDashboard from './components/Employee/EmployeeDashboard';
import MyProfile from './components/Employee/MyProfile';
import MyAttendance from './components/Employee/MyAttendance';
import AttendanceHistory from './components/Employee/AttendanceHistory';
import ProfileSettings from './components/Employee/ProfileSettings';

function App() {
  const { loading } = useAuth();

  if (loading) {
    return <Loader message="Loading..." fullScreen={true} />;
  }

  return (
    <div className="App">
      <Routes>
        {/* ✅ HOME - Landing Page */}
        <Route path="/" element={<LandingPage />} />
        
        {/* ✅ ROLE-BASED LOGIN ROUTES */}
        <Route path="/manager/login" element={<Login userType="manager" />} />
        <Route path="/employee/login" element={<Login userType="employee" />} />
        
        {/* Password Recovery */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/change-password" element={<ChangePassword />} />
        
        {/* Error Routes */}
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/404" element={<NotFound />} />

        {/* ============ MANAGER ROUTES ============ */}
        <Route 
          path="/manager/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <ManagerDashboard />
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

        {/* ============ EMPLOYEE ROUTES ============ */}
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

        {/* Catch all - 404 */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </div>
  );
}

export default App;