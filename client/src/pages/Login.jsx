import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiEye, FiEyeOff, FiShield } from 'react-icons/fi';
import Spinner from '../components/Spinner';

const Login = () => {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState({});

  const validate = () => {
    const errs = {};
    if (!formData.email)    errs.email    = 'Email is required';
    if (!formData.password) errs.password = 'Password is required';
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    const result = await login(formData);
    setLoading(false);

    if (result.success) {
      const role = result.user.role;
      if (role === 'admin') navigate('/admin/dashboard');
      else if (role === 'agent') navigate('/agent/dashboard');
      else navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white
                    to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fadeIn">

        {/* ── Brand ─────────────────────────────────────────── */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center
                          justify-center mx-auto mb-4 shadow-lg">
            <FiShield size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-500 mt-2">Sign in to your account</p>
        </div>

        {/* ── Card ──────────────────────────────────────────── */}
        <div className="card shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2
                                   text-gray-400" size={16} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={`input pl-10 ${errors.email ? 'input-error' : ''}`}
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="error-text">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-primary-600 hover:text-primary-700
                             font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2
                                   text-gray-400" size={16} />
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`input pl-10 pr-10 ${errors.password ? 'input-error' : ''}`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="error-text">{errors.password}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full btn-lg"
            >
              {loading ? <Spinner size="sm" color="white" /> : 'Sign In'}
            </button>
          </form>

          {/* ── Demo Credentials ───────────────────────────── */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-xs font-semibold text-blue-700 mb-2">
              🔑 Demo Credentials
            </p>
            <div className="space-y-1 text-xs text-blue-600">
              <p><span className="font-medium">Admin:</span> admin@complaint.com / Admin@123</p>
              <p><span className="font-medium">User:</span> Register a new account</p>
            </div>
          </div>

          {/* ── Register Link ──────────────────────────────── */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-primary-600 hover:text-primary-700 font-semibold"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;