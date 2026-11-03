import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import {
  Check,
  Calendar,
  Clock,
  MapPin,
  Ticket,
  ArrowRight,
  Home,
  Download,
  Share2
} from 'lucide-react';

export const ConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [eventData, setEventData] = useState(location.state?.event || null);
  const [registrationData, setRegistrationData] = useState(location.state?.registration || null);
  const [loadingFallback, setLoadingFallback] = useState(!location.state?.event);

  // Trigger celebration confetti on mount
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4F46E5', '#F97316', '#10B981', '#6366F1'],
      });
    } catch (e) {
      // Confetti is a visual enhancement, ignore if blocked
    }
  }, []);

  // If user navigated directly to /confirmation without location state, fetch the most recent registration
  useEffect(() => {
    if (!eventData) {
      setLoadingFallback(true);
      api.getMyRegistrations()
        .then((res) => {
          if (res.registrations && res.registrations.length > 0) {
            const latest = res.registrations[0];
            setRegistrationData(latest);
            setEventData(latest.event);
          }
        })
        .catch(() => {})
        .finally(() => {
          setLoadingFallback(false);
        });
    }
  }, [eventData]);

  const handlePrint = () => {
    window.print();
  };

  if (loadingFallback) {
    return (
      <div className="min-h-screen bg-surface-bg flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            <p className="text-sm text-slate-500">Loading your ticket confirmation...</p>
          </div>
        </div>
      </div>
    );
  }

  const registrationId = registrationData?.registrationId || 'REG-2026-PASS';
  const qrValue = JSON.stringify({
    regId: registrationId,
    eventId: eventData?._id,
    eventTitle: eventData?.title,
    attendee: user?.name,
    email: user?.email,
    verified: true,
  });

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col">
      {/* Top Bar with round logo, app name, profile avatar */}
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-10 w-full flex flex-col items-center">

        {/* Large green circle with animated checkmark */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-emerald-100 border-4 border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4 animate-scale-up">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-inner">
              <Check className="w-8 h-8 sm:w-10 sm:h-10 stroke-[3]" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Registration Done!
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-md">
            Your seat has been reserved. Present your QR code ticket at the entrance.
          </p>
        </div>

        {/* Summary Card */}
        {eventData ? (
          <div className="w-full card-base p-6 sm:p-8 overflow-hidden relative border-t-4 border-t-emerald-500 mb-8">

            {/* Event Header with Banner Thumbnail */}
            <div className="flex flex-col sm:flex-row gap-5 pb-6 border-b border-slate-100 items-start">
              <img
                src={eventData.image}
                alt={eventData.title}
                className="w-full sm:w-28 h-28 object-cover rounded-xl shadow-sm shrink-0"
              />
              <div className="flex-1">
                <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                  {eventData.category}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1 leading-snug">
                  {eventData.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Organized by <span className="font-semibold text-slate-700">{eventData.organizer}</span>
                </p>
              </div>
            </div>

            {/* Logistics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-6 border-b border-slate-100">
              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-400 font-medium">Date</p>
                  <p className="text-sm font-semibold text-slate-800">{eventData.date}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-400 font-medium">Time</p>
                  <p className="text-sm font-semibold text-slate-800">{eventData.time}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-400 font-medium">Venue</p>
                  <p className="text-sm font-semibold text-slate-800 truncate" title={eventData.venue}>
                    {eventData.venue}
                  </p>
                </div>
              </div>
            </div>

            {/* Registration Details & Scannable QR Code */}
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-50/70 p-5 rounded-xl border border-slate-100 mt-6">
              <div className="space-y-2 text-center sm:text-left">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Registration ID
                  </span>
                  <p className="text-lg sm:text-xl font-mono font-bold text-primary-700 tracking-wider">
                    {registrationId}
                  </p>
                </div>

                <div className="pt-1">
                  <p className="text-xs text-slate-400 font-medium">Attendee</p>
                  <p className="text-sm font-bold text-slate-800">{user?.name}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>

                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-md">
                  <Ticket className="w-3.5 h-3.5" />
                  <span>Confirmed Seat</span>
                </div>
              </div>

              {/* Scannable QR Code */}
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center">
                <QRCodeSVG
                  value={qrValue}
                  size={128}
                  level="M"
                  includeMargin={true}
                />
                <span className="text-[10px] text-slate-400 font-mono mt-1">Scan at check-in</span>
              </div>
            </div>

          </div>
        ) : (
          <div className="w-full card-base p-8 text-center mb-8">
            <p className="text-slate-600">No recent registration record found.</p>
          </div>
        )}

        {/* Buttons: "View My Events" and "Back to Home" */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
          <Link
            to="/profile"
            className="flex-1 btn-accent justify-center py-3"
          >
            <Ticket className="w-4 h-4" />
            <span>View My Events</span>
          </Link>

          <Link
            to="/"
            className="flex-1 btn-secondary justify-center py-3"
          >
            <Home className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Print / Save button */}
        <div className="mt-4">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Print or Save Pass as PDF</span>
          </button>
        </div>

      </main>
    </div>
  );
};
