import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiHome, FiArrowLeft } from 'react-icons/fi';

const NotFound = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const dashboardPath =
    user?.role === 'admin' ? '/admin/dashboard'
    : user?.role === 'agent' ? '/agent/dashboard'
    : user ? '/dashboard'
    : '/';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50
                    flex items-center justify-center p-4">
      <div className="text-center animate-fadeIn">
        {/* 404 Number */}
        <div className="text-[8rem] sm:text-[12rem] font-black text-primary-100
                        leading-none select-none">
          404
        </div>

        <div className="-mt-8 relative z-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Page not found
          </h1>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto">
            Oops! The page you're looking for doesn't exist or
            has been moved.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="btn-secondary"
            >
              <FiArrowLeft size={16} />
              Go Back
            </button>
            <Link to={dashboardPath} className="btn-primary">
              <FiHome size={16} />
              {user ? 'Go to Dashboard' : 'Go Home'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;