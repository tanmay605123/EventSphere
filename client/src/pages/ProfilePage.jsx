import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { QRCodeSVG } from 'qrcode.react';
import {
  User,
  Mail,
  Phone,
  Lock,
  Ticket,
  Info,
  LogOut,
  Calendar,
  MapPin,
  Trash2,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  Save,
  KeyRound,
  X
} from 'lucide-react';

export const ProfilePage = () => {
  const { user, updateUser, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Registrations state
  const [registrations, setRegistrations] = useState([]);
  const [loadingRegs, setLoadingRegs] = useState(true);
  const [eventTab, setEventTab] = useState('upcoming'); // 'upcoming' | 'past'

  // Personal info form state
  const [personalInfo, setPersonalInfo] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
  });
  const [savingPersonal, setSavingPersonal] = useState(false);

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);

  // Modal states
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedRegToCancel, setSelectedRegToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  // Sync user info if user changes
  useEffect(() => {
    if (user) {
      setPersonalInfo({
        name: user.name || '',
        phone: user.phone || '',
        email: user.email || '',
      });
    }
  }, [user]);

  // Fetch registrations
  const fetchRegistrations = async () => {
    setLoadingRegs(true);
    try {
      const res = await api.getMyRegistrations();
      setRegistrations(res.registrations || []);
    } catch (err) {
      addToast({
        type: 'error',
        message: 'Could not load your registered events.',
      });
    } finally {
      setLoadingRegs(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  // Filter registrations by upcoming vs past
  const now = new Date();
  const upcomingEvents = registrations.filter((reg) => {
    if (!reg.event) return false;
    const eventDate = new Date(reg.event.date);
    return eventDate >= now || isSameDay(eventDate, now);
  });

  const pastEvents = registrations.filter((reg) => {
    if (!reg.event) return false;
    const eventDate = new Date(reg.event.date);
    return eventDate < now && !isSameDay(eventDate, now);
  });

  function isSameDay(d1, d2) {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  // Handle Personal Info Update
  const handlePersonalSubmit = async (e) => {
    e.preventDefault();
    if (!personalInfo.name.trim()) {
      addToast({ type: 'error', message: 'Name cannot be empty' });
      return;
    }

    setSavingPersonal(true);
    try {
      const res = await api.updateProfile({
        name: personalInfo.name,
        phone: personalInfo.phone,
      });
      if (res.user) {
        updateUser(res.user);
      }
      addToast({
        type: 'success',
        message: 'Personal details updated successfully!',
      });
    } catch (err) {
      addToast({
        type: 'error',
        message: err.message || 'Failed to update personal info.',
      });
    } finally {
      setSavingPersonal(false);
    }
  };

  // Handle Password Update
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword || !newPassword) {
      addToast({ type: 'error', message: 'Please enter all password fields' });
      return;
    }

    if (newPassword.length < 6) {
      addToast({
        type: 'error',
        message: 'New password must be at least 6 characters',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      addToast({ type: 'error', message: 'New passwords do not match' });
      return;
    }

    setSavingPassword(true);
    try {
      await api.updatePassword({ currentPassword, newPassword });
      addToast({
        type: 'success',
        message: 'Password updated successfully!',
      });
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      addToast({
        type: 'error',
        message: err.message || 'Failed to update password.',
      });
    } finally {
      setSavingPassword(false);
    }
  };

  // Handle Cancel Registration
  const confirmCancelRegistration = async () => {
    if (!selectedRegToCancel) return;
    setCancelling(true);
    try {
      const regIdentifier =
        selectedRegToCancel.registrationId ||
        selectedRegToCancel._id ||
        selectedRegToCancel.id;
      await api.cancelRegistration(regIdentifier);
      addToast({
        type: 'success',
        message: 'Registration cancelled. Seat has been released.',
      });
      setCancelModalOpen(false);
      setSelectedRegToCancel(null);
      fetchRegistrations();
    } catch (err) {
      addToast({
        type: 'error',
        message: err.message || 'Failed to cancel registration.',
      });
    } finally {
      setCancelling(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col">
      {/* Top Bar with round logo, app name, profile avatar */}
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">

        {/* Top Header Section: Avatar, Name and Email */}
        <div className="card-base p-6 sm:p-8 mb-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-500 text-white font-bold text-2xl sm:text-3xl flex items-center justify-center shadow-lg shadow-primary-500/25 shrink-0">
            {getInitials(user?.name)}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold text-slate-900">{user?.name}</h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 self-center sm:self-auto">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified Member</span>
              </span>
            </div>
            <p className="text-sm text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{user?.email}</span>
            </p>
            {user?.phone && (
              <p className="text-xs text-slate-500 mt-1 flex items-center justify-center sm:justify-start gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{user?.phone}</span>
              </p>
            )}
          </div>

          <div className="sm:self-center">
            <button
              onClick={() => setLogoutModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 text-xs font-semibold transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Four Cards in a 2x2 Grid (Stacked on mobile) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* CARD A: Events Registered */}
          <div className="card-base p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary-50 text-primary-600">
                    <Ticket className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Events Registered</h3>
                    <p className="text-xs text-slate-500">Upcoming and past registrations</p>
                  </div>
                </div>

                {/* Sub-tabs: Upcoming vs Past */}
                <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setEventTab('upcoming')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      eventTab === 'upcoming'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Upcoming ({upcomingEvents.length})
                  </button>
                  <button
                    onClick={() => setEventTab('past')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      eventTab === 'past'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Past ({pastEvents.length})
                  </button>
                </div>
              </div>

              {/* Event Registrations List */}
              {loadingRegs ? (
                <div className="space-y-3 py-4">
                  <div className="h-16 bg-slate-100 rounded-xl animate-pulse"></div>
                  <div className="h-16 bg-slate-100 rounded-xl animate-pulse"></div>
                </div>
              ) : (eventTab === 'upcoming' ? upcomingEvents : pastEvents).length === 0 ? (
                <div className="text-center py-10 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                  <Ticket className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No {eventTab} events</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {eventTab === 'upcoming'
                      ? 'Explore new events on the home page and register!'
                      : 'Your attended events will be archived here.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {(eventTab === 'upcoming' ? upcomingEvents : pastEvents).map((reg) => {
                    const ev = reg.event;
                    if (!ev) return null;
                    const isCancelled = reg.status === 'cancelled';

                    return (
                      <div
                        key={reg._id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isCancelled
                            ? 'bg-slate-50 border-slate-200 opacity-60'
                            : 'bg-white border-slate-200 hover:border-primary-200 shadow-xs'
                        }`}
                      >
                        <div className="flex gap-3 items-center">
                          <img
                            src={ev.image}
                            alt={ev.title}
                            className="w-14 h-14 rounded-lg object-cover shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-slate-900 truncate">
                              {ev.title}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-primary-600" />
                                {ev.date}
                              </span>
                              <span>•</span>
                              <span className="truncate">{ev.venue}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-mono text-slate-400">
                                {reg.registrationId}
                              </span>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.2 rounded-full ${
                                  isCancelled
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {isCancelled ? 'Cancelled' : 'Registered'}
                              </span>
                            </div>
                          </div>

                          {/* Actions: View Ticket / Cancel */}
                          <div className="flex flex-col gap-1.5 shrink-0">
                            {!isCancelled && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedTicket({ reg, event: ev });
                                    setTicketModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 text-xs font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors flex items-center gap-1"
                                  title="View QR Ticket"
                                >
                                  <Ticket className="w-3 h-3" />
                                  <span>Ticket</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setSelectedRegToCancel(reg);
                                    setCancelModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1"
                                  title="Cancel Registration"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Cancel</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 text-right">
              <button
                onClick={() => navigate('/')}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
              >
                <span>Browse more events</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* CARD B: Personal Info */}
          <div className="card-base p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-4">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Personal Information</h3>
                  <p className="text-xs text-slate-500">Update your profile details</p>
                </div>
              </div>

              <form onSubmit={handlePersonalSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={personalInfo.name}
                    onChange={(e) =>
                      setPersonalInfo({ ...personalInfo, name: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={personalInfo.email}
                    disabled
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                    title="Email address cannot be modified"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Email is associated with your login credentials
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={personalInfo.phone}
                    onChange={(e) =>
                      setPersonalInfo({ ...personalInfo, phone: e.target.value })
                    }
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingPersonal}
                    className="btn-primary w-full justify-center text-sm py-2.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingPersonal ? 'Saving Changes...' : 'Save Personal Info'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* CARD C: Password */}
          <div className="card-base p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-4">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Security & Password</h3>
                  <p className="text-xs text-slate-500">Change your login password</p>
                </div>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        currentPassword: e.target.value,
                      })
                    }
                    placeholder="••••••••"
                    required
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        newPassword: e.target.value,
                      })
                    }
                    placeholder="Minimum 6 characters"
                    required
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="Confirm password"
                    required
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="btn-primary w-full justify-center text-sm py-2.5"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{savingPassword ? 'Updating...' : 'Update Password'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* CARD D: About */}
          <div className="card-base p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
                <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">About EventSphere</h3>
                  <p className="text-xs text-slate-500">Platform information & terms</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <p>
                  <strong className="text-slate-800">EventSphere</strong> is a single platform designed for discovering, attending, and managing event registrations across technology, cultural fests, sports meets, and professional workshops.
                </p>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                  <p className="flex justify-between">
                    <span className="text-slate-400">Release Version:</span>
                    <span className="font-mono font-bold text-slate-800">v1.0.0 (Production)</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-400">Stack:</span>
                    <span className="font-semibold text-slate-800">React + Tailwind + Node.js + Express</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-400">Environment:</span>
                    <span className="font-semibold text-emerald-600">Active & Connected</span>
                  </p>
                </div>

                <div className="pt-2">
                  <p className="font-semibold text-slate-700">Terms & Privacy Summary:</p>
                  <p className="mt-1 text-slate-500">
                    Registration data is kept strictly confidential. Cancellations release seats immediately for waiting attendees.
                  </p>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <div className="pt-6 border-t border-slate-100 mt-6">
              <button
                onClick={() => setLogoutModalOpen(true)}
                className="w-full py-2.5 px-4 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out of Account</span>
              </button>
            </div>
          </div>

        </div>

      </main>

      {/* Cancel Registration Confirmation Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Registration"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl text-amber-800 text-sm">
            <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600" />
            <p>
              Are you sure you want to cancel your seat for{' '}
              <strong className="text-slate-900">{selectedRegToCancel?.event?.title}</strong>?
              This seat will be released for other attendees.
            </p>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              onClick={() => setCancelModalOpen(false)}
              className="btn-secondary"
            >
              Keep Registration
            </button>
            <button
              onClick={confirmCancelRegistration}
              disabled={cancelling}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm rounded-xl transition-all shadow-sm"
            >
              {cancelling ? 'Cancelling...' : 'Yes, Cancel Seat'}
            </button>
          </div>
        </div>
      </Modal>

      {/* View QR Ticket Modal */}
      <Modal
        isOpen={ticketModalOpen}
        onClose={() => setTicketModalOpen(false)}
        title="Event Access Pass"
      >
        {selectedTicket && (
          <div className="space-y-4 text-center">
            <img
              src={selectedTicket.event.image}
              alt={selectedTicket.event.title}
              className="w-full h-32 object-cover rounded-xl"
            />
            <div className="text-left">
              <h4 className="font-bold text-slate-900 text-base">{selectedTicket.event.title}</h4>
              <p className="text-xs text-slate-500 mt-1">{selectedTicket.event.date} • {selectedTicket.event.time}</p>
              <p className="text-xs text-slate-500">{selectedTicket.event.venue}</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center">
              <QRCodeSVG
                value={JSON.stringify({
                  regId: selectedTicket.reg.registrationId,
                  attendee: user?.name,
                  email: user?.email,
                })}
                size={140}
              />
              <p className="font-mono text-sm font-bold text-primary-700 mt-2">
                {selectedTicket.reg.registrationId}
              </p>
              <p className="text-[11px] text-slate-400">Scan at entrance gate</p>
            </div>

            <button
              onClick={() => setTicketModalOpen(false)}
              className="w-full btn-primary"
            >
              Done
            </button>
          </div>
        )}
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        title="Confirm Logout"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to log out of your EventSphere session?
          </p>
          <div className="flex gap-3 justify-end pt-2">
            <button
              onClick={() => setLogoutModalOpen(false)}
              className="btn-secondary"
            >
              Stay Logged In
            </button>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm rounded-xl transition-all shadow-sm"
            >
              Yes, Log Out
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
