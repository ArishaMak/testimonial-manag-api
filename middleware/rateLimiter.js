const rateLimit = require('express-rate-limit');

// для аутентификации - 5 попыток в минуту
const authLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 минута
    max: 5, // колво попыток
    message: {
        code: 429,
        status: 'failure',
        message: 'Too many login attempts. Please try again after 1 minute'
    },
    standardHeaders: true, // возвр инф о лимите
    legacyHeaders: false,
});

module.exports = { authLimiter };