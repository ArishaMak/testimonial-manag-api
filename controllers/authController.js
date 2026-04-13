// логика регистрации (+ проверка мэйла на дубликат) и логина (проверяем пароль)
const User = require('../models/user');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    try {
        const { email, password, businessName } = req.body;

        // валидация входных данных
        if (!email || !password || !businessName) {
            return res.status(400).json({
                code: 400,
                status: 'failure',
                message: 'Please provide all required fields (email, password, businessName)'
            });
        }

        // есть ли мэйл в бд
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                code: 400,
                status: 'failure',
                message: 'User already exists with this email'
            });
        }

        // создаем пользователяю. pre-save hooks в user.js хешируют
        const user = new User({
            email,
            password,
            businessName
        });

        await user.save();

        // генерация jwt токена (rfc 7519)
        const token = jwt.sign(
            { userId: user.userId, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRY || '7d' }
        );

        // все гуд
        res.status(201).json({
            code: 201,
            status: 'success',
            message: 'User registered successfully',
            data: {
                user: user.toJSON(), // метод toJSON уберет пароль
                token
            }
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            code: 500,
            status: 'failure',
            message: 'Server error'
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                code: 400,
                status: 'failure',
                message: 'Please provide email and password'
            });
        }

        // ищем пользователя по мэйлу и запрашиваем пароль
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                code: 401,
                status: 'failure',
                message: 'Invalid credentials'
            });
        }

        // проверяем пароль черз метод из модели
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                code: 401,
                status: 'failure',
                message: 'Invalid credentials'
            });
        }

        // генераци ятокена
        const token = jwt.sign(
            { userId: user.userId, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRY || '7d' }
        );

        res.status(200).json({
            code: 200,
            status: 'success',
            message: 'Login successful',
            data: { token }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            code: 500,
            status: 'failure',
            message: 'Server error'
        });
    }
};

module.exports = { register, login };