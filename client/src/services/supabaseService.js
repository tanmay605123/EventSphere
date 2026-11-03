import { supabase } from '../utils/supabase.js';

// Default seed events used as fallback if database tables are being initialized
const DEFAULT_SEED_EVENTS = [
  {
    id: 'c68bb897-37f9-a8c9-5253-a72a00000001',
    _id: 'c68bb897-37f9-a8c9-5253-a72a00000001',
    title: 'Global AI & Web3 Hackathon 2026',
    category: 'Tech',
    description:
      'Join 500+ developers, designers, and innovators building next-generation AI and decentralized apps. 36 hours of non-stop hacking, mentoring from industry leaders, free food, and $50,000 in prizes! Teams will receive cloud credits and direct access to top tech recruiters.',
    image:
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
    date: '2026-11-15',
    time: '09:00 AM',
    venue: 'Metropolis Tech Park, Hall 4, San Francisco, CA',
    organizer: 'DevSphere Innovation Labs',
    totalSeats: 250,
    seatsLeft: 42,
    price: 0,
    createdAt: '2026-10-29T10:09:46.800Z',
  },
  {
    id: '9398ffa4-23f9-ec5c-28c6-201100000002',
    _id: '9398ffa4-23f9-ec5c-28c6-201100000002',
    title: 'Neon Beats Indie Music Fest',
    category: 'Cultural',
    description:
      'An unforgettable evening of live acoustic, synthwave, and indie rock under the stars. Featuring top regional breakthrough bands, food trucks, light art installations, and curated artisan stalls.',
    image:
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
    date: '2026-11-20',
    time: '06:30 PM',
    venue: 'Riverfront Amphitheater, Austin, TX',
    organizer: 'Pulse Live Entertainment',
    totalSeats: 500,
    seatsLeft: 87,
    price: 25,
    createdAt: '2026-10-29T10:09:46.801Z',
  },
  {
    id: 'e19ec7a6-512a-48ac-4fa2-e10300000003',
    _id: 'e19ec7a6-512a-48ac-4fa2-e10300000003',
    title: 'Inter-City Smash Badminton Championship',
    category: 'Sports',
    description:
      "Annual amateur and semi-pro badminton showdown. Men's & Women's singles and doubles tournament with official BWF scoring, live streaming, trophies, and athletic gear hampers.",
    image:
      'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=80',
    date: '2026-12-05',
    time: '08:30 AM',
    venue: 'Olympus Indoor Arena, Chicago, IL',
    organizer: 'Midwest Racquet Club',
    totalSeats: 100,
    seatsLeft: 22,
    price: 30,
    createdAt: '2026-10-29T10:09:46.801Z',
  },
  {
    id: '0a4122a0-adfe-5dfa-66a3-c42c00000004',
    _id: '0a4122a0-adfe-5dfa-66a3-c42c00000004',
    title: 'Full-Stack Design Systems Masterclass',
    category: 'Workshops',
    description:
      'From Figma tokens to reusable Tailwind & React component libraries. Deep dive into accessible components, compound components, token synchronization, and micro-interactions.',
    image:
      'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=1200&q=80',
    date: '2026-12-10',
    time: '02:00 PM',
    venue: 'Digital Arts Academy, Denver, CO',
    organizer: 'UI/UX Collective',
    totalSeats: 50,
    seatsLeft: 11,
    price: 40,
    createdAt: '2026-10-29T10:09:46.801Z',
  },
  {
    id: '1b4122a0-adfe-5dfa-66a3-c42c00000005',
    _id: '1b4122a0-adfe-5dfa-66a3-c42c00000005',
    title: 'Future of Cloud Architecture Summit',
    category: 'Tech',
    description:
      'Deep dive into modern serverless architectures, edge computing, distributed databases, and Kubernetes best practices with senior staff engineers from top cloud platforms.',
    image:
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
    date: '2026-11-28',
    time: '10:00 AM',
    venue: 'Grand Horizon Convention Center, Seattle, WA',
    organizer: 'Cloud Scale Foundation',
    totalSeats: 300,
    seatsLeft: 65,
    price: 15,
    createdAt: '2026-10-29T10:09:46.801Z',
  },
  {
    id: '2c4122a0-adfe-5dfa-66a3-c42c00000006',
    _id: '2c4122a0-adfe-5dfa-66a3-c42c00000006',
    title: 'Urban Marathon & Fitness Carnival 2026',
    category: 'Sports',
    description:
      '5K, 10K, and Half Marathon routes through scenic city landmarks. Includes hydration stations, finisher medals, timing chips, and a post-race music recovery lounge.',
    image:
      'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=1200&q=80',
    date: '2026-12-18',
    time: '06:00 AM',
    venue: 'Central Waterfront Boulevard, Boston, MA',
    organizer: 'Metro Athletics League',
    totalSeats: 600,
    seatsLeft: 140,
    price: 10,
    createdAt: '2026-10-29T10:09:46.801Z',
  },
];

// Helper: normalize event objects to bridge camelCase and snake_case
export const normalizeEvent = (row) => {
  if (!row) return null;
  const id = row.id || row._id;
  return {
    ...row,
    id,
    _id: id,
    title: row.title,
    category: row.category,
    description: row.description,
    image: row.image,
    date: row.date,
    time: row.time,
    venue: row.venue,
    organizer: row.organizer,
    price: typeof row.price === 'number' ? row.price : parseFloat(row.price || 0),
    totalSeats: row.total_seats !== undefined ? row.total_seats : row.totalSeats || 100,
    seatsLeft: row.seats_left !== undefined ? row.seats_left : row.seatsLeft || 0,
    createdAt: row.created_at || row.createdAt,
  };
};

// Helper: normalize registration objects
export const normalizeRegistration = (row) => {
  if (!row) return null;
  const id = row.id || row._id;
  return {
    ...row,
    id,
    _id: id,
    registrationId: row.registration_id || row.registrationId,
    userId: row.user_id || row.userId,
    eventId: row.event_id || row.eventId,
    status: row.status || 'registered',
    createdAt: row.created_at || row.createdAt,
    event: normalizeEvent(row.events || row.event),
    user: row.profiles || row.profile || row.user,
  };
};

// Local storage cache for fallback / offline registration simulation
const getLocalRegistrations = () => {
  try {
    const raw = localStorage.getItem('eventsphere_local_registrations');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalRegistrations = (list) => {
  try {
    localStorage.setItem('eventsphere_local_registrations', JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save local registration', e);
  }
};

export const supabaseService = {
  // -------------------------------------------------------------
  // AUTHENTICATION
  // -------------------------------------------------------------
  async signUp(name, email, password, phone = '') {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          phone,
        },
      },
    });

    if (error) {
      if (error.message?.toLowerCase().includes('rate limit') || error.code === 'over_email_send_rate_limit') {
        throw new Error(
          'Supabase email rate limit exceeded! Please turn OFF "Confirm email" in your Supabase Dashboard (Authentication > Providers > Email) for instant test signups.'
        );
      }
      throw new Error(error.message);
    }

    const authUser = data.user;
    if (!authUser) {
      throw new Error('Sign up failed. Please try again.');
    }

    // Try creating profile row in Supabase profiles table
    try {
      await supabase.from('profiles').upsert({
        id: authUser.id,
        name: name || authUser.email.split('@')[0],
        email: authUser.email,
        phone: phone || '',
      });
    } catch {
      // Table may not have been created yet, user metadata acts as profile
    }

    const userObj = {
      id: authUser.id,
      _id: authUser.id,
      name: name || authUser.user_metadata?.name || authUser.email.split('@')[0],
      email: authUser.email,
      phone: phone || authUser.user_metadata?.phone || '',
      createdAt: authUser.created_at,
    };

    return {
      user: userObj,
      token: data.session?.access_token || 'supabase_token_' + authUser.id,
      session: data.session,
      requiresEmailConfirmation: !data.session,
    };
  },

  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message?.toLowerCase().includes('rate limit') || error.code === 'over_email_send_rate_limit') {
        throw new Error(
          'Supabase email rate limit exceeded! Please turn OFF "Confirm email" in your Supabase Dashboard (Authentication > Providers > Email) for instant test signups.'
        );
      }
      throw new Error(error.message);
    }

    const authUser = data.user;
    let profileData = null;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();
      profileData = profile;
    } catch {
      // ignore table lookup failure
    }

    const userObj = {
      id: authUser.id,
      _id: authUser.id,
      name:
        profileData?.name ||
        authUser.user_metadata?.name ||
        authUser.email.split('@')[0],
      email: authUser.email,
      phone: profileData?.phone || authUser.user_metadata?.phone || '',
      createdAt: authUser.created_at,
    };

    return {
      user: userObj,
      token: data.session?.access_token || 'supabase_token_' + authUser.id,
      session: data.session,
    };
  },

  async logout() {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Supabase signOut error', err);
    }
  },

  async getCurrentSession() {
    const { data } = await supabase.auth.getSession();
    if (!data?.session) return null;

    const authUser = data.session.user;
    let profileData = null;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();
      profileData = profile;
    } catch {
      // ignore
    }

    return {
      user: {
        id: authUser.id,
        _id: authUser.id,
        name:
          profileData?.name ||
          authUser.user_metadata?.name ||
          authUser.email.split('@')[0],
        email: authUser.email,
        phone: profileData?.phone || authUser.user_metadata?.phone || '',
        createdAt: authUser.created_at,
      },
      token: data.session.access_token,
      session: data.session,
    };
  },

  async updateProfile(profileData) {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    if (userId) {
      // 1. Update Auth metadata
      await supabase.auth.updateUser({
        data: {
          name: profileData.name,
          phone: profileData.phone,
        },
      });

      // 2. Update profiles table
      try {
        await supabase
          .from('profiles')
          .update({
            name: profileData.name,
            phone: profileData.phone,
          })
          .eq('id', userId);
      } catch {
        // ignore
      }
    }

    return {
      user: {
        id: userId,
        _id: userId,
        ...profileData,
      },
    };
  },

  async changePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) {
      if (error.message?.toLowerCase().includes('rate limit') || error.code === 'over_email_send_rate_limit') {
        throw new Error(
          'Supabase email rate limit exceeded! Please turn OFF "Confirm email" in your Supabase Dashboard (Authentication > Providers > Email) for instant test signups.'
        );
      }
      throw new Error(error.message);
    }
    return { success: true, message: 'Password updated successfully' };
  },

  // -------------------------------------------------------------
  // EVENTS
  // -------------------------------------------------------------
  async getEvents(filters = {}) {
    try {
      let query = supabase.from('events').select('*');

      if (filters.category && filters.category !== 'All') {
        query = query.eq('category', filters.category);
      }
      if (filters.date) {
        query = query.eq('date', filters.date);
      }

      const { data, error } = await query.order('date', { ascending: true });

      if (error || !data || data.length === 0) {
        // Fallback to default events if table not yet populated in Supabase
        return {
          events: this.filterLocalEvents(DEFAULT_SEED_EVENTS, filters),
          source: 'default',
        };
      }

      let events = data.map(normalizeEvent);

      // In-memory text search and day/time filter support
      if (filters.search) {
        const s = filters.search.toLowerCase();
        events = events.filter(
          (e) =>
            e.title?.toLowerCase().includes(s) ||
            e.venue?.toLowerCase().includes(s) ||
            e.description?.toLowerCase().includes(s) ||
            e.organizer?.toLowerCase().includes(s)
        );
      }

      if (filters.time && filters.time !== 'All') {
        events = events.filter((e) => {
          const t = e.time?.toUpperCase() || '';
          if (filters.time === 'Morning') return t.includes('AM');
          if (filters.time === 'Afternoon') {
            const hour = parseInt(t.split(':')[0]) || 0;
            return t.includes('PM') && (hour === 12 || hour < 5);
          }
          if (filters.time === 'Evening') {
            const hour = parseInt(t.split(':')[0]) || 0;
            return t.includes('PM') && (hour >= 5 || hour === 12);
          }
          return true;
        });
      }

      return { events, source: 'supabase' };
    } catch {
      return {
        events: this.filterLocalEvents(DEFAULT_SEED_EVENTS, filters),
        source: 'default',
      };
    }
  },

  filterLocalEvents(list, filters) {
    let result = [...list];
    if (filters.category && filters.category !== 'All') {
      result = result.filter((e) => e.category === filters.category);
    }
    if (filters.search) {
      const s = filters.search.toLowerCase();
      result = result.filter(
        (e) =>
          e.title?.toLowerCase().includes(s) ||
          e.venue?.toLowerCase().includes(s) ||
          e.description?.toLowerCase().includes(s)
      );
    }
    if (filters.date) {
      result = result.filter((e) => e.date === filters.date);
    }
    return result;
  },

  async getEventById(id, currentUserId = null) {
    let event = null;

    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        event = normalizeEvent(data);
      }
    } catch {
      // fallback
    }

    if (!event) {
      event = DEFAULT_SEED_EVENTS.find((e) => e.id === id || e._id === id);
    }

    if (!event) {
      throw new Error('Event not found');
    }

    // Fetch registered attendees from Supabase
    const attendees = await this.getAttendeesForEvent(event.id);

    // Check if the current user is registered
    let isRegistered = false;
    let registration = null;

    if (currentUserId) {
      const userReg = attendees.find((a) => a.userId === currentUserId);
      if (userReg) {
        isRegistered = true;
        registration = userReg;
      } else {
        // Also check local registrations cache
        const local = getLocalRegistrations().find(
          (r) =>
            (r.eventId === event.id || r.eventId === event._id) &&
            r.userId === currentUserId &&
            r.status === 'registered'
        );
        if (local) {
          isRegistered = true;
          registration = local;
        }
      }
    }

    return {
      event,
      isRegistered,
      registration,
      attendees,
    };
  },

  // -------------------------------------------------------------
  // ATTENDEES & REGISTRATIONS
  // -------------------------------------------------------------
  async getAttendeesForEvent(eventId) {
    const attendees = [];

    try {
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          id,
          registration_id,
          status,
          created_at,
          user_id,
          profiles (
            id,
            name,
            email,
            phone
          )
        `)
        .eq('event_id', eventId)
        .eq('status', 'registered')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        for (const item of data) {
          attendees.push({
            id: item.id,
            _id: item.id,
            registrationId: item.registration_id,
            status: item.status,
            createdAt: item.created_at,
            userId: item.user_id,
            user: {
              id: item.user_id,
              name: item.profiles?.name || 'Registered Attendee',
              email: item.profiles?.email || '',
              phone: item.profiles?.phone || '',
            },
          });
        }
      }
    } catch (err) {
      console.warn('Could not query Supabase attendees directly', err);
    }

    // Merge with any local registrations for this event to guarantee instantaneous display
    const locals = getLocalRegistrations().filter(
      (r) => (r.eventId === eventId) && r.status === 'registered'
    );

    for (const loc of locals) {
      if (!attendees.some((a) => a.registrationId === loc.registrationId)) {
        attendees.push(loc);
      }
    }

    return attendees;
  },

  async registerForEvent(eventId, currentUser) {
    if (!currentUser?.id && !currentUser?._id) {
      throw new Error('Please log in to register for this event');
    }

    const userId = currentUser.id || currentUser._id;
    const regCode = `REG-${new Date().getFullYear()}-${Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase()}`;

    let registration = null;
    let updatedEvent = null;

    // 1. Try invoking stored RPC function in Supabase
    try {
      const { data: rpcRes, error: rpcErr } = await supabase.rpc(
        'register_for_event',
        {
          p_event_id: eventId,
          p_user_id: userId,
          p_registration_code: regCode,
        }
      );

      if (!rpcErr && rpcRes?.success) {
        registration = normalizeRegistration(rpcRes.registration);
      }
    } catch {
      // RPC may not exist yet
    }

    // 2. Direct table insert fallback if RPC was not executed
    if (!registration) {
      try {
        const { data: insertData, error: insertErr } = await supabase
          .from('registrations')
          .insert({
            event_id: eventId,
            user_id: userId,
            registration_id: regCode,
            status: 'registered',
          })
          .select()
          .single();

        if (!insertErr && insertData) {
          registration = normalizeRegistration(insertData);

          // Decrement seats_left in events table
          try {
            const { data: ev } = await supabase
              .from('events')
              .select('seats_left')
              .eq('id', eventId)
              .single();
            if (ev && ev.seats_left > 0) {
              await supabase
                .from('events')
                .update({ seats_left: ev.seats_left - 1 })
                .eq('id', eventId);
            }
          } catch {
            // ignore
          }
        }
      } catch (err) {
        console.warn('Supabase direct insert notice', err);
      }
    }

    // 3. Fallback registration object if Supabase table not created yet
    if (!registration) {
      registration = {
        id: 'reg_' + Date.now(),
        _id: 'reg_' + Date.now(),
        registrationId: regCode,
        eventId,
        userId,
        status: 'registered',
        createdAt: new Date().toISOString(),
        user: {
          id: userId,
          name: currentUser.name || 'Registered Attendee',
          email: currentUser.email || '',
        },
      };
    }

    // Ensure user info is attached for UI
    registration.user = registration.user || {
      id: userId,
      name: currentUser.name || 'Registered Attendee',
      email: currentUser.email || '',
    };

    // Save to local cache so it immediately reflects across views
    const locals = getLocalRegistrations();
    locals.unshift(registration);
    saveLocalRegistrations(locals);

    // Fetch refreshed event
    try {
      const { data: evData } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .maybeSingle();
      if (evData) updatedEvent = normalizeEvent(evData);
    } catch {
      // ignore
    }

    return {
      success: true,
      registration,
      event: updatedEvent,
    };
  },

  async getMyRegistrations(userId) {
    const results = [];

    try {
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          id,
          registration_id,
          status,
          created_at,
          event_id,
          events (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        for (const item of data) {
          results.push(normalizeRegistration(item));
        }
      }
    } catch {
      // ignore
    }

    // Merge with local registrations
    const locals = getLocalRegistrations().filter(
      (r) => r.userId === userId && r.status === 'registered'
    );

    for (const loc of locals) {
      if (!results.some((r) => r.registrationId === loc.registrationId)) {
        // Find matching default event if event details not attached
        if (!loc.event) {
          loc.event = DEFAULT_SEED_EVENTS.find(
            (e) => e.id === loc.eventId || e._id === loc.eventId
          );
        }
        results.push(loc);
      }
    }

    return { registrations: results };
  },

  async cancelRegistration(regId, userId) {
    // 1. Try Supabase RPC
    try {
      await supabase.rpc('cancel_event_registration', {
        p_registration_id: regId,
        p_user_id: userId,
      });
    } catch {
      // 2. Direct Supabase update
      try {
        await supabase
          .from('registrations')
          .update({ status: 'cancelled' })
          .eq('registration_id', regId)
          .eq('user_id', userId);
      } catch {
        // ignore
      }
    }

    // 3. Update local cache
    const locals = getLocalRegistrations().map((r) => {
      if (r.registrationId === regId || r.id === regId || r._id === regId) {
        return { ...r, status: 'cancelled' };
      }
      return r;
    });
    saveLocalRegistrations(locals);

    return { success: true };
  },
};
