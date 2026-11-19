import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { ExploreGigsPage } from './pages/ExploreGigsPage';
import { TaskDetailsPage } from './pages/TaskDetailsPage';
import { PostGigPage } from './pages/PostGigPage';
import { MyApplicationsPage } from './pages/MyApplicationsPage';
import { MyGigsPage } from './pages/MyGigsPage';
import { EarningsPaymentsPage } from './pages/EarningsPaymentsPage';
import { ProfilePage } from './pages/ProfilePage';
import { MessagesNotificationsPage } from './pages/MessagesNotificationsPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { SafetyGuidelinesPage } from './pages/SafetyGuidelinesPage';

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <DataProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/explore" element={<ExploreGigsPage />} />
                  <Route path="/tasks/:taskId" element={<TaskDetailsPage />} />
                  <Route path="/post" element={<PostGigPage />} />
                  <Route path="/applications" element={<MyApplicationsPage />} />
                  <Route path="/gigs" element={<MyGigsPage />} />
                  <Route path="/earnings" element={<EarningsPaymentsPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/profile/:userId" element={<ProfilePage />} />
                  <Route path="/messages" element={<MessagesNotificationsPage />} />
                  <Route path="/admin" element={<AdminDashboardPage />} />
                  <Route path="/safety" element={<SafetyGuidelinesPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
            </DataProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
