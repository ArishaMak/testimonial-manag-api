const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid'); // деструктизация объектов es6 для генерации uuid
/*const myId = uuidv4(); как функцию*/

const TestimonialSchema = new mongoose.Schema({
    testimonialId: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: Number,
        required: true
    },
    customerName: {
        type: String,
        required: [true, 'Customer name is required']
    },
    customerEmail: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Invalid customer email format']
    },
    customerPhone: String,
    videoUrl: String,
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    text: String,
    status: {
        type: String,
        enum: ['draft', 'recording', 'processing', 'completed', 'shared'],
        default: 'draft'
    },
    consentGiven: {
        type: Boolean,
        default: false
    },
    sharedAt: Date,
    // валидатор без дубликатов:
    sharedChannels: [{
        type: String,
        enum: ['email', 'sms', 'facebook', 'instagram'],
        validate: {
            validator: function (arr) {
                return new Set(arr).size === arr.length; // без дублей
            },
            message: 'Duplicate channels not allowed'
        }
    }],
    // мягкое удаление. чтобы удаленные данные не получить
    isDeleted: { 
        type: Boolean,
        default: false
    },
    deletedAt: Date
}, {
    timestamps: true
});

//индексы
TestimonialSchema.index({ testimonialId: 1 }, { unique: true });
TestimonialSchema.index({ userId: 1 });
TestimonialSchema.index({ status: 1 });
TestimonialSchema.index({ userId: 1, isDeleted: 1 });

//хук мягкого удаления. /^find/ - регуляторн выражение
TestimonialSchema.pre(/^find/, function (next) {
    this.find({ isDeleted: { $ne: true } });
    next(); //все ок, едем дальше
});

TestimonialSchema.pre('save', function (next) {
    if (this.isNew) {
        this.testimonialId = uuidv4();
    }
    next(); //синхронный хук, поэтому сразу юзаем
});

module.exports = mongoose.model('Testimonial', TestimonialSchema);