import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiHome, FiFileText, FiPlusCircle, FiUser,
  FiUsers, FiSettings, FiTag, FiLogOut,
  FiX, FiShield, FiClipboard,
} from 'react-icons/fi';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout, isAdmin, isAgent, getAvatarUrl } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    onClose?.();
  };

  // ─── Nav links per role ───────────────────────────────────────────────────
  const userLinks = [
    { to: '/dashboard',          icon: <FiHome />,       label: 'Dashboard'         },
    { to: '/complaints',         icon: <FiFileText />,   label: 'My Complaints'     },
    { to: '/complaints/create',  icon: <FiPlusCircle />, label: 'New Complaint'     },
    { to: '/profile',            icon: <FiUser />,       label: 'Profile'           },
  ];

  const adminLinks = [
    { to: '/admin/dashboard',    icon: <FiHome />,       label: 'Dashboard'         },
    { to: '/admin/complaints',   icon: <FiFileText />,   label: 'All Complaints'    },
    { to: '/admin/users',        icon: <FiUsers />,      label: 'Manage Users'      },
    { to: '/admin/categories',   icon: <FiTag />,        label: 'Categories'        },
    { to: '/profile',            icon: <FiUser />,       label: 'Profile'           },
  ];

  const agentLinks = [
    { to: '/agent/dashboard',    icon: <FiClipboard />,  label: 'Dashboard'         },
    { to: '/profile',            icon: <FiUser />,       label: 'Profile'           },
  ];

  const links = isAdmin ? adminLinks : isAgent ? agentLinks : userLinks;

  const roleLabel = isAdmin ? 'Administrator' : isAgent ? 'Support Agent' : 'User';
  const roleBadgeColor = isAdmin
    ? 'bg-purple-100 text-purple-700'
    : isAgent
    ? 'bg-blue-100 text-blue-700'
    : 'bg-green-100 text-green-700';

  return (
    <>
      {/* ── Mobile Overlay ──────────────────────────────────────── */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* ── Sidebar Panel ───────────────────────────────────────── */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-30
          flex flex-col transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:shadow-none lg:border-r lg:border-gray-200
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* ── Logo / Brand ──────────────────────────────────────── */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center
                            justify-center text-white">
              <FiShield size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-tight">
                Complaint
              </p>
              <p className="text-xs text-gray-500 leading-tight">
                Management
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* ── User Info ─────────────────────────────────────────── */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-100
                            flex items-center justify-center flex-shrink-0">
              {user?.avatar ? (
                <img
                  src={getAvatarUrl(user.avatar)}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-primary-700 font-bold text-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {/* Name & Role */}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.name}
              </p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleBadgeColor}`}>
                {roleLabel}
              </span>
            </div>
          </div>
        </div>

        {/* ── Navigation Links ──────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <span className="text-lg">{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* ── Logout ────────────────────────────────────────────── */}
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="sidebar-link w-full text-red-600 hover:bg-red-50
                       hover:text-red-700"
          >
            <FiLogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;