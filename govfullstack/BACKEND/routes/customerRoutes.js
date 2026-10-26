const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../src/prisma/client');
const { authenticate } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'banking-management-secret-2026';

/**
 * @route   POST /api/customers/register
 * @desc    Register a new customer
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    // 1. Validation
    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
      return res.status(400).json({ message: 'Full name is required.' });
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = email.trim().toLowerCase();
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    // 2. Check duplicate email
    const existingCustomer = await prisma.customer.findUnique({
      where: { email: cleanEmail }
    });

    if (existingCustomer) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create customer
    const newCustomer = await prisma.customer.create({
      data: {
        fullName: fullName.trim(),
        email: cleanEmail,
        password: hashedPassword,
        phone: phone ? String(phone).trim() : null
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return res.status(201).json({
      message: 'Customer registered successfully',
      customer: newCustomer
    });
  } catch (error) {
    console.error('Error during customer registration:', error);
    return res.status(500).json({ message: 'Internal server error while registering customer.' });
  }
});

/**
 * @route   POST /api/customers/login
 * @desc    Authenticate customer & get token
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // 1. Find customer
    const customer = await prisma.customer.findUnique({
      where: { email: cleanEmail }
    });

    if (!customer) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // 2. Compare password
    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // 3. Generate JWT
    const token = jwt.sign(
      {
        id: customer.id,
        email: customer.email,
        fullName: customer.fullName
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 4. Return response (never return password)
    const customerData = {
      id: customer.id,
      fullName: customer.fullName,
      email: customer.email,
      phone: customer.phone,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt
    };

    return res.status(200).json({
      message: 'Login successful',
      token,
      customer: customerData
    });
  } catch (error) {
    console.error('Error during customer login:', error);
    return res.status(500).json({ message: 'Internal server error while logging in.' });
  }
});

/**
 * @route   GET /api/customers/me
 * @desc    Get currently logged-in customer profile
 * @access  Private (JWT)
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.customer.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        accounts: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found.' });
    }

    // Format account balances
    const formattedAccounts = customer.accounts.map(acc => ({
      ...acc,
      balance: Number(acc.balance)
    }));

    return res.status(200).json({
      customer: {
        ...customer,
        accounts: formattedAccounts
      }
    });
  } catch (error) {
    console.error('Error fetching customer profile:', error);
    return res.status(500).json({ message: 'Internal server error while fetching customer profile.' });
  }
});

module.exports = router;
