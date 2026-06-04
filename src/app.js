const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { CORS_ORIGIN } = require('./config/env');
const logger = require('./utils/logger');
const { errorHandler } = require('./utils/errors');
const apiResponse = require('./utils/response');
const { HTTP_STATUS } = require('./utils/constants');

// Import routes
const authRoutes = require('./routes/authRoutes');
const clinicRoutes = require('./routes/clinicRoutes');
const userRoutes = require('./routes/userRoutes');
const customerRoutes = require('./routes/customerRoutes');
const petRoutes = require('./routes/petRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const groomingRoutes = require('./routes/groomingRoutes');
const pharmacyRoutes = require('./routes/pharmacyRoutes');
const pharmacyDeliveryRoutes = require('./routes/pharmacyDeliveryRoutes');
const eventRoutes = require('./routes/eventRoutes');
const laboratoryRoutes = require('./routes/laboratoryRoutes');
const storeRoutes = require('./routes/storeRoutes');
const storeDispensingRoutes = require('./routes/storeDispensingRoutes');
const suppliesRoutes = require('./routes/suppliesRoutes');
const financeRoutes = require('./routes/financeRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const vetRoutes = require('./routes/vetRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');

const app = express();

// ============================================================================
// Middleware Setup
// ============================================================================

// Security
app.use(helmet());

// CORS - Allow localhost on any port for development, or specific origin for production
const corsOptions = {
    origin: (origin, callback) => {
        // In development, allow all localhost origins
        if (process.env.NODE_ENV === 'development') {
            if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        } else {
            // In production, only allow specified CORS_ORIGIN
            if (CORS_ORIGIN === origin || !origin) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Logging
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// ============================================================================
// API Routes
// ============================================================================

const apiV1 = '/api/v1';

// Health check
app.get('/health', (req, res) => {
    res.status(HTTP_STATUS.OK).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
});

// API version info
app.get('/api', (req, res) => {
    res.status(HTTP_STATUS.OK).json({
        version: '1.0.0',
        name: 'PetVMS API',
        description: 'Pet Veterinary Management System',
    });
});

// Auth routes (no prefix needed for /auth)
app.use(`${apiV1}/auth`, authRoutes);

// Clinic routes
app.use(`${apiV1}/clinics`, clinicRoutes);

// User routes
app.use(`${apiV1}/users`, userRoutes);

// Clinic-nested routes
app.use(`${apiV1}/clinics/:clinicId/customers`, customerRoutes);
app.use(`${apiV1}/clinics/:clinicId/pets`, petRoutes);
app.use(`${apiV1}/clinics/:clinicId/appointments`, appointmentRoutes);
app.use(`${apiV1}/clinics/:clinicId/grooming`, groomingRoutes);
app.use(`${apiV1}/clinics/:clinicId/pharmacy/delivery`, pharmacyDeliveryRoutes);
app.use(`${apiV1}/clinics/:clinicId/pharmacy`, pharmacyRoutes);
app.use(`${apiV1}/clinics/:clinicId/prescriptions`, prescriptionRoutes);
app.use(`${apiV1}/clinics/:clinicId/events`, eventRoutes);
app.use(`${apiV1}/clinics/:clinicId/laboratory`, laboratoryRoutes);
app.use(`${apiV1}/clinics/:clinicId/store/dispense`, storeDispensingRoutes);
app.use(`${apiV1}/clinics/:clinicId/store`, storeRoutes);
app.use(`${apiV1}/clinics/:clinicId/supplies`, suppliesRoutes);
app.use(`${apiV1}/clinics/:clinicId/finance`, financeRoutes);
app.use(`${apiV1}/clinics/:clinicId/dashboard`, dashboardRoutes);

// Vet routes (for Vet Dashboard and Case Management)
app.use(`${apiV1}/clinics/:clinicId/vet`, vetRoutes);

// ============================================================================
// Error Handling
// ============================================================================

// 404 Not Found handler
app.use((req, res) => {
    logger.warn(`404 Not Found: ${req.method} ${req.path}`);
    res.status(HTTP_STATUS.NOT_FOUND).json(
        apiResponse.error('Route not found', HTTP_STATUS.NOT_FOUND, 'NOT_FOUND')
    );
});

// Global error handler (must be last)
app.use(errorHandler);

// ============================================================================
// Export
// ============================================================================

module.exports = app;
