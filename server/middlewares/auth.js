// middlewares/auth.js
import { getAuth } from '@clerk/express';

export const protect = (req, res, next) => {
  try {
    let token = null;

    // Try header first
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Fallback to query param (EventSource can't set headers)
    else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authenticated: No token' });
    }

    // Patch header so Clerk's getAuth(req) can pick it up
    req.headers.authorization = `Bearer ${token}`;

    const auth = getAuth(req);

    if (!auth || !auth.userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated: Invalid token' });
    }

    // make req.auth() return an object synchronously
    req.auth = () => ({ userId: auth.userId });

    next();
  } catch (error) {
    console.error('protect middleware error:', error);
    return res.status(401).json({ success: false, message: error.message || 'Unauthorized' });
  }
};
