import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LoginPage } from "@/components/auth/LoginPage";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import HomePage from "@/pages/HomePage";
import PLConsoPage from "@/pages/PLConsoPage";
import DownloadsPage from "@/pages/DownloadsPage";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminFilesPage from "@/pages/admin/AdminFilesPage";
import AdminAnalyticsPage from "@/pages/admin/AdminAnalyticsPage";
import AdminAuditPage from "@/pages/admin/AdminAuditPage";
import AdminFeedbackPage from "@/pages/admin/AdminFeedbackPage";
import NotFound from "./pages/NotFound";
import ProfilePage from "./pages/ProfilePage";
import FeedbackPage from "./pages/FeedbackPage";
import PLInputPage from "./pages/PLInputPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes with layout */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<HomePage />} />
              <Route path="automation/pl-conso" element={<PLConsoPage />} />
              <Route path="automation/pl-input" element={<PLInputPage />} />
              <Route path="analytics" element={<AdminAnalyticsPage />} />
              <Route path="downloads" element={<DownloadsPage />} />

              {/* Admin routes */}
              <Route
                path="admin/users"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminUsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/files"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminFilesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/analytics"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminAnalyticsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/audit"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminAuditPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="profile"
                element={
                  <ProtectedRoute requireAdmin>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="feedback"
                element={
                  <ProtectedRoute requireAdmin>
                    <FeedbackPage/>
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/feedback"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminFeedbackPage />
                  </ProtectedRoute>
                }
              />
            </Route>
            

            {/* Catch-all */}
            {/* <Route path="*" element={<NotFound />} /> */}
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
