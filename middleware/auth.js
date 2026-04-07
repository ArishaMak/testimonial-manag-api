// проверят заголовок Autorization, берет токен и расшифр
const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        // череез тернарный оператор обрабат http заголовко
        const token =
            authHeader &&
            authHeader.split(' ')[0] === 'Bearer'
            ? authHeader.split(' ')[1] || null
            : null;

        if (!token) {
            return res.status(401).json({
                code: 401,
                status: 'failure',
                message: 'No token, authorization denied'
            });
        }

        // проверка токена и извл данных
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded; // сохранили данные

        next();
    } catch (error) {
        res.status(401).json({
            code: 401,
            status: 'failure',
            message: 'Token is not valid'
        });
    }
};

module.exports = auth;