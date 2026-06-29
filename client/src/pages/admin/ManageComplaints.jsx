import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { complaintAPI, userAPI, categoryAPI } from '../../api/axios';
import Sidebar    from '../../components/Sidebar';
import Navbar     from '../../components/Navbar';
import Spinner    from '../../components/Spinner';
import Pagination from '../../components/Pagination';
import toast      from 'react-hot-toast';
import { format } from 'date-fns';
import {
  FiSearch, FiFilter, FiEye, FiTrash2,
  FiUserCheck, FiRefreshCw, FiX, FiSave,
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

const LIMIT = 10;

const ManageComplaints = () => {
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [complaints,   setComplaints]   = useState([]);
  const [agents,       setAgents]       = useState([]);
  const [categories,   setCategories]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [total,        setTotal]        = useState(0);
  const [page,         setPage]         = useState(1);
  const [showFilters,  setShowFilters]  = useState(false);

  // Assign modal
  const [assignModal,    setAssignModal]    = useState(false);
  const [selectedC,      setSelectedC]      = useState(null);
  const [selectedAgent,  setSelectedAgent]  = useState('');
  const [assigning,      setAssigning]      = useState(false);

  // Status modal
  const [statusModal,    setStatusModal]    = useState(false);
  const [newStatus,      setNewStatus]      = useState('');
  const [statusNote,     setStatusNote]     = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [filters, setFilters] = useState({
    search: '', status: '', priority: '', category: '',
  });

  useEffect(() => {
    fetchAgents();
    fetchCategories();
  }, []);

  useEffect(() => { fetchComplaints(); }, [page, filters]);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT, ...filters };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const { data } = await complaintAPI.getAll(params);
      setComplaints(data.complaints || []);
      setTotal(data.total || 0);
    } catch {
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  const fetchAgents = async () => {
    try {
      const { data } = await userAPI.getAgents();
      setAgents(data.agents || []);
    } catch {}
  };

  const fetchCategories = async () => {
    try {
      const { data } = await categoryAPI.getAll();
      setCategories(data.categories || []);
    } catch {}
  };

  // ── Assign ──────────────────────────────────────────────────────────────────
  const handleAssign = async () => {
    if (!selectedAgent) { toast.error('Please select an agent'); return; }
    setAssigning(true);
    try {
      await complaintAPI.assign(selectedC._id, { agentId: selectedAgent });
      toast.success('Complaint assigned successfully');
      setAssignModal(false);
      fetchComplaints();
    } catch (err) {
      toast.error(err.message || 'Failed to assign complaint');
    } finally {
      setAssigning(false);
    }
  };

  // ── Status update ───────────────────────────────────────────────────────────
  const handleStatusUpdate = async () => {
    if (!newStatus) { toast.error('Please select a status'); return; }
    setUpdatingStatus(true);
    try {
      await complaintAPI.updateStatus(selectedC._id, {
        status:          newStatus,
        resolutionNotes: newStatus === 'resolved' ? statusNote : undefined,
        rejectionReason: newStatus === 'rejected' ? statusNote : undefined,
      });
      toast.success('Status updated successfully');
      setStatusModal(false);
      fetchComplaints();
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (c) => {
    if (!window.confirm(`Delete complaint "${c.title}"?`)) return;
    try {
      await complaintAPI.delete(c._id);
      toast.success('Complaint deleted');
      fetchComplaints();
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const activeFilters = Object.values(filters).filter(Boolean).length;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          title="Manage Complaints"
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">

          <div className="page-header">
            <div>
              <h2 className="page-title">Manage Complaints</h2>
              <p className="page-subtitle">{total} total complaints</p>
            </div>
          </div>

          {/* ── Filters ──────────────────────────────────────── */}
          <div className="card p-4 mb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <FiSearch
                  className="absolute left-3 top-1/2 -translate-y-1/2
                             text-gray-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search by title or ticket ID..."
                  value={filters.search}
                  onChange={(e) => {
                    setFilters((p) => ({ ...p, search: e.target.value }));
                    setPage(1);
                  }}
                  className="input pl-9"
                />
              </div>
              <button
                onClick={() => setShowFilters((p) => !p)}
                className={`btn-secondary ${
                  activeFilters > 0 ? 'border-primary-400 text-primary-600' : ''
                }`}
              >
                <FiFilter size={15} />
                Filters
                {activeFilters > 0 && (
                  <span className="ml-1 bg-primary-600 text-white text-xs
                                   rounded-full w-4 h-4 flex items-center
                                   justify-center font-bold">
                    {activeFilters}
                  </span>
                )}
              </button>
              {activeFilters > 0 && (
                <button
                  onClick={() => {
                    setFilters({
                      search: '', status: '', priority: '', category: '',
                    });
                    setPage(1);
                  }}
                  className="btn-secondary text-red-500"
                >
                  <FiX size={15} /> Clear
                </button>
              )}
            </div>

            {showFilters && (
              <div className="grid sm:grid-cols-3 gap-3 mt-4 pt-4
                              border-t border-gray-100">
                <select
                  value={filters.status}
                  onChange={(e) => {
                    setFilters((p) => ({ ...p, status: e.target.value }));
                    setPage(1);
                  }}
                  className="input text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <select
                  value={filters.priority}
                  onChange={(e) => {
                    setFilters((p) => ({ ...p, priority: e.target.value }));
                    setPage(1);
                  }}
                  className="input text-sm"
                >
                  <option value="">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <select
                  value={filters.category}
                  onChange={(e) => {
                    setFilters((p) => ({ ...p, category: e.target.value }));
                    setPage(1);
                  }}
                  className="input text-sm"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* ── Table ────────────────────────────────────────── */}
          <div className="card p-0 overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-16">
                <Spinner size="lg" />
              </div>
            ) : complaints.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p>No complaints found</p>
              </div>
            ) : (
              <>
                <div className="table-container rounded-none border-0">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Ticket</th>
                        <th>Title</th>
                        <th>User</th>
                        <th>Agent</th>
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
                            <span className="font-mono text-xs text-gray-500">
                              {c.ticketId}
                            </span>
                          </td>
                          <td>
                            <p className="font-medium text-gray-900
                                          max-w-[140px] truncate text-sm">
                              {c.title}
                            </p>
                          </td>
                          <td className="text-sm text-gray-600">
                            {c.user?.name}
                          </td>
                          <td className="text-sm text-gray-500">
                            {c.assignedAgent?.name || (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td><PriorityBadge priority={c.priority} /></td>
                          <td><StatusBadge   status={c.status}   /></td>
                          <td className="text-xs text-gray-400">
                            {format(new Date(c.createdAt), 'MMM dd')}
                          </td>
                          <td>
                            <div className="flex items-center gap-1">
                              <Link
                                to={`/complaints/${c._id}`}
                                className="p-1.5 text-gray-400
                                           hover:text-primary-600
                                           hover:bg-primary-50 rounded-lg"
                                title="View"
                              >
                                <FiEye size={14} />
                              </Link>
                              <button
                                onClick={() => {
                                  setSelectedC(c);
                                  setSelectedAgent(
                                    c.assignedAgent?._id || ''
                                  );
                                  setAssignModal(true);
                                }}
                                className="p-1.5 text-gray-400
                                           hover:text-blue-600
                                           hover:bg-blue-50 rounded-lg"
                                title="Assign Agent"
                              >
                                <FiUserCheck size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedC(c);
                                  setNewStatus(c.status);
                                  setStatusNote('');
                                  setStatusModal(true);
                                }}
                                className="p-1.5 text-gray-400
                                           hover:text-purple-600
                                           hover:bg-purple-50 rounded-lg"
                                title="Update Status"
                              >
                                <FiRefreshCw size={14} />
                              </button>
                              <button
                                onClick={() => handleDelete(c)}
                                className="p-1.5 text-gray-400
                                           hover:text-red-600
                                           hover:bg-red-50 rounded-lg"
                                title="Delete"
                              >
                                <FiTrash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  currentPage={page}
                  totalPages={Math.ceil(total / LIMIT)}
                  onPageChange={setPage}
                  totalItems={total}
                  itemsPerPage={LIMIT}
                />
              </>
            )}
          </div>
        </main>
      </div>

      {/* ── Assign Modal ──────────────────────────────────────── */}
      {assignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex
                        items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md
                          animate-fadeIn">
            <div className="flex items-center justify-between p-5
                            border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Assign Complaint
              </h3>
              <button
                onClick={() => setAssignModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <FiX size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-3 bg-gray-50 rounded-xl text-sm">
                <p className="font-medium text-gray-800">{selectedC?.title}</p>
                <p className="text-gray-400 text-xs mt-0.5">
                  {selectedC?.ticketId}
                </p>
              </div>
              <div>
                <label className="label">Select Agent</label>
                <select
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  className="input"
                >
                  <option value="">Choose an agent...</option>
                  {agents.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.name}
                      {a.department ? ` — ${a.department}` : ''}
                      {` (${a.activeComplaints} active)`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-200">
              <button
                onClick={() => setAssignModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={assigning}
                className="btn-primary flex-1"
              >
                {assigning
                  ? <Spinner size="sm" color="white" />
                  : <><FiUserCheck size={15} /> Assign</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Status Modal ──────────────────────────────────────── */}
      {statusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex
                        items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md
                          animate-fadeIn">
            <div className="flex items-center justify-between p-5
                            border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Update Status
              </h3>
              <button
                onClick={() => setStatusModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <FiX size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-3 bg-gray-50 rounded-xl text-sm">
                <p className="font-medium text-gray-800">{selectedC?.title}</p>
              </div>
              <div>
                <label className="label">New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="input"
                >
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              {(newStatus === 'resolved' || newStatus === 'rejected') && (
                <div>
                  <label className="label">
                    {newStatus === 'resolved'
                      ? 'Resolution Notes'
                      : 'Rejection Reason'
                    }
                  </label>
                  <textarea
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    rows={3}
                    className="input resize-none"
                    placeholder={
                      newStatus === 'resolved'
                        ? 'Describe how it was resolved...'
                        : 'Reason for rejection...'
                    }
                  />
                </div>
              )}
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-200">
              <button
                onClick={() => setStatusModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                disabled={updatingStatus}
                className="btn-primary flex-1"
              >
                {updatingStatus
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

export default ManageComplaints;