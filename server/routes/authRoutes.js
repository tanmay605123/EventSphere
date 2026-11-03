const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models/dbStore');
const supabase = require('../config/supabase');

const JWT_SECRET = process.env.JWT_SECRET || 'eventsphere_super_secret_jwt_key_2026_modern_secure';

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: '7d',
  });
};

// @route   POST /signup
// @desc    Register a new user
// @access  Public
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists. Please log in.',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user in Supabase Auth as well
    let supabaseUserId = null;
    try {
      const { data: supaRes, error: supaErr } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            name: name.trim(),
            phone: phone ? phone.trim() : '',
          },
        },
      });
      if (supaRes?.user) {
        supabaseUserId = supaRes.user.id;
      }
    } catch (e) {
      console.warn('[Supabase signup error]:', e.message);
    }

    // Create user
    const newUser = await User.create({
      _id: supabaseUserId,
      id: supabaseUserId,
      name,
      email,
      password: hashedPassword,
      phone: phone || '',
    });

    const token = generateToken(newUser._id);

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        createdAt: newUser.createdAt,
      },
    });
  } catch (err) {
    console.error('Error in /signup:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error while registering user',
    });
  }
});

// @route   POST /login
// @desc    Authenticate user & return token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Check for user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check password match
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user._id);

    return res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('Error in /login:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error while logging in',
    });
  }
});

module.exports = router;
