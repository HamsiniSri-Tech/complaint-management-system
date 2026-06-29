import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { complaintAPI, categoryAPI } from '../api/axios';
import Sidebar  from '../components/Sidebar';
import Navbar   from '../components/Navbar';
import Spinner  from '../components/Spinner';
import toast    from 'react-hot-toast';
import {
  FiFileText, FiAlignLeft, FiTag, FiAlertCircle,
  FiUpload, FiX, FiSend, FiFile, FiImage,
} from 'react-icons/fi';

const CreateComplaint = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categories,  setCategories]  = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [errors,      setErrors]      = useState({});

  const [formData, setFormData] = useState({
    title:       '',
    description: '',
    category:    '',
    priority:    'medium',
  });
  const [files, setFiles] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await categoryAPI.getAll();
      setCategories(data.categories || []);
    } catch {
      toast.error('Failed to load categories');
    }
  };

  // ── File handling ──────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    const total    = files.length + selected.length;

    if (total > 3) {
      toast.error('Maximum 3 files allowed');
      return;
    }

    const oversized = selected.filter((f) => f.size > 5 * 1024 * 1024);
    if (oversized.length > 0) {
      toast.error('Each file must be less than 5MB');
      return;
    }

    setFiles((prev) => [...prev, ...selected]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) return <FiImage size={16} />;
    return <FiFile size={16} />;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024)        return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!formData.title.trim())
      errs.title = 'Title is required';
    else if (formData.title.trim().length < 5)
      errs.title = 'Title must be at least 5 characters';

    if (!formData.description.trim())
      errs.description = 'Description is required';
    else if (formData.description.trim().length < 10)
      errs.description = 'Description must be at least 10 characters';

    if (!formData.category)
      errs.category = 'Please select a category';

    return errs;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('title',       formData.title.trim());
      payload.append('description', formData.description.trim());
      payload.append('category',    formData.category);
      payload.append('priority',    formData.priority);
      files.forEach((file) => payload.append('attachments', file));

      const { data } = await complaintAPI.create(payload);
      toast.success(
        `Complaint submitted! Ticket: ${data.complaint.ticketId}`
      );
      navigate(`/complaints/${data.complaint._id}`);
    } catch (err) {
      toast.error(err.message || 'Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  const priorities = [
    { value: 'low',    label: 'Low',    color: 'text-gray-600',  bg: 'bg-gray-100'   },
    { value: 'medium', label: 'Medium', color: 'text-orange-600', bg: 'bg-orange-100' },
    { value: 'high',   label: 'High',   color: 'text-red-600',   bg: 'bg-red-100'    },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          title="New Complaint"
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-3xl mx-auto">

            {/* ── Header ───────────────────────────────────── */}
            <div className="page-header">
              <div>
                <h2 className="page-title">Submit a Complaint</h2>
                <p className="page-subtitle">
                  Fill in the details below. We'll assign an agent shortly.
                </p>
              </div>
            </div>

            {/* ── Form Card ────────────────────────────────── */}
            <div className="card shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Title */}
                <div>
                  <label className="label">
                    Complaint Title <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FiFileText
                      className="absolute left-3 top-1/2 -translate-y-1/2
                                 text-gray-400"
                      size={16}
                    />
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => {
                        setFormData((p) => ({ ...p, title: e.target.value }));
                        if (errors.title)
                          setErrors((p) => ({ ...p, title: '' }));
                      }}
                      placeholder="Brief, descriptive title for your complaint"
                      className={`input pl-10 ${errors.title ? 'input-error' : ''}`}
                      maxLength={100}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    {errors.title
                      ? <p className="error-text">{errors.title}</p>
                      : <span />
                    }
                    <span className="text-xs text-gray-400">
                      {formData.title.length}/100
                    </span>
                  </div>
                </div>

                {/* Category + Priority row */}
                <div className="grid sm:grid-cols-2 gap-5">
                  {/* Category */}
                  <div>
                    <label className="label">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FiTag
                        className="absolute left-3 top-1/2 -translate-y-1/2
                                   text-gray-400"
                        size={16}
                      />
                      <select
                        value={formData.category}
                        onChange={(e) => {
                          setFormData((p) => ({
                            ...p, category: e.target.value,
                          }));
                          if (errors.category)
                            setErrors((p) => ({ ...p, category: '' }));
                        }}
                        className={`input pl-10 appearance-none
                          ${errors.category ? 'input-error' : ''}`}
                      >
                        <option value="">Select a category</option>
                        {categories.map((cat) => (
                          <option key={cat._id} value={cat._id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.category && (
                      <p className="error-text">{errors.category}</p>
                    )}
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="label">Priority Level</label>
                    <div className="flex gap-2">
                      {priorities.map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev, priority: p.value,
                            }))
                          }
                          className={`
                            flex-1 py-2 px-3 rounded-lg text-sm font-medium
                            border-2 transition-all duration-150
                            ${formData.priority === p.value
                              ? `${p.bg} ${p.color} border-current`
                              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                            }
                          `}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="label">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FiAlignLeft
                      className="absolute left-3 top-3 text-gray-400"
                      size={16}
                    />
                    <textarea
                      value={formData.description}
                      onChange={(e) => {
                        setFormData((p) => ({
                          ...p, description: e.target.value,
                        }));
                        if (errors.description)
                          setErrors((p) => ({ ...p, description: '' }));
                      }}
                      rows={6}
                      placeholder="Describe your complaint in detail. Include relevant dates, locations, and any steps you've already taken..."
                      className={`input pl-10 resize-none
                        ${errors.description ? 'input-error' : ''}`}
                      maxLength={2000}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    {errors.description
                      ? <p className="error-text">{errors.description}</p>
                      : <span />
                    }
                    <span className="text-xs text-gray-400">
                      {formData.description.length}/2000
                    </span>
                  </div>
                </div>

                {/* File Upload */}
                <div>
                  <label className="label">
                    Attachments
                    <span className="text-gray-400 font-normal ml-1">
                      (optional, max 3 files, 5MB each)
                    </span>
                  </label>

                  {/* Drop zone */}
                  <label
                    htmlFor="attachments"
                    className={`
                      flex flex-col items-center justify-center w-full h-32
                      border-2 border-dashed rounded-xl cursor-pointer
                      transition-colors duration-200
                      ${files.length >= 3
                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                        : 'border-gray-300 bg-gray-50 hover:border-primary-400 hover:bg-primary-50'
                      }
                    `}
                  >
                    <FiUpload
                      size={24}
                      className={files.length >= 3
                        ? 'text-gray-300'
                        : 'text-gray-400'
                      }
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      {files.length >= 3
                        ? 'Maximum files reached'
                        : 'Click to upload or drag & drop'
                      }
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      JPG, PNG, PDF, DOC, DOCX, XLS up to 5MB
                    </p>
                    <input
                      id="attachments"
                      type="file"
                      multiple
                      accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                      onChange={handleFileChange}
                      disabled={files.length >= 3}
                      className="hidden"
                    />
                  </label>

                  {/* File list */}
                  {files.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 bg-white
                                     border border-gray-200 rounded-lg"
                        >
                          <div className="w-8 h-8 bg-primary-100 rounded-lg
                                          flex items-center justify-center
                                          text-primary-600 flex-shrink-0">
                            {getFileIcon(file)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800
                                          truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="p-1 text-gray-400 hover:text-red-500
                                       transition-colors"
                          >
                            <FiX size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Info box */}
                <div className="flex gap-3 p-4 bg-blue-50 rounded-xl
                                border border-blue-100">
                  <FiAlertCircle
                    size={18}
                    className="text-blue-500 flex-shrink-0 mt-0.5"
                  />
                  <div className="text-sm text-blue-700">
                    <p className="font-semibold mb-1">Before submitting:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-blue-600">
                      <li>Ensure your description is clear and detailed</li>
                      <li>Select the correct category and priority</li>
                      <li>Attach relevant documents or screenshots</li>
                    </ul>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => navigate('/complaints')}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary btn-lg"
                  >
                    {loading
                      ? <Spinner size="sm" color="white" />
                      : <><FiSend size={16} /> Submit Complaint</>
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreateComplaint;