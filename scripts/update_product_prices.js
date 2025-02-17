const mongoose = require('mongoose');
const Product = require('../models/product');

// MongoDB connection string
const MONGODB_URI = 'mongodb://localhost:27017/inventory-system';

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Sample prices for different product categories
const categoryPrices = {
    'Diagnostic System': 150000,
    'Patient Monitoring': 50000,
    'Laboratory Equipment': 75000,
    'Imaging Equipment': 250000,
    'Surgical Equipment': 100000,
    'Medical Supplies': 5000
};

// Function to update product prices
async function updateProductPrices() {
    try {
        // Find all products
        const products = await Product.find({});

        // Update each product with a price based on its category
        for (let product of products) {
            // Assign a base price with some randomness
            const basePrice = categoryPrices[product.category];
            const randomVariation = Math.random() * 0.2; // 20% variation
            const unitPrice = basePrice * (1 + (Math.random() > 0.5 ? randomVariation : -randomVariation));

            product.unitPrice = Math.round(unitPrice);
            await product.save();
            console.log(`Updated ${product.name} with price: $${product.unitPrice}`);
        }

        console.log('All products updated successfully');
    } catch (error) {
        console.error('Error updating products:', error);
    } finally {
        mongoose.connection.close();
    }
}

// Run the update
updateProductPrices();
