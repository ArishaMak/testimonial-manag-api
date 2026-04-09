// routes/testimonialRoute.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // middleware проверки токена
const { create, getAll, update, getOne, softDelete, updateStatus, share, getSettings, upsertSettings, getAnalytics, search, bulkUpdateStatus } = require('../controllers/testimonialController'); // импортируем методы

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

// бонусное 2 - поиск отзывов
router.get('/search', auth, search);

// бонусное 3 - массовое обновление статуса
router.post('/bulk/status', auth, bulkUpdateStatus);

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