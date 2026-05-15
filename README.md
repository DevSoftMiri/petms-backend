# PetVMS Backend - PostgreSQL + Prisma ORM

A production-level scalable SaaS veterinary management system backend built with Node.js, Express, PostgreSQL, and Prisma ORM.

## 🎯 Features

✅ **PostgreSQL Database** - Reliable relational database with Prisma ORM
✅ **JWT Authentication** - Secure token-based authentication
✅ **RBAC (Role-Based Access Control)** - Seven role types with granular permissions
✅ **Multi-Tenant Architecture** - Clinic isolation and data segmentation
✅ **Production-Ready** - Comprehensive error handling, logging, and validation
✅ **RESTful API** - Clean API design with proper HTTP status codes
✅ **Input Validation** - Express-validator with custom validation rules
✅ **Security** - Helmet, CORS, password hashing with bcryptjs
✅ **Soft Deletes** - Data preservation with soft delete fields
✅ **Transaction-Ready** - Prisma transaction support for data consistency
✅ **Structured Logging** - Winston logger with file and console output

## 📋 Prerequisites

- Node.js 16 or higher
- PostgreSQL 12 or higher
- npm 8+ or yarn

## 🚀 Quick Start

### 1. Clone and Install

```bash
cd backend
npm install
```

### 2. Setup Database

Create PostgreSQL database:

```bash
createdb petvms_dev
```

### 3. Configure Environment

Edit `.env` with your database credentials:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/petvms_dev"
JWT_SECRET="your-secret-key-here"
PORT=5000
NODE_ENV="development"
```

### 4. Setup Prisma & Database

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database with initial data
npm run prisma:seed
```

### 5. Start Development Server

```bash
npm run dev
```

Server runs at `http://localhost:5000`

## 📚 Documentation

- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Complete API documentation, endpoints, and setup guide
- [Prisma Schema](./prisma/schema.prisma) - Database schema with all models

## 🔐 Default Credentials (After Seed)

```
Email:    superadmin@petvms.com
Password: Admin@12345
```

⚠️ **Change these in production!**

## 📁 Project Structure

```
backend/
├── src/
│   ├── app.js                      # Express app setup
│   ├── server.js                   # Server entry point
│   ├── config/
│   │   └── env.js                  # Environment variables
│   ├── lib/
│   │   └── prisma.js               # Prisma client instance
│   ├── middleware/                 # Express middlewares
│   │   ├── authMiddleware.js       # JWT verification
│   │   ├── roleMiddleware.js       # Role-based access
│   │   ├── permissionMiddleware.js # Permission checking
│   │   ├── clinicAccessMiddleware.js # Clinic isolation
│   │   └── loggingMiddleware.js    # Request logging
│   ├── controllers/                # Route handlers
│   ├── services/                   # Business logic
│   ├── routes/                     # API routes
│   ├── validators/                 # Input validation
│   └── utils/
│       ├── auth.js                 # JWT and password utilities
│       ├── errors.js               # Error handling
│       ├── response.js             # API response formatting
│       ├── constants.js            # Constants and enums
│       └── logger.js               # Winston logger setup
├── prisma/
│   ├── schema.prisma               # Prisma database schema
│   └── seed.js                     # Database seeding script
├── .env                            # Environment variables (local)

├── package.json                    # Dependencies
├── MIGRATION_GUIDE.md              # Complete API & setup guide
└── README.md                       # This file
```

## 🗄️ Database Models

Core models: Clinic, User, Customer, Pet, Appointment, GroomingRecord, PharmacyRecord
Permission system: Permission, UserPermission (many-to-many)

## 👥 User Roles

- **SUPERADMIN** - Full system access across all clinics
- **ADMIN** - Clinic management and staff oversight
- **VET** - Appointment and medical record management
- **GROOMER** - Grooming service management
- **RECEPTIONIST** - Appointment scheduling
- **PHARMACIST** - Medication management
- **STAFF** - Limited read-only access

## 📊 API Endpoints

### Authentication
```
POST   /api/v1/auth/signup
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh-token
PUT    /api/v1/auth/change-password
GET    /api/v1/auth/me
```

### Clinics (SUPERADMIN)
```
GET    /api/v1/clinics
GET    /api/v1/clinics/:id
POST   /api/v1/clinics
PUT    /api/v1/clinics/:id
DELETE /api/v1/clinics/:id
```

### Users, Customers, Pets, Appointments, Grooming, Pharmacy
RESTful CRUD endpoints with clinic isolation via `:clinicId` path parameter.

## 🔑 Quick Test

```bash
# Development Mode
npm start
```

The server will start on `http://localhost:8080`

## API Endpoints

### Authentication Routes `/api/v1/auth`
- `POST /login` - User login
- `POST /signup` - User registration
- `POST /logout` - User logout

### Pets Routes `/api/v1/pets`
- `GET /` - Get all pets
- `GET /:id` - Get pet by ID
- `POST /` - Create new pet
- `PUT /:id` - Update pet
- `DELETE /:id` - Delete pet
- `GET /owner/:ownerId` - Get pets by owner

### Users Routes `/api/v1/users`
- `GET /` - Get all users (Admin only)
- `GET /:id` - Get user by ID
- `POST /` - Create new user (Admin only)
- `PUT /:id` - Update user (Admin only)
- `DELETE /:id` - Delete user (Admin only)

### Customers Routes `/api/v1/customers`
- `GET /` - Get all customers
- `GET /:id` - Get customer by ID
- `POST /` - Create new customer
- `PUT /:id` - Update customer
- `DELETE /:id` - Delete customer

### Events Routes `/api/v1/events`
- `GET /` - Get all events
- `GET /:id` - Get event by ID
- `POST /` - Create new event
- `PUT /:id` - Update event
- `DELETE /:id` - Delete event

### Laboratory Routes `/api/v1/laboratory`
- `GET /` - Get all tests
- `GET /:id` - Get test by ID
- `POST /` - Create new test
- `PUT /:id` - Update test
- `DELETE /:id` - Delete test

### Store Routes `/api/v1/store`
- `GET /` - Get all items
- `GET /:id` - Get item by ID
- `POST /` - Create new item
- `PUT /:id` - Update item
- `DELETE /:id` - Delete item

### Grooming Routes `/api/v1/grooming`
- `GET /` - Get all services
- `GET /:id` - Get service by ID
- `POST /` - Create new service
- `PUT /:id` - Update service
- `DELETE /:id` - Delete service

### Pharmacy Routes `/api/v1/pharmacy`
- `GET /` - Get all medicines
- `GET /:id` - Get medicine by ID
- `POST /` - Create new medicine
- `PUT /:id` - Update medicine
- `DELETE /:id` - Delete medicine

### Finance Routes `/api/v1/finance`
- `GET /` - Get all transactions
- `GET /summary` - Get finance summary
- `GET /:id` - Get transaction by ID
- `POST /` - Create new transaction
- `PUT /:id` - Update transaction
- `DELETE /:id` - Delete transaction (Admin only)

### Supplies Routes `/api/v1/supplies`
- `GET /` - Get all supplies
- `GET /:id` - Get supply by ID
- `POST /` - Create new supply
- `PUT /:id` - Update supply
- `DELETE /:id` - Delete supply

### Profile Routes `/api/v1/profile`
- `GET /` - Get user profile
- `PUT /` - Update user profile
- `POST /change-password` - Change user password

### Settings Routes `/api/v1/settings`
- `GET /` - Get system settings
- `PUT /` - Update settings (Admin only)
- `GET /system-info` - Get system information

## Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## User Roles

- `ROLE_SUPERADMIN` - Full access to all features
- `ROLE_ADMIN` - Administrative access
- `ROLE_STAFF` - Staff access
- `ROLE_USER` - Regular user access

## Project Structure

```
backend/
├── models/              # Database models
├── controllers/         # Route controllers
├── routes/             # API routes
├── middleware/         # Authentication middleware
├── server.js           # Main server file
├── .env                # Environment variables
└── package.json        # Dependencies
```

## Technologies Used

- Express.js - Web framework
- MongoDB - Database
- Mongoose - ODM
- JWT - Authentication
- Bcryptjs - Password hashing

## License

ISC
