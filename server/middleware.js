import jwt from 'jsonwebtoken';
import { User } from './models.js';

export function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ message: 'Please sign in to continue.' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'local-demo-secret-change-me');
    return User.findById(payload.sub).select('-__v').then(user => {
      if (!user) return res.status(401).json({ message: 'Session user no longer exists.' });
      req.user = user;
      return next();
    }).catch(next);
  } catch { return res.status(401).json({ message: 'Your session has expired. Please sign in again.' }); }
}

export function allow(...roles) {
  return (req, res, next) => roles.includes(req.user?.role)
    ? next() : res.status(403).json({ message: 'You do not have permission to perform this action.' });
}

export function errors(err, _req, res, _next) {
  if (err?.name === 'ValidationError' || err?.name === 'CastError') return res.status(400).json({ message: err.message });
  if (err?.code === 11000) return res.status(409).json({ message: 'This record already exists.' });
  console.error(err);
  return res.status(err.status || 500).json({ message: err.message || 'Something went wrong.' });
}
