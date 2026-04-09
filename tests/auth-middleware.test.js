// интеграционный тест. проверка middleware авторизации (блокировка неправильных запросов и пропуск правильных)

const request = require('supertest'); //http-запрос к серверу
const express = require('express'); //создание тестового сервера
const jwt = require('jsonwebtoken'); //создание токенов

// импортируем middleware
const auth = require('../middleware/auth');

// создаём мини-приложение только для тестирования auth
const app = express();
app.use(express.json());

// тестовый защищённый роут
app.get('/protected', auth, (req, res) => {
    res.status(200).json({
        message: 'OK',
        user: req.user
    });
});

// контролируем токенs не завися от env
const TEST_SECRET = 'test_secret_for_auth_tests';

describe('Auth Middleware', () => {

    beforeAll(() => {
        // подмена JWT_SECRET для тестов
        process.env.JWT_SECRET = TEST_SECRET;
    });

    test('должен вернуть 401, если нет токена', async () => {
        const res = await request(app).get('/protected');

        expect(res.statusCode).toBe(401);
        expect(res.body.status).toBe('failure');
        expect(res.body.message).toContain('authorization denied');
    });

    test('должен вернуть 401, если токен невалидный', async () => {
        const res = await request(app)
            .get('/protected')
            .set('Authorization', 'Bearer invalid_token_12345');

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toContain('Token is not valid');
    });

    test('должен пропустить запрос с валидным токеном', async () => {
        // валидный токен с данными userId  email
        const validToken = jwt.sign(
            { userId: 123, email: 'test@example.com' },
            TEST_SECRET,
            { expiresIn: '1h' }
        );

        const res = await request(app)
            .get('/protected')
            .set('Authorization', `Bearer ${validToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.user.userId).toBe(123);
        expect(res.body.user.email).toBe('test@example.com');
    });

    // проверка содержимого токена
    test('должен извлечь userId и email из токена', async () => {
        const token = jwt.sign(
            { userId: 999, email: 'user@test.com', role: 'owner' },
            TEST_SECRET,
            { expiresIn: '1h' }
        );

        const res = await request(app)
            .get('/protected')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.user.userId).toBe(999);
        expect(res.body.user.email).toBe('user@test.com');
    });
});