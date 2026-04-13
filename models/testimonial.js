const mongoose = require('mongoose');
// используем встроенный crypto.randomUUID() вместо uuid-пакета (ESM-only)
const { randomUUID } = require('crypto');

const TestimonialSchema = new mongoose.Schema({
    testimonialId: {
        type: String,
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
    sharedChannels: [{
        type: String,
        enum: ['email', 'sms', 'facebook', 'instagram']
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

// индексы
TestimonialSchema.index({ userId: 1 });
TestimonialSchema.index({ status: 1 });
TestimonialSchema.index({ userId: 1, isDeleted: 1 });

// хук для генерации UUID
TestimonialSchema.pre('save', function () {
    if (this.isNew) {
        this.testimonialId = randomUUID();
    }
});

// метод toJSON для скрытия __v
TestimonialSchema.methods.toJSON = function () {
    const doc = this.toObject();
    delete doc.__v; // убираем version key из ответа
    return doc;
};

module.exports = mongoose.model('Testimonial', TestimonialSchema);