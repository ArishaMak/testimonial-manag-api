const TestimonialSettings = require('../../models/testimonialSettings');

// получение настроек для отзыва
const getSettings = async (req, res) => {
    try {
        const settings = await TestimonialSettings.findOne({ userId: req.user.userId });

        // если настроек нет, возвращаем null в data (не 404)
        res.status(200).json({
            code: 200,
            status: 'success',
            message: 'Settings retrieved successfully',
            data: settings // null - если не найдено
        });

    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({
            code: 500,
            status: 'failure',
            message: 'Server error'
        });
    }
};

// создание и обновление настроек
// настроек нет - mongodb создает новый документ, настройки есть - обновляем переданные поля
const upsertSettings = async (req, res) => {
    try {
        const { isEnabled, defaultVideoLength, videoLengthOptions, questionnaire, sendingOptions, thankYouMessage, contactConsent } = req.body;

        const settings = await TestimonialSettings.findOneAndUpdate(
            { userId: req.user.userId }, // фильтр - ищем по юзеру
            {
                // обновляем только переданные поля
                // через спрэд и тернарник - если не андэфайнд - обновляем
                ...(isEnabled !== undefined && { isEnabled }),
                ...(defaultVideoLength !== undefined && { defaultVideoLength }),
                ...(videoLengthOptions !== undefined && { videoLengthOptions }),
                ...(questionnaire !== undefined && { questionnaire }),
                ...(sendingOptions !== undefined && { sendingOptions }),
                ...(thankYouMessage !== undefined && { thankYouMessage }),
                ...(contactConsent !== undefined && { contactConsent })
            },
            {
                new: true, // вернуть док
                upsert: true, // создать док
                runValidators: true // валидация схемы
            }
        );

        res.status(200).json({
            code: 200,
            status: 'success',
            message: 'Settings saved successfully',
            data: settings
        });

    } catch (error) {
        console.error('Upsert settings error:', error);//испр
        res.status(500).json({
            code: 500,
            status: 'failure',
            message: 'Server error'
        });
    }
};

module.exports = { getSettings, upsertSettings };