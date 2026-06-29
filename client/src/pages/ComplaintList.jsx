import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { complaintAPI, categoryAPI } from '../api/axios';
import Sidebar     from '../components/Sidebar';
import Navbar      from '../components/Navbar';
import Spinner     from '../components/Spinner';
import Pagination  from '../components/Pagination';
import { format }  from 'date-fns';
import {
  FiSearch, FiFilter, FiPlusCircle,
  FiEye, FiAlertCircle, FiX,
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

const ComplaintList = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [complaints,  setComplaints]  = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [total,       setTotal]       = useState(0);
  const [page,        setPage]        = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    search:    '',
    status:    '',
    priority:  '',
    category:  '',
    sortBy:    'createdAt',
    sortOrder: 'desc',
  });
  const LIMIT = 10;

  useEffect(() => { fetchCategories(); }, []);

  useEffect(() => {
    fetchComplaints();
  }, [page, filters]);

  const fetchCategories = async () => {
    try {
      const { data } = await categoryAPI.getAll();
      setCategories(data.categories || []);
    } catch {}
  };

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT, ...filters };
      // Remove empty params
      Object.keys(params).forEach(
        (k) => !params[k] && delete params[k]
      );
      const { data } = await complaintAPI.getAll(params);
      setComplaints(data.complaints || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '', status: '', priority: '',
      category: '', sortBy: 'createdAt', sortOrder: 'desc',
    });
    setPage(1);
  };

  const activeFilterCount = [
    filters.status, filters.priority, filters.category, filters.search,
  ].filter(Boolean).length;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          title="My Complaints"
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">

          {/* ── Header ───────────────────────────────────────── */}
          <div className="page-header">
            <div>
              <h2 className="page-title">My Complaints</h2>
              <p className="page-subtitle">
                {total} complaint{total !== 1 ? 's' : ''} found
              </p>
            </div>
            <Link to="/complaints/create" className="btn-primary">
              <FiPlusCircle size={16} />
              New Complaint
            </Link>
          </div>

          {/* ── Search & Filter Bar ───────────────────────────── */}
          <div className="card mb-4 p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
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
                  onChange={(e) =>
                    handleFilterChange('search', e.target.value)
                  }
                  className="input pl-9"
                />
              </div>

              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters((p) => !p)}
                className={`btn-secondary relative ${
                  activeFilterCount > 0 ? 'border-primary-400 text-primary-600' : ''
                }`}
              >
                <FiFilter size={16} />
                Filters
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5
                                   bg-primary-600 text-white text-xs rounded-full
                                   flex items-center justify-center font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Clear */}
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="btn-secondary text-red-500 border-red-200
                             hover:bg-red-50"
                >
                  <FiX size={16} />
                  Clear
                </button>
              )}
            </div>

            {/* Expanded filters */}
            {showFilters && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4
                              pt-4 border-t border-gray-100 animate-fadeIn">
                {/* Status */}
                <div>
                  <label className="label text-xs">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) =>
                      handleFilterChange('status', e.target.value)
                    }
                    className="input text-sm"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="assigned">Assigned</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="label text-xs">Priority</label>
                  <select
                    value={filters.priority}
                    onChange={(e) =>
                      handleFilterChange('priority', e.target.value)
                    }
                    className="input text-sm"
                  >
                    <option value="">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="label text-xs">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) =>
                      handleFilterChange('category', e.target.value)
                    }
                    className="input text-sm"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort */}
                <div>
                  <label className="label text-xs">Sort By</label>
                  <select
                    value={`${filters.sortBy}-${filters.sortOrder}`}
                    onChange={(e) => {
                      const [sortBy, sortOrder] = e.target.value.split('-');
                      handleFilterChange('sortBy', sortBy);
                      handleFilterChange('sortOrder', sortOrder);
                    }}
                    className="input text-sm"
                  >
                    <option value="createdAt-desc">Newest First</option>
                    <option value="createdAt-asc">Oldest First</option>
                    <option value="priority-desc">Priority (High→Low)</option>
                    <option value="priority-asc">Priority (Low→High)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* ── Table Card ────────────────────────────────────── */}
          <div className="card p-0 overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-16">
                <Spinner size="lg" />
              </div>
            ) : complaints.length === 0 ? (
              <div className="text-center py-16">
                <FiAlertCircle
                  size={48}
                  className="mx-auto text-gray-300 mb-3"
                />
                <p className="text-gray-500 font-medium">
                  No complaints found
                </p>
                <p className="text-gray-400 text-sm mb-4">
                  {activeFilterCount > 0
                    ? 'Try adjusting your filters'
                    : 'Submit your first complaint to get started'
                  }
                </p>
                {activeFilterCount > 0 ? (
                  <button
                    onClick={clearFilters}
                    className="btn-secondary"
                  >
                    Clear Filters
                  </button>
                ) : (
                  <Link
                    to="/complaints/create"
                    className="btn-primary"
                  >
                    <FiPlusCircle size={16} />
                    New Complaint
                  </Link>
                )}
              </div>
            ) : (
              <>
                <div className="table-container rounded-none border-0">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Ticket ID</th>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Agent</th>
                        <th>Date</th>
                        <th>Action</th>
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
                                          max-w-[160px] truncate text-sm">
                              {c.title}
                            </p>
                          </td>
                          <td>
                            <span className="flex items-center gap-1.5
                                             text-xs font-medium text-gray-600">
                              <span
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{
                                  backgroundColor: c.category?.color,
                                }}
                              />
                              {c.category?.name}
                            </span>
                          </td>
                          <td>
                            <PriorityBadge priority={c.priority} />
                          </td>
                          <td>
                            <StatusBadge status={c.status} />
                          </td>
                          <td className="text-xs text-gray-500">
                            {c.assignedAgent?.name || (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="text-xs text-gray-400 whitespace-nowrap">
                            {format(new Date(c.createdAt), 'MMM dd, yyyy')}
                          </td>
                          <td>
                            <Link
                              to={`/complaints/${c._id}`}
                              className="btn btn-sm btn-secondary"
                            >
                              <FiEye size={13} />
                              View
                            </Link>
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
    </div>
  );
};

export default ComplaintList;