const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import models
const Order = require('../models/order');
const Product = require('../models/product');
const User = require('../models/user');

// MongoDB connection function
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

// Generate order number
function generateOrderNumber() {
    const prefix = 'ORD';
    const timestamp = new Date().getTime();
    const randomComponent = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}-${timestamp}-${randomComponent}`;
}

// Seed orders
async function seedOrders() {
    try {
        // Clear existing orders
        await Order.deleteMany({});
        console.log('Existing orders cleared');

        // Fetch all users and products
        const users = await User.find({});
        const products = await Product.find({});

        // Create orders for each user
        const orders = [];
        for (const user of users) {
            // Skip if no products available
            if (products.length === 0) break;

            // Determine number of orders to create (1-3 per user)
            const numOrders = Math.floor(Math.random() * 3) + 1;

            for (let i = 0; i < numOrders; i++) {
                // Randomly select 1-3 products for each order
                const numProducts = Math.floor(Math.random() * 3) + 1;
                const selectedProducts = [];

                for (let j = 0; j < numProducts; j++) {
                    const randomProduct = products[Math.floor(Math.random() * products.length)];
                    selectedProducts.push({
                        product: randomProduct._id,
                        quantity: Math.floor(Math.random() * 5) + 1,
                        unitPrice: randomProduct.price || 100000, // Fallback price if not set
                        itemStatus: 'inventory'
                    });
                }

                // Create order
                const order = new Order({
                    orderNumber: generateOrderNumber(),
                    customer: user._id,
                    customerVisibility: user._id,
                    items: selectedProducts,
                    status: ['pending', 'processing', 'completed'][Math.floor(Math.random() * 3)],
                    orderDate: new Date(),
                    visibleToRoles: user.role === 'admin' ? 
                        ['admin', 'customer', 'inventory_staff', 'logistics_manager'] : 
                        ['customer']
                });

                await order.save();
                orders.push(order);
            }
        }

        console.log(`Seeded ${orders.length} orders successfully`);
    } catch (error) {
        console.error('Error seeding orders:', error);
    } finally {
        // Close the connection
        await mongoose.connection.close();
    }
}

// Connect to DB and seed
connectDB()
    .then(seedOrders)
    .catch(console.error);
