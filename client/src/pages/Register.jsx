import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiUser, FiMail, FiLock, FiPhone,
  FiEye, FiEyeOff, FiShield,
} from 'react-icons/fi';
import Spinner from '../components/Spinner';

const Register = () => {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [formData, setFormData] = useState({
    name: '', email: '', password: '',
    confirmPassword: '', phone: '',
  });
  const [showPass,        setShowPass]        = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [errors,          setErrors]          = useState({});

  const validate = () => {
    const errs = {};
    if (!formData.name.trim())     errs.name  = 'Full name is required';
    if (!formData.email)           errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email))
                                   errs.email = 'Enter a valid email';
    if (!formData.password)        errs.password = 'Password is required';
    else if (formData.password.length < 6)
                                   errs.password = 'Password must be at least 6 characters';
    if (!formData.confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword)
                                   errs.confirmPassword = 'Passwords do not match';
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
    const result = await register({
      name:     formData.name,
      email:    formData.email,
      password: formData.password,
      phone:    formData.phone,
    });
    setLoading(false);

    if (result.success) navigate('/dashboard');
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
          <h1 className="text-3xl font-bold text-gray-900">Create account</h1>
          <p className="text-gray-500 mt-2">Join us to submit and track complaints</p>
        </div>

        {/* ── Card ──────────────────────────────────────────── */}
        <div className="card shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name */}
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2
                                   text-gray-400" size={16} />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className={`input pl-10 ${errors.name ? 'input-error' : ''}`}
                />
              </div>
              {errors.name && <p className="error-text">{errors.name}</p>}
            </div>

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
                />
              </div>
              {errors.email && <p className="error-text">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="label">
                Phone Number
                <span className="text-gray-400 font-normal ml-1">(optional)</span>
              </label>
              <div className="relative">
                <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2
                                    text-gray-400" size={16} />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 234 567 8900"
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2
                                   text-gray-400" size={16} />
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                  className={`input pl-10 pr-10 ${errors.password ? 'input-error' : ''}`}
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
              {errors.password && <p className="error-text">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="label">Confirm Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2
                                   text-gray-400" size={16} />
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                  className={`input pl-10 pr-10
                    ${errors.confirmPassword ? 'input-error' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="error-text">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full btn-lg mt-2"
            >
              {loading ? <Spinner size="sm" color="white" /> : 'Create Account'}
            </button>
          </form>

          {/* ── Login Link ─────────────────────────────────── */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-primary-600 hover:text-primary-700 font-semibold"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;