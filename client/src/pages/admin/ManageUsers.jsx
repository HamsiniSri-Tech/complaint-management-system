import { useState, useEffect, useCallback } from 'react';
import { userAPI } from '../../api/axios';
import Sidebar    from '../../components/Sidebar';
import Navbar     from '../../components/Navbar';
import Spinner    from '../../components/Spinner';
import Pagination from '../../components/Pagination';
import toast      from 'react-hot-toast';
import { format } from 'date-fns';
import {
  FiSearch, FiPlus, FiEdit2, FiTrash2,
  FiToggleLeft, FiToggleRight, FiX, FiSave,
  FiUser, FiMail, FiPhone, FiShield,
} from 'react-icons/fi';

const ROLES = ['user', 'agent', 'admin'];
const LIMIT  = 10;

const RoleBadge = ({ role }) => {
  const map = {
    admin: 'bg-purple-100 text-purple-700',
    agent: 'bg-blue-100   text-blue-700',
    user:  'bg-green-100  text-green-700',
  };
  return (
    <span className={`badge ${map[role] || ''} capitalize`}>{role}</span>
  );
};

const ManageUsers = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users,       setUsers]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [total,       setTotal]       = useState(0);
  const [page,        setPage]        = useState(1);
  const [search,      setSearch]      = useState('');
  const [roleFilter,  setRoleFilter]  = useState('');
  const [showModal,   setShowModal]   = useState(false);
  const [editUser,    setEditUser]    = useState(null);
  const [saving,      setSaving]      = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', password: '',
    role: 'user', phone: '', department: '',
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => { fetchUsers(); }, [page, search, roleFilter]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (search)     params.search = search;
      if (roleFilter) params.role   = roleFilter;
      const { data } = await userAPI.getAll(params);
      setUsers(data.users  || []);
      setTotal(data.total  || 0);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  // ── Open modal ──────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditUser(null);
    setForm({
      name: '', email: '', password: '',
      role: 'user', phone: '', department: '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditUser(user);
    setForm({
      name:       user.name       || '',
      email:      user.email      || '',
      password:   '',
      role:       user.role       || 'user',
      phone:      user.phone      || '',
      department: user.department || '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  // ── Validate ────────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!form.name.trim())  errs.name  = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    if (!editUser && !form.password)
      errs.password = 'Password is required for new users';
    if (!editUser && form.password && form.password.length < 6)
      errs.password = 'Min. 6 characters';
    return errs;
  };

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }

    setSaving(true);
    try {
      const payload = { ...form };
      if (editUser && !payload.password) delete payload.password;

      if (editUser) {
        await userAPI.update(editUser._id, payload);
        toast.success('User updated successfully');
      } else {
        await userAPI.create(payload);
        toast.success('User created successfully');
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (user) => {
    if (!window.confirm(
      `Delete "${user.name}"? This will also delete their complaints.`
    )) return;
    try {
      await userAPI.delete(user._id);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Failed to delete user');
    }
  };

  // ── Toggle active ───────────────────────────────────────────────────────────
  const handleToggle = async (user) => {
    try {
      await userAPI.toggle(user._id);
      toast.success(
        `User ${user.isActive ? 'deactivated' : 'activated'} successfully`
      );
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Failed to toggle user status');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          title="Manage Users"
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">

          {/* ── Header ───────────────────────────────────────── */}
          <div className="page-header">
            <div>
              <h2 className="page-title">Manage Users</h2>
              <p className="page-subtitle">{total} total users</p>
            </div>
            <button onClick={openCreate} className="btn-primary">
              <FiPlus size={16} />
              Add User
            </button>
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
                  placeholder="Search by name, email or phone..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="input pl-9"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                className="input w-full sm:w-40"
              >
                <option value="">All Roles</option>
                {ROLES.map((r) => (
                  <option key={r} value={r} className="capitalize">{r}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Table ────────────────────────────────────────── */}
          <div className="card p-0 overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-16">
                <Spinner size="lg" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <FiUser size={40} className="mx-auto mb-3 opacity-40" />
                <p>No users found</p>
              </div>
            ) : (
              <>
                <div className="table-container rounded-none border-0">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Role</th>
                        <th>Phone</th>
                        <th>Department</th>
                        <th>Status</th>
                        <th>Joined</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u._id}>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-primary-100
                                              flex items-center justify-center
                                              flex-shrink-0">
                                <span className="text-primary-700 font-bold
                                                 text-sm">
                                  {u.name?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900
                                              text-sm">
                                  {u.name}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {u.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td><RoleBadge role={u.role} /></td>
                          <td className="text-sm text-gray-500">
                            {u.phone || '—'}
                          </td>
                          <td className="text-sm text-gray-500">
                            {u.department || '—'}
                          </td>
                          <td>
                            <span className={`badge ${
                              u.isActive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {u.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="text-xs text-gray-400">
                            {format(new Date(u.createdAt), 'MMM dd, yyyy')}
                          </td>
                          <td>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => openEdit(u)}
                                className="p-1.5 text-gray-400 hover:text-primary-600
                                           hover:bg-primary-50 rounded-lg
                                           transition-colors"
                                title="Edit"
                              >
                                <FiEdit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleToggle(u)}
                                className={`p-1.5 rounded-lg transition-colors
                                  ${u.isActive
                                    ? 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                                    : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                                  }`}
                                title={u.isActive ? 'Deactivate' : 'Activate'}
                              >
                                {u.isActive
                                  ? <FiToggleRight size={16} />
                                  : <FiToggleLeft  size={16} />
                                }
                              </button>
                              <button
                                onClick={() => handleDelete(u)}
                                className="p-1.5 text-gray-400 hover:text-red-600
                                           hover:bg-red-50 rounded-lg
                                           transition-colors"
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

      {/* ── Modal ─────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex
                        items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md
                          animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between p-5
                            border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editUser ? 'Edit User' : 'Add New User'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Name */}
              <div>
                <label className="label">Full Name</label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2
                                     text-gray-400" size={15} />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, name: e.target.value }));
                      if (formErrors.name)
                        setFormErrors((p) => ({ ...p, name: '' }));
                    }}
                    placeholder="Full name"
                    className={`input pl-9 ${formErrors.name ? 'input-error' : ''}`}
                  />
                </div>
                {formErrors.name && (
                  <p className="error-text">{formErrors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="label">Email Address</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2
                                     text-gray-400" size={15} />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, email: e.target.value }));
                      if (formErrors.email)
                        setFormErrors((p) => ({ ...p, email: '' }));
                    }}
                    placeholder="Email address"
                    className={`input pl-9 ${formErrors.email ? 'input-error' : ''}`}
                  />
                </div>
                {formErrors.email && (
                  <p className="error-text">{formErrors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="label">
                  Password
                  {editUser && (
                    <span className="text-gray-400 font-normal ml-1">
                      (leave blank to keep current)
                    </span>
                  )}
                </label>
                <div className="relative">
                  <FiShield className="absolute left-3 top-1/2 -translate-y-1/2
                                       text-gray-400" size={15} />
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, password: e.target.value }));
                      if (formErrors.password)
                        setFormErrors((p) => ({ ...p, password: '' }));
                    }}
                    placeholder={
                      editUser ? 'Leave blank to keep current' : 'Min. 6 characters'
                    }
                    className={`input pl-9
                      ${formErrors.password ? 'input-error' : ''}`}
                  />
                </div>
                {formErrors.password && (
                  <p className="error-text">{formErrors.password}</p>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="label">Role</label>
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, role: e.target.value }))
                  }
                  className="input"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r} className="capitalize">
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Phone */}
              <div>
                <label className="label">Phone (optional)</label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2
                                      text-gray-400" size={15} />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, phone: e.target.value }))
                    }
                    placeholder="Phone number"
                    className="input pl-9"
                  />
                </div>
              </div>

              {/* Department */}
              {form.role === 'agent' && (
                <div>
                  <label className="label">Department</label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, department: e.target.value }))
                    }
                    placeholder="e.g. Technical Support"
                    className="input"
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-5 border-t border-gray-200">
              <button
                onClick={() => setShowModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex-1"
              >
                {saving
                  ? <Spinner size="sm" color="white" />
                  : <><FiSave size={15} />
                    {editUser ? 'Update' : 'Create'}</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;