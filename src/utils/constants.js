// Standard HTTP Status Codes
const HTTP_STATUS = {
  // 2xx Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  
  // 4xx Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  RATE_LIMIT: 429,
  
  // 5xx Server Errors
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  SERVICE_UNAVAILABLE: 503,
};

// User Roles
const USER_ROLES = {
  SUPERADMIN: 'SUPERADMIN',
  ADMIN: 'ADMIN',
  VET: 'VET',
  GROOMER: 'GROOMER',
  RECEPTIONIST: 'RECEPTIONIST',
  PHARMACIST: 'PHARMACIST',
  STAFF: 'STAFF',
};

// Default Permissions
const DEFAULT_PERMISSIONS = [
  // Customer Permissions
  { name: 'VIEW_CUSTOMERS', category: 'CUSTOMER', description: 'View customer information' },
  { name: 'CREATE_CUSTOMERS', category: 'CUSTOMER', description: 'Create new customers' },
  { name: 'UPDATE_CUSTOMERS', category: 'CUSTOMER', description: 'Update customer information' },
  { name: 'DELETE_CUSTOMERS', category: 'CUSTOMER', description: 'Delete customers' },
  
  // Pet Permissions
  { name: 'VIEW_PETS', category: 'PET', description: 'View pet information' },
  { name: 'CREATE_PETS', category: 'PET', description: 'Create new pets' },
  { name: 'UPDATE_PETS', category: 'PET', description: 'Update pet information' },
  { name: 'DELETE_PETS', category: 'PET', description: 'Delete pets' },
  
  // Appointment Permissions
  { name: 'VIEW_APPOINTMENTS', category: 'APPOINTMENT', description: 'View appointments' },
  { name: 'CREATE_APPOINTMENTS', category: 'APPOINTMENT', description: 'Create appointments' },
  { name: 'UPDATE_APPOINTMENTS', category: 'APPOINTMENT', description: 'Update appointments' },
  { name: 'CANCEL_APPOINTMENTS', category: 'APPOINTMENT', description: 'Cancel appointments' },
  
  // Grooming Permissions
  { name: 'VIEW_GROOMING', category: 'GROOMING', description: 'View grooming records' },
  { name: 'MANAGE_GROOMING', category: 'GROOMING', description: 'Manage grooming services' },
  
  // Pharmacy Permissions
  { name: 'VIEW_PHARMACY', category: 'PHARMACY', description: 'View pharmacy records' },
  { name: 'MANAGE_PHARMACY', category: 'PHARMACY', description: 'Manage pharmacy' },
  
  // User & Staff Permissions
  { name: 'MANAGE_STAFF', category: 'USER', description: 'Manage staff members' },
  { name: 'VIEW_USERS', category: 'USER', description: 'View users' },
  
  // Finance Permissions
  { name: 'VIEW_FINANCE', category: 'FINANCE', description: 'View financial reports' },
  { name: 'MANAGE_FINANCE', category: 'FINANCE', description: 'Manage financial records' },
  
  // Clinic Permissions
  { name: 'MANAGE_CLINIC', category: 'CLINIC', description: 'Manage clinic settings' },
  { name: 'VIEW_CLINIC', category: 'CLINIC', description: 'View clinic information' },
  
  // Admin Permissions
  { name: 'MANAGE_PERMISSIONS', category: 'ADMIN', description: 'Manage user permissions' },
  { name: 'VIEW_ANALYTICS', category: 'ADMIN', description: 'View analytics and reports' },
];

// Role-Permission Mapping
const ROLE_PERMISSIONS = {
  SUPERADMIN: [
    'VIEW_CUSTOMERS', 'CREATE_CUSTOMERS', 'UPDATE_CUSTOMERS', 'DELETE_CUSTOMERS',
    'VIEW_PETS', 'CREATE_PETS', 'UPDATE_PETS', 'DELETE_PETS',
    'VIEW_APPOINTMENTS', 'CREATE_APPOINTMENTS', 'UPDATE_APPOINTMENTS', 'CANCEL_APPOINTMENTS',
    'VIEW_GROOMING', 'MANAGE_GROOMING',
    'VIEW_PHARMACY', 'MANAGE_PHARMACY',
    'MANAGE_STAFF', 'VIEW_USERS',
    'VIEW_FINANCE', 'MANAGE_FINANCE',
    'MANAGE_CLINIC', 'VIEW_CLINIC',
    'MANAGE_PERMISSIONS', 'VIEW_ANALYTICS',
  ],
  ADMIN: [
    'VIEW_CUSTOMERS', 'CREATE_CUSTOMERS', 'UPDATE_CUSTOMERS', 'DELETE_CUSTOMERS',
    'VIEW_PETS', 'CREATE_PETS', 'UPDATE_PETS', 'DELETE_PETS',
    'VIEW_APPOINTMENTS', 'CREATE_APPOINTMENTS', 'UPDATE_APPOINTMENTS', 'CANCEL_APPOINTMENTS',
    'VIEW_GROOMING', 'MANAGE_GROOMING',
    'VIEW_PHARMACY', 'MANAGE_PHARMACY',
    'MANAGE_STAFF', 'VIEW_USERS',
    'VIEW_FINANCE', 'MANAGE_FINANCE',
    'VIEW_CLINIC',
  ],
  VET: [
    'VIEW_CUSTOMERS',
    'VIEW_PETS',
    'VIEW_APPOINTMENTS', 'CREATE_APPOINTMENTS', 'UPDATE_APPOINTMENTS',
    'VIEW_PHARMACY', 'MANAGE_PHARMACY',
  ],
  GROOMER: [
    'VIEW_CUSTOMERS',
    'VIEW_PETS',
    'VIEW_GROOMING', 'MANAGE_GROOMING',
  ],
  RECEPTIONIST: [
    'VIEW_CUSTOMERS', 'CREATE_CUSTOMERS', 'UPDATE_CUSTOMERS',
    'VIEW_PETS',
    'VIEW_APPOINTMENTS', 'CREATE_APPOINTMENTS',
  ],
  PHARMACIST: [
    'VIEW_CUSTOMERS',
    'VIEW_PETS',
    'VIEW_PHARMACY', 'MANAGE_PHARMACY',
  ],
  STAFF: [
    'VIEW_CUSTOMERS',
    'VIEW_PETS',
  ],
};

// Appointment Status
const APPOINTMENT_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

// Subscription Plans
const SUBSCRIPTION_PLANS = {
  STARTER: 'STARTER',
  PROFESSIONAL: 'PROFESSIONAL',
  ENTERPRISE: 'ENTERPRISE',
};

// Pagination Defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

module.exports = {
  HTTP_STATUS,
  USER_ROLES,
  DEFAULT_PERMISSIONS,
  ROLE_PERMISSIONS,
  APPOINTMENT_STATUS,
  SUBSCRIPTION_PLANS,
  PAGINATION,
};
