// заглушка !! потом исправить
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ message: 'Testimonials route is ready' });
});

module.exports = router;