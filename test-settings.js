//проверяем модель без роута (thunder client е юзала для проверки тут)
require('dotenv').config();
const mongoose = require('mongoose');
const TestimonialSettings = require('./models/testimonialSettings');

async function test() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('бд подключена');


        await TestimonialSettings.deleteMany({ userId: 6 }); // userId тестового юзера
        console.log('старые данные удалены');

        // новые настройки для теста
        const settings = new TestimonialSettings({
            userId: 6, // ID пользователя из предыдущих тестов
            isEnabled: true,
            defaultVideoLength: 15,
            questionnaire: [
                "What did you like most?",
                "Would you recommend us?"
            ],
            thankYouMessage: "thanks for your feedback!"
        });

        await settings.save();
        console.log('настройки созданы:', settings);

        const found = await TestimonialSettings.findOne({ userId: 6 });
        console.log('найдено в бд', found);

        // проверка дефолтных значений
        console.log('проверка дефолтов:');
        console.log('contactConsent.enabled:', found.contactConsent.enabled); // должно быть true
        console.log('sendingOptions:', found.sendingOptions); // ['email', 'sms']

        await mongoose.disconnect();
        console.log('тесты пройдены, бд откл');

    } catch (err) {
        console.error('ошибка', err.message);
        process.exit(1);
    }
}

test();