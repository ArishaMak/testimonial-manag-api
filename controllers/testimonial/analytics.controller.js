const Testimonial = require('../../models/testimonial');

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
                    count: { $sum: 1 }, // сколько в каждом статусу
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

module.exports = { getAnalytics };