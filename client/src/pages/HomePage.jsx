import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from '../components/Navbar';
import { EventCard } from '../components/EventCard';
import { SkeletonCard } from '../components/SkeletonCard';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  Search,
  Filter,
  Calendar,
  Clock,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X
} from 'lucide-react';

const CATEGORIES = ['All', 'Tech', 'Cultural', 'Sports', 'Workshops'];
const DAYS = ['All', 'Today', 'Tomorrow', 'Weekend', 'Weekdays'];
const TIMES = ['All', 'Morning', 'Afternoon', 'Evening'];
const ITEMS_PER_PAGE = 6;

export const HomePage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDay, setSelectedDay] = useState('All');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Fetch events from API
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await api.getEvents({
        search: searchTerm,
        category: selectedCategory,
        day: selectedDay,
        date: selectedDate,
        time: selectedTime,
      });
      setEvents(res.events || []);
      setCurrentPage(1); // Reset to page 1 on filter change
    } catch (err) {
      addToast({
        type: 'error',
        message: 'Failed to load events. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Debounced search / trigger on filter change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEvents();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory, selectedDay, selectedDate, selectedTime]);

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSelectedDay('All');
    setSelectedDate('');
    setSelectedTime('All');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchTerm !== '' ||
    selectedCategory !== 'All' ||
    selectedDay !== 'All' ||
    selectedDate !== '' ||
    selectedTime !== 'All';

  // Pagination calculation
  const totalPages = Math.ceil(events.length / ITEMS_PER_PAGE) || 1;
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return events.slice(start, start + ITEMS_PER_PAGE);
  }, [events, currentPage]);

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col">
      {/* Universal Top Bar */}
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Hero Section */}
        <div className="text-center sm:text-left mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-700 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Live Events in 2026</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
              Discover & Join Extraordinary Events
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-1">
              Browse tech conferences, indie concerts, sports camps, and expert workshops.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="hidden sm:flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-100 shadow-sm text-xs font-medium text-slate-600">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>{events.length} events currently open for registration</span>
          </div>
        </div>

        {/* Search & Filters Card */}
        <div className="card-base p-4 sm:p-6 mb-8">
          <div className="flex flex-col gap-4">

            {/* Top row: Search input + Mobile Filter Toggle */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search events by name, venue, or keywords..."
                  className="w-full pl-10 pr-10 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 focus:bg-white transition-all"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Mobile filter accordion toggle */}
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="md:hidden flex items-center gap-1.5 px-4 py-3 bg-slate-100 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-200 transition-colors"
                aria-label="Toggle filters"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filters</span>
              </button>
            </div>

            {/* Category Chips Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:inline-block mr-1">
                Category:
              </span>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                    selectedCategory === cat
                      ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/25 scale-[1.02]'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Dropdown Filters (Day, Date, Time) - visible on Desktop, collapsible on Mobile */}
            <div className={`${showMobileFilters ? 'block' : 'hidden md:block'} pt-3 border-t border-slate-100`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">

                {/* Day Filter */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Day
                  </label>
                  <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d === 'All' ? 'All Days' : d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Picker */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Specific Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 text-slate-700"
                  />
                </div>

                {/* Time Filter */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Time of Day
                  </label>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600"
                  >
                    {TIMES.map((t) => (
                      <option key={t} value={t}>
                        {t === 'All' ? 'All Times' : `${t} ${t === 'Morning' ? '(<12 PM)' : t === 'Afternoon' ? '(12-5 PM)' : '(5 PM+)'}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reset Filters Action */}
                <div className="flex items-end">
                  <button
                    onClick={resetFilters}
                    disabled={!hasActiveFilters}
                    className="w-full py-2 px-3 text-sm font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Filters</span>
                  </button>
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-4 px-1">
          <p className="text-sm font-medium text-slate-600">
            Showing <span className="font-bold text-slate-900">{events.length}</span> {events.length === 1 ? 'event' : 'events'}
            {hasActiveFilters && ' matching your filters'}
          </p>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear all</span>
            </button>
          )}
        </div>

        {/* Responsive Grid of Event Cards (1 col mobile, 2 col tablet, 3 col desktop) */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : events.length === 0 ? (
          /* Empty State */
          <div className="card-base p-12 text-center my-8 max-w-lg mx-auto">
            <div className="w-16 h-16 bg-indigo-50 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 opacity-60" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">No events found</h3>
            <p className="text-sm text-slate-600 mt-2">
              We couldn't find any events matching your search or filters. Try adjusting your query or resetting filters.
            </p>
            <button
              onClick={resetFilters}
              className="mt-6 btn-accent"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset all filters</span>
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedEvents.map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }).map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all ${
                        currentPage === pageNum
                          ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/25'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};
