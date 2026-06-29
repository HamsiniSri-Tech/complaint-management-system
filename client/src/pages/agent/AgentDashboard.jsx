import { useState, useEffect } from 'react';
import { Link }  from 'react-router-dom';
import { agentAPI } from '../../api/axios';
import Sidebar   from '../../components/Sidebar';
import Navbar    from '../../components/Navbar';
import Spinner   from '../../components/Spinner';
import toast     from 'react-hot-toast';
import { format } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  FiClipboard, FiCheckCircle, FiClock,
  FiTrendingUp, FiAlertCircle, FiEye,
  FiRefreshCw, FiX, FiSave,
} from 'react-icons/fi';

const StatusBadge = ({ status }) => {
  const map = {
    pending:       'badge-pending',
    assigned:      'badge-assigned',
    'in-progress': 'badge-in-progress',
    resolved:      'badge-resolved',
    rejected:      'badge-rejected',
  };
  return (
    <span className={map[status] || 'badge'}>
      {status?.replace('-', ' ')}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const map = {
    low: 'badge-low', medium: 'badge-medium', high: 'badge-high',
  };
  return <span className={map[priority] || 'badge'}>{priority}</span>;
};

const AgentDashboard = () => {
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [stats,        setStats]        = useState(null);
  const [complaints,   setComplaints]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [page,         setPage]         = useState(1);
  const [total,        setTotal]        = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  // Status update modal
  const [showModal,   setShowModal]   = useState(false);
  const [selectedC,   setSelectedC]   = useState(null);
  const [newStatus,   setNewStatus]   = useState('');
  const [notes,       setNotes]       = useState('');
  const [updating,    setUpdating]    = useState(false);

  const LIMIT = 8;

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [page, statusFilter]);

  const fetchStats = async () => {
    try {
      const { data } = await agentAPI.getStats();
      setStats(data.stats);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (statusFilter) params.status = statusFilter;
      const { data } = await agentAPI.getComplaints(params);
      setComplaints(data.complaints || []);
      setTotal(data.total || 0);
    } catch {
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const openStatusModal = (c) => {
    setSelectedC(c);
    setNewStatus('in-progress');
    setNotes('');
    setShowModal(true);
  };

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    if (newStatus === 'resolved' && !notes.trim()) {
      toast.error('Resolution notes are required');
      return;
    }
    setUpdating(true);
    try {
      await agentAPI.updateStatus(selectedC._id, {
        status:          newStatus,
        resolutionNotes: newStatus === 'resolved' ? notes : undefined,
        rejectionReason: newStatus === 'rejected' ? notes : undefined,
      });
      toast.success('Status updated successfully');
      setShowModal(false);
      fetchComplaints();
      fetchStats();
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const statCards = stats ? [
    {
      label: 'Total Assigned',
      value: stats.totalAssigned,
      icon:  <FiClipboard size={20} />,
      color: 'bg-blue-500',
    },
    {
      label: 'In Progress',
      value: stats.byStatus.inProgress,
      icon:  <FiTrendingUp size={20} />,
      color: 'bg-orange-500',
    },
    {
      label: 'Resolved',
      value: stats.byStatus.resolved,
      icon:  <FiCheckCircle size={20} />,
      color: 'bg-green-500',
    },
    {
      label: 'Resolution Rate',
      value: `${stats.resolutionRate}%`,
      icon:  <FiTrendingUp size={20} />,
      color: 'bg-purple-500',
    },
  ] : [];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          title="Agent Dashboard"
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {!stats ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="space-y-6 animate-fadeIn">

              {/* ── Banner ───────────────────────────────────── */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700
                              rounded-2xl p-6 text-white shadow-lg">
                <h2 className="text-xl font-bold">Agent Dashboard 🎯</h2>
                <p className="text-blue-100 text-sm mt-1">
                  Manage and resolve your assigned complaints
                </p>
              </div>

              {/* ── Stat Cards ───────────────────────────────── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card, i) => (
                  <div key={i} className="card">
                    <div className={`w-10 h-10 ${card.color} rounded-xl
                                     flex items-center justify-center
                                     text-white mb-3`}>
                      {card.icon}
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {card.value}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {card.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* ── Monthly Trend Chart ──────────────────────── */}
              {stats.monthlyTrend?.length > 0 && (
                <div className="card">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">
                    Monthly Activity
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={stats.monthlyTrend}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#f0f0f0"
                      />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) => {
                          const [year, month] = v.split('-');
                          return new Date(year, month - 1)
                            .toLocaleString('default', { month: 'short' });
                        }}
                      />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar
                        dataKey="total"
                        name="Assigned"
                        fill="#3B82F6"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="resolved"
                        name="Resolved"
                        fill="#10B981"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* ── Assigned Complaints ──────────────────────── */}
              <div className="card">
                <div className="flex flex-col sm:flex-row sm:items-center
                                sm:justify-between gap-3 mb-4">
                  <h3 className="text-base font-semibold text-gray-900">
                    Assigned Complaints
                  </h3>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPage(1);
                    }}
                    className="input w-full sm:w-44 text-sm"
                  >
                    <option value="">All Statuses</option>
                    <option value="assigned">Assigned</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {loading ? (
                  <div className="flex justify-center py-10">
                    <Spinner size="lg" />
                  </div>
                ) : complaints.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <FiAlertCircle
                      size={40}
                      className="mx-auto mb-3 opacity-40"
                    />
                    <p>No complaints assigned yet</p>
                  </div>
                ) : (
                  <>
                    <div className="table-container">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Ticket</th>
                            <th>Title</th>
                            <th>User</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {complaints.map((c) => (
                            <tr key={c._id}>
                              <td>
                                <span className="font-mono text-xs
                                                 text-gray-500">
                                  {c.ticketId}
                                </span>
                              </td>
                              <td>
                                <p className="font-medium text-gray-900
                                              max-w-[140px] truncate text-sm">
                                  {c.title}
                                </p>
                              </td>
                              <td className="text-sm text-gray-500">
                                {c.user?.name}
                              </td>
                              <td>
                                <PriorityBadge priority={c.priority} />
                              </td>
                              <td>
                                <StatusBadge status={c.status} />
                              </td>
                              <td className="text-xs text-gray-400">
                                {format(
                                  new Date(c.createdAt), 'MMM dd'
                                )}
                              </td>
                              <td>
                                <div className="flex items-center gap-1">
                                  <Link
                                    to={`/complaints/${c._id}`}
                                    className="p-1.5 text-gray-400
                                               hover:text-primary-600
                                               hover:bg-primary-50
                                               rounded-lg transition-colors"
                                    title="View Details"
                                  >
                                    <FiEye size={14} />
                                  </Link>
                                  {!['resolved','rejected'].includes(
                                    c.status
                                  ) && (
                                    <button
                                      onClick={() => openStatusModal(c)}
                                      className="p-1.5 text-gray-400
                                                 hover:text-purple-600
                                                 hover:bg-purple-50
                                                 rounded-lg transition-colors"
                                      title="Update Status"
                                    >
                                      <FiRefreshCw size={14} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {total > LIMIT && (
                      <div className="flex items-center justify-between
                                      pt-4 border-t border-gray-100 mt-2">
                        <p className="text-sm text-gray-500">
                          Page {page} of {Math.ceil(total / LIMIT)}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="btn-secondary btn-sm disabled:opacity-40"
                          >
                            Prev
                          </button>
                          <button
                            onClick={() => setPage((p) => p + 1)}
                            disabled={page >= Math.ceil(total / LIMIT)}
                            className="btn-secondary btn-sm disabled:opacity-40"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── Status Update Modal ───────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex
                        items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md
                          animate-fadeIn">
            <div className="flex items-center justify-between p-5
                            border-b border-gray-200">
              <h3 className="text-lg font-semibold">Update Status</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 bg-gray-50 rounded-xl text-sm">
                <p className="font-medium text-gray-800">
                  {selectedC?.title}
                </p>
                <p className="text-gray-400 text-xs mt-0.5">
                  {selectedC?.ticketId}
                </p>
              </div>

              <div>
                <label className="label">New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="input"
                >
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="label">
                  {newStatus === 'resolved'
                    ? 'Resolution Notes'
                    : newStatus === 'rejected'
                    ? 'Rejection Reason'
                    : 'Notes (optional)'
                  }
                  {newStatus === 'resolved' && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="input resize-none"
                  placeholder={
                    newStatus === 'resolved'
                      ? 'Describe how the complaint was resolved...'
                      : newStatus === 'rejected'
                      ? 'Reason for rejection...'
                      : 'Optional notes...'
                  }
                />
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t border-gray-200">
              <button
                onClick={() => setShowModal(false)}
                className="btn-secondary flex-1"
              >
                <FiX size={15} /> Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                disabled={updating}
                className="btn-primary flex-1"
              >
                {updating
                  ? <Spinner size="sm" color="white" />
                  : <><FiSave size={15} /> Update</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentDashboard;