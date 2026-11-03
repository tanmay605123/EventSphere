const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { MongooseUser } = require('./User');
const { MongooseEvent } = require('./Event');
const { MongooseRegistration } = require('./Registration');
const sampleEvents = require('../data/sampleEvents');
const supabase = require('../config/supabase');

const DB_FILE_PATH = path.join(__dirname, '..', 'data', 'db.json');

// Ensure data folder exists
const dataDir = path.dirname(DB_FILE_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Helper to generate 24-character hex ID (MongoDB ObjectId style)
const generateId = () => crypto.randomBytes(12).toString('hex');

// Normalizers between PostgreSQL snake_case and JavaScript camelCase
const normalizeEvent = (e) => {
  if (!e) return null;
  const id = e.id || e._id;
  return {
    ...e,
    _id: id,
    id,
    seatsLeft: e.seats_left !== undefined ? e.seats_left : e.seatsLeft,
    totalSeats: e.total_seats !== undefined ? e.total_seats : e.totalSeats,
    createdAt: e.created_at || e.createdAt,
  };
};

const normalizeRegistration = (r) => {
  if (!r) return null;
  const id = r.id || r._id;
  return {
    ...r,
    _id: id,
    id,
    registrationId: r.registration_id || r.registrationId,
    userId: r.user_id || r.userId,
    eventId: r.event_id || r.eventId,
    status: r.status || 'registered',
    createdAt: r.created_at || r.createdAt,
    event: normalizeEvent(r.events || r.event),
    user: r.profiles || r.profile || r.user,
  };
};

// Read local JSON file
const readLocalDB = () => {
  try {
    if (!fs.existsSync(DB_FILE_PATH)) {
      const initial = {
        users: [],
        events: sampleEvents.map((ev) => ({
          _id: generateId(),
          ...ev,
          createdAt: new Date().toISOString(),
        })),
        registrations: [],
      };
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const data = fs.readFileSync(DB_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading local JSON db:', err);
    return { users: [], events: [], registrations: [] };
  }
};

// Write local JSON file
const writeLocalDB = (data) => {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing local JSON db:', err);
  }
};

const isMongooseActive = () => mongoose.connection.readyState === 1;

// ================= USER METHODS =================
const User = {
  async findByEmail(email) {
    const cleanEmail = email.trim().toLowerCase();
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();
      if (!error && data) {
        return {
          _id: data.id,
          id: data.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
        };
      }
    } catch {}

    if (isMongooseActive()) {
      return await MongooseUser.findOne({ email: cleanEmail });
    }
    const db = readLocalDB();
    return db.users.find((u) => u.email.toLowerCase() === cleanEmail) || null;
  },

  async findById(id) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (!error && data) {
        return {
          _id: data.id,
          id: data.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
        };
      }
    } catch {}

    if (isMongooseActive()) {
      return await MongooseUser.findById(id).select('-password');
    }
    const db = readLocalDB();
    const user = db.users.find((u) => String(u._id) === String(id));
    if (!user) return null;
    const { password, ...safeUser } = user;
    return safeUser;
  },

  async findByIdWithPassword(id) {
    if (isMongooseActive()) {
      return await MongooseUser.findById(id);
    }
    const db = readLocalDB();
    return db.users.find((u) => String(u._id) === String(id)) || null;
  },

  async create(userData) {
    const cleanEmail = userData.email.trim().toLowerCase();

    // Also persist in Supabase profiles if possible
    try {
      await supabase.from('profiles').upsert({
        name: userData.name.trim(),
        email: cleanEmail,
        phone: userData.phone ? userData.phone.trim() : '',
      });
    } catch {}

    if (isMongooseActive()) {
      const user = new MongooseUser({
        ...userData,
        email: cleanEmail,
      });
      return await user.save();
    }
    const db = readLocalDB();
    const newUser = {
      _id: generateId(),
      name: userData.name.trim(),
      email: cleanEmail,
      password: userData.password,
      phone: userData.phone ? userData.phone.trim() : '',
      createdAt: new Date().toISOString(),
    };
    db.users.push(newUser);
    writeLocalDB(db);
    return newUser;
  },

  async update(id, updateData) {
    try {
      await supabase
        .from('profiles')
        .update({
          name: updateData.name,
          phone: updateData.phone,
        })
        .eq('id', id);
    } catch {}

    if (isMongooseActive()) {
      return await MongooseUser.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
    }
    const db = readLocalDB();
    const index = db.users.findIndex((u) => String(u._id) === String(id));
    if (index === -1) return null;

    db.users[index] = {
      ...db.users[index],
      ...updateData,
    };
    writeLocalDB(db);
    const { password, ...safeUser } = db.users[index];
    return safeUser;
  },

  async updatePassword(id, hashedPassword) {
    if (isMongooseActive()) {
      return await MongooseUser.findByIdAndUpdate(id, { password: hashedPassword }, { new: true });
    }
    const db = readLocalDB();
    const index = db.users.findIndex((u) => String(u._id) === String(id));
    if (index === -1) return null;
    db.users[index].password = hashedPassword;
    writeLocalDB(db);
    return db.users[index];
  },
};

// ================= EVENT METHODS =================
const EventStore = {
  async find({ search, category, day, date, time }) {
    // 1. Try Supabase first
    try {
      let query = supabase.from('events').select('*');
      if (category && category !== 'All') {
        query = query.eq('category', category);
      }
      if (date) {
        query = query.eq('date', date);
      }

      const { data, error } = await query.order('date', { ascending: true });
      if (!error && Array.isArray(data) && data.length > 0) {
        let events = data.map(normalizeEvent);

        if (search) {
          const s = search.toLowerCase();
          events = events.filter(
            (e) =>
              e.title?.toLowerCase().includes(s) ||
              e.venue?.toLowerCase().includes(s) ||
              e.description?.toLowerCase().includes(s)
          );
        }
        if (day && day !== 'All') {
          events = events.filter((e) => filterByDay(e.date, day));
        }
        if (time && time !== 'All') {
          events = events.filter((e) => filterByTime(e.time, time));
        }
        return events;
      }
    } catch (e) {
      console.warn('[Supabase] Event.find fallback notice:', e.message);
    }

    // 2. Mongoose fallback
    if (isMongooseActive()) {
      const query = {};
      if (category && category !== 'All') query.category = category;
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { venue: { $regex: search, $options: 'i' } },
        ];
      }
      let events = await MongooseEvent.find(query).sort({ date: 1 });
      return events.map(normalizeEvent);
    }

    // 3. Local JSON DB fallback
    const db = readLocalDB();
    let events = (db.events || []).map(normalizeEvent);
    if (category && category !== 'All') {
      events = events.filter((e) => e.category === category);
    }
    if (search) {
      const s = search.toLowerCase();
      events = events.filter(
        (e) =>
          e.title?.toLowerCase().includes(s) ||
          e.description?.toLowerCase().includes(s) ||
          e.venue?.toLowerCase().includes(s)
      );
    }
    return events;
  },

  async findById(id) {
    // 1. Try Supabase
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (!error && data) {
        return normalizeEvent(data);
      }
    } catch {}

    // 2. Mongoose fallback
    if (isMongooseActive()) {
      try {
        const ev = await MongooseEvent.findById(id);
        if (ev) return normalizeEvent(ev);
      } catch {}
    }

    // 3. Local JSON fallback
    const db = readLocalDB();
    const ev = (db.events || []).find((e) => String(e._id) === String(id) || String(e.id) === String(id));
    return ev ? normalizeEvent(ev) : null;
  },

  async updateSeats(id, delta) {
    // 1. Try Supabase
    try {
      const { data: ev } = await supabase
        .from('events')
        .select('seats_left')
        .eq('id', id)
        .maybeSingle();

      if (ev) {
        const newSeats = Math.max(0, ev.seats_left + delta);
        const { data: updated } = await supabase
          .from('events')
          .update({ seats_left: newSeats })
          .eq('id', id)
          .select()
          .maybeSingle();
        if (updated) return normalizeEvent(updated);
      }
    } catch {}

    // 2. Mongoose fallback
    if (isMongooseActive()) {
      return await MongooseEvent.findByIdAndUpdate(
        id,
        { $inc: { seatsLeft: delta } },
        { new: true }
      );
    }

    // 3. Local fallback
    const db = readLocalDB();
    const index = (db.events || []).findIndex(
      (e) => String(e._id) === String(id) || String(e.id) === String(id)
    );
    if (index === -1) return null;

    db.events[index].seatsLeft = Math.max(0, (db.events[index].seatsLeft || 0) + delta);
    writeLocalDB(db);
    return normalizeEvent(db.events[index]);
  },

  async seedIfEmpty() {
    // Supabase is pre-seeded via supabase-schema.sql
    const db = readLocalDB();
    if (!db.events || db.events.length === 0) {
      db.events = sampleEvents.map((ev) => ({
        _id: generateId(),
        ...ev,
        createdAt: new Date().toISOString(),
      }));
      writeLocalDB(db);
    }
  },
};

// ================= REGISTRATION METHODS =================
const Registration = {
  async findByUserAndEvent(userId, eventId) {
    // 1. Try Supabase
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .eq('user_id', userId)
        .eq('event_id', eventId)
        .eq('status', 'registered')
        .maybeSingle();
      if (!error && data) {
        return normalizeRegistration(data);
      }
    } catch {}

    // 2. Local fallback
    const db = readLocalDB();
    const reg = (db.registrations || []).find(
      (r) =>
        String(r.userId) === String(userId) &&
        String(r.eventId) === String(eventId) &&
        r.status === 'registered'
    );
    return reg ? normalizeRegistration(reg) : null;
  },

  async create({ userId, eventId, registrationId }) {
    // 1. Try Supabase
    try {
      const { data, error } = await supabase
        .from('registrations')
        .insert({
          user_id: userId,
          event_id: eventId,
          registration_id: registrationId,
          status: 'registered',
        })
        .select()
        .single();
      if (!error && data) {
        return normalizeRegistration(data);
      }
    } catch (e) {
      console.warn('[Supabase] Registration.create notice:', e.message);
    }

    // 2. Local fallback
    const db = readLocalDB();
    const newReg = {
      _id: generateId(),
      userId: String(userId),
      eventId: String(eventId),
      registrationId,
      status: 'registered',
      createdAt: new Date().toISOString(),
    };
    db.registrations = db.registrations || [];
    db.registrations.push(newReg);
    writeLocalDB(db);
    return normalizeRegistration(newReg);
  },

  async findById(id) {
    try {
      const { data } = await supabase
        .from('registrations')
        .select('*')
        .or(`id.eq.${id},registration_id.eq.${id}`)
        .maybeSingle();
      if (data) return normalizeRegistration(data);
    } catch {}

    const db = readLocalDB();
    const reg = (db.registrations || []).find(
      (r) => String(r._id) === String(id) || String(r.id) === String(id) || r.registrationId === id
    );
    return reg ? normalizeRegistration(reg) : null;
  },

  async findByRegistrationId(registrationId) {
    try {
      const { data } = await supabase
        .from('registrations')
        .select('*')
        .eq('registration_id', registrationId)
        .maybeSingle();
      if (data) return normalizeRegistration(data);
    } catch {}

    const db = readLocalDB();
    const reg = (db.registrations || []).find((r) => r.registrationId === registrationId);
    return reg ? normalizeRegistration(reg) : null;
  },

  async cancel(id, userId) {
    try {
      await supabase
        .from('registrations')
        .update({ status: 'cancelled' })
        .or(`id.eq.${id},registration_id.eq.${id}`)
        .eq('user_id', userId);
    } catch {}

    const db = readLocalDB();
    const reg = (db.registrations || []).find(
      (r) =>
        (String(r._id) === String(id) || String(r.id) === String(id) || r.registrationId === id) &&
        String(r.userId) === String(userId)
    );
    if (reg) {
      reg.status = 'cancelled';
      writeLocalDB(db);
      return normalizeRegistration(reg);
    }
    return null;
  },

  async findByUserId(userId) {
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('*, events(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        return data.map(normalizeRegistration);
      }
    } catch {}

    const db = readLocalDB();
    const userRegs = (db.registrations || [])
      .filter((r) => String(r.userId) === String(userId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return userRegs.map((r) => {
      const event = (db.events || []).find((e) => String(e._id) === String(r.eventId) || String(e.id) === String(r.eventId)) || null;
      return {
        ...r,
        event: normalizeEvent(event),
      };
    });
  },

  async findAttendees(eventId) {
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('id, registration_id, status, created_at, user_id, profiles(id, name, email, phone)')
        .eq('event_id', eventId)
        .eq('status', 'registered')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        return data.map((item) => ({
          _id: item.id,
          id: item.id,
          registrationId: item.registration_id,
          createdAt: item.created_at,
          status: item.status,
          userId: item.user_id,
          user: item.profiles || { name: 'Attendee' },
        }));
      }
    } catch {}

    return [];
  },
};

// Helper: Day filtering
function filterByDay(dateString, dayFilter) {
  const eventDate = new Date(dateString);
  const now = new Date();
  const dayOfWeek = eventDate.getDay();

  if (dayFilter === 'Weekend') return dayOfWeek === 0 || dayOfWeek === 6;
  if (dayFilter === 'Weekday' || dayFilter === 'Weekdays') return dayOfWeek >= 1 && dayOfWeek <= 5;
  if (dayFilter === 'Today') return eventDate.toDateString() === now.toDateString();
  if (dayFilter === 'Tomorrow') {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return eventDate.toDateString() === tomorrow.toDateString();
  }
  return true;
}

// Helper: Time filtering
function filterByTime(timeString, timeFilter) {
  if (!timeString) return true;
  const lower = timeString.toLowerCase();
  const isPM = lower.includes('pm');
  let hour = parseInt(lower.replace(/[^0-9:]/g, '').split(':')[0], 10);
  if (isNaN(hour)) return true;
  if (isPM && hour < 12) hour += 12;
  if (!isPM && hour === 12) hour = 0;

  if (timeFilter === 'Morning') return hour < 12;
  if (timeFilter === 'Afternoon') return hour >= 12 && hour < 17;
  if (timeFilter === 'Evening') return hour >= 17;
  return true;
}

module.exports = {
  User,
  Event: EventStore,
  Registration,
};
