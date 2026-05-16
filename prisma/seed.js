const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { DEFAULT_PERMISSIONS, ROLE_PERMISSIONS } = require('../src/utils/constants');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...\n');

    try {
        // ========================================================================
        // 1. Create Permissions
        // ========================================================================
        console.log('📋 Creating permissions...');
        const permissions = await prisma.permission.createMany({
            data: DEFAULT_PERMISSIONS,
            skipDuplicates: true,
        });
        console.log(`✅ ${permissions.count} permissions created\n`);

        // ========================================================================
        // 2. Create SUPERADMIN User (No clinic assigned)
        // ========================================================================
        console.log('👤 Creating SUPERADMIN user...');
        const hashedPassword = await bcrypt.hash('Admin@12345', 10);
        const superAdmin = await prisma.user.upsert({
            where: { email: 'superadmin@petvms.com' },
            update: {},
            create: {
                username: 'superadmin',
                email: 'superadmin@petvms.com',
                password: hashedPassword,
                firstName: 'Super',
                lastName: 'Admin',
                phoneNumber: '+1-800-000-0000',
                role: 'SUPERADMIN',
                isActive: true,
            },
        });
        console.log(`✅ SUPERADMIN created: ${superAdmin.email}\n`);

        // ========================================================================
        // 3. Assign permissions to SUPERADMIN
        // ========================================================================
        console.log('🔐 Assigning permissions to SUPERADMIN...');
        const superAdminPerms = await prisma.permission.findMany({
            where: { name: { in: ROLE_PERMISSIONS.SUPERADMIN } },
        });

        await prisma.userPermission.createMany({
            data: superAdminPerms.map((perm) => ({
                userId: superAdmin.id,
                permissionId: perm.id,
            })),
            skipDuplicates: true,
        });
        console.log(`✅ ${superAdminPerms.length} permissions assigned to SUPERADMIN\n`);

        // ========================================================================
        // 4. Create Sample Clinics
        // ========================================================================
        console.log('🏥 Creating sample clinics...');
        const clinic1 = await prisma.clinic.upsert({
            where: { clinicCode: 'CLI001' },
            update: {},
            create: {
                clinicName: 'Downtown Veterinary Clinic',
                clinicCode: 'CLI001',
                email: 'downtown@petvms.com',
                phoneNumber: '+1-555-001-0001',
                address: '123 Main Street',
                city: 'San Francisco',
                state: 'CA',
                zipCode: '94102',
                country: 'USA',
                licenseNumber: 'CA-VET-001',
                subscriptionPlan: 'PROFESSIONAL',
                maxUsers: 20,
                isActive: true,
            },
        });

        const clinic2 = await prisma.clinic.upsert({
            where: { clinicCode: 'CLI002' },
            update: {},
            create: {
                clinicName: 'Uptown Pet Care Center',
                clinicCode: 'CLI002',
                email: 'uptown@petvms.com',
                phoneNumber: '+1-555-002-0002',
                address: '456 Oak Avenue',
                city: 'Los Angeles',
                state: 'CA',
                zipCode: '90001',
                country: 'USA',
                licenseNumber: 'CA-VET-002',
                subscriptionPlan: 'ENTERPRISE',
                maxUsers: 50,
                isActive: true,
            },
        });

        console.log(`✅ 2 clinics created\n`);

        // ========================================================================
        // 5. Create Admin Users for Each Clinic
        // ========================================================================
        console.log('👤 Creating clinic admin users...');
        const admin1 = await prisma.user.upsert({
            where: { email: 'admin@clinic1.com' },
            update: {},
            create: {
                clinicId: clinic1.id,
                username: 'admin_clinic1',
                email: 'admin@clinic1.com',
                password: hashedPassword,
                firstName: 'John',
                lastName: 'Manager',
                phoneNumber: '+1-555-001-0010',
                role: 'ADMIN',
                isActive: true,
            },
        });

        const admin2 = await prisma.user.upsert({
            where: { email: 'admin@clinic2.com' },
            update: {},
            create: {
                clinicId: clinic2.id,
                username: 'admin_clinic2',
                email: 'admin@clinic2.com',
                password: hashedPassword,
                firstName: 'Jane',
                lastName: 'Director',
                phoneNumber: '+1-555-002-0010',
                role: 'ADMIN',
                isActive: true,
            },
        });

        console.log(`✅ 2 admin users created\n`);

        // ========================================================================
        // 6. Assign permissions to admin users
        // ========================================================================
        console.log('🔐 Assigning permissions to admin users...');
        const adminPerms = await prisma.permission.findMany({
            where: { name: { in: ROLE_PERMISSIONS.ADMIN } },
        });

        await prisma.userPermission.createMany({
            data: [
                ...adminPerms.map((perm) => ({
                    userId: admin1.id,
                    permissionId: perm.id,
                })),
                ...adminPerms.map((perm) => ({
                    userId: admin2.id,
                    permissionId: perm.id,
                })),
            ],
            skipDuplicates: true,
        });
        console.log(`✅ Permissions assigned\n`);

        // ========================================================================
        // 7. Create Staff Users
        // ========================================================================
        console.log('👥 Creating staff users...');
        const staffUsers = [
            {
                clinicId: clinic1.id,
                username: 'dr_smith',
                email: 'dr.smith@clinic1.com',
                firstName: 'Dr. Michael',
                lastName: 'Smith',
                role: 'VET',
            },
            {
                clinicId: clinic1.id,
                username: 'groomer_sarah',
                email: 'sarah@clinic1.com',
                firstName: 'Sarah',
                lastName: 'Johnson',
                role: 'GROOMER',
            },
            {
                clinicId: clinic1.id,
                username: 'receptionist_emma',
                email: 'emma@clinic1.com',
                firstName: 'Emma',
                lastName: 'Wilson',
                role: 'RECEPTIONIST',
            },
            {
                clinicId: clinic1.id,
                username: 'pharmacist_david',
                email: 'david@clinic1.com',
                firstName: 'David',
                lastName: 'Brown',
                role: 'PHARMACIST',
            },
            {
                clinicId: clinic2.id,
                username: 'dr_jones',
                email: 'dr.jones@clinic2.com',
                firstName: 'Dr. Robert',
                lastName: 'Jones',
                role: 'VET',
            },
            {
                clinicId: clinic2.id,
                username: 'groomer_lisa',
                email: 'lisa@clinic2.com',
                firstName: 'Lisa',
                lastName: 'Martinez',
                role: 'GROOMER',
            },
        ];

        for (const staffData of staffUsers) {
            await prisma.user.upsert({
                where: { email: staffData.email },
                update: {},
                create: {
                    ...staffData,
                    password: hashedPassword,
                    phoneNumber: '+1-555-000-0000',
                    isActive: true,
                },
            });
        }
        console.log(`✅ ${staffUsers.length} staff users created\n`);

        // ========================================================================
        // 8. Assign permissions to staff
        // ========================================================================
        console.log('🔐 Assigning permissions to staff...');
        const staffPerms = await prisma.permission.findMany({
            where: { name: { in: ROLE_PERMISSIONS.VET } }, // Using VET permissions as template
        });

        const allStaff = await prisma.user.findMany({
            where: { role: { in: ['VET', 'GROOMER', 'RECEPTIONIST', 'PHARMACIST'] } },
        });

        for (const staff of allStaff) {
            const perms = ROLE_PERMISSIONS[staff.role] || [];
            const permRecords = await prisma.permission.findMany({
                where: { name: { in: perms } },
            });

            await prisma.userPermission.createMany({
                data: permRecords.map((perm) => ({
                    userId: staff.id,
                    permissionId: perm.id,
                })),
                skipDuplicates: true,
            });
        }
        console.log(`✅ Staff permissions assigned\n`);

        // ========================================================================
        // 9. Create Sample Customers
        // ========================================================================
        console.log('👨‍👩‍👧 Creating sample customers...');
        const customers = [
            {
                clinicId: clinic1.id,
                customerId: 'CUS-1001',
                firstName: 'Michael',
                lastName: 'Anderson',
                email: 'michael.anderson@email.com',
                phoneNumber: '+1-555-100-0001',
                address: '789 Pet Lane',
                city: 'San Francisco',
                state: 'CA',
                zipCode: '94102',
            },
            {
                clinicId: clinic1.id,
                customerId: 'CUS-1002',
                firstName: 'Sarah',
                lastName: 'Thompson',
                email: 'sarah.thompson@email.com',
                phoneNumber: '+1-555-100-0002',
                address: '321 Doggo Drive',
                city: 'San Francisco',
                state: 'CA',
                zipCode: '94103',
            },
            {
                clinicId: clinic2.id,
                customerId: 'CUS-2001',
                firstName: 'James',
                lastName: 'Taylor',
                email: 'james.taylor@email.com',
                phoneNumber: '+1-555-200-0001',
                address: '654 Whisker Way',
                city: 'Los Angeles',
                state: 'CA',
                zipCode: '90001',
            },
        ];

        for (const customerData of customers) {
            await prisma.customer.upsert({
                where: { customerId: customerData.customerId },
                update: {},
                create: customerData,
            });
        }
        console.log(`✅ ${customers.length} customers created/updated\n`);

        // ========================================================================
        // 10. Create Sample Pets
        // ========================================================================
        console.log('🐕 Creating sample pets...');
        const allCustomers = await prisma.customer.findMany();

        const pets = [
            {
                petId: 'PET-1001',
                customerId: allCustomers[0].id,
                clinicId: clinic1.id,
                name: 'Buddy',
                species: 'Dog',
                breed: 'Golden Retriever',
                age: 36,
                gender: 'Male',
                weight: 32.5,
                colour: 'Golden',
                medicalNotes: 'Regular checkups recommended',
            },
            {
                petId: 'PET-1002',
                customerId: allCustomers[0].id,
                clinicId: clinic1.id,
                name: 'Whiskers',
                species: 'Cat',
                breed: 'Persian',
                age: 24,
                gender: 'Female',
                weight: 4.5,
                colour: 'White',
                medicalNotes: 'Hypoallergenic diet recommended',
            },
            {
                petId: 'PET-1003',
                customerId: allCustomers[1].id,
                clinicId: clinic1.id,
                name: 'Max',
                species: 'Dog',
                breed: 'German Shepherd',
                age: 48,
                gender: 'Male',
                weight: 35.0,
                colour: 'Brown',
                medicalNotes: 'Hip dysplasia monitoring needed',
            },
            {
                petId: 'PET-2001',
                customerId: allCustomers[2].id,
                clinicId: clinic2.id,
                name: 'Luna',
                species: 'Cat',
                breed: 'Siamese',
                age: 18,
                gender: 'Female',
                weight: 3.8,
                colour: 'Cream',
                medicalNotes: 'None',
            },
        ];

        for (const petData of pets) {
            await prisma.pet.upsert({
                where: { petId: petData.petId },
                update: {},
                create: petData,
            });
        }
        console.log(`✅ ${pets.length} pets created/updated\n`);

        // ========================================================================
        // 11. Create Sample Appointments
        // ========================================================================
        console.log('📅 Creating sample appointments...');
        const allPets = await prisma.pet.findMany();
        const allVets = await prisma.user.findMany({ where: { role: 'VET' } });

        const appointments = [
            {
                clinicId: clinic1.id,
                petId: allPets[0].id,
                customerId: allCustomers[0].id,
                vetId: allVets[0].id,
                appointmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                reason: 'Annual checkup',
                status: 'CONFIRMED',
                notes: 'Regular health checkup',
            },
            {
                clinicId: clinic1.id,
                petId: allPets[1].id,
                customerId: allCustomers[0].id,
                vetId: allVets[0].id,
                appointmentDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
                reason: 'Vaccination',
                status: 'PENDING',
                notes: 'Booster shot needed',
            },
        ];

        for (const appointmentData of appointments) {
            await prisma.appointment.create({
                data: appointmentData,
            });
        }
        console.log(`✅ ${appointments.length} appointments created\n`);

        // ========================================================================
        // 12. Create Sample Grooming Records
        // ========================================================================
        console.log('✂️ Creating sample grooming records...');

        const allGroomers = await prisma.user.findMany({
            where: { role: 'GROOMER' },
        });

        const groomingRecords = [
            {
                clinicId: clinic1.id,
                petId: allPets[0].id, // Buddy
                groomerId: allGroomers[0].id,
                services: JSON.stringify([
                    "Bath",
                    "Hair Trimming",
                    "Nail Clipping",
                ]),
                notes: 'Pet was calm and cooperative during grooming.',
                cost: 75.0,
                groomingDate: new Date(),
            },
            {
                clinicId: clinic1.id,
                petId: allPets[1].id, // Whiskers
                groomerId: allGroomers[0].id,
                services: JSON.stringify([
                    "Fur Brushing",
                    "Ear Cleaning",
                ]),
                notes: 'Sensitive skin noticed near neck area.',
                cost: 45.0,
                groomingDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            },
            {
                clinicId: clinic2.id,
                petId: allPets[3].id, // Luna
                groomerId: allGroomers[1].id,
                services: JSON.stringify([
                    "Full Grooming",
                    "Teeth Cleaning",
                    "Nail Trimming",
                ]),
                notes: 'Recommended monthly grooming schedule.',
                cost: 95.0,
                groomingDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            },
        ];

        for (const groomingData of groomingRecords) {
            await prisma.groomingRecord.create({
                data: groomingData,
            });
        }

        console.log(`✅ ${groomingRecords.length} grooming records created\n`);

        // ========================================================================
        // Success Message
        // ========================================================================
        console.log('═══════════════════════════════════════════════════════');
        console.log('✨ Database seed completed successfully!');
        console.log('═══════════════════════════════════════════════════════\n');
        console.log('🔐 Default Login Credentials:');
        console.log('   Email: superadmin@petvms.com');
        console.log('   Password: Admin@12345\n');
        console.log('📊 Seeded Data:');
        console.log(`   ✅ Permissions: ${DEFAULT_PERMISSIONS.length}`);
        console.log(`   ✅ SUPERADMIN: 1`);
        console.log(`   ✅ Clinics: 2`);
        console.log(`   ✅ Admin Users: 2`);
        console.log(`   ✅ Staff Users: ${staffUsers.length}`);
        console.log(`   ✅ Customers: ${customers.length}`);
        console.log(`   ✅ Pets: ${pets.length}`);
        console.log(`   ✅ Appointments: ${appointments.length}`);
        console.log(`   ✅ Grooming Records: ${groomingRecords.length}\n`);
    } catch (error) {
        console.error('❌ Error during seed:', error);
        throw error;
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });

// ============================================================================
// Run the seed function