import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute  from "./routes/ProtectedRoute";
import MainLayout      from "./components/layout/MainLayout";
import AuthPage        from "./pages/auth/AuthPage";
import Dashboard       from "./pages/dashboard/Dashboard";
import Contacts        from "./pages/contacts/Contacts";
import Companies       from "./pages/companies/Companies";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />

          {/* Protected — first checks auth, then shows sidebar layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/contacts"  element={<Contacts />} />
              <Route path="/companies" element={<Companies />} />
              <Route path="/profile"   element={<AuthPage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}