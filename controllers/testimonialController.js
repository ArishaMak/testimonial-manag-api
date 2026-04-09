const Testimonial = require('../models/testimonial');
const TestimonialSettings = require('../models/testimonialSettings');
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

// получение настроек для отзыва
const getSettings = async (req, res) => {
    try {
        const settings = await TestimonialSettings.findOne({ userId: req.user.userId });

        // если настроек нет, возвращаем null в data (не 404)
        res.status(200).json({
            code: 200,
            status: 'success',
            message: 'Settings retrieved successfully',
            data: settings // null - если не найдено
        });

    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({
            code: 500,
            status: 'failure',
            message: 'Server error'
        });
    }
};

// создание и обновление настроек
// настроек нет - mpngoDB создае тновый документ, натсройки есть - обновляем переданные поля
const upsertSettings = async (req, res) => {
    try {
        const { isEnabled, defaultVideoLength, videoLengthOptions, questionnaire, sendingOptions, thankYouMessage, contactConsent } = req.body;

        const settings = await TestimonialSettings.findOneAndUpdate(
            { userId: req.user.userId }, // фильтр - ищем по юзеру
            {
                // обновляем только переданные поля
                // через спрэд и тернарник - если не андэфайнд - обновляем
                ...(isEnabled !== undefined && { isEnabled }),
                ...(defaultVideoLength !== undefined && { defaultVideoLength }),
                ...(videoLengthOptions !== undefined && { videoLengthOptions }),
                ...(questionnaire !== undefined && { questionnaire }),
                ...(sendingOptions !== undefined && { sendingOptions }),
                ...(thankYouMessage !== undefined && { thankYouMessage }),
                ...(contactConsent !== undefined && { contactConsent })
            },
            {
                new: true, // вернуть док
                upsert: true, // создать док
                runValidators: true // валидация схемы
            }
        );

        res.status(200).json({
            code: 200,
            status: 'success',
            message: 'Settings saved successfully',
            data: settings
        });

} catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
        code: 500,
        status: 'failure',
        message: 'Server error'
    });
}
};

// возвращает аналитику по отзывам юзеров
const getAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query; // даты из query (фильтр по периоду)
        const userId = req.user.userId; // текущий юзер из токена

        // базовый фильтр: только свои и не удалённые
        // аналог where в SQL
        const matchStage = {
            $match: {
                userId: userId,
                isDeleted: false
            }
        };

        // добавляем фильтр по датам, если переданы
        if (startDate || endDate) {
            matchStage.$match.createdAt = {};
            if (startDate) matchStage.$match.createdAt.$gte = new Date(startDate);
            if (endDate) matchStage.$match.createdAt.$lte = new Date(endDate);
        }

        // aggregation pipeline (считаем сразу по статусам)
        const analytics = await Testimonial.aggregate([
            matchStage, // фильтруем документы
            {
                $group: {
                    _id: '$status', // группируем по статусу
                    count: { $sum: 1 }, // сколько в каждом статусе
                    avgRating: { $avg: '$rating' } // средний рейтинг по статусу
                }
            }
        ]);

        const byStatus = {};
        let totalRatings = 0; // сумма всех рейтингов (с учётом кол-ва)
        let totalWithRating = 0; // сколько отзывов с рейтингом

        analytics.forEach(item => {
            byStatus[item._id] = item.count; // записываем статус

            // считаем общий ср рейтинг
            if (item.avgRating !== null) {
                totalRatings += item.avgRating * item.count;
                totalWithRating += item.count;
            }
        });

        // общее колво отзывов
        const total = analytics.reduce((sum, item) => sum + item.count, 0);

        // общий средний рейтинг
        const averageRating = totalWithRating > 0
            ? Number((totalRatings / totalWithRating).toFixed(2))
            : null;

        // формируем период для ответа (если был фильтр)
        const period = {};
        if (startDate) period.startDate = new Date(startDate).toISOString();
        if (endDate) period.endDate = new Date(endDate).toISOString();

        res.status(200).json({
            code: 200,
            status: 'success',
            message: 'Analytics retrieved successfully',
            data: {
                overview: {
                    total,
                    byStatus,
                    averageRating
                },
                period: Object.keys(period).length > 0 ? period : null
            }
        });

    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({
            code: 500,
            status: 'failure',
            message: 'Server error'
        });
    }
};

module.exports = { create, getAll, update, getOne, softDelete, updateStatus, share, getSettings, upsertSettings, getAnalytics };