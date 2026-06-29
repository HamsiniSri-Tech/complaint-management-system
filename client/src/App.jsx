import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import Home            from './pages/Home';
import Login           from './pages/Login';
import Register        from './pages/Register';
import ForgotPassword  from './pages/ForgotPassword';
import Dashboard       from './pages/Dashboard';
import Profile         from './pages/Profile';
import CreateComplaint from './pages/CreateComplaint';
import ComplaintList   from './pages/ComplaintList';
import ComplaintDetails from './pages/ComplaintDetails';
import NotFound        from './pages/NotFound';

// Admin Pages
import AdminDashboard    from './pages/admin/AdminDashboard';
import ManageUsers       from './pages/admin/ManageUsers';
import ManageComplaints  from './pages/admin/ManageComplaints';
import ManageCategories  from './pages/admin/ManageCategories';

// Agent Pages
import AgentDashboard from './pages/agent/AgentDashboard';

// Components
import Spinner from './components/Spinner';

// ─── Protected Route ──────────────────────────────────────────────────────────
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    // Redirect to appropriate dashboard
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'agent') return <Navigate to="/agent/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// ─── Public Route (redirect if logged in) ────────────────────────────────────
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (user) {
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'agent') return <Navigate to="/agent/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// ─── App ──────────────────────────────────────────────────────────────────────
const App = () => {
  return (
    <Routes>
      {/* ── Public Routes ─────────────────────────────────────── */}
      <Route path="/" element={<Home />} />

      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />

      {/* ── User Routes ───────────────────────────────────────── */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute roles={['user']}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute roles={['user', 'admin', 'agent']}>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/complaints"
        element={
          <ProtectedRoute roles={['user']}>
            <ComplaintList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/complaints/create"
        element={
          <ProtectedRoute roles={['user']}>
            <CreateComplaint />
          </ProtectedRoute>
        }
      />
      <Route
        path="/complaints/:id"
        element={
          <ProtectedRoute roles={['user', 'admin', 'agent']}>
            <ComplaintDetails />
          </ProtectedRoute>
        }
      />

      {/* ── Admin Routes ──────────────────────────────────────── */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute roles={['admin']}>
            <ManageUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/complaints"
        element={
          <ProtectedRoute roles={['admin']}>
            <ManageComplaints />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/categories"
        element={
          <ProtectedRoute roles={['admin']}>
            <ManageCategories />
          </ProtectedRoute>
        }
      />

      {/* ── Agent Routes ──────────────────────────────────────── */}
      <Route
        path="/agent/dashboard"
        element={
          <ProtectedRoute roles={['agent']}>
            <AgentDashboard />
          </ProtectedRoute>
        }
      />

      {/* ── 404 ───────────────────────────────────────────────── */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;