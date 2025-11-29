// Simple rate limiter (in-memory)
// For production, use redis-based rate limiter

const rateLimitMap = new Map();

const rateLimiter = (windowMs = 15 * 60 * 1000, maxRequests = 5) => {
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!rateLimitMap.has(key)) {
      rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const record = rateLimitMap.get(key);
    
    // Reset if window expired
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      return next();
    }
    
    // Check if limit exceeded
    if (record.count >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests. Please try again later.',
      });
    }
    
    // Increment count
    record.count++;
    next();
  };
};

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 60 * 1000); // Clean up every minute

module.exports = rateLimiter;

