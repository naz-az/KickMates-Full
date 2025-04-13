import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import HomePage from './pages/HomePage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import CreateEventPage from './pages/CreateEventPage';
import EditEventPage from './pages/EditEventPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import UserEventsPage from './pages/UserEventsPage';
import UserBookmarksPage from './pages/UserBookmarksPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import NotificationsPage from './pages/NotificationsPage';
import MembersPage from './pages/MembersPage';
import UserProfilePage from './pages/UserProfilePage';
import DiscussionsPage from './pages/DiscussionsPage';
import DiscussionDetailPage from './pages/DiscussionDetailPage';
import CreateDiscussionPage from './pages/CreateDiscussionPage';
import EditDiscussionPage from './pages/EditDiscussionPage';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Sidebar from './components/Sidebar';
import TopNavbar from './components/TopNavbar';
import MessagesPage from './pages/MessagesPage';
import Footer from './components/Footer';

// Import CSS files removed - using Tailwind

const App = () => {
  // State for sidebar collapse
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Toggle sidebar collapsed state with smooth transition
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <div className="flex flex-col min-h-screen">
              <div className="flex flex-1">
                <Sidebar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
                <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                  <TopNavbar sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
                  <div className="main-content-inner">
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/events" element={<EventsPage />} />
                      <Route path="/events/:id" element={<EventDetailPage />} />
                      <Route 
                        path="/events/create" 
                        element={
                          <ProtectedRoute>
                            <CreateEventPage />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/events/:id/edit" 
                        element={
                          <ProtectedRoute>
                            <EditEventPage />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/events/:id/delete" 
                        element={
                          <ProtectedRoute>
                            <EventDetailPage deleteMode={true} />
                          </ProtectedRoute>
                        } 
                      />

                      {/* Discussion Routes */}
                      <Route path="/discussions" element={<DiscussionsPage />} />
                      <Route path="/discussions/:id" element={<DiscussionDetailPage />} />
                      <Route 
                        path="/discussions/create" 
                        element={
                          <ProtectedRoute>
                            <CreateDiscussionPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route 
                        path="/discussions/:id/edit" 
                        element={
                          <ProtectedRoute>
                            <EditDiscussionPage />
                          </ProtectedRoute>
                        }
                      />
                      
                      <Route 
                        path="/profile" 
                        element={
                          <ProtectedRoute>
                            <ProfilePage />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/profile/events" 
                        element={
                          <ProtectedRoute>
                            <UserEventsPage />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/profile/bookmarks" 
                        element={
                          <ProtectedRoute>
                            <UserBookmarksPage />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/profile/:id" 
                        element={<UserProfilePage />} 
                      />
                      <Route 
                        path="/dashboard" 
                        element={
                          <ProtectedRoute>
                            <DashboardPage />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/messages" 
                        element={
                          <ProtectedRoute>
                            <MessagesPage />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/messages/:conversationId" 
                        element={
                          <ProtectedRoute>
                            <MessagesPage />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/members" 
                        element={
                          <ProtectedRoute>
                            <MembersPage />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/members/:id" 
                        element={
                          <ProtectedRoute>
                            <UserProfilePage />
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
                      <Route 
                        path="/settings" 
                        element={
                          <ProtectedRoute>
                            <SettingsPage />
                          </ProtectedRoute>
                        } 
                      />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                    </Routes>
                  </div>
                </div>
              </div>
              <div className={`${sidebarCollapsed ? 'ml-0' : 'ml-64'} transition-all duration-500 ease-in-out`}>
                <Footer />
              </div>
            </div>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;