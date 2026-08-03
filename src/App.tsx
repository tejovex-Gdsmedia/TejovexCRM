import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute  from "./routes/ProtectedRoute";
import MainLayout      from "./components/layout/MainLayout";
import AuthPage        from "./pages/auth/AuthPage";
import Dashboard       from "./pages/dashboard/Dashboard";
import Contacts        from "./pages/contacts/ContactsPage";
import Companies       from "./pages/companies/Companies";
import Notes           from "./pages/notes/Notes";
import Leads           from "./pages/leads/LeadsPage";
import Deals           from "./pages/deals/DealsPage";
import Tasks           from "./pages/tasks/TasksPage";
import Profile         from "./pages/profile/Profile";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/contacts"  element={<Contacts />} />
              <Route path="/companies" element={<Companies />} />
              <Route path="/leads"     element={<Leads />} />
              <Route path="/deals"     element={<Deals />} />
              <Route path="/tasks"     element={<Tasks />} />
              <Route path="/notes"     element={<Notes />} />
              <Route path="/profile"   element={<Profile />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}