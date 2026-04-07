// test-user.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user');

async function test() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('бд подключ');

        // пробуем создать тестового юзера
        const user = new User({
            email: 'test@example.com',
            password: 'securepass123',
            businessName: 'Test Biz'
        });

        await user.save();
        console.log('юзер сохр с id', user.userId);

        // проверка хэша пароля
        const isMatch = await user.comparePassword('securepass123');
        console.log('воркает', isMatch);

        await mongoose.disconnect();
        console.log('тесты пройдены');
    } catch (err) {
        console.error('ошибка', err.message);
        process.exit(1);
    }
}

test();