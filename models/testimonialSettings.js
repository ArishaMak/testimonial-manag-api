//храит настройки для каждого пользователя
const mongoose = require('mongoose');

const TestimonialSettingsSchema = new mongoose.Schema({
    // ссылка на пользователя
    userId: {
        type: Number,
        required: true,
        unique: true //юник!
    },
    // функция отзыво
    isEnabled: {
        type: Boolean,
        default: false
    },
    // длительность видео по дефолту
    defaultVideoLength: {
        type: Number,
        default: 10
    },
    // варинаты длит видео
    videoLengthOptions: {
        type: [Number],
        default: [5, 10, 15, 20, 25]
    },
    // анкета вопросов
    questionnaire: {
        type: [String],
        default: ["What do you like about our service?"]
    },
    // каналы отправки
    sendingOptions: {
        type: [String],
        default: ["email", "sms"]
    },
    thankYouMessage: {
        type: String,
        default: "Thank you!"
    },
    // согласие на спам
    contactConsent: {
        enabled: {
            type: Boolean,
            default: true
        },
        text: {
            type: String,
            default: "Join our mailing list"
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('TestimonialSettings', TestimonialSettingsSchema);