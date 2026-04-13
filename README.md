# Тестовое задание: Testimonial Management API

## Описание проекта

**Testimonial Management API** с нуля. Это упрощённая версия реальной фичи платформы.

Бизнесы используют приложение для сбора видео-отзывов (testimonials) от своих клиентов. API будет управлять жизненным циклом отзывов: создание, отслеживание статуса, шаринг и аналитика.

**Результат:** GitHub-репозиторий с работающим Node.js API

**Статус выполнения:** Все обязательные требования выполнены + 5/5 бонусных задач

---

## Технологический стек (обязательно)

- **Runtime:** Node.js (v16+)
- **Framework:** Express.js
- **База данных:** MongoDB + Mongoose ODM
- **Аутентификация:** JWT (jsonwebtoken)
- **Язык:** JavaScript (CommonJS модули с `require`, без TypeScript)

---

## Модели данных

Созданы **3 модели Mongoose**:

### 1. User

Представляет владельца бизнеса, который собирает отзывы.

| Поле           | Тип     | Обязательное | Описание                                            |
| -------------- | ------- | ------------ | --------------------------------------------------- |
| `userId`       | Number  | Да           | Уникальный авто-инкрементный ID                     |
| `email`        | String  | Да           | Уникальный, валидный формат email                   |
| `password`     | String  | Да           | Хешированный через bcrypt                           |
| `businessName` | String  | Да           | Название бизнеса                                    |
| `role`         | String  | Нет          | Enum: `["owner", "staff"]`, по умолчанию: `"owner"` |
| `isActive`     | Boolean | Нет          | По умолчанию: `true`                                |
| `timestamps`   | —       | —            | Использовать Mongoose `timestamps: true`            |

### 2. Testimonial

Представляет один отзыв, собранный от клиента.

| Поле             | Тип      | Обязательное | Описание                                                                                     |
| ---------------- | -------- | ------------ | -------------------------------------------------------------------------------------------- |
| `testimonialId`  | String   | Да           | Уникальный идентификатор (uuid)                                                              |
| `userId`         | Number   | Да           | Ссылка на User — владельца отзыва                                                            |
| `customerName`   | String   | Да           | Имя клиента, оставившего отзыв                                                               |
| `customerEmail`  | String   | Нет          | Email клиента                                                                                |
| `customerPhone`  | String   | Нет          | Телефон клиента                                                                              |
| `videoUrl`       | String   | Нет          | URL видео (просто строка, загрузка файлов не требуется)                                      |
| `rating`         | Number   | Нет          | Рейтинг от 1 до 5                                                                            |
| `text`           | String   | Нет          | Текст отзыва                                                                                 |
| `status`         | String   | Да           | Enum: `["draft", "recording", "processing", "completed", "shared"]`, по умолчанию: `"draft"` |
| `consentGiven`   | Boolean  | Нет          | По умолчанию: `false`                                                                        |
| `sharedAt`       | Date     | Нет          | Дата шаринга                                                                                 |
| `sharedChannels` | [String] | Нет          | Массив каналов: `["email", "sms", "facebook", "instagram"]`                                  |
| `isDeleted`      | Boolean  | Нет          | По умолчанию: `false` (мягкое удаление)                                                      |
| `deletedAt`      | Date     | Нет          | Дата удаления                                                                                |
| `timestamps`     | —        | —            | Использовать Mongoose `timestamps: true`                                                     |

**Реализованные индексы:**
- `testimonialId` (unique)
- `userId`
- `status`
- Составной индекс: `{ userId: 1, isDeleted: 1 }`

### 3. TestimonialSettings

Настройки фичи отзывов для каждого пользователя.

| Поле                 | Тип      | Обязательное | Описание                                                                              |
| -------------------- | -------- | ------------ | ------------------------------------------------------------------------------------- |
| `userId`             | Number   | Да           | Уникальный — один документ настроек на пользователя                                   |
| `isEnabled`          | Boolean  | Нет          | По умолчанию: `false`                                                                 |
| `defaultVideoLength` | Number   | Нет          | В секундах, по умолчанию: `10`                                                        |
| `videoLengthOptions` | [Number] | Нет          | По умолчанию: `[5, 10, 15, 20, 25]`                                                   |
| `questionnaire`      | [String] | Нет          | По умолчанию: `["What do you like about our service?"]`                               |
| `sendingOptions`     | [String] | Нет          | По умолчанию: `["email", "sms"]`                                                      |
| `thankYouMessage`    | String   | Нет          | По умолчанию: `"Thank you!"`                                                          |
| `contactConsent`     | Object   | Нет          | `{ enabled: Boolean (default true), text: String (default "Join our mailing list") }` |
| `timestamps`         | —        | —            | Использовать Mongoose `timestamps: true`                                              |

---

## API Эндпоинты

### Аутентификация

| Метод | Эндпоинт             | Описание                           | Auth |
| ----- | -------------------- | ---------------------------------- | ---- |
| POST  | `/api/auth/register` | Регистрация нового пользователя    | Нет  |
| POST  | `/api/auth/login`    | Авторизация и получение JWT токена | Нет  |

**Register:**
- Валидация обязательных полей (email, password, businessName)
- Проверка на дубликат email
- Хеширование пароля через bcrypt
- Авто-генерация `userId` (инкремент от последнего пользователя)
- Возврат данных пользователя (без пароля) и JWT токена

**Login:**
- Валидация email и password
- Сравнение с хешированным паролем
- Возврат JWT токена с `userId` и `email` в payload

---

### Testimonials (все требуют JWT авторизацию)

| Метод  | Эндпоинт                                  | Описание                                    |
| ------ | ----------------------------------------- | ------------------------------------------- |
| POST   | `/api/testimonials`                       | Создать новый отзыв                         |
| GET    | `/api/testimonials`                       | Список отзывов авторизованного пользователя |
| GET    | `/api/testimonials/:testimonialId`        | Получить один отзыв по ID                   |
| PUT    | `/api/testimonials/:testimonialId`        | Обновить отзыв                              |
| PATCH  | `/api/testimonials/:testimonialId/status` | Обновить статус отзыва                      |
| DELETE | `/api/testimonials/:testimonialId`        | Мягкое удаление отзыва                      |
| POST   | `/api/testimonials/:testimonialId/share`  | Записать действие шаринга                   |

#### Детали эндпоинтов

**POST `/api/testimonials`**
- Авто-генерация `testimonialId` через uuid
- Установка `userId` из JWT токена авторизованного пользователя
- Валидация обязательных полей: `customerName`
- Начальный статус: `"draft"`

**GET `/api/testimonials`**
- Возврат отзывов только авторизованного пользователя
- Исключение мягко удалённых записей (`isDeleted: false`)
- Поддержка query-параметров:
  - `status` — фильтр по статусу (например, `?status=completed`)
  - `page` и `limit` — пагинация (по умолчанию: page 1, limit 10)
  - `sort` — поле сортировки (по умолчанию: `createdAt`, по убыванию)
- Формат ответа:
```json
{
  "code": 200,
  "status": "success",
  "message": "Data retrieved successfully",
  "data": [],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "pages": 3
  }
}

PATCH /api/testimonials/:testimonialId/status
Принимает { "status": "completed" } в теле запроса
Обязательная валидация переходов статусов:
draft → recording
recording → processing
processing → completed
completed → shared
Отклонение невалидных переходов с ошибкой 400 и понятным сообщением (например: "Cannot transition from draft to completed")
При переходе в "shared" установить sharedAt на текущую дату
DELETE /api/testimonials/:testimonialId
Мягкое удаление: установить isDeleted: true и deletedAt: new Date()
НЕ удалять документ из базы данных
Пользователь может удалить только свои отзывы

POST /api/testimonials/:testimonialId/share
Принимает { "channels": ["email", "facebook"] }
Валидация каналов из допустимого списка: ["email", "sms", "facebook", "instagram"]
Добавление каналов в sharedChannels (без дубликатов)
Авто-переход статуса в "shared", если текущий статус "completed"
Установка sharedAt, если ещё не установлено

### Settings (требуют JWT авторизацию)

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| GET | `/api/testimonials/settings` | Получить настройки авторизованного пользователя |
| POST | `/api/testimonials/settings` | Создать или обновить настройки |

**GET `/api/testimonials/settings`**
- Возврат настроек авторизованного пользователя
- Если настройки ещё не существуют, вернуть `null` в data (не 404)

**POST `/api/testimonials/settings`**
- Upsert: создать если не существует, обновить если существует
- Использовать `userId` из JWT токена
- Обновлять только те поля, которые переданы в теле запроса

---

### Analytics (требует JWT авторизацию)

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| GET | `/api/testimonials/analytics` | Получить аналитику по отзывам |

**GET `/api/testimonials/analytics`**
- Поддержка опциональных query-параметров: `startDate`, `endDate` (ISO date строки)
- Формат ответа:
```json
{
  "code": 200,
  "status": "success",
  "message": "Data retrieved successfully",
  "data": {
    "overview": {
      "total": 50,
      "byStatus": {
        "draft": 5,
        "recording": 3,
        "processing": 2,
        "completed": 25,
        "shared": 15
      },
      "averageRating": 4.2
    },
    "period": {
      "startDate": "2025-01-01T00:00:00.000Z",
      "endDate": "2025-12-31T23:59:59.999Z"
    }
  }
}

### Бонусные задачи (все выполнены)

## Бонус 1: Rate Limiting

- Добавлен rate limiting на эндпоинты аутентификации (максимум 5 попыток логина в минуту с одного IP) через express-rate-limit.

## Бонус 2: Поиск и фильтрация

Эндпоинт GET /api/testimonials/search поддерживает:
- Текстовый поиск по полям customerName и text
- Фильтрацию по дате (createdAfter, createdBefore)
- Фильтрацию по рейтингу (minRating, maxRating)
- Комбинацию с пагинацией

## Бонус 3: Массовые операции
Эндпоинт POST /api/testimonials/bulk/status:
- Принимает { "testimonialIds": ["id1", "id2"], "status": "completed" }
- Валидирует переходы статусов для каждого отзыва отдельно
- Возвращает результат: { "updated": 3, "failed": 1, "errors": [...] }

## Бонус 4: Экспорт
- Эндпоинт GET /api/testimonials/export:
- Возвращает отзывы в формате CSV
- Устанавливает корректные заголовки Content-Type и Content-Disposition
- Поддерживает те же фильтры, что и список отзывов

## Бонус 5: Тесты
Интеграционные тесты на Jest:
- Тест логики переходов статусов
- Тест middleware аутентификации
- Тесты CRUD-эндпоинтов
- Использование in-memory MongoDB (mongodb-memory-server)

### Технические требования (реализовано)

## 1. Формат ответов

Все API-ответы следуют единому формату:
Успешный ответ:

{
  "code": 200,
  "status": "success",
  "message": "Descriptive message",
  "data": {}
}

Ответ с ошибкой:

{
  "code": 400,
  "status": "failure",
  "message": "Error description"
}

Используются консистентные HTTP статус-коды: 200, 201, 400, 401, 403, 404, 500.

## 2. Middleware аутентификации

- Переиспользуемая middleware-функция:
- Извлекает JWT из заголовка Authorization (Bearer <token>)
- Верифицирует токен
- Прикрепляет декодированные данные пользователя в req.user
- Возвращает 401, если токен отсутствует или невалиден

## 3. Валидация входных данных
- Валидация обязательных полей при создании/обновлении
- Валидация формата email
- Валидация enum-значений (status, channels)
- Валидация рейтинга: от 1 до 5
- Понятные сообщения об ошибках валидации

## 4. Обработка ошибок
- Вся логика контроллеров обёрнута в try/catch
- Stack traces не показываются в ответах API
- Ошибки логируются в консоль
- Корректная обработка ошибок валидации Mongoose

## 5. Проверка владельца
- Пользователи могут просматривать, изменять и удалять только свои отзывы и настройки
- Возвращается 403 Forbidden при попытке доступа к данным другого пользователя

## 6. Структура проекта

/
├── models/
│   ├── user.js
│   ├── testimonial.js
│   └── testimonialSettings.js
│   └── counter.js
├── controllers/
│   ├── authController.js
│   └── testimonialController.js
├── routes/
│   ├── authRoute.js
│   └── testimonialRoute.js
├── middleware/
│   └── auth.js
├── lib/
│   └── constants.js
├── tests/
│   ├── auth-middleware.test.js
│   ├── status-transitions.test.js
│   └── testimonial-crud.test.js
├── app.js
├── package.json
├── README.md
├── .env.example
├── Dockerfile
└── docker-compose.yml

## 7. Конфигурация

Переменные окружения через .env файл с dotenv:
- PORT — порт сервера (по умолчанию: 3000)
- MONGODB_URI — строка подключения к MongoDB
- JWT_SECRET — секрет для подписи JWT
- JWT_EXPIRY — время жизни токена (по умолчанию: "7d")

### Быстрый старт

## Требования

- Node.js v16+
- MongoDB (у меня локально)

## Установка

# Клонируйте репозиторий
git clone https://github.com/ArishaMak/testimonial-manag-api.git
cd testimonial-manag-api

# Установите зависимости
npm install

# Настройка окружения
Создайте файл .env в корне проекта:

PORT=3001
MONGODB_URI=mongodb://127.0.0.1:27017/testimonial-db
JWT_SECRET=your_secret_key
JWT_EXPIRY=7d

# Запуск

# Режим разработки (с nodemon)
npm run dev

# Продакшен режим
npm start

## Docker
Файлы конфигурации включены: Dockerfile, docker-compose.yml

Известная проблема (Windows)
На данной машине разработки (Windows) Docker Desktop не запустился из-за проблем с конфигурацией WSL 2 (Windows Subsystem for Linux). Обновление ядра WSL зависало на начальном этапе, что препятствовало инициализации Docker.

Это проблема окружения, а не кода приложения

Конфигурация Docker составлена по стандартам и должна работать на:
- Linux
- macOS
- Windows с корректно настроенным WSL 2 или Hyper-V

## Как запустить через Docker (на исправной системе):
docker compose up -d

Приложение будет доступно по адресу: http://localhost:3001

### Примеры запросов (Thunder Client)
## 1. Регистрация и вход

# Регистрация:

POST http://127.0.0.1:3001/api/auth/register
Content-Type: application/json

{
  "email": "owner@business.com",
  "password": "secure123",
  "businessName": "My Business"
}

# Вход:

POST http://127.0.0.1:3001/api/auth/login
Content-Type: application/json

{
  "email": "owner@business.com",
  "password": "secure123"
}

# Ответ:

{
  "code": 200,
  "status": "success",
  "message": "Login successful",
  "data": {
    "token": "JWT_TOKEN_HERE",
    "userId": 1,
    "email": "owner@business.com"
  }
}

## 2. Создание отзыва

POST http://127.0.0.1:3001/api/testimonials
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "rating": 5,
  "text": "Отличный сервис!"
}

## 3. Получение списка с фильтрами

# Базовый запрос
GET /api/testimonials

# С пагинацией
GET /api/testimonials?page=1&limit=5

# Фильтр по статусу
GET /api/testimonials?status=completed

## 4. Изменение статуса

PATCH /api/testimonials/:id/status
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{ "status": "recording" }

## 5. Поиск (бонус)

# Поиск по имени
GET /api/testimonials/search?query=John

# Сложный поиск
GET /api/testimonials/search?query=сервис&minRating=4&createdAfter=2025-01-01

## 6. Массовое обновление (бонус)

POST /api/testimonials/bulk/status
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "testimonialIds": ["id1", "id2"],
  "status": "completed"
}

## 7. Экспорт в CSV (бонус)

GET /api/testimonials/export
Authorization: Bearer YOUR_TOKEN

## 8. Аналитика

# Все данные
GET /api/testimonials/analytics

# С фильтром по дате
GET /api/testimonials/analytics?startDate=2025-01-01&endDate=2025-12-31

### Тестирование

npm test

# Используется:
- Jest
- Supertest
- mongodb-memory-server

# Покрытие:
- Аутентификация (middleware)
- Логика переходов статусов
- Основные CRUD-операции
- Проверка владельца (owner validation)

### Архитектурные решения

## Auto-increment userId через Counter

MongoDB не поддерживает авто-инкремент "из коробки". Реализована отдельная коллекция Counter, которая атомарно увеличивает последовательность при создании каждого нового пользователя. Минимальное решение без внешних зависимостей.

## Мягкое удаление (Soft Delete)

Отзывы не удаляются физически. При удалении устанавливаются флаги:

{ "isDeleted": true, "deletedAt": "timestamp" }

Все запросы явно фильтруют isDeleted: false. Это позволяет восстанавливать данные и вести аудит.

## Статусы в constants.js

Карта разрешённых переходов статусов вынесена в lib/constants.js. Одно место для чтения и изменения — меньше ошибок, проще поддержка.

## Проверка владельца на каждом изменении

Каждый мутационный эндпоинт сначала загружает документ и сверяет userId из токена с владельцем записи. Проверка реализована в контроллерах, чтобы middleware аутентификации оставался простым и переиспользуемым.

## UUID для testimonialId

Публичные идентификаторы не должны раскрывать информацию о количестве записей. UUID генерируется через Mongoose pre-save hook, контроллеры не занимаются этим вручную.

### Проблемы и решения в процессе разработки

## 1. Таймауты MongoDB Memory Server

Проблема: Интеграционные тесты зависали на 60+ секунд при запуске in-memory базы.
Решение: Увеличен таймаут Jest до 120 секунд, добавлена обработка ошибок в beforeAll. Первый запуск скачивает бинарник MongoDB (~300 МБ), последующие — используют кэш.

## 2. Конфликт модулей UUID

Проблема: Пакет uuid@13 использует ES6 export, но проект написан на CommonJS (require).
Решение: Установлена версия uuid@9, совместимая с CommonJS.

## 3. Порядок маршрутов в Express

Проблема: Эндпоинт /search возвращал 404, потому что Express обрабатывал :testimonialId раньше.
Решение: Все специфичные маршруты (/search, /settings, /analytics) размещены выше динамического /:testimonialId.

## 4. Двойное подключение Mongoose

Проблема: При разделении app.js и server.js возникала ошибка повторного объявления mongoose.
Решение: Экспортированы оба объекта из app.js, добавлена проверка if (require.main === module) для предотвращения авто-запуска сервера при импорте в тестах.

## 5. Линтер и качество кода

Проблема: Необходимость обеспечить единообразие кода.
Решение: Настроен ESLint с конфигурацией для Node.js и Jest, все предупреждения устранены.

### Время разработки

Общее время (без Docker + README): 3 дня

### Безопасность
- Пароли хешируются через bcrypt
- JWT аутентификация на защищённых маршрутах
- Проверка владельца на всех операциях записи
- Rate limiting на эндпоинтах входа
- Валидация входных данных на всех эндпоинтах
- Чувствительные данные не попадают в ответы API

### Технологический стек

| Категория | Технология |
|-----------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + Bcrypt |
| Testing | Jest + Supertest + mongodb-memory-server |
| Rate Limiting | express-rate-limit |
| Linting | ESLint |

### Автор
Arina N. Makovchik
Тестовое задание для EtaCar Systems.