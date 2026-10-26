const jwt = require('jsonwebtoken');
const prisma = require('../src/prisma/client');

const JWT_SECRET = process.env.JWT_SECRET || 'banking-management-secret-2026';

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access denied. No authentication token provided.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Access denied. Token missing.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: 'Invalid token payload.' });
    }

    // Verify user still exists in database
    const customer = await prisma.customer.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!customer) {
      return res.status(401).json({ message: 'User associated with token no longer exists.' });
    }

    req.customer = customer;
    req.user = customer; // Alias for convenience
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired. Please log in again.' });
    }
    return res.status(401).json({ message: 'Invalid or malformed token.' });
  }
};

// Optional auth: attaches req.customer if valid token present, but doesn't block if absent
const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded && decoded.id) {
          const customer = await prisma.customer.findUnique({
            where: { id: decoded.id },
            select: { id: true, fullName: true, email: true, phone: true, createdAt: true }
          });
          if (customer) {
            req.customer = customer;
            req.user = customer;
          }
        }
      }
    }
  } catch (err) {
    // Ignore error for optional auth
  }
  next();
};

module.exports = {
  authenticate,
  optionalAuthenticate
};
