// интеграционный тест. бизнес-логика: статус, валидация, владелец; безопасность; интеграция
// проверка работы бд. создание отзыва с валид/невалид данными, возврат только своих отзывов, поиск по айди + 404, защита от удаления чужих отзывов

const request = require('supertest'); // отправка http запроса
const { MongoMemoryServer } = require('mongodb-memory-server'); // in-memory монгобд для тестов
const jwt = require('jsonwebtoken');

// импорт приложения
const { app, mongoose } = require('../app');
const Testimonial = require('../models/testimonial');

// In-memory MongoDB для тестов
let mongoServer;
let token; // тестовый токен создаем
const TEST_USER_ID = 999;
const TEST_SECRET = process.env.JWT_SECRET || 'test_secret';

process.env.MONGOMS_VERSION = '6.0.4';
process.env.MONGOMS_DOWNLOAD_URL = 'https://fastdl.mongodb.org';

// подготовка среды
beforeAll(async () => {
    try {
        mongoServer = await MongoMemoryServer.create({
            binary: {
                skipMD5: true,
            },
            instance: {
                dbName: 'test_db'
            },
            autoStart: false
        });

        await mongoServer.start();
        const uri = mongoServer.getUri();

        await mongoose.connect(uri, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 30000
        });

        token = jwt.sign(
            { userId: TEST_USER_ID, email: 'test@example.com' },
            TEST_SECRET,
            { expiresIn: '1h' }
        );

        console.log('MongoDB Memory Server started on:', mongoServer.getUri());

    } catch (error) {
        console.error('Setup error:', error);
        throw error;
    }
}, 300000);

afterAll(async () => {
    try {
        // очистка после тестов !!
        if (mongoose.connection) {
            await mongoose.disconnect();
        }
        if (mongoServer) {
            await mongoServer.stop();
        }
        console.log('MongoDB Memory Server stopped');
    } catch (error) {
        console.error('Cleanup error:', error);
    }
}, 20000);

beforeEach(async () => {
    // очистка коллекции перед каждым тестом
    if (Testimonial) {
        await Testimonial.deleteMany({});
    }
});

// дальше тесты непосредственно
describe('Testimonial CRUD API', () => {

    // тест создания отзыва
    describe('POST /api/testimonials', () => {
        test('должен создать отзыв с валидными данными', async () => {
            const testData = {
                customerName: 'Тестовый Клиент',
                customerEmail: 'client@test.com',
                rating: 5,
                text: 'Отличный тестовый отзыв!'
            };

            const res = await request(app)
                .post('/api/testimonials')
                .set('Authorization', `Bearer ${token}`)
                .send(testData);

            expect(res.statusCode).toBe(201);
            expect(res.body.status).toBe('success');
            expect(res.body.data.customerName).toBe(testData.customerName);
            expect(res.body.data.userId).toBe(TEST_USER_ID); // ! юзер айди из токена а не из бади
            expect(res.body.data.testimonialId).toBeDefined();
            expect(res.body.data.status).toBe('draft'); // проверка дефолтного значения
        }, 10000);

        test('должен вернуть 400, если нет customerName', async () => {
            const res = await request(app)
                .post('/api/testimonials')
                .set('Authorization', `Bearer ${token}`)
                .send({ rating: 5, text: 'Без имени' });

            expect(res.statusCode).toBe(400);
            expect(res.body.status).toBe('failure');
            expect(res.body.message).toContain('required');
        }, 10000);
    });

    // только свои отзывы. чужие не возвращаем
    describe('GET /api/testimonials', () => {
        test('должен вернуть список отзывов только текущего пользователя', async () => {
            // создание тестовых данных
            await Testimonial.create([
                { userId: TEST_USER_ID, customerName: 'Клиент 1', text: 'Текст 1' },
                { userId: TEST_USER_ID, customerName: 'Клиент 2', text: 'Текст 2' },
                { userId: 8888, customerName: 'Чужой отзыв', text: 'Не должен вернуться' }
            ]);

            const res = await request(app)
                .get('/api/testimonials')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('success');
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data).toHaveLength(2); // только свои 2 отзыва
            expect(res.body.pagination.total).toBe(2);
        }, 10000);

        test('должен вернуть пустой массив, если отзывов нет', async () => {
            const res = await request(app)
                .get('/api/testimonials')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data).toEqual([]); // api корректно возвращает пустой массив
            expect(res.body.pagination.total).toBe(0);
        }, 10000);
    });

    // getOne по айди
    describe('GET /api/testimonials/:id', () => {
        test('должен вернуть один отзыв по testimonialId', async () => {
            const created = await Testimonial.create({
                userId: TEST_USER_ID,
                customerName: 'Одиночный Клиент',
                text: 'Уникальный текст для поиска'
            });

            const res = await request(app)
                .get(`/api/testimonials/${created.testimonialId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.testimonialId).toBe(created.testimonialId);
            expect(res.body.data.customerName).toBe('Одиночный Клиент');
        }, 10000);

        test('должен вернуть 404, если отзыв не найден', async () => {
            const res = await request(app)
                .get('/api/testimonials/non-existent-uuid')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(404); // статус не найденного ресурса
            expect(res.body.status).toBe('failure');
        }, 10000);
    });

    // проверка владельца отзыва при удалении 
    describe('Owner Validation', () => {
        test('не должен позволять удалять чужие отзывы', async () => {
            const otherUserReview = await Testimonial.create({
                userId: 7777, // не наш тестовый пользователь
                customerName: 'Чужой',
                text: 'Не трогай'
            });

            const res = await request(app)
                .delete(`/api/testimonials/${otherUserReview.testimonialId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(403);
            expect(res.body.message).toContain('Forbidden');
        }, 10000);
    });
});