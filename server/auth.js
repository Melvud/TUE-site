import jwt from 'jsonwebtoken';

export function signToken(payload, secret) {
  // Токен на 7 дней
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

export function requireAuthFactory(secret) {
  return function requireAuth(req, res, next) {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const decoded = jwt.verify(token, secret);
      req.user = decoded;
      next();
    } catch {
      res.status(401).json({ error: 'Invalid token' });
    }
  };
}
