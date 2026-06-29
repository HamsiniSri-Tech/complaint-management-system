import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { complaintAPI } from '../../api/axios';
import Sidebar  from '../../components/Sidebar';
import Navbar   from '../../components/Navbar';
import Spinner  from '../../components/Spinner';
import { format } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  FiFileText, FiUsers, FiCheckCircle, FiClock,
  FiAlertCircle, FiTrendingUp, FiUserCheck, FiXCircle,
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

const PIE_COLORS = ['#F59E0B','#3B82F6','#8B5CF6','#10B981','#EF4444'];

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats,       setStats]       = useState(null);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data } = await complaintAPI.getStats();
      setStats(data.stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = stats ? [
    {
      label: 'Total Complaints',
      value: stats.totalComplaints,
      icon:  <FiFileText size={22} />,
      color: 'bg-blue-500',
      sub:   `${stats.byStatus.pending} pending`,
    },
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon:  <FiUsers size={22} />,
      color: 'bg-purple-500',
      sub:   'Registered users',
    },
    {
      label: 'Total Agents',
      value: stats.totalAgents,
      icon:  <FiUserCheck size={22} />,
      color: 'bg-indigo-500',
      sub:   'Support agents',
    },
    {
      label: 'Resolved',
      value: stats.byStatus.resolved,
      icon:  <FiCheckCircle size={22} />,
      color: 'bg-green-500',
      sub:   'Successfully closed',
    },
    {
      label: 'In Progress',
      value: stats.byStatus.inProgress,
      icon:  <FiTrendingUp size={22} />,
      color: 'bg-orange-500',
      sub:   'Being handled',
    },
    {
      label: 'Rejected',
      value: stats.byStatus.rejected,
      icon:  <FiXCircle size={22} />,
      color: 'bg-red-500',
      sub:   'Could not resolve',
    },
  ] : [];

  // Pie chart data from byStatus
  const pieData = stats ? [
    { name: 'Pending',     value: stats.byStatus.pending    },
    { name: 'Assigned',    value: stats.byStatus.assigned   },
    { name: 'In Progress', value: stats.byStatus.inProgress },
    { name: 'Resolved',    value: stats.byStatus.resolved   },
    { name: 'Rejected',    value: stats.byStatus.rejected   },
  ].filter((d) => d.value > 0) : [];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          title="Admin Dashboard"
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="space-y-6 animate-fadeIn">

              {/* ── Welcome Banner ───────────────────────────── */}
              <div className="bg-gradient-to-r from-primary-600 to-blue-700
                              rounded-2xl p-6 text-white shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center
                                sm:justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold">
                      Admin Dashboard 🛡️
                    </h2>
                    <p className="text-blue-100 text-sm mt-1">
                      Overview of all complaints and system activity
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to="/admin/complaints"
                      className="btn bg-white text-primary-700
                                 hover:bg-blue-50 font-semibold text-sm"
                    >
                      <FiFileText size={15} />
                      Manage Complaints
                    </Link>
                    <Link
                      to="/admin/users"
                      className="btn bg-white bg-opacity-20 text-white
                                 hover:bg-opacity-30 font-semibold text-sm
                                 border border-white border-opacity-30"
                    >
                      <FiUsers size={15} />
                      Manage Users
                    </Link>
                  </div>
                </div>
              </div>

              {/* ── Stat Cards ───────────────────────────────── */}
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6
                              gap-4">
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
                    <p className="text-xs font-semibold text-gray-600 mt-0.5">
                      {card.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
                  </div>
                ))}
              </div>

              {/* ── Charts Row ───────────────────────────────── */}
              <div className="grid lg:grid-cols-2 gap-6">

                {/* Monthly Trend Bar Chart */}
                <div className="card">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">
                    Monthly Complaint Trend
                  </h3>
                  {stats?.monthlyTrend?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
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
                            return new Date(year, month - 1).toLocaleString(
                              'default', { month: 'short' }
                            );
                          }}
                        />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip
                          formatter={(value) => [value, 'Complaints']}
                          labelFormatter={(label) => {
                            const [year, month] = label.split('-');
                            return new Date(year, month - 1)
                              .toLocaleString('default', {
                                month: 'long', year: 'numeric',
                              });
                          }}
                        />
                        <Bar
                          dataKey="count"
                          fill="#3B82F6"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-52
                                    text-gray-400">
                      <div className="text-center">
                        <FiTrendingUp size={32} className="mx-auto mb-2 opacity-40" />
                        <p className="text-sm">No data available yet</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Pie Chart */}
                <div className="card">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">
                    Complaints by Status
                  </h3>
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((_, index) => (
                            <Cell
                              key={index}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => [value, name]}
                        />
                        <Legend
                          iconType="circle"
                          iconSize={8}
                          wrapperStyle={{ fontSize: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-52
                                    text-gray-400">
                      <p className="text-sm">No complaints yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Category Bar Chart ───────────────────────── */}
              {stats?.byCategory?.length > 0 && (
                <div className="card">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">
                    Complaints by Category
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={stats.byCategory}
                      layout="vertical"
                      margin={{ left: 20 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#f0f0f0"
                        horizontal={false}
                      />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 11 }}
                        width={100}
                      />
                      <Tooltip />
                      <Bar
                        dataKey="count"
                        radius={[0, 6, 6, 0]}
                      >
                        {stats.byCategory.map((entry, index) => (
                          <Cell
                            key={index}
                            fill={entry.color || '#3B82F6'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* ── Recent Complaints Table ──────────────────── */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-gray-900">
                    Recent Complaints
                  </h3>
                  <Link
                    to="/admin/complaints"
                    className="text-sm text-primary-600 hover:text-primary-700
                               font-medium"
                  >
                    View all →
                  </Link>
                </div>
                {stats?.recentComplaints?.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <FiAlertCircle
                      size={32}
                      className="mx-auto mb-2 opacity-40"
                    />
                    <p className="text-sm">No complaints yet</p>
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Ticket ID</th>
                          <th>Title</th>
                          <th>User</th>
                          <th>Category</th>
                          <th>Status</th>
                          <th>Date</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentComplaints.map((c) => (
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
                            <td className="text-sm text-gray-600">
                              {c.user?.name}
                            </td>
                            <td>
                              <span className="flex items-center gap-1.5
                                               text-xs">
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{
                                    backgroundColor: c.category?.color,
                                  }}
                                />
                                {c.category?.name}
                              </span>
                            </td>
                            <td>
                              <StatusBadge status={c.status} />
                            </td>
                            <td className="text-xs text-gray-400">
                              {format(new Date(c.createdAt), 'MMM dd')}
                            </td>
                            <td>
                              <Link
                                to={`/complaints/${c._id}`}
                                className="text-primary-600 text-xs
                                           font-medium hover:underline"
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
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;