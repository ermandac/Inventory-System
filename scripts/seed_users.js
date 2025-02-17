const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const Role = require('../models/role');
require('dotenv').config();

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory-system';

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Function to hash password
async function hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

// Seed users function
async function seedUsers() {
    try {
        // Find roles
        const adminRole = await Role.findOne({ name: 'Admin' });
        const inventoryStaffRole = await Role.findOne({ name: 'Inventory Staff' });
        const customerRole = await Role.findOne({ name: 'Customer' });

        if (!adminRole || !inventoryStaffRole || !customerRole) {
            throw new Error('Roles not found. Please seed roles first.');
        }

        // Clear existing users
        await User.deleteMany({});

        // Create users
        const users = [
            {
                username: 'admin_user',
                email: 'admin@example.com',
                firstName: 'System',
                lastName: 'Administrator',
                role: 'admin',
                password: await hashPassword('AdminPass123!')
            },
            {
                username: 'inventory_staff',
                email: 'inventory@example.com',
                firstName: 'Inventory',
                lastName: 'Manager',
                role: 'inventory_staff',
                password: await hashPassword('InventoryPass123!')
            },
            {
                username: 'customer1',
                email: 'customer1@example.com',
                firstName: 'John',
                lastName: 'Doe',
                role: 'customer',
                password: await hashPassword('CustomerPass123!')
            },
            {
                username: 'customer2',
                email: 'customer2@example.com',
                firstName: 'Jane',
                lastName: 'Smith',
                role: 'customer',
                password: await hashPassword('CustomerPass456!')
            }
        ];

        // Insert users
        const insertedUsers = await User.insertMany(users);
        console.log('Users seeded successfully:');
        insertedUsers.forEach(user => {
            console.log(`- ${user.username} (${user.email}) - Role: ${user.role}`);
        });
    } catch (error) {
        console.error('Error seeding users:', error);
    } finally {
        mongoose.connection.close();
    }
}

// Run the seeding
seedUsers();
