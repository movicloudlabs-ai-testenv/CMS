import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { getUserSession, hasActiveSession } from './auth/sessionController';
import { AdmissionProvider } from './context/AdmissionContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPageWrapper from './pages/DashboardPageWrapper';
import LoginPage from './pages/LoginPage';
import TimetablePage from './pages/TimetablePage';
import AttendancePage from './pages/AttendancePage';
import ExamsPage from './pages/ExamsPage';
import PlacementPage from './pages/PlacementPage';
import FacilityPage from './pages/FacilityPage';
import SettingsPage from './pages/SettingsPage';
import StudentPageWrapper from './pages/StudentPageWrapper';
import StudentProfilePage from './pages/StudentProfilePage';
import NotificationsPage from './pages/NotificationPage';
import AnalyticsPage from './pages/AnalyticsPage';
import PayrollPage from './pages/PayrollPage';
import AdmissionPage from './pages/AdmissionPage';
import AdminFeesPage from './pages/AdminFeesPage';
import AdminInvoicePage from './pages/AdminInvoicePage';
import FeesPage from './pages/FeesPage';
import InvoicePage from './pages/InvoicePage';
import FinanceInvoicePage from './pages/FinanceInvoicePage';
import ComingSoonPage from './pages/ComingSoonPage';
import FacultyPage from './pages/FacultyPage';
import FacultyProfilePage from './pages/FacultyProfilePage';
import FacultyDepartmentPage from './pages/FacultyDepartmentPage';
import ErrorBoundary from './components/ErrorBoundary';
import AddMemberSelectionPage from './pages/AddMemberSelectionPage';
import AddStudentPage from './pages/AddStudentPage';
import AddFacultyPage from './pages/AddFacultyPage';

export default function App() {
  const [, setAuthVersion] = useState(0);
  const session = getUserSession();
  const activeSession = hasActiveSession();

  useEffect(() => {
    const handleAuthChange = () => setAuthVersion((prev) => prev + 1);
    window.addEventListener('cms-auth-change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    return () => {
      window.removeEventListener('cms-auth-change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  return (
    <ErrorBoundary>
      <AdmissionProvider>
        <Routes>
        <Route
          path="/"
          element={
            activeSession && session
              ? <Navigate to={`/dashboard?role=${encodeURIComponent(session.role)}`} replace />
              : <LoginPage />
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPageWrapper />
            </ProtectedRoute>
          }
        />
        <Route path="/timetable" element={<ProtectedRoute allowedRoles={['student', 'admin', 'faculty']}><TimetablePage /></ProtectedRoute>} />
        <Route path="/attendance" element={<ProtectedRoute allowedRoles={['student', 'admin', 'faculty']}><AttendancePage /></ProtectedRoute>} />
        <Route path="/exams" element={<ProtectedRoute allowedRoles={['student', 'admin', 'faculty']}><ExamsPage /></ProtectedRoute>} />
        <Route path="/placement" element={<ProtectedRoute allowedRoles={['admin', 'faculty', 'student']}><PlacementPage /></ProtectedRoute>} />
        <Route path="/facility" element={<ProtectedRoute allowedRoles={['admin', 'faculty']}><FacilityPage /></ProtectedRoute>} />
        <Route path="/payroll" element={<ProtectedRoute allowedRoles={['admin', 'finance']}><PayrollPage /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute allowedRoles={['admin', 'finance', 'faculty']}><AnalyticsPage /></ProtectedRoute>} />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/students" element={<ProtectedRoute allowedRoles={['admin', 'faculty']}><StudentPageWrapper /></ProtectedRoute>} />
        <Route path="/students/:id" element={<ProtectedRoute allowedRoles={['admin', 'faculty', 'student']}><StudentProfilePage /></ProtectedRoute>} />
        <Route path="/faculty" element={<ProtectedRoute allowedRoles={['admin']}><FacultyPage /></ProtectedRoute>} />
        <Route path="/faculty/:id" element={<ProtectedRoute allowedRoles={['admin', 'faculty']}><FacultyProfilePage /></ProtectedRoute>} />
        <Route path="/department" element={<ProtectedRoute allowedRoles={['admin', 'faculty']}><FacultyDepartmentPage /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute allowedRoles={['admin', 'faculty']}><ComingSoonPage /></ProtectedRoute>} />
        <Route path="/admission" element={<ProtectedRoute allowedRoles={['admin']}><AdmissionPage /></ProtectedRoute>} />
        <Route path="/add-member" element={<ProtectedRoute allowedRoles={['admin']}><AddMemberSelectionPage /></ProtectedRoute>} />
        <Route path="/add-student" element={<ProtectedRoute allowedRoles={['admin']}><AddStudentPage /></ProtectedRoute>} />
        <Route path="/add-faculty" element={<ProtectedRoute allowedRoles={['admin']}><AddFacultyPage /></ProtectedRoute>} />
        <Route path="/fees" element={<ProtectedRoute allowedRoles={['student']}><FeesPage /></ProtectedRoute>} />
        <Route path="/admin-fees" element={<ProtectedRoute allowedRoles={['admin']}><AdminFeesPage /></ProtectedRoute>} />
        <Route path="/invoices" element={<ProtectedRoute allowedRoles={['student']}><InvoicePage /></ProtectedRoute>} />
        <Route path="/admin-invoices" element={<ProtectedRoute allowedRoles={['admin']}><AdminInvoicePage /></ProtectedRoute>} />
        <Route path="/finance-invoices" element={<ProtectedRoute allowedRoles={['finance']}><FinanceInvoicePage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </AdmissionProvider>
    </ErrorBoundary>
  );
}
