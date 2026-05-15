# PetVMS Backend - PostgreSQL + Prisma Migration Guide

## Overview

This is a complete migration of the PetVMS backend from MongoDB/Mongoose to PostgreSQL with Prisma ORM. The new architecture includes:

- ✅ PostgreSQL database with Prisma ORM
- ✅ JWT-based authentication
- ✅ Role-Based Access Control (RBAC)
- ✅ Multi-tenant architecture with clinic isolation
- ✅ Production-level scalable design
- ✅ Comprehensive error handling
- ✅ Structured logging with Winston
- ✅ Input validation with express-validator

## Prerequisites

- Node.js 16+ 
- PostgreSQL 12+
- npm or yarn

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup Database

Create a PostgreSQL database:

```bash
createdb petvms_dev
```

### 3. Configure Environment

Edit `.env` with your database URL:
```
DATABASE_URL="postgresql://user:password@localhost:5432/petvms_dev"
JWT_SECRET="your-secret-key"
PORT=5000
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3000"
```

### 4. Setup Prisma

Generate Prisma client:
```bash
npm run prisma:generate
```

Run migrations:
```bash
npm run prisma:migrate
```

### 5. Seed Database

Load seed data with default permissions, users, and sample data:
```bash
npm run prisma:seed
```

### 6. Start Server

Development:
```bash
npm run dev
```

Production:
```bash
npm run start
```

Server runs on `http://localhost:5000`

## Default Login Credentials

After seeding:

```
Email: superadmin@petvms.com
Password: Admin@12345
```

## Project Structure

```
backend/
├── src/
│   ├── app.js                 # Express app configuration
│   ├── server.js              # Server startup
│   ├── config/
│   │   └── env.js             # Environment configuration
│   ├── lib/
│   │   └── prisma.js          # Prisma client setup
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── roleMiddleware.js
│   │   ├── permissionMiddleware.js
│   │   ├── clinicAccessMiddleware.js
│   │   └── loggingMiddleware.js
│   ├── controllers/           # Route handlers
│   ├── services/              # Business logic
│   ├── routes/                # API routes
│   ├── validators/            # Input validation
│   └── utils/
│       ├── auth.js            # JWT and password utilities
│       ├── errors.js          # Error handling
│       ├── response.js        # API response helpers
│       ├── constants.js       # Constants, roles, permissions
│       └── logger.js          # Winston logging
├── prisma/
│   ├── schema.prisma          # Prisma schema
│   └── seed.js                # Database seeding
├── .env                       # Environment variables
└── package.json               # Dependencies
```

## API Endpoints

### Authentication

```
POST   /api/v1/auth/signup              - Register new user
POST   /api/v1/auth/login               - Login user
POST   /api/v1/auth/logout              - Logout user
POST   /api/v1/auth/refresh-token       - Refresh access token
PUT    /api/v1/auth/change-password     - Change password
GET    /api/v1/auth/me                  - Get current user profile
```

### Clinics (SUPERADMIN only)

```
GET    /api/v1/clinics                  - Get all clinics
GET    /api/v1/clinics/:id              - Get clinic by ID
POST   /api/v1/clinics                  - Create clinic
PUT    /api/v1/clinics/:id              - Update clinic
DELETE /api/v1/clinics/:id              - Delete clinic
```

### Users

```
GET    /api/v1/users                    - Get all users
GET    /api/v1/users/:id                - Get user by ID
POST   /api/v1/users                    - Create user
PUT    /api/v1/users/:id                - Update user
DELETE /api/v1/users/:id                - Delete user
POST   /api/v1/users/:userId/permissions - Assign permissions
```

### Customers

```
GET    /api/v1/clinics/:clinicId/customers              - Get all customers
GET    /api/v1/clinics/:clinicId/customers/:id          - Get customer by ID
POST   /api/v1/clinics/:clinicId/customers              - Create customer
PUT    /api/v1/clinics/:clinicId/customers/:id          - Update customer
DELETE /api/v1/clinics/:clinicId/customers/:id          - Delete customer
```

### Pets

```
GET    /api/v1/clinics/:clinicId/pets                   - Get all pets
GET    /api/v1/clinics/:clinicId/pets/:id               - Get pet by ID
POST   /api/v1/clinics/:clinicId/pets                   - Create pet
PUT    /api/v1/clinics/:clinicId/pets/:id               - Update pet
DELETE /api/v1/clinics/:clinicId/pets/:id               - Delete pet
```

### Appointments

```
GET    /api/v1/clinics/:clinicId/appointments           - Get all appointments
GET    /api/v1/clinics/:clinicId/appointments/:id       - Get appointment by ID
POST   /api/v1/clinics/:clinicId/appointments           - Create appointment
PUT    /api/v1/clinics/:clinicId/appointments/:id       - Update appointment
PATCH  /api/v1/clinics/:clinicId/appointments/:id/cancel - Cancel appointment
DELETE /api/v1/clinics/:clinicId/appointments/:id       - Delete appointment
```

### Grooming

```
GET    /api/v1/clinics/:clinicId/grooming               - Get all grooming records
GET    /api/v1/clinics/:clinicId/grooming/:id           - Get grooming record by ID
POST   /api/v1/clinics/:clinicId/grooming               - Create grooming record
PUT    /api/v1/clinics/:clinicId/grooming/:id           - Update grooming record
DELETE /api/v1/clinics/:clinicId/grooming/:id           - Delete grooming record
```

### Pharmacy

```
GET    /api/v1/clinics/:clinicId/pharmacy               - Get all pharmacy records
GET    /api/v1/clinics/:clinicId/pharmacy/:id           - Get pharmacy record by ID
POST   /api/v1/clinics/:clinicId/pharmacy               - Create pharmacy record
PUT    /api/v1/clinics/:clinicId/pharmacy/:id           - Update pharmacy record
DELETE /api/v1/clinics/:clinicId/pharmacy/:id           - Delete pharmacy record
```

## User Roles & Permissions

### SUPERADMIN
- Can create/delete clinics
- Can manage all users across all clinics
- Can manage all clinic data
- Does not belong to a specific clinic

### ADMIN
- Belongs to one clinic
- Can manage clinic staff and permissions
- Can view clinic reports
- Can manage pets, customers, appointments

### VET
- Can view customers and pets
- Can create/manage appointments
- Can manage pharmacy records

### GROOMER
- Can view customers and pets
- Can manage grooming records

### RECEPTIONIST
- Can view customers and pets
- Can create appointments

### PHARMACIST
- Can view customers and pets
- Can manage pharmacy records

### STAFF
- Can view customers and pets
- Limited access for general staff

## Prisma Commands

```bash
# Generate Prisma client
npm run prisma:generate

# Create new migration
npm run prisma:migrate

# Deploy migrations to production
npm run prisma:migrate:prod

# Open Prisma Studio (GUI)
npm run prisma:studio

# Seed database
npm run prisma:seed
```

## Database Schema Features

✅ UUID primary keys for all models
✅ Timestamps (createdAt, updatedAt) on all models
✅ Soft deletes (deletedAt field) on relevant models
✅ Proper indexes on frequently queried fields
✅ Cascade delete rules for data integrity
✅ Unique constraints for business logic
✅ Foreign key relationships
✅ Many-to-many relationships (User ↔ Permission)

## Authentication Flow

1. User signs up or logs in
2. Server validates credentials and generates JWT tokens
3. Access token (short-lived) is returned to client
4. Client includes access token in Authorization header
5. Middleware verifies token and extracts user data
6. RBAC middleware checks user role
7. Permission middleware checks specific permissions

## Multi-Tenant Architecture

- Each clinic is isolated via `clinicId` field
- Users belong to specific clinics (except SUPERADMIN)
- `clinicAccessMiddleware` enforces clinic isolation
- Soft deletes prevent data loss

## Error Handling

Centralized error handling with proper HTTP status codes:

```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400,
  "code": "ERROR_CODE",
  "errors": []
}
```

## Logging

Winston logger configured with:
- Console output in development
- File output (error.log, combined.log)
- Structured JSON format
- Request logging via morgan

## Testing

Run tests (when added):
```bash
npm test
```

## Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT secrets (32+ chars)
- [ ] Setup PostgreSQL on reliable hosting
- [ ] Configure CORS_ORIGIN to frontend URL
- [ ] Setup environment variables securely
- [ ] Run migrations: `npm run prisma:migrate:prod`
- [ ] Monitor logs and error tracking
- [ ] Setup SSL/HTTPS
- [ ] Configure database backups
- [ ] Setup rate limiting and DDoS protection

### Example Production Deploy

```bash
# Install dependencies
npm install --production

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate:prod

# Start server
npm run start
```

## Troubleshooting

### Database Connection Error

```bash
# Check PostgreSQL is running
psql -U postgres -d petvms_dev

# Check .env DATABASE_URL
cat .env
```

### Prisma Migration Issues

```bash
# Reset database (development only!)
npx prisma migrate reset

# Check migration status
npx prisma migrate status

# View Prisma logs
export DEBUG="prisma:*"
```

### Port Already in Use

```bash
# Change PORT in .env or
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

## Documentation & Resources

- [Prisma Docs](https://www.prisma.io/docs/)
- [Express.js](https://expressjs.com/)
- [JWT.io](https://jwt.io/)
- [PostgreSQL](https://www.postgresql.org/docs/)

## Contributing

1. Follow the existing code structure
2. Add proper error handling
3. Use TypeScript comments for clarity
4. Test changes before committing
5. Update documentation

## License

MIT

## Support

For issues or questions, please check existing documentation or create an issue.
