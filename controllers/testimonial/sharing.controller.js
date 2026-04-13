const Testimonial = require('../../models/testimonial');
const { SHARING_CHANNELS } = require('../../lib/constants');

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
            testimonial
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

module.exports = { share };