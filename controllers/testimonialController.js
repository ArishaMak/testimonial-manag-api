const Testimonial = require('../models/testimonial');
// импорт правил
const { ALLOWED_STATUS_TRANSITIONS, SHARING_CHANNELS } = require('../lib/constants');

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

// получаем одтн отзыв по айди
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

// обновление статуса отзыва
const updateStatus = async (req, res) => {
    try {
        const { testimonialId } = req.params;
        const { status: newStatus } = req.body;

        // валидация на новый статус
        if (!newStatus) {
            return res.status(400).json({
                code: 400,
                status: 'failure',
                message: 'Please provide a new status'
            });
        }

        // ищем отзыв
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

        // проверка владельца
        if (testimonial.userId !== req.user.userId) {
            return res.status(403).json({
                code: 403,
                status: 'failure',
                message: 'Forbidden: You can only modify your own testimonials'
            });
        }

        const currentStatus = testimonial.status;

        // получаем списак эвэйлбл статусов для данного
        const allowedNextStatuses = ALLOWED_STATUS_TRANSITIONS[currentStatus];

        //undefined или массив не содержит newStatus - ошибка
        if (!allowedNextStatuses || !allowedNextStatuses.includes(newStatus)) {
            return res.status(400).json({
                code: 400,
                status: 'failure',
                message: `Cannot transition from ${currentStatus} to ${newStatus}`
            });
        }

        // сохр измен
        testimonial.status = newStatus;

        // фикс времени в shared
        if (newStatus === 'shared' && !testimonial.sharedAt) {
            testimonial.sharedAt = new Date();
        }

        await testimonial.save();

        // успешный ответ
        res.status(200).json({
            code: 200,
            status: 'success',
            message: 'Status updated successfully',
            data: {
                testimonial
            }
        });

    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({
            code: 500,
            status: 'failure',
            message: 'Server error'
        });
    }
};

// шаринг отзыва
const share = async (req, res) => {
    try {
        const { testimonialId } = req.params;
        const { channels } = req.body;

        // валидация на то переданы ли каналы
        if (!channels || !Array.isArray(channels) || channels.length === 0) {
            return res.status(400).json({
                code: 400,
                status: 'failure',
                message: 'Please provide at least one sharing channel'
            });
        }

        // проверка на валидность каналов
        const invalidChannels = channels.filter(ch => !SHARING_CHANNELS.includes(ch));
        if (invalidChannels.length > 0) {
            return res.status(400).json({
                code: 400,
                status: 'failure',
                message: `Invalid channels: ${invalidChannels.join(', ')}`
            });
        }

        // ищем отзыв
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

        // проверяем владельца
        if (Number(testimonial.userId) !== Number(req.user.userId)) {
            return res.status(403).json({
                code: 403,
                status: 'failure',
                message: 'Forbidden: You can only share your own testimonials'
            });
        }

        // проверяем статус — шарить можно только из completed или shared
        if (testimonial.status !== 'completed' && testimonial.status !== 'shared') {
            return res.status(400).json({
                code: 400,
                status: 'failure',
                message: `Cannot share testimonial with status "${testimonial.status}". Must be "completed" first.`
            });
        }

        // обновление данных о шаринге
        const existing = testimonial.sharedChannels || [];
        testimonial.sharedChannels = [...new Set([...existing, ...channels])]; // объединить с сущ и убрать дубли
        if (!testimonial.sharedAt) {
            testimonial.sharedAt = new Date();
        }

        // смена статуса
        if (testimonial.status !== 'shared') {
            testimonial.status = 'shared';
        }

        await testimonial.save();

        res.status(200).json({
            code: 200,
            status: 'success',
            message: 'Testimonial shared successfully',
            data: testimonial
        });

    } catch (error) {
        console.error('Share testimonial error:', error);
        res.status(500).json({
            code: 500,
            status: 'failure',
            message: 'Server error'
        });
    }
};

module.exports = { create, getAll, getOne, softDelete, updateStatus, share };