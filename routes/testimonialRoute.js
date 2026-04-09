// routes/testimonialRoute.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // middleware проверки токена
const { create, getAll, update, getOne, softDelete, updateStatus, share, getSettings, upsertSettings, getAnalytics, search } = require('../controllers/testimonialController'); // импортируем методы

// создание нового отзыва
router.post('/', auth, create);

// получение списка отзывов (+ пагинацией + фильтры)
router.get('/', auth, getAll);

// специфичные роуты
// настройки
router.get('/settings', auth, getSettings);
router.post('/settings', auth, upsertSettings);

// ананлитика
router.get('/analytics', auth, getAnalytics);

// бонусное - поиск отзывов
router.get('/search', auth, search);

// динамические роуты
// получаем один отзыв по айди
router.get('/:testimonialId', auth, getOne);

// мягкое удаление отзыва
router.delete('/:testimonialId', auth, softDelete);

// смена статуса отзыва
router.patch('/:testimonialId/status', auth, updateStatus);

// шаринг отзыва
router.post('/:testimonialId/share', auth, share);

// обновление отзыва
router.put('/:testimonialId', auth, update);

module.exports = router;