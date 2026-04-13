// импорт модели — путь на два уровня вверх, так как файл в подпапке
const Testimonial = require('../../models/testimonial');

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
        // userId из токена. // isDeleted: false добавится автоматически хуком в модели - мимо
        const filter = { userId: req.user.userId, isDeleted: false }
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
            message: 'Data retrieved successfully',
            data: testimonials,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / limit)
            }
        })

    } catch (error) {
        console.error('Get all testimonials error:', error);
        res.status(500).json({
            code: 500,
            status: 'failure',
            message: 'Server error'
        });
    }
};

// получаем один отзыв по айди
// !! ИСПР : добавлена проверка владельца
const getOne = async (req, res) => {
    try {
        const { testimonialId } = req.params;

        const testimonial = await Testimonial.findOne({
            testimonialId: testimonialId,
            isDeleted: false // фильтруем
        });

        if (!testimonial) {
            return res.status(404).json({
                code: 404,
                status: 'failure',
                message: 'Testimonial not found'
            });
        }

        // !! ИСПР : добавлена проверка владельца
        // если найденный отзыв не принадлежит текущему пользователю — запрещаем доступ
        if (testimonial.userId !== req.user.userId) {
            return res.status(403).json({
                code: 403,
                status: 'failure',
                message: 'Forbidden: you can only access your own testimonials',
                data: null
            });
        }

        res.status(200).json({
            code: 200,
            status: 'success',
            message: 'Data retrieved successfully',
            data: testimonial
        })

    } catch (error) {
        console.error('Get one testimonial error:', error);
        res.status(500).json({
            code: 500,
            status: 'failure',
            message: 'Server error'
        });
    }
};

// мягкое удаление теперь с проверкой владельца
const softDelete = async (req, res) => {
    try {
        const { testimonialId } = req.params;

        const testimonial = await Testimonial.findOne({
            testimonialId: testimonialId,
            isDeleted: false
        });

        if (!testimonial) {
            return res.status(404).json({
                code: 404,
                status: 'failure',
                message: 'Testimonial not found'
            });
        }

        if (Number(testimonial.userId) !== Number(req.user.userId)) {
            return res.status(403).json({
                code: 403,
                status: 'failure',
                message: 'Forbidden: You can only delete your own testimonials'
            });
        }

        testimonial.isDeleted = true;
        testimonial.deletedAt = new Date();
        await testimonial.save();

        res.status(200).json({
            code: 200,
            status: 'success',
            message: 'Testimonial deleted successfully'
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

// метод полного обновления отзыва (через put) + проверка владельца
const update = async (req, res) => {
    try {
        const { testimonialId } = req.params; // берез из юрл!
        const { customerName, customerEmail, customerPhone, videoUrl, rating, text, consentGiven } = req.body;

        // ищем отзыв в базе с нужным айдишником и который не удален
        const testimonial = await Testimonial.findOne({
            testimonialId: testimonialId,
            isDeleted: false
        });

        // не нашли - 404
        if (!testimonial) {
            return res.status(404).json({
                code: 404,
                status: 'failure',
                message: 'Testimonial not found'
            });
        }

        // проверяем владельца (пользователь = владелец)
        if (Number(testimonial.userId) !== Number(req.user.userId)) {
            return res.status(403).json({
                code: 403,
                status: 'failure',
                message: 'Forbidden: You can only update your own testimonials'
            });
        }

        // обновление передел полей и сохр
        if (customerName !== undefined) testimonial.customerName = customerName;
        if (customerEmail !== undefined) testimonial.customerEmail = customerEmail;
        if (customerPhone !== undefined) testimonial.customerPhone = customerPhone;
        if (videoUrl !== undefined) testimonial.videoUrl = videoUrl;
        if (rating !== undefined) testimonial.rating = rating;
        if (text !== undefined) testimonial.text = text;
        if (consentGiven !== undefined) testimonial.consentGiven = consentGiven;

        await testimonial.save(); // mongoose сохраняет изм в бд

        res.status(200).json({
            code: 200,
            status: 'success',
            message: 'Testimonial updated successfully',
            data: testimonial
        });

    } catch (error) {
        console.error('Update testimonial error:', error);
        res.status(500).json({
            code: 500,
            status: 'failure',
            message: 'Server error'
        });
    }
};

module.exports = { create, getAll, getOne, update, softDelete };