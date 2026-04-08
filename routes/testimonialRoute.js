const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // middleware проверки токена
const { create, getAll } = require('../controllers/testimonialController'); // импортируем методы

// создание нового отзыва
router.post('/', auth, create);

// получение списка отзывов (+ пагинацией + фильтры)
router.get('/', auth, getAll);

module.exports = router;