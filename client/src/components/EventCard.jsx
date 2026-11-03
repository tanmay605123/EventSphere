import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Users, ArrowRight, Tag } from 'lucide-react';

export const EventCard = ({ event }) => {
  const {
    _id,
    title,
    category,
    image,
    date,
    time,
    venue,
    seatsLeft,
    totalSeats,
    price,
  } = event;

  // Format date nicely: e.g. "Sat, Nov 15, 2026"
  const formattedDate = (() => {
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return date;
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return date;
    }
  })();

  const isFull = seatsLeft <= 0;
  const isFewSeats = seatsLeft > 0 && seatsLeft <= 10;

  // Category badge colors
  const categoryStyles = {
    Tech: 'bg-blue-50 text-blue-700 border-blue-200',
    Cultural: 'bg-purple-50 text-purple-700 border-purple-200',
    Sports: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Workshops: 'bg-amber-50 text-amber-700 border-amber-200',
  }[category] || 'bg-slate-50 text-slate-700 border-slate-200';

  return (
    <div className="group bg-white rounded-2xl border border-slate-100 shadow-soft hover:shadow-soft-hover hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden">
      {/* Banner Image with Badges */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-100">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>

        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border shadow-sm backdrop-blur-md bg-white/90 ${categoryStyles}`}>
            {category}
          </span>
        </div>

        {/* Price Tag */}
        <div className="absolute top-3 right-3">
          <span className={`px-2.5 py-1 text-xs font-bold rounded-full shadow-sm backdrop-blur-md ${
            price === 0
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-900/80 text-white'
          }`}>
            {price === 0 ? 'Free' : `$${price}`}
          </span>
        </div>

        {/* Seats Status Pill (Floating over bottom banner) */}
        <div className="absolute bottom-2.5 left-3">
          <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold backdrop-blur-md shadow-sm ${
            isFull
              ? 'bg-rose-500/90 text-white'
              : isFewSeats
              ? 'bg-amber-500/90 text-white'
              : 'bg-slate-900/70 text-slate-100'
          }`}>
            <Users className="w-3.5 h-3.5" />
            <span>
              {isFull ? 'Event Full' : `${seatsLeft} seats left`}
            </span>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Title */}
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-2 mb-3">
            {title}
          </h3>

          {/* Date & Time */}
          <div className="flex flex-col gap-2 text-sm text-slate-600 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary-600 shrink-0" />
              <span className="font-medium text-slate-700">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{time}</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span className="truncate">{venue}</span>
            </div>
          </div>
        </div>

        {/* Card Footer: View Details CTA */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Total capacity: <span className="font-semibold text-slate-700">{totalSeats}</span>
          </div>

          <Link
            to={`/events/${_id}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 group-hover:translate-x-0.5 transition-all"
          >
            <span>View Details</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};
