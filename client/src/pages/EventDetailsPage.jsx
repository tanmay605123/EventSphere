import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertTriangle,
  Building2,
  DollarSign,
  Share2,
  ShieldCheck,
  Ticket,
  UserCheck,
  Sparkles,
} from 'lucide-react';

export const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [event, setEvent] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationDetails, setRegistrationDetails] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  // Fetch event details and registered attendees
  const fetchEvent = async () => {
    setLoading(true);
    try {
      const res = await api.getEventById(id);
      setEvent(res.event);
      setIsRegistered(res.isRegistered);
      setRegistrationDetails(res.registration);
      setAttendees(res.attendees || []);
    } catch (err) {
      addToast({
        type: 'error',
        message: 'Unable to load event details. Returning to home.',
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const handleRegister = async () => {
    if (isRegistered) {
      navigate('/confirmation', {
        state: {
          event,
          registration: registrationDetails,
        },
      });
      return;
    }

    if (event.seatsLeft <= 0) {
      addToast({
        type: 'error',
        message: 'This event is full. No seats remaining.',
      });
      return;
    }

    setRegistering(true);
    try {
      const res = await api.registerForEvent(id);

      // Immediately add the user to local attendees list
      if (res.registration) {
        const newAttendee = {
          ...res.registration,
          userId: user?.id || user?._id,
          user: {
            id: user?.id || user?._id,
            name: user?.name || 'You',
            email: user?.email,
          },
        };
        setAttendees((prev) => [
          newAttendee,
          ...prev.filter(
            (a) =>
              a.userId !== (user?.id || user?._id) &&
              a.registrationId !== res.registration.registrationId
          ),
        ]);
        setIsRegistered(true);
        setRegistrationDetails(res.registration);
      }

      addToast({
        type: 'success',
        message: 'Registration confirmed! See your ticket below.',
      });

      // Redirect to Confirmation Page with event & registration info
      navigate('/confirmation', {
        state: {
          event: res.event || event,
          registration: res.registration,
        },
      });
    } catch (err) {
      addToast({
        type: 'error',
        message: err.message || 'Registration failed. Please try again.',
      });
      // Refresh event to sync seats/status
      fetchEvent();
    } finally {
      setRegistering(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: event?.title,
          text: `Check out ${event?.title} on EventSphere!`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      addToast({
        type: 'info',
        message: 'Event link copied to clipboard!',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-bg flex flex-col">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-8 w-full animate-pulse">
          <div className="h-6 w-32 bg-slate-200 rounded mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-6 h-96 bg-slate-200 rounded-2xl"></div>
            <div className="lg:col-span-6 space-y-4">
              <div className="h-8 bg-slate-200 rounded w-3/4"></div>
              <div className="h-5 bg-slate-200 rounded w-1/2"></div>
              <div className="h-32 bg-slate-200 rounded w-full"></div>
              <div className="h-12 bg-slate-200 rounded w-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) return null;

  const isFull = event.seatsLeft <= 0;
  const seatsOccupied = event.totalSeats - event.seatsLeft;
  const capacityPercent = Math.min(
    100,
    Math.round((seatsOccupied / event.totalSeats) * 100)
  );

  const formattedDate = (() => {
    try {
      const d = new Date(event.date);
      if (isNaN(d.getTime())) return event.date;
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return event.date;
    }
  })();

  const currentUserId = user?.id || user?._id;

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col">
      {/* Top Bar with round logo, app name, profile avatar */}
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Back navigation & Share action */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-primary-600 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Events</span>
          </button>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>

        {/* Responsive Layout: Large picture on left, details on right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Event picture, Organizer, and Registered Attendees */}
          <div className="lg:col-span-6 space-y-6">
            <div className="relative rounded-2xl overflow-hidden border border-slate-100 shadow-md bg-white group">
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-80 sm:h-96 object-cover group-hover:scale-102 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>

              {/* Category & Price Floating Badges */}
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 text-xs font-bold rounded-full bg-white/95 text-primary-700 shadow-sm backdrop-blur-md">
                  {event.category}
                </span>
              </div>

              <div className="absolute top-4 right-4">
                <span
                  className={`px-3 py-1 text-xs font-bold rounded-full shadow-sm backdrop-blur-md text-white ${
                    event.price === 0 ? 'bg-emerald-600' : 'bg-slate-900/90'
                  }`}
                >
                  {event.price === 0 ? 'Free Entry' : `$${event.price}`}
                </span>
              </div>
            </div>

            {/* Organizer Card */}
            <div className="card-base p-5 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-lg">
                  <Building2 className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Organized by
                  </p>
                  <p className="text-base font-bold text-slate-900">
                    {event.organizer}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-emerald-600 text-xs font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified</span>
              </div>
            </div>

            {/* REGISTERED ATTENDEES SECTION */}
            <div className="card-base p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Registered Attendees
                    </h3>
                    <p className="text-xs text-slate-500">
                      Users registered for this event
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-100">
                  {attendees.length}{' '}
                  {attendees.length === 1 ? 'Registered' : 'Registered'}
                </span>
              </div>

              {/* Attendee List */}
              {attendees.length === 0 ? (
                <div className="py-6 text-center text-slate-400 space-y-1">
                  <Users className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
                  <p className="text-xs font-medium">No attendees registered yet.</p>
                  <p className="text-xs text-slate-400">
                    Be the first attendee to secure your ticket!
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {attendees.map((attendee, index) => {
                    const attendeeName =
                      attendee.user?.name ||
                      attendee.user?.email?.split('@')[0] ||
                      `Attendee #${index + 1}`;
                    const isSelf =
                      currentUserId &&
                      (attendee.userId === currentUserId ||
                        attendee.user?.id === currentUserId);
                    const initial = attendeeName.charAt(0).toUpperCase();

                    return (
                      <div
                        key={attendee.id || attendee.registrationId || index}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                          isSelf
                            ? 'bg-primary-50/70 border-primary-200'
                            : 'bg-slate-50/80 border-slate-100 hover:bg-slate-100/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shadow-xs ${
                              isSelf
                                ? 'bg-primary-600 text-white'
                                : 'bg-gradient-to-tr from-slate-700 to-indigo-600 text-white'
                            }`}
                          >
                            {initial}
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-semibold text-slate-800">
                                {attendeeName}
                              </span>
                              {isSelf && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-primary-600 text-white rounded-md">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400">
                              Ticket: {attendee.registrationId}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-emerald-600 text-xs font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Confirmed</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Event details, logistics & CTA */}
          <div className="lg:col-span-6">
            <div className="card-base p-6 sm:p-8 space-y-6">
              {/* Title & Category */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-2.5 py-0.5 rounded-md">
                    {event.category}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-medium text-slate-500">
                    Registration Closes Soon
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                  {event.title}
                </h1>
              </div>

              {/* Date, Time & Venue Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-lg text-primary-600 shadow-xs">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400">Date</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {formattedDate}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-lg text-primary-600 shadow-xs">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400">Time</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {event.time}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:col-span-2">
                  <div className="p-2 bg-white rounded-lg text-primary-600 shadow-xs">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400">Venue</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {event.venue}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
                  About the Event
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                  {event.description}
                </p>
              </div>

              {/* Seats Left & Capacity Progress */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <Users className="w-4 h-4 text-slate-500" />
                    Seats Availability
                  </span>
                  <span className={isFull ? 'text-rose-600' : 'text-slate-800'}>
                    {isFull
                      ? 'No seats remaining'
                      : `${event.seatsLeft} of ${event.totalSeats} seats available`}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      capacityPercent >= 90
                        ? 'bg-rose-500'
                        : capacityPercent >= 70
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${capacityPercent}%` }}
                  ></div>
                </div>
              </div>

              {/* Action Buttons Section */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                {isRegistered ? (
                  /* Already Registered State */
                  <div className="space-y-3">
                    <button
                      disabled
                      className="w-full bg-emerald-600 text-white font-semibold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 cursor-default shadow-sm opacity-95"
                    >
                      <CheckCircle2 className="w-5 h-5 text-white" />
                      <span>Registered</span>
                    </button>

                    <button
                      onClick={() =>
                        navigate('/confirmation', {
                          state: {
                            event,
                            registration: registrationDetails,
                          },
                        })
                      }
                      className="w-full btn-secondary justify-center py-2.5 text-sm"
                    >
                      <Ticket className="w-4 h-4 text-primary-600" />
                      <span>View Confirmation & QR Ticket</span>
                    </button>
                  </div>
                ) : isFull ? (
                  /* Event Full State */
                  <button
                    disabled
                    className="w-full bg-slate-200 text-slate-500 font-semibold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed shadow-none"
                  >
                    <AlertTriangle className="w-5 h-5 text-slate-400" />
                    <span>Event Full</span>
                  </button>
                ) : (
                  /* Available: Prominent Accent Orange Register Button */
                  <button
                    onClick={handleRegister}
                    disabled={registering}
                    className="w-full btn-accent justify-center py-3.5 px-6 text-base shadow-md hover:shadow-lg disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {registering ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Securing your seat...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <span>
                          Register Now (
                          {event.price === 0 ? 'Free' : `$${event.price}`})
                        </span>
                      </div>
                    )}
                  </button>
                )}

                <p className="text-center text-xs text-slate-400">
                  Instant registration confirmation • Scannable QR pass included
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
