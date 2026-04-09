// app.js — создание приложения (для экспорта в тесты)
const express = require('express');
const mongoose = require('mongoose');

const app = express();

app.use(express.json());

// роуты
const authRoute = require('./routes/authRoute');
const testimonialRoute = require('./routes/testimonialRoute');
app.use('/api/auth', authRoute);
app.use('/api/testimonials', testimonialRoute);

app.use((req, res) => {
    res.status(404).json({
        code: 404,
        status: 'failure',
        message: 'Route not found'
    });
});

// экспортируем app и mongoose для тестов
module.exports = { app, mongoose };