import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../api/axios';
import { FiMail, FiArrowLeft, FiShield, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Spinner from '../components/Spinner';

const ForgotPassword = () => {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email address'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email'); return; }

    setLoading(true);
    try {
      await authAPI.forgotPassword({ email });
      setSent(true);
      toast.success('Reset instructions sent!');
    } catch (err) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
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
          <h1 className="text-3xl font-bold text-gray-900">Reset Password</h1>
          <p className="text-gray-500 mt-2">
            Enter your email to receive reset instructions
          </p>
        </div>

        <div className="card shadow-lg">
          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Email Address</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2
                                     text-gray-400" size={16} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    placeholder="you@example.com"
                    className={`input pl-10 ${error ? 'input-error' : ''}`}
                  />
                </div>
                {error && <p className="error-text">{error}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full btn-lg"
              >
                {loading
                  ? <Spinner size="sm" color="white" />
                  : 'Send Reset Link'
                }
              </button>

              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-sm
                           text-gray-500 hover:text-gray-700 font-medium mt-2"
              >
                <FiArrowLeft size={14} /> Back to Login
              </Link>
            </form>
          ) : (
            /* ── Success State ──────────────────────────────── */
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center
                              justify-center mx-auto">
                <FiCheckCircle size={36} className="text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Check your inbox
              </h3>
              <p className="text-sm text-gray-500">
                If an account exists for{' '}
                <span className="font-semibold text-gray-700">{email}</span>,
                we've sent password reset instructions.
              </p>
              <p className="text-xs text-gray-400">
                Didn't receive it? Check your spam folder or try again.
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => { setSent(false); setEmail(''); }}
                  className="btn-secondary w-full"
                >
                  Try another email
                </button>
                <Link to="/login" className="btn-primary w-full">
                  Back to Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;