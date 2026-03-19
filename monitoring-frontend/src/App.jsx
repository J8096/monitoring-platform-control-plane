import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login          from "./pages/Login";
import Signup         from "./pages/Signup";
import SignupSuccess   from "./pages/SignupSuccess";
import RequestAccess  from "./pages/RequestAccess";
import CreateAgent    from "./pages/CreateAgent";
import Dashboard      from "./pages/Dashboard";
import Incidents      from "./pages/Incidents";
import IncidentDetails from "./pages/IncidentDetails";
import SLO            from "./pages/SLO";
import Agents         from "./pages/Agents";

import AppLayout from "./components/AppLayout";
import Protected from "./components/Protected";

function AppRoutes() {
  return (
    <Routes>
      {/* ── Public ── */}
      <Route path="/login"           element={<Login />} />
      <Route path="/signup"          element={<Signup />} />
      <Route path="/signup-success"  element={<SignupSuccess />} />
      <Route path="/request-access"  element={<RequestAccess />} />

      {/* ── Protected ── */}
      <Route
        path="/"
        element={
          <Protected>
            <AppLayout />
          </Protected>
        }
      >
        <Route index                    element={<Dashboard />} />
        <Route path="agents"            element={<Agents />} />
        <Route path="agents/create"     element={<CreateAgent />} />
        <Route path="incidents"         element={<Incidents />} />
        <Route path="incidents/:id"     element={<IncidentDetails />} />
        <Route path="slo"               element={<SLO />} />
      </Route>

      {/* ── Fallback ── */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
