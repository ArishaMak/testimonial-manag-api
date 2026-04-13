const Testimonial = require('../../models/testimonial');

// расширенный поиск (доп задание)
const search = async (req, res) => {
    try {
        const { // деструктизация параметров из юрл
            query,
            createdAfter,
            createdBefore,
            minRating,
            maxRating,
            page = 1,
            limit = 10
        } = req.query;

        // безопасный фильтр - только отзывы текущ юзера ! не удаленные
        const filter = { userId: req.user.userId, isDeleted: false };

        // поиск по тексту. поиск совпадения по регуляторному выражению минуя регистр
        if (query) {
            filter.$or = [
                { customerName: { $regex: query, $options: 'i' } },
                { text: { $regex: query, $options: 'i' } }
            ];
        }

        // фильтр по дате
        if (createdAfter || createdBefore) {
            filter.createdAt = {};
            if (createdAfter) filter.createdAt.$gte = new Date(createdAfter);
            if (createdBefore) filter.createdAt.$lte = new Date(createdBefore);
        }

        // фильтр по рейтингу
        const ratingFilter = {};
        if (minRating) ratingFilter.$gte = Number(minRating);
        if (maxRating) ratingFilter.$lte = Number(maxRating);
        if (Object.keys(ratingFilter).length > 0) filter.rating = ratingFilter;

        // пагинация
        const skip = (page - 1) * limit;

        const results = await Testimonial.find(filter)
            .sort({ createdAt: -1 }) // сначала новые отзывы
            .skip(skip)
            .limit(Number(limit)); // лимитим кол-во отзывов на странице

        // общее кол-во отзывов по фильтру
        const total = await Testimonial.countDocuments(filter);

        res.status(200).json({
            code: 200,
            status: 'success',
            message: 'Search completed successfully',
            data: results, // было: results,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Search testimonials error:', error);
        res.status(500).json({
            code: 500,
            status: 'failure',
            message: 'Server error'
        });
    }
};

module.exports = { search };