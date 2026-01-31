import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/signup";
import SignupSuccess from "./pages/SignupSuccess";
import RequestAccess from "./pages/RequestAcess";
import CreateAgent from "./pages/CreateAgent";

import Dashboard from "./pages/Dashboard";
import Incidents from "./pages/Incidents";
import IncidentDetails from "./pages/IncidentDetails";
import SLO from "./pages/SLO";

import AppLayout from "./components/AppLayout";
import Protected from "./components/protected";

import Agents from "./pages/Agents";

/* ================= ROUTES ================= */

function AppRoutes() {
  return (
    <Routes>
      {/* ================= PUBLIC ================= */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/signup-success" element={<SignupSuccess />} />
      <Route path="/request-access" element={<RequestAccess />} />

      {/* ================= PROTECTED ================= */}
      <Route
        path="/"
        element={
          <Protected>
            <AppLayout />
          </Protected>
        }
      >
        {/* DASHBOARD HOME */}
        <Route index element={<Dashboard />} />

        {/* AGENTS */}
        <Route path="agents" element={<Agents />} />
        <Route path="agents/create" element={<CreateAgent />} />

        {/* OTHER PAGES */}
        <Route path="incidents" element={<Incidents />} />
        <Route path="incidents/:id" element={<IncidentDetails />} />
        <Route path="slo" element={<SLO />} />
      </Route>

      {/* ================= FALLBACK ================= */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}


/* ================= APP ROOT ================= */

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
