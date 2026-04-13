const Testimonial = require('../../models/testimonial');

// бонус 4 - экспорт в csv (файл можно открывать в икселе гугл шитс например)
const exportCsv = async (req, res) => {
    try {
        const { query, createdAfter, createdBefore, minRating, maxRating, status } = req.query;

        // формируем фильтр
        const filter = { userId: req.user.userId, isDeleted: false };

        if (query) {
            filter.$or = [
                { customerName: { $regex: query, $options: 'i' } },
                { text: { $regex: query, $options: 'i' } }
            ];
        }

        if (createdAfter || createdBefore) {
            filter.createdAt = {};
            if (createdAfter) filter.createdAt.$gte = new Date(createdAfter);
            if (createdBefore) filter.createdAt.$lte = new Date(createdBefore);
        }

        const ratingFilter = {};
        if (minRating) ratingFilter.$gte = Number(minRating);
        if (maxRating) ratingFilter.$lte = Number(maxRating);
        if (Object.keys(ratingFilter).length > 0) filter.rating = ratingFilter;

        if (status) filter.status = status;

        // получаем данные
        const testimonials = await Testimonial.find(filter).sort({ createdAt: -1 });

        // формируем CSV-заголовок
        const headers = [
            'testimonialId',
            'customerName',
            'customerEmail',
            'rating',
            'text',
            'status',
            'sharedChannels',
            'createdAt'
        ];

        // формируем строки CSV
        const rows = testimonials.map(t => [
            t.testimonialId,
            `"${t.customerName.replace(/"/g, '""')}"`,  // экранирование кавычек
            t.customerEmail || '',
            t.rating || '',
            `"${(t.text || '').replace(/"/g, '""')}"`,
            t.status,
            `"${(t.sharedChannels || []).join(';')}"`,
            t.createdAt.toISOString()
        ]);

        // собираем финальный CSV
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // устанавливаем заголовки для скачивания
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=testimonials-${Date.now()}.csv`);

        // отправляем файл
        res.status(200).send(csvContent);

    } catch (error) {
        console.error('Export CSV error:', error);
        res.status(500).json({
            code: 500,
            status: 'failure',
            message: 'Server error'
        });
    }
};

module.exports = { exportCsv };