import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/axios';
import Sidebar  from '../components/Sidebar';
import Navbar   from '../components/Navbar';
import Spinner  from '../components/Spinner';
import toast    from 'react-hot-toast';
import {
  FiUser, FiMail, FiPhone, FiMapPin,
  FiLock, FiCamera, FiSave, FiBriefcase,
} from 'react-icons/fi';

const Profile = () => {
  const { user, updateUser, getAvatarUrl } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Profile form state ─────────────────────────────────────────────────────
  const [profileData, setProfileData] = useState({
    name:       user?.name       || '',
    phone:      user?.phone      || '',
    address:    user?.address    || '',
    department: user?.department || '',
  });
  const [avatarFile,    setAvatarFile]    = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // ── Password form state ────────────────────────────────────────────────────
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword:     '',
    confirmPassword: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});

  // ── Handle avatar selection ────────────────────────────────────────────────
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // ── Save profile ───────────────────────────────────────────────────────────
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const formData = new FormData();
      Object.entries(profileData).forEach(([k, v]) => formData.append(k, v));
      if (avatarFile) formData.append('avatar', avatarFile);

      const { data } = await authAPI.updateProfile(formData);
      updateUser(data.user);
      setAvatarFile(null);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Save password ──────────────────────────────────────────────────────────
  const validatePassword = () => {
    const errs = {};
    if (!passwordData.currentPassword) errs.currentPassword = 'Required';
    if (!passwordData.newPassword)     errs.newPassword     = 'Required';
    else if (passwordData.newPassword.length < 6)
      errs.newPassword = 'Min. 6 characters';
    if (passwordData.newPassword !== passwordData.confirmPassword)
      errs.confirmPassword = 'Passwords do not match';
    return errs;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const errs = validatePassword();
    if (Object.keys(errs).length > 0) { setPasswordErrors(errs); return; }

    setSavingPassword(true);
    try {
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword:     passwordData.newPassword,
      });
      setPasswordData({
        currentPassword: '', newPassword: '', confirmPassword: '',
      });
      setPasswordErrors({});
      toast.success('Password changed successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  const roleLabel = user?.role === 'admin'
    ? 'Administrator'
    : user?.role === 'agent'
    ? 'Support Agent'
    : 'User';

  const roleBg = user?.role === 'admin'
    ? 'bg-purple-100 text-purple-700'
    : user?.role === 'agent'
    ? 'bg-blue-100 text-blue-700'
    : 'bg-green-100 text-green-700';

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(true)} title="Profile" />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-4xl mx-auto space-y-6">

            {/* ── Profile Card ─────────────────────────────── */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Personal Information
              </h3>

              <form onSubmit={handleProfileSubmit}>
                {/* Avatar Section */}
                <div className="flex flex-col sm:flex-row items-center gap-6 mb-8
                                pb-6 border-b border-gray-100">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden
                                    bg-primary-100 flex items-center
                                    justify-center shadow-md">
                      {avatarPreview || user?.avatar ? (
                        <img
                          src={
                            avatarPreview ||
                            getAvatarUrl(user.avatar)
                          }
                          alt={user?.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl font-bold text-primary-700">
                          {user?.name?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <label
                      htmlFor="avatar"
                      className="absolute -bottom-2 -right-2 w-8 h-8
                                 bg-primary-600 rounded-full flex items-center
                                 justify-center text-white cursor-pointer
                                 hover:bg-primary-700 shadow-md transition-colors"
                    >
                      <FiCamera size={14} />
                    </label>
                    <input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>

                  <div>
                    <h4 className="text-xl font-bold text-gray-900">
                      {user?.name}
                    </h4>
                    <p className="text-gray-500 text-sm">{user?.email}</p>
                    <span className={`inline-block mt-2 text-xs font-semibold
                                      px-3 py-1 rounded-full ${roleBg}`}>
                      {roleLabel}
                    </span>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="label">Full Name</label>
                    <div className="relative">
                      <FiUser className="absolute left-3 top-1/2 -translate-y-1/2
                                         text-gray-400" size={15} />
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) =>
                          setProfileData((p) => ({ ...p, name: e.target.value }))
                        }
                        className="input pl-9"
                        placeholder="Full name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">Email Address</label>
                    <div className="relative">
                      <FiMail className="absolute left-3 top-1/2 -translate-y-1/2
                                         text-gray-400" size={15} />
                      <input
                        type="email"
                        value={user?.email}
                        disabled
                        className="input pl-9 bg-gray-50 cursor-not-allowed
                                   text-gray-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">Phone Number</label>
                    <div className="relative">
                      <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2
                                          text-gray-400" size={15} />
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) =>
                          setProfileData((p) => ({
                            ...p, phone: e.target.value,
                          }))
                        }
                        className="input pl-9"
                        placeholder="Phone number"
                      />
                    </div>
                  </div>

                  {user?.role === 'agent' && (
                    <div>
                      <label className="label">Department</label>
                      <div className="relative">
                        <FiBriefcase
                          className="absolute left-3 top-1/2 -translate-y-1/2
                                     text-gray-400"
                          size={15}
                        />
                        <input
                          type="text"
                          value={profileData.department}
                          onChange={(e) =>
                            setProfileData((p) => ({
                              ...p, department: e.target.value,
                            }))
                          }
                          className="input pl-9"
                          placeholder="Department"
                        />
                      </div>
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <label className="label">Address</label>
                    <div className="relative">
                      <FiMapPin
                        className="absolute left-3 top-3 text-gray-400"
                        size={15}
                      />
                      <textarea
                        value={profileData.address}
                        onChange={(e) =>
                          setProfileData((p) => ({
                            ...p, address: e.target.value,
                          }))
                        }
                        rows={3}
                        className="input pl-9 resize-none"
                        placeholder="Your address"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="btn-primary"
                  >
                    {savingProfile
                      ? <Spinner size="sm" color="white" />
                      : <><FiSave size={15} /> Save Changes</>
                    }
                  </button>
                </div>
              </form>
            </div>

            {/* ── Change Password Card ──────────────────────── */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Change Password
              </h3>

              <form onSubmit={handlePasswordSubmit} className="space-y-4
                            max-w-md">
                {[
                  {
                    label: 'Current Password',
                    key:   'currentPassword',
                    placeholder: 'Enter current password',
                  },
                  {
                    label: 'New Password',
                    key:   'newPassword',
                    placeholder: 'Min. 6 characters',
                  },
                  {
                    label: 'Confirm New Password',
                    key:   'confirmPassword',
                    placeholder: 'Repeat new password',
                  },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label className="label">{label}</label>
                    <div className="relative">
                      <FiLock
                        className="absolute left-3 top-1/2 -translate-y-1/2
                                   text-gray-400"
                        size={15}
                      />
                      <input
                        type="password"
                        value={passwordData[key]}
                        onChange={(e) => {
                          setPasswordData((p) => ({
                            ...p, [key]: e.target.value,
                          }));
                          if (passwordErrors[key])
                            setPasswordErrors((p) => ({ ...p, [key]: '' }));
                        }}
                        className={`input pl-9
                          ${passwordErrors[key] ? 'input-error' : ''}`}
                        placeholder={placeholder}
                      />
                    </div>
                    {passwordErrors[key] && (
                      <p className="error-text">{passwordErrors[key]}</p>
                    )}
                  </div>
                ))}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="btn-primary"
                  >
                    {savingPassword
                      ? <Spinner size="sm" color="white" />
                      : <><FiLock size={15} /> Update Password</>
                    }
                  </button>
                </div>
              </form>
            </div>

            {/* ── Account Info Card ─────────────────────────── */}
            <div className="card bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Account Information
              </h3>
              <div className="grid sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 text-xs mb-1">Member Since</p>
                  <p className="font-medium text-gray-700">
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'long', day: 'numeric',
                        })
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Last Login</p>
                  <p className="font-medium text-gray-700">
                    {user?.lastLogin
                      ? new Date(user.lastLogin).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'long', day: 'numeric',
                        })
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Account Status</p>
                  <span className="inline-flex items-center gap-1.5 text-green-700
                                   font-medium">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    Active
                  </span>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;