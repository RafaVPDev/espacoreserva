import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Bookings from "./pages/Bookings";
import Slots from "./pages/Slots";
import Clients from "./pages/Clients";
import Owners from "./pages/Owners";
import Venues from "./pages/Venues";
import Profile from "./pages/Profile";

// dentro das routes:
<Route
  path="/profile"
  element={
    <ProtectedRoute>
      <Layout>
        <Profile />
      </Layout>
    </ProtectedRoute>
  }
/>;
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings"
        element={
          <ProtectedRoute>
            <Layout>
              <Bookings />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/slots"
        element={
          <ProtectedRoute>
            <Layout>
              <Slots />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/clients"
        element={
          <ProtectedRoute>
            <Layout>
              <Clients />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/owners"
        element={
          <ProtectedRoute>
            <Layout>
              <Owners />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/venues"
        element={
          <ProtectedRoute>
            <Layout>
              <Venues />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
