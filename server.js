const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/inventory-system', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((error) => {
    console.error('MongoDB connection error:', error);
});

// Import routes
const productRoutes = require('./routes/product.routes');
const itemRoutes = require('./routes/item.routes');

// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Inventory Management System API' });
});

// Use routes
app.use('/api/products', productRoutes);
app.use('/api/items', itemRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
