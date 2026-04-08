const Testimonial = require('../models/testimonial');
// импорт правил


// создание отзыва
const create = async (req, res) => {
    try {
        const { customerName, customerEmail, customerPhone, videoUrl, rating, text } = req.body;

        // валидация обязательного поля
        if (!customerName || customerName.trim() === '') {
            return res.status(400).json({
                code: 400,
                status: 'failure',
                message: 'Customer name is required'
            });
        }

        // создаем документ отзыва
        // userId берём из токена, остальное из тела запроса
        const testimonial = new Testimonial({
            userId: req.user.userId, //чтобы никто не создавал отзыв от чужого имени
            customerName,
            customerEmail,
            customerPhone,
            videoUrl,
            rating,
            text
        });

        await testimonial.save();

        // успешный ответ
        res.status(201).json({
            code: 201,
            status: 'success',
            message: 'Testimonial created successfully',
            data: testimonial
        });

    } catch (error) {
        console.error('Create testimonial error:', error);
        res.status(500).json({
            code: 500,
            status: 'failure',
            message: 'Server error'
        });
    }
};

// получение списка (+ пагинация и фильтрация)
const getAll = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, search } = req.query;
        const skip = (page - 1) * limit;

        // формируем фильтр
        // userId из токена. isDeleted: false добавится автоматически хуком в модели
        const filter = { userId: req.user.userId };
        if (status) filter.status = status;

        // фильтр поиска по имени клиента или тексту отзыва
        if (search) {
            filter.$or = [
                { customerName: { $regex: search, $options: 'i' } }, // поиск по регулярке (частичное совпадение строки и без учета регистра)
                { text: { $regex: search, $options: 'i' } }
            ];
        }

        // запрос к БД
        const testimonials = await Testimonial.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await Testimonial.countDocuments(filter);

        // ответ с мета-данными пагинации
        res.status(200).json({
            code: 200,
            status: 'success',
            data: {
                testimonials,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get all testimonials error:', error);
        res.status(500).json({
            code: 500,
            status: 'failure',
            message: 'Server error'
        });
    }
};

// получаем одтн отзыв по айди
const getOne = async (req, res) => {
    try {
        const { id } = req.params;

        const testimonial = await Testimonial.findOne({
            testimonialId: id,
            isDeleted: false  // фильтруем
        });

        if (!testimonial) {
            return res.status(404).json({
                code: 404,
                status: 'failure',
                message: 'Testimonial not found'
            });
        }

        res.status(200).json({
            code: 200,
            status: 'success',
            testimonial
        });

    } catch (error) {
        console.error('Get one testimonial error:', error);
        res.status(500).json({
            code: 500,
            status: 'failure',
            message: 'Server error'
        });
    }
};

const softDelete = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await Testimonial.updateOne(
            { testimonialId: id },
            {
                isDeleted: true,
                deletedAt: new Date()
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                code: 404,
                status: 'failure',
                message: 'Testimonial not found or already deleted'
            });
        }

        res.status(200).json({
            code: 200,
            status: 'success',
            message: 'Testimonial soft deleted successfully'
        });

    } catch (error) {
        console.error('Soft delete error:', error);
        res.status(500).json({
            code: 500,
            status: 'failure',
            message: 'Server error'
        });
    }
};

module.exports = { create, getAll, getOne, softDelete };