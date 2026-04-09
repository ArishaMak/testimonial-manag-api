# Testimonial Management API

A RESTful API for managing customer video testimonials. Business owners can collect, track, share, and analyze customer feedback.

Built with Node.js, Express, and MongoDB.

---

## Quick Start

### Prerequisites
- Node.js v16+
- MongoDB (local or Atlas)

### Installation

```md
```bash
# Clone repo
git clone https://github.com/ArishaMak/testimonial-manag-api.git
cd testimonial-manag-api

npm install

# Edit .env with your config

## Environment Variables

PORT=3001
MONGODB_URI=mongodb://127.0.0.1:27017/testimonial-db
JWT_SECRET=your_secret_key
JWT_EXPIRY=7d

## Run

# Development
npm run dev

# Production
npm start

## API Endpoints

Method - Endpoint - Description
POST - /api/auth/register - Register new user
POST - /api/auth/login - Login & get JWT token

## Testimonials
All endpoints require JWT authentication.

Method - Endpoint - Description
POST - /api/testimonials - Create new testimonial
GET - /api/testimonials - List user's testimonials
GET - /api/testimonials/:id - Get single testimonial
PUT - /api/testimonials/:id - Update testimonial
PATCH - /api/testimonials/:id/status - Change status
POST - /api/testimonials/:id/share - Share via channels
DELETE - /api/testimonials/:id - Soft delete

## Query parameters for GET /api/testimonials:
status — filter by status (e.g. ?status=completed)
page and limit — pagination (defaults: page 1, limit 10)
sort — sort field (default: createdAt descending)

## Settings

Method - Endpoint - Description
GET - /api/testimonials/settings - Get current user settings
POST - /api/testimonials/settings - Create or update settings

## Analytics

Method - Endpoint - Description
GET - /api/testimonials/analytics - Get stats with optional date range

Supports startDate and endDate query parameters (ISO format).
Response includes total count, breakdown by status, and average rating.
Bonus endpoints

## Bonus endpoints
Method - Endpoint - Description
GET - /api/testimonials/search - Search by name, text, rating range, date range
POST - /api/testimonials/bulk/status - 	
Bulk status update with per-item error reporting
GET - /api/testimonials/export - Export testimonials as CSV

## Response Format
All responses follow a consistent structure:

Success:
{
  "code": 200,
  "status": "success",
  "message": "Data retrieved successfully",
  "data": {}
}

Erroe:
{
  "code": 400,
  "status": "failure",
  "message": "Cannot transition from draft to completed"
  "data": null
}

##!!API Usage Examples (Thunder Client)

1. Register & Login
Register:
POST http://127.0.0.1:3001/api/auth/register
Content-Type: application/json

{
  "email": "owner@business.com",
  "password": "secure123",
  "businessName": "My Awesome Business"
}

Login:
POST http://127.0.0.1:3001/api/auth/login
Content-Type: application/json

{
  "email": "owner@business.com",
  "password": "secure123"
}

Response:
{
  "code": 200,
  "status": "success",
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userId": 1,
    "email": "owner@business.com"
  }
}

2. Create Testimonial
POST http://127.0.0.1:3001/api/testimonials
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "rating": 5,
  "text": "Amazing service! Highly recommend."
}

3. Get Testimonials with Filters
Basic list:
GET http://127.0.0.1:3001/api/testimonials
Authorization: Bearer YOUR_TOKEN_HERE

With pagination:
GET http://127.0.0.1:3001/api/testimonials?page=1&limit=5
Authorization: Bearer YOUR_TOKEN_HERE

Filter by status:
GET http://127.0.0.1:3001/api/testimonials?status=completed
Authorization: Bearer YOUR_TOKEN_HERE

4. Update Status (with validation)
PATCH http://127.0.0.1:3001/api/testimonials/TESTIMONIAL_ID/status
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "status": "recording"
}

Valid transitions:
draft → recording
recording → processing
processing → completed
completed → shared

This will fail (invalid transition):
PATCH http://127.0.0.1:3001/api/testimonials/TESTIMONIAL_ID/status
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "status": "completed"
}

Response:
{
  "code": 400,
  "status": "failure",
  "message": "Cannot transition from draft to completed"
}

5. Share Testimonial
POST http://127.0.0.1:3001/api/testimonials/TESTIMONIAL_ID/share
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "channels": ["email", "sms", "facebook"]
}

6. Search (Bonus Feature)
Search by name:
GET http://127.0.0.1:3001/api/testimonials/search?query=John
Authorization: Bearer YOUR_TOKEN_HERE

Complex search:
GET http://127.0.0.1:3001/api/testimonials/search?query=service&minRating=3&createdAfter=2025-01-01&page=1&limit=10
Authorization: Bearer YOUR_TOKEN_HERE

7. Bulk Status Update (Bonus Feature)
POST http://127.0.0.1:3001/api/testimonials/bulk/status
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "testimonialIds": [
    "f459fecd-57b7-4165-9e93-bba903c973ed",
    "8981bf0e-c2b4-47fd-8b01-87f69ecef797"
  ],
  "status": "completed"
}

Response:
{
  "code": 200,
  "status": "success",
  "data": {
    "updated": 2,
    "failed": 0,
    "errors": []
  }
}

8. Export to CSV (Bonus Feature)
GET http://127.0.0.1:3001/api/testimonials/export
Authorization: Bearer YOUR_TOKEN_HERE

Response: File download testimonials-1234567890.csv
With filters:
GET http://127.0.0.1:3001/api/testimonials/export?status=shared&minRating=4
Authorization: Bearer YOUR_TOKEN_HERE

9. Analytics
All time:
GET http://127.0.0.1:3001/api/testimonials/analytics
Authorization: Bearer YOUR_TOKEN_HERE

Date range:
GET http://127.0.0.1:3001/api/testimonials/analytics?startDate=2025-01-01&endDate=2025-12-31
Authorization: Bearer YOUR_TOKEN_HERE

Response:
{
  "code": 200,
  "status": "success",
  "data": {
    "overview": {
      "total": 25,
      "byStatus": {
        "draft": 3,
        "recording": 2,
        "processing": 1,
        "completed": 12,
        "shared": 7
      },
      "averageRating": 4.6
    },
    "period": {
      "startDate": "2025-01-01T00:00:00.000Z",
      "endDate": "2025-12-31T23:59:59.999Z"
    }
  }
}

10. Settings
Get settings:
GET http://127.0.0.1:3001/api/testimonials/settings
Authorization: Bearer YOUR_TOKEN_HERE

Create/Update settings:
POST http://127.0.0.1:3001/api/testimonials/settings
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "isEnabled": true,
  "defaultVideoLength": 30,
  "thankYouMessage": "Thank you for your feedback! 🎉"
}

## Testing

npm test

Uses Jest, Supertest, and in-memory MongoDB. No local database needed for tests.
Covers:
- Auth middleware (token validation)
- Status transition logic
- Core CRUD endpoints
- Owner validation

## Architectural Decisions

- Counter collection for userId auto-increment
MongoDB has no built-in auto-increment. I implemented a small Counter collection that atomically increments a sequence on each new user. Minimal solution, no external dependencies.

- Soft delete over hard delete
Testimonials are never permanently removed. Setting isDeleted: true with a deletedAt timestamp preserves data for audit purposes. All queries explicitly filter on isDeleted: false.

- Status transitions in constants
The allowed transitions map lives in lib/constants.js rather than being scattered across controllers. One place to read, one place to change.

- Owner validation on every write
Every mutation endpoint fetches the document first and compares userId from the token against the document owner. This happens in the controller rather than middleware to keep auth stateless.

- UUID for testimonialId
Auto-increment integers as public identifiers expose information about record counts. UUIDs are generated via a Mongoose pre-save hook so the controller never needs to handle this manually.

## Challenges & Solutions
This project took me 3 days (about 12 hours total). Here are the main hurdles I hit and how I solved them:

1. MongoDB Memory Server kept timing out
Problem: Integration tests would hang for 60+ seconds trying to spin up the in-memory database, then fail with timeout errors.

Solution: I increased the Jest timeout to 120 seconds and added proper error handling in the beforeAll hook. Also learned that the first test run downloads a ~300MB MongoDB binary, which takes time. Subsequent runs are much faster because it's cached.

What I learned: Always account for external binary downloads in test setup. Add generous timeouts for the first run.

2. UUID package ES6 module conflict
Problem: The latest uuid package (v13) uses ES6 export syntax, but my project uses CommonJS require(). Jest choked on this with "Unexpected token 'export errors.

Solution: Downgraded to uuid@9, which still uses CommonJS. Alternatively, I could have configured Babel transforms, but downgrading was simpler and faster.

What I learned: Always check if a package's module system matches your project setup before installing.

3. Route order matters!
Problem: My /api/testimonials/search endpoint was returning 404 because Express was matching :testimonialId first and treating "search" as an ID.

Solution: Moved all specific routes (/search, /settings, /analytics, /bulk/status) above the dynamic /:testimonialId route. Order matters in Express!

What I learned: Always define specific routes before parameterized routes.

4. Double mongoose connection
Problem: When I split app.js and server.js for testing, I accidentally imported mongoose twice and got "already declared" errors.

Solution: Exported both app and mongoose from app.js and imported them together in tests. Also added if (require.main === module) guard so the server only starts when running app.js directly, not when importing for tests.

What I learned: Be careful with module exports and avoid duplicate variable declarations.

Development Time
Total time: ~12 hours over 3 days

## Tech Stack
Runtime: Node.js
Framework: Express.js
Database: MongoDB + Mongoose
Auth: JWT + Bcrypt
Testing: Jest + Supertest + mongodb-memory-server
Rate Limiting: express-rate-limit

## Security Features
- Passwords hashed with bcrypt
- JWT authentication on protected routes
- Owner validation on all write operations
- Rate limiting on login endpoint
- Input validation on all endpoints
- No sensitive data in responses

## Author
Arina N. Makovchik

## Built as a test assignment for EtaCar Systems.
