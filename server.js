// разбила содержимое app.js так как тесты не запускались из-за конфликта
// ТОЛЬКО для запуска сервера
require('dotenv').config();
const { app, mongoose } = require('./app');

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

async function start() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB connected');

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
}

start();