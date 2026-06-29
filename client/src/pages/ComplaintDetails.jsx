import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { complaintAPI } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Sidebar  from '../components/Sidebar';
import Navbar   from '../components/Navbar';
import Spinner  from '../components/Spinner';
import toast    from 'react-hot-toast';
import { format } from 'date-fns';
import {
  FiArrowLeft, FiClock, FiUser,
  FiPaperclip, FiDownload,
  FiCheckCircle, FiXCircle,
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
    <span className={`${map[status] || 'badge'} text-sm px-3 py-1`}>
      {status?.replace('-', ' ')}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const map = {
    low: 'badge-low', medium: 'badge-medium', high: 'badge-high',
  };
  return (
    <span className={`${map[priority] || 'badge'} text-sm px-3 py-1`}>
      {priority}
    </span>
  );
};

const ComplaintDetails = () => {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const { user }    = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [complaint,   setComplaint]   = useState(null);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => { fetchComplaint(); }, [id]);

  const fetchComplaint = async () => {
    setLoading(true);
    try {
      const { data } = await complaintAPI.getById(id);
      setComplaint(data.complaint);
    } catch (err) {
      toast.error(err.message || 'Complaint not found');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const statusSteps = ['pending', 'assigned', 'in-progress', 'resolved'];

  const currentStepIndex = statusSteps.indexOf(
    complaint?.status === 'rejected' ? 'rejected' : complaint?.status
  );

  const formatBytes = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024 * 1024)
      return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          title="Complaint Details"
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" />
            </div>
          ) : !complaint ? null : (
            <div className="max-w-4xl mx-auto space-y-5 animate-fadeIn">

              {/* Back + Ticket ID */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => navigate(-1)}
                  className="btn-secondary btn-sm"
                >
                  <FiArrowLeft size={15} />
                  Back
                </button>
                <span className="font-mono text-sm text-gray-500
                                 bg-gray-100 px-3 py-1 rounded-lg">
                  {complaint.ticketId}
                </span>
              </div>

              {/* Main Info */}
              <div className="card">
                <div className="flex flex-col sm:flex-row sm:items-start
                                sm:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      {complaint.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={complaint.status} />
                      <PriorityBadge priority={complaint.priority} />
                      {complaint.category && (
                        <span
                          className="badge text-sm px-3 py-1"
                          style={{
                            backgroundColor: complaint.category.color + '20',
                            color: complaint.category.color,
                          }}
                        >
                          {complaint.category.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p>Submitted on</p>
                    <p className="font-medium text-gray-700">
                      {format(
                        new Date(complaint.createdAt),
                        'MMM dd, yyyy • hh:mm a'
                      )}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </h4>
                  <p className="text-gray-600 leading-relaxed text-sm
                                whitespace-pre-wrap bg-gray-50 rounded-xl p-4">
                    {complaint.description}
                  </p>
                </div>

                {/* Meta */}
                <div className="grid sm:grid-cols-3 gap-4 pt-4
                                border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-100 rounded-xl flex
                                    items-center justify-center">
                      <FiUser size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Submitted by</p>
                      <p className="text-sm font-medium text-gray-700">
                        {complaint.user?.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-purple-100 rounded-xl flex
                                    items-center justify-center">
                      <FiUser size={16} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Assigned Agent</p>
                      <p className="text-sm font-medium text-gray-700">
                        {complaint.assignedAgent?.name || (
                          <span className="text-gray-400 font-normal">
                            Not assigned
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-green-100 rounded-xl flex
                                    items-center justify-center">
                      <FiClock size={16} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Last Updated</p>
                      <p className="text-sm font-medium text-gray-700">
                        {format(new Date(complaint.updatedAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Tracker */}
              {complaint.status !== 'rejected' && (
                <div className="card">
                  <h4 className="text-sm font-semibold text-gray-700 mb-5">
                    Progress Tracker
                  </h4>
                  <div className="flex items-center">
                    {statusSteps.map((step, index) => {
                      const isCompleted = index <= currentStepIndex;
                      const isCurrent   = index === currentStepIndex;
                      return (
                        <div
                          key={step}
                          className="flex items-center flex-1 last:flex-none"
                        >
                          <div className="flex flex-col items-center">
                            <div
                              className={`
                                w-9 h-9 rounded-full flex items-center
                                justify-center text-sm font-bold
                                ${isCompleted
                                  ? 'bg-primary-600 text-white shadow-md'
                                  : 'bg-gray-200 text-gray-400'}
                                ${isCurrent ? 'ring-4 ring-primary-100' : ''}
                              `}
                            >
                              {isCompleted
                                ? <FiCheckCircle size={16} />
                                : index + 1}
                            </div>
                            <p className={`text-xs mt-2 font-medium capitalize
                              ${isCompleted
                                ? 'text-primary-600'
                                : 'text-gray-400'}`}>
                              {step.replace('-', ' ')}
                            </p>
                          </div>
                          {index < statusSteps.length - 1 && (
                            <div
                              className={`flex-1 h-1 mx-2 rounded-full
                                ${index < currentStepIndex
                                  ? 'bg-primary-500'
                                  : 'bg-gray-200'}`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Rejected Banner */}
              {complaint.status === 'rejected' && (
                <div className="flex gap-3 p-4 bg-red-50 border border-red-200
                                rounded-xl">
                  <FiXCircle size={20} className="text-red-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-700">
                      Complaint Rejected
                    </p>
                    {complaint.rejectionReason && (
                      <p className="text-sm text-red-600 mt-1">
                        Reason: {complaint.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Resolution Notes */}
              {complaint.resolutionNotes && (
                <div className="card border-l-4 border-l-green-500">
                  <div className="flex items-center gap-2 mb-2">
                    <FiCheckCircle size={16} className="text-green-600" />
                    <h4 className="text-sm font-semibold text-gray-700">
                      Resolution Notes
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {complaint.resolutionNotes}
                  </p>
                  {complaint.resolvedAt && (
                    <p className="text-xs text-gray-400 mt-2">
                      Resolved on{' '}
                      {format(
                        new Date(complaint.resolvedAt),
                        'MMM dd, yyyy • hh:mm a'
                      )}
                    </p>
                  )}
                </div>
              )}

              {/* Attachments */}
              {complaint.attachments?.length > 0 && (
                <div className="card">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4">
                    <FiPaperclip className="inline mr-2" size={15} />
                    Attachments ({complaint.attachments.length})
                  </h4>
                  <div className="space-y-2">
                    {complaint.attachments.map((file, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 bg-gray-50
                                   rounded-xl border border-gray-200"
                      >
                        <div className="w-9 h-9 bg-primary-100 rounded-lg
                                        flex items-center justify-center
                                        text-primary-600 flex-shrink-0">
                          <FiPaperclip size={15} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {file.originalName}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatBytes(file.size)}
                          </p>
                        </div>
                        
                          href={`http://localhost:5000/uploads/${file.filename}`}
                          target="_blank"
                          rel="noreferrer"
                          download
                          className="btn btn-sm btn-secondary"
                        <a>
                          <FiDownload size={13} />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status History */}
              {complaint.statusHistory?.length > 0 && (
                <div className="card">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4">
                    Status History
                  </h4>
                  <div className="space-y-3">
                    {[...complaint.statusHistory].reverse().map((entry, i) => (
                      <div
                        key={i}
                        className="flex gap-3 pb-3 border-b border-gray-100
                                   last:border-0 last:pb-0"
                      >
                        <div className="w-2 h-2 bg-primary-500 rounded-full
                                        flex-shrink-0 mt-1.5" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-gray-800 capitalize">
                              {entry.status?.replace('-', ' ')}
                            </p>
                            <p className="text-xs text-gray-400 whitespace-nowrap">
                              {format(new Date(entry.changedAt), 'MMM dd, yyyy')}
                            </p>
                          </div>
                          {entry.note && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {entry.note}
                            </p>
                          )}
                          {entry.changedBy && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              By: {entry.changedBy.name}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ComplaintDetails;