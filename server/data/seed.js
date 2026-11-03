require('dotenv').config();
const { connectDB } = require('../config/db');
const { Event: eventStore } = require('../models/dbStore');
const sampleEvents = require('./sampleEvents');

const runSeed = async () => {
  console.log('--- EventSphere Database Seeder ---');
  await connectDB();

  try {
    await eventStore.seedIfEmpty();
    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error during seeding:', err);
    process.exit(1);
  }
};

runSeed();
