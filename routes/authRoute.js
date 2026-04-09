const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');

// привязываем эндпоинты к методам контроллера
router.post('/register', register);
router.post('/login', authLimiter, login);

module.exports = router;