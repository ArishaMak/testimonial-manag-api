# Code Review: Testimonial Management API — ДО исправлений

**Дата ревью:** 2026-04-13

---

## Общая информация

- Все основные эндпоинты реализованы и работают
- Все 5 бонусных заданий выполнены
- Docker-compose настроен
- README подробный и на русском языке

---

## Оценка по критериям задания

### 1. Корректность (25%) — 18/25

**Что работает:**
- Регистрация и логин с JWT
- CRUD отзывов (create, getAll, getOne, update)
- Валидация переходов статусов (draft → recording → processing → completed → shared)
- Шаринг с валидацией каналов и дедупликацией
- Мягкое удаление (isDeleted + deletedAt)
- Настройки (upsert)
- Аналитика (aggregation pipeline)
- Все 5 бонусов: rate limiting, поиск, bulk update, CSV export, тесты

**Что не работает / баги:**
- **КРИТИЧНО: `getOne` не проверяет владельца** — любой авторизованный пользователь может читать чужие отзывы по testimonialId. Нарушение требования "Пользователи могут просматривать только свои отзывы". Должен быть 403 Forbidden.
- **Тесты CRUD полностью сломаны** — `uuid` v13 является ESM-only пакетом, а проект использует CommonJS (`require`). Jest не может импортировать модуль. Результат: 2 из 3 test suites проходят, `testimonial-crud.test.js` падает с `SyntaxError: Unexpected token 'export'`.
- Ответ эндпоинта search использует поле `results` вместо `data`, нарушая единый формат ответов из спецификации.

### 2. Качество кода (25%) — 16/25

**Плюсы:**
- Чёткое разделение на models/controllers/routes/middleware/lib
- Константы вынесены в отдельный файл (status transitions, sharing channels)
- Единый формат ответов (code, status, message, data)

**Минусы:**
- `testimonialController.js` — **795 строк**. Содержит 13 функций: CRUD, настройки, аналитику и все бонусы в одном файле
- `console.log('register получен: ', req.body)` в `authController.js:6` — **логирует тело запроса включая пароль в открытом виде**
- `console.log('login запрос получен:', req.body)` в `authController.js:67` — аналогично
- **~60 строк закомментированного кода** в `models/testimonial.js` — 4 варианта pre-save хуков, 3 варианта soft-delete хуков, закомментированный валидатор
- `unique: true` закомментирован в `models/user.js:9,14` хотя индексы дублируются ниже
- Copy-paste ошибка: `testimonialController.js:469` — в catch блоке upsertSettings написано `'Get analytics error:'`
- `package.json`: `"main": "index.js"` — файл index.js не существует
- `package.json`: `"dev": "nodemon app.js"` — app.js не запускает сервер, должен быть server.js
- `dotenv` указан и в dependencies (`^16.x.x`) и в devDependencies (`^17.4.1`) с разными версиями
- ESLint скрипты (`lint`, `lint:fix`) в package.json, но **конфигурационный файл ESLint отсутствует** — `npm run lint` падает с ошибкой
- Обёртка `{ testimonial }` в ответе updateStatus вместо просто `testimonial` (inconsistency с остальными эндпоинтами)

### 3. Обработка ошибок (20%) — 16/20

**Плюсы:**
- Try-catch в каждом контроллере
- Правильные HTTP коды: 200, 201, 400, 401, 403, 404, 500
- Mongoose валидация на уровне схемы (email regex, rating min/max, enum)
- Понятные сообщения об ошибках (например, `"Cannot transition from draft to completed"`)
- Stack traces не утекают в ответы API

**Минусы:**
- `console.log(req.body)` при регистрации и логине — логирует пароли в открытом виде
- Нет проверки наличия `JWT_SECRET` при старте сервера — если переменная не задана, сервер запустится, но все JWT-операции будут крашиться с невнятной ошибкой
- Нет валидации `MONGODB_URI` при старте

### 4. Моделирование данных (15%) — 13/15

**Плюсы:**
- Все 3 модели соответствуют спецификации
- Auto-increment userId через Counter коллекцию — правильный паттерн
- UUID для testimonialId через pre-save хук
- Индексы: userId, status, составной { userId, isDeleted }
- Пароль скрыт через `select: false` и toJSON
- Enum валидация для status и sharedChannels
- Timestamps на всех моделях

**Минусы:**
- `__v` (version key) возвращается в ответах Testimonial и Settings, хотя в User модели убирается через toJSON — inconsistency
- Дублирование определения индексов: `unique: true` в схеме + `schema.index()` — Mongoose выдаёт warning
- Нет CORS middleware

### 5. Дизайн API (10%) — 8/10

**Плюсы:**
- RESTful конвенции соблюдены
- Единый формат ответов (с исключением search)
- Пагинация с метаданными (total, page, limit, pages)
- Статичные роуты (`/settings`, `/analytics`, `/search`) размещены до динамических (`/:testimonialId`)
- Rate limiting на login (5 попыток/минуту)

**Минусы:**
- Search endpoint возвращает `results` вместо `data`
- Отсутствие CORS — frontend на другом домене не сможет обращаться к API

### 6. Бонусные задачи (5%) — 4/5

| Бонус | Статус | Комментарий |
|---|---|---|
| Rate Limiting | Работает | express-rate-limit на login, 5 попыток/мин |
| Поиск и фильтрация | Работает | $regex по customerName/text, фильтры по дате и рейтингу |
| Массовые операции | Работает | Индивидуальная валидация переходов, подробный отчёт |
| Экспорт CSV | Работает | Правильные заголовки, экранирование кавычек |
| Тесты | Частично | 2/3 suite работают, CRUD тесты сломаны из-за uuid ESM |

---

## Итоговая оценка ДО исправлений

| Критерий | Вес | Баллы | Процент |
|---|---|---|---|
| Корректность | 25% | 18/25 | 72% |
| Качество кода | 25% | 16/25 | 64% |
| Обработка ошибок | 20% | 16/20 | 80% |
| Моделирование данных | 15% | 13/15 | 87% |
| Дизайн API | 10% | 8/10 | 80% |
| Бонусные задачи | 5% | 4/5 | 80% |
| **ИТОГО** | **100%** | **75/100** | **75%** |

---

## Полный список найденных проблем

### Критические (блокируют приёмку)
1. `getOne` без проверки владельца — утечка данных между пользователями
2. Тесты CRUD не запускаются — uuid v13 ESM несовместим с CommonJS

### Средние (заметно снижают оценку)
3. `console.log(req.body)` логирует пароли в открытом виде
4. Copy-paste ошибка в сообщении об ошибке upsertSettings
5. `testimonialController.js` — 795 строк, монолит
6. Search возвращает `results` вместо `data`
7. `dotenv` в двух секциях package.json с разными версиями
8. `npm run dev` запускает `nodemon app.js` вместо `nodemon server.js`
9. `package.json` main указывает на несуществующий `index.js`
10. ESLint конфиг отсутствует, `npm run lint` падает

### Мелкие (портят впечатление)
11. ~60 строк закомментированного кода в моделях
12. `__v` возвращается в Testimonial/Settings, но не в User
13. Нет CORS middleware
14. Нет проверки JWT_SECRET/MONGODB_URI при старте сервера
15. Дублирование индексов в User модели (schema + explicit)
