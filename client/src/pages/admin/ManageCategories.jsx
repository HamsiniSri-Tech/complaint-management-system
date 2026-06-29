import { useState, useEffect } from 'react';
import { categoryAPI } from '../../api/axios';
import Sidebar from '../../components/Sidebar';
import Navbar  from '../../components/Navbar';
import Spinner from '../../components/Spinner';
import toast   from 'react-hot-toast';
import {
  FiPlus, FiEdit2, FiTrash2, FiToggleLeft,
  FiToggleRight, FiX, FiSave, FiTag,
} from 'react-icons/fi';

const ManageCategories = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categories,  setCategories]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [editCat,     setEditCat]     = useState(null);
  const [saving,      setSaving]      = useState(false);

  const [form, setForm] = useState({
    name: '', description: '', color: '#3B82F6',
  });
  const [formErrors, setFormErrors] = useState({});

  const PRESET_COLORS = [
    '#3B82F6','#10B981','#F59E0B','#EF4444',
    '#8B5CF6','#EC4899','#6B7280','#06B6D4',
    '#84CC16','#F97316',
  ];

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data } = await categoryAPI.getAll({
        includeInactive: true,
      });
      setCategories(data.categories || []);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditCat(null);
    setForm({ name: '', description: '', color: '#3B82F6' });
    setFormErrors({});
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setEditCat(cat);
    setForm({
      name:        cat.name        || '',
      description: cat.description || '',
      color:       cat.color       || '#3B82F6',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Category name is required';
    if (form.name.trim().length < 2)
      errs.name = 'Name must be at least 2 characters';
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }

    setSaving(true);
    try {
      if (editCat) {
        await categoryAPI.update(editCat._id, form);
        toast.success('Category updated successfully');
      } else {
        await categoryAPI.create(form);
        toast.success('Category created successfully');
      }
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(
      `Delete category "${cat.name}"? This only works if no complaints are attached.`
    )) return;
    try {
      await categoryAPI.delete(cat._id);
      toast.success('Category deleted');
      fetchCategories();
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const handleToggle = async (cat) => {
    try {
      await categoryAPI.toggle(cat._id);
      toast.success(
        `Category "${cat.name}" ${cat.isActive ? 'deactivated' : 'activated'}`
      );
      fetchCategories();
    } catch (err) {
      toast.error(err.message || 'Failed to toggle');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          title="Manage Categories"
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="page-header">
            <div>
              <h2 className="page-title">Manage Categories</h2>
              <p className="page-subtitle">
                {categories.length} categories total
              </p>
            </div>
            <button onClick={openCreate} className="btn-primary">
              <FiPlus size={16} />
              Add Category
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <div
                  key={cat._id}
                  className={`card border-l-4 transition-opacity
                    ${!cat.isActive ? 'opacity-60' : ''}`}
                  style={{ borderLeftColor: cat.color }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center
                                   justify-center text-white flex-shrink-0"
                        style={{ backgroundColor: cat.color }}
                      >
                        <FiTag size={18} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">
                          {cat.name}
                        </h4>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                          {cat.description || 'No description'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => openEdit(cat)}
                        className="p-1.5 text-gray-400 hover:text-primary-600
                                   hover:bg-primary-50 rounded-lg"
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleToggle(cat)}
                        className={`p-1.5 rounded-lg
                          ${cat.isActive
                            ? 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                            : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                          }`}
                      >
                        {cat.isActive
                          ? <FiToggleRight size={16} />
                          : <FiToggleLeft  size={16} />
                        }
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        className="p-1.5 text-gray-400 hover:text-red-600
                                   hover:bg-red-50 rounded-lg"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3
                                  border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className={`badge text-xs ${
                        cat.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {cat.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {cat.complaintCount || 0} complaints
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ── Modal ─────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex
                        items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md
                          animate-fadeIn">
            <div className="flex items-center justify-between p-5
                            border-b border-gray-200">
              <h3 className="text-lg font-semibold">
                {editCat ? 'Edit Category' : 'Add Category'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Name */}
              <div>
                <label className="label">Category Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, name: e.target.value }));
                    if (formErrors.name)
                      setFormErrors((p) => ({ ...p, name: '' }));
                  }}
                  placeholder="e.g. Technical Issue"
                  className={`input ${formErrors.name ? 'input-error' : ''}`}
                />
                {formErrors.name && (
                  <p className="error-text">{formErrors.name}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="label">
                  Description
                  <span className="text-gray-400 font-normal ml-1">
                    (optional)
                  </span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  rows={2}
                  placeholder="Brief description of this category"
                  className="input resize-none"
                />
              </div>

              {/* Color */}
              <div>
                <label className="label">Color</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, color }))}
                      className={`w-8 h-8 rounded-lg transition-transform
                        ${form.color === color
                          ? 'scale-125 ring-2 ring-offset-1 ring-gray-400'
                          : 'hover:scale-110'
                        }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, color: e.target.value }))
                    }
                    className="w-10 h-10 rounded-lg border border-gray-200
                               cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={form.color}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, color: e.target.value }))
                    }
                    className="input flex-1 font-mono text-sm"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
            </div>

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
                    {editCat ? 'Update' : 'Create'}</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCategories;