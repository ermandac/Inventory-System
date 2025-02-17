const mongoose = require('mongoose');
const Product = require('../models/product');
const Item = require('../models/item');

// Load environment variables
require('dotenv').config({ path: '../.env' });

// Seed function
async function seedInventory() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        // Find all products
        const products = await Product.find({});

        // Create inventory entries for each product
        const inventoryEntries = products.flatMap(product => [
            // Create multiple inventory entries for each product
            {
                product: product._id,
                quantity: 10,
                serialNumber: `${product.sku}-001`,
                status: 'In Stock',
                location: 'Warehouse A',
                purchaseDate: new Date(),
                notes: 'Initial stock'
            },
            {
                product: product._id,
                quantity: 5,
                serialNumber: `${product.sku}-002`,
                status: 'In Stock',
                location: 'Warehouse B',
                purchaseDate: new Date(),
                notes: 'Secondary stock'
            }
        ]);

        console.log(`Seeded ${inventoryEntries.length} inventory entries for ${products.length} products`);

        // Disconnect from MongoDB
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error seeding inventory:', error);
        process.exit(1);
    }
}

// Run the seed function
seedInventory();
