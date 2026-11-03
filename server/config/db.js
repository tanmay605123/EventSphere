const supabase = require('./supabase');

let isSupabaseConnected = false;
let useLocalStore = false;

const connectDB = async () => {
  try {
    const { data, error } = await supabase.from('events').select('id').limit(1);
    if (!error) {
      isSupabaseConnected = true;
      useLocalStore = false;
      console.log(`[Supabase] PostgreSQL Database connected successfully (${data ? data.length : 0} rows found)`);
      return true;
    } else {
      console.warn(`[Supabase] Health check returned error: ${error.message}`);
      useLocalStore = true;
      return false;
    }
  } catch (error) {
    console.warn(`[Supabase] Connection failed: ${error.message}`);
    console.log(`[DataStore] Falling back to local database store.`);
    useLocalStore = true;
    return false;
  }
};

const getStorageMode = () => ({
  isSupabaseConnected,
  useLocalStore,
});

module.exports = {
  connectDB,
  getStorageMode,
};
