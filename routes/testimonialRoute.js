const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // middleware проверки токена
const { create, getAll, getOne, softDelete, updateStatus, share } = require('../controllers/testimonialController'); // импортируем методы

// создание нового отзыва
router.post('/', auth, create);

// получение списка отзывов (+ пагинацией + фильтры)
router.get('/', auth, getAll);

// получаем один отзыв по айди
router.get('/:testimonialId', auth, getOne);

// мягкое удаление отзыва
router.delete('/:testimonialId', auth, softDelete);

// смена статуса отзыва
router.patch('/:testimonialId/status', auth, updateStatus);

// шаринг отзыва
router.post('/:testimonialId/share', auth, share);

module.exports = router;