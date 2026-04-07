// init-counter.js
require('dotenv').config();
const mongoose = require('mongoose');
const Counter = require('./models/counter');

async function init() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('БД подключена');

        // инициализ счётчика
        const counter = await Counter.findByIdAndUpdate(
            'userId',
            { $set: { seq: 0 } },
            { upsert: true, new: true }
        );

        console.log('Counter создан:', counter);
        await mongoose.disconnect();
        console.log('работает, создаем пользователей');
    } catch (err) {
        console.error('ошибка:', err.message);
        process.exit(1);
    }
}

init();