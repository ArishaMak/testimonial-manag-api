const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // middleware проверки токена
const { create, getAll, getOne, softDelete, updateStatus } = require('../controllers/testimonialController'); // импортируем методы

// создание нового отзыва
router.post('/', auth, create);

// получение списка отзывов (+ пагинацией + фильтры)
router.get('/', auth, getAll);

// получаем один отзыв по айди
router.get('/:id', auth, getOne);

// мягкое удаление отзыва
router.delete('/:id', auth, softDelete);

// смена статуса отзыва
router.patch('/:id/status', auth, updateStatus);

module.exports = router;