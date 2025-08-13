// middlewares/protect.js
import { getAuth } from '@clerk/express'; // adjust import if using a different auth

export const protect = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    // Verify token here
    const auth = await getAuth({ apiKey: process.env.CLERK_API_KEY, apiVersion: 2 });
    const { userId } = await auth.verifyToken(token);

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }

    req.auth = () => Promise.resolve({ userId });
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ message: 'Unauthorized' });
  }
};
