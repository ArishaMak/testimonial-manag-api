const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Counter = require('./counter');

//схема польз
const UserSchema = new mongoose.Schema({
    userId: {
        type: Number,
        /*unique: true*/
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        /*unique: true,*/
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Invalid email format'] //валидация почты
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'], //юзаем надежный пароль
        select: false // не возвр по дефолту
    },
    businessName: {
        type: String,
        required: [true, 'Business name is required'],
        trim: true
    },
    role: {
        type: String,
        enum: ['owner', 'staff'],
        default: 'owner'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// индексы
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ userId: 1 }, { unique: true });

//хук (через async function) для авто-инкремента userId (через counter-коллекцию)
UserSchema.pre('save', async function () {

    if (this.isNew) {
        /*console.log('генерируем айдишку юзера');*/
        const counter = await Counter.findByIdAndUpdate(
            'userId',
            { $inc: { seq: 1 } },
            { new: true, upsert: true, runValidators: true }
        );
        /*console.log('Counter вернул', counter);*/
        this.userId = counter.seq;
        /*console.log('userID присвоен', this.userId);*/
    } else {
        /*console.log('не новый док, скипаем');*/
    }
});

//хэширование пароля. в асинх нэкст не нужен
UserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

//метод сравнения парля
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

//метод получ данных юзера
UserSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    delete user.__v;
    return user;
};

module.exports = mongoose.model('User', UserSchema);