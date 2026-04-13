const Testimonial = require('../../models/testimonial');
const { ALLOWED_STATUS_TRANSITIONS } = require('../../lib/constants');

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
            testimonial
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

// бонусное 3 - массовое обновление статуса (bulk update)
const bulkUpdateStatus = async (req, res) => {
    try {
        const { testimonialIds, status: newStatus } = req.body;

        // валидация входных данных
        if (!testimonialIds || !Array.isArray(testimonialIds) || testimonialIds.length === 0) {
            return res.status(400).json({
                code: 400,
                status: 'failure',
                message: 'Please provide an array of testimonialIds'
            });
        }
        if (!newStatus) {
            return res.status(400).json({
                code: 400,
                status: 'failure',
                message: 'Please provide a new status'
            });
        }

        const userId = req.user.userId;
        const updated = [];
        const failed = [];

        // обрабатываем каждый ID отдельно
        for (const testimonialId of testimonialIds) {
            try {
                const testimonial = await Testimonial.findOne({
                    testimonialId,
                    isDeleted: false
                });

                // не найден или не принадлежит пользователю
                if (!testimonial || testimonial.userId !== userId) {
                    failed.push({ testimonialId, reason: 'Not found or forbidden' });
                    continue;
                }

                // проверка перехода статуса
                const allowed = ALLOWED_STATUS_TRANSITIONS[testimonial.status];
                if (!allowed || !allowed.includes(newStatus)) {
                    failed.push({
                        testimonialId,
                        reason: `Cannot transition from ${testimonial.status} to ${newStatus}`
                    });
                    continue;
                }

                // обновление статуса и сохр
                testimonial.status = newStatus;
                if (newStatus === 'shared' && !testimonial.sharedAt) {
                    testimonial.sharedAt = new Date();
                }
                await testimonial.save();
                updated.push(testimonialId);

            } catch (err) {
                failed.push({ testimonialId, reason: err.message });
            }
        }

        res.status(200).json({
            code: 200,
            status: 'success',
            message: 'Bulk status update completed',
            data: {
                updated: updated.length,
                failed: failed.length,
                errors: failed
            }
        });

    } catch (error) {
        console.error('Bulk update status error:', error);
        res.status(500).json({
            code: 500,
            status: 'failure',
            message: 'Server error'
        });
    }
};

module.exports = { updateStatus, bulkUpdateStatus };