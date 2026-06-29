import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { complaintAPI } from '../api/axios';
import Sidebar from '../components/Sidebar';
import Navbar  from '../components/Navbar';
import Spinner from '../components/Spinner';
import {
  FiFileText, FiClock, FiCheckCircle, FiXCircle,
  FiPlusCircle, FiAlertCircle, FiArrowRight,
} from 'react-icons/fi';
import { format } from 'date-fns';

const StatusBadge = ({ status }) => {
  const map = {
    pending:     'badge-pending',
    assigned:    'badge-assigned',
    'in-progress': 'badge-in-progress',
    resolved:    'badge-resolved',
    rejected:    'badge-rejected',
  };
  return (
    <span className={map[status] || 'badge'}>
      {status?.replace('-', ' ')}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const map = {
    low:    'badge-low',
    medium: 'badge-medium',
    high:   'badge-high',
  };
  return <span className={map[priority] || 'badge'}>{priority}</span>;
};

const Dashboard = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [complaints,  setComplaints]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [stats,       setStats]       = useState({
    total: 0, pending: 0, resolved: 0, rejected: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await complaintAPI.getAll({ limit: 5, page: 1 });
      setComplaints(data.complaints || []);

      // Calculate stats
      const all = data.complaints || [];
      setStats({
        total:    data.total || 0,
        pending:  all.filter((c) => c.status === 'pending').length,
        resolved: all.filter((c) => c.status === 'resolved').length,
        rejected: all.filter((c) => c.status === 'rejected').length,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Total Complaints',
      value: stats.total,
      icon:  <FiFileText size={22} />,
      color: 'bg-blue-500',
      bg:    'bg-blue-50',
      text:  'text-blue-700',
    },
    {
      label: 'Pending',
      value: stats.pending,
      icon:  <FiClock size={22} />,
      color: 'bg-yellow-500',
      bg:    'bg-yellow-50',
      text:  'text-yellow-700',
    },
    {
      label: 'Resolved',
      value: stats.resolved,
      icon:  <FiCheckCircle size={22} />,
      color: 'bg-green-500',
      bg:    'bg-green-50',
      text:  'text-green-700',
    },
    {
      label: 'Rejected',
      value: stats.rejected,
      icon:  <FiXCircle size={22} />,
      color: 'bg-red-500',
      bg:    'bg-red-50',
      text:  'text-red-700',
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          title="Dashboard"
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">

          {/* ── Welcome Banner ─────────────────────────────── */}
          <div className="bg-gradient-to-r from-primary-600 to-blue-700
                          rounded-2xl p-6 text-white mb-6 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center
                            sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">
                  Welcome back, {user?.name?.split(' ')[0]}! 👋
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                  Here's an overview of your complaints
                </p>
              </div>
              <Link
                to="/complaints/create"
                className="btn bg-white text-primary-700 hover:bg-blue-50
                           font-semibold shadow self-start sm:self-auto"
              >
                <FiPlusCircle size={16} />
                New Complaint
              </Link>
            </div>
          </div>

          {/* ── Stat Cards ─────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statCards.map((card, i) => (
              <div key={i} className="card">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 ${card.color} rounded-xl
                                   flex items-center justify-center
                                   text-white flex-shrink-0`}>
                    {card.icon}
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {loading ? '—' : card.value}
                    </p>
                    <p className="text-xs text-gray-500 font-medium">
                      {card.label}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Recent Complaints Table ─────────────────────── */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Complaints
              </h3>
              <Link
                to="/complaints"
                className="text-sm text-primary-600 hover:text-primary-700
                           font-medium flex items-center gap-1"
              >
                View all <FiArrowRight size={14} />
              </Link>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : complaints.length === 0 ? (
              <div className="text-center py-12">
                <FiAlertCircle size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No complaints yet</p>
                <p className="text-gray-400 text-sm mb-4">
                  Submit your first complaint to get started
                </p>
                <Link to="/complaints/create" className="btn-primary">
                  <FiPlusCircle size={16} />
                  Create Complaint
                </Link>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Ticket ID</th>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.map((complaint) => (
                      <tr key={complaint._id}>
                        <td>
                          <span className="font-mono text-xs text-gray-500">
                            {complaint.ticketId}
                          </span>
                        </td>
                        <td>
                          <p className="font-medium text-gray-900 max-w-[180px]
                                        truncate">
                            {complaint.title}
                          </p>
                        </td>
                        <td>
                          <span
                            className="inline-flex items-center gap-1.5 text-xs
                                       font-medium"
                          >
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor: complaint.category?.color,
                              }}
                            />
                            {complaint.category?.name}
                          </span>
                        </td>
                        <td>
                          <PriorityBadge priority={complaint.priority} />
                        </td>
                        <td>
                          <StatusBadge status={complaint.status} />
                        </td>
                        <td className="text-xs text-gray-400 whitespace-nowrap">
                          {format(new Date(complaint.createdAt), 'MMM dd, yyyy')}
                        </td>
                        <td>
                          <Link
                            to={`/complaints/${complaint._id}`}
                            className="text-primary-600 hover:text-primary-700
                                       text-xs font-medium"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;