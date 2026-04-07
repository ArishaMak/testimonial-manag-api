// точка входа в приложение
require('dotenv').config() //загружает .env в process.env
const express = require('express')
const mongoose = require('mongoose')

const app = express() //объект для регистрации мидлвеар и роутов

app.use(express.json()) //парсинг джэйсона

const authRoute = require('./routes/authRoute')
const testimonialRoute = require('./routes/testimonialRoute')
app.use('/api/auth', authRoute)
app.use('/api/testimonials', testimonialRoute)

app.use((req, res) => {
    res.status(404).json({
        code: 404,
        status: 'failure',
        message: 'Route not found'
    })
})

//подключ к БД (промисом еще можно) и запускаем сервер
const PORT = process.env.PORT || 3000
const MONGODB_URI = process.env.MONGODB_URI

async function start() {
    try {
        await mongoose.connect(MONGODB_URI)
        console.log('MongoDB connected')

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`)
        })
    } catch (err) {
        console.error('MongoDB connection error:', err)
        process.exit(1)
    }
}

start()