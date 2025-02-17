const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../models/product');
const Order = require('../models/order');
const Item = require('../models/item');

// Get all products with stock information
router.get('/', async (req, res) => {
    try {
        // First, fetch products
        const products = await Product.find();
        
        console.log(`Fetched ${products.length} products`);

        // Calculate stock for each product using Item model
        const productsWithStock = await Promise.all(
            products.map(async product => {
                try {
                    // Ensure we're working with a plain object
                    const productObj = product.toObject ? product.toObject() : product;
                    
                    console.log(`Processing product: ${productObj._id}`);

                    // Safely convert to ObjectId
                    let productId;
                    try {
                        // Use new keyword to instantiate ObjectId
                        productId = new mongoose.Types.ObjectId(productObj._id.toString());
                    } catch (idError) {
                        console.error(`Invalid ObjectId for product ${productObj._id}:`, idError);
                        return {
                            ...productObj,
                            availableItems: 0,
                            reservedItems: 0,
                            deliveryItems: 0,
                            demoItems: 0,
                            returnedItems: 0,
                            soldItems: 0,
                            totalItems: 0,
                            _id: productObj._id.toString()
                        };
                    }

                    // Directly use mongoose aggregation instead of method
                    const statusCounts = await mongoose.model('Item').aggregate([
                        { $match: { productId: productId } },
                        { 
                            $group: {
                                _id: '$status',
                                count: { $sum: 1 }
                            }
                        }
                    ]);

                    console.log(`Status counts for product ${productObj._id}:`, statusCounts);

                    // Create a map to easily access counts
                    const countMap = statusCounts.reduce((acc, item) => {
                        acc[item._id] = item.count;
                        return acc;
                    }, {});

                    // Merge stock information with product, ensuring no duplicate _id
                    return {
                        ...productObj,
                        availableItems: countMap.inventory || 0,
                        reservedItems: countMap.reserved || 0,
                        deliveryItems: countMap.delivery || 0,
                        demoItems: countMap.demo || 0,
                        returnedItems: countMap.returned || 0,
                        soldItems: countMap.sold || 0,
                        totalItems: statusCounts.reduce((sum, item) => sum + item.count, 0),
                        _id: productObj._id.toString() // Convert ObjectId to string
                    };
                } catch (stockError) {
                    console.error(`Detailed error calculating stock for product ${product._id}:`, {
                        message: stockError.message,
                        stack: stockError.stack,
                        name: stockError.name
                    });

                    // Return product with zero stock if calculation fails
                    return {
                        ...product.toObject(),
                        availableItems: 0,
                        reservedItems: 0,
                        deliveryItems: 0,
                        demoItems: 0,
                        returnedItems: 0,
                        soldItems: 0,
                        totalItems: 0,
                        _id: product._id.toString()
                    };
                }
            })
        );

        res.json(productsWithStock);
    } catch (error) {
        console.error('Comprehensive product retrieval error:', {
            message: error.message,
            name: error.name,
            stack: error.stack,
            // Include any additional error details
            errorObject: JSON.stringify(error, Object.getOwnPropertyNames(error))
        });

        res.status(500).json({ 
            message: 'Error fetching products', 
            error: process.env.NODE_ENV === 'development' ? {
                message: error.message,
                name: error.name,
                stack: error.stack
            } : 'Internal server error'
        });
    }
});

// Create a product
router.post('/', async (req, res) => {
    const product = new Product({
        name: req.body.name,
        model: req.body.model,
        manufacturer: req.body.manufacturer,
        description: req.body.description,
        sku: req.body.sku,
        category: req.body.category,
        specifications: req.body.specifications,
        certifications: req.body.certifications,
        technicalDetails: req.body.technicalDetails,
        maintenanceSchedule: req.body.maintenanceSchedule,
        warranty: req.body.warranty,
        documentation: req.body.documentation,
        support: req.body.support
    });

    try {
        const newProduct = await product.save();
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get product by ID
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update product
router.put('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            Object.assign(product, req.body);
            product.updatedAt = Date.now();
            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete product
router.delete('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            await product.remove();
            res.json({ message: 'Product deleted' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get product-referenced quantity route
router.get('/product-referenced-quantity/:id', async (req, res) => {
    const productId = req.params.id;

    try {
        // Find the product
        const product = await Product.findById(productId);
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Calculate stock using Item model
        const stockInfo = await Item.calculateProductStock(productId);

        // Aggregate across all orders to calculate total referenced quantity
        const referencedQuantity = await Order.aggregate([
            // Match orders that are not cancelled
            { $match: { 
                status: { $ne: 'cancelled' } 
            }},
            // Unwind the items array
            { $unwind: '$items' },
            // Match only the specific product
            { $match: { 
                'items.product': new mongoose.Types.ObjectId(productId) 
            }},
            // Group and sum the quantities
            { $group: {
                _id: null,
                totalReferenced: { $sum: '$items.quantity' }
            }}
        ]);

        // Extract total referenced quantity
        const totalReferencedQuantity = referencedQuantity.length > 0 
            ? referencedQuantity[0].totalReferenced 
            : 0;

        // Update route to include sold items in stock calculation
        const soldItems = await Order.aggregate([
            // Match orders that are completed
            { $match: { 
                status: 'completed' 
            }},
            // Unwind the items array
            { $unwind: '$items' },
            // Match only the specific product
            { $match: { 
                'items.product': new mongoose.Types.ObjectId(productId) 
            }},
            // Group and sum the quantities
            { $group: {
                _id: null,
                totalSold: { $sum: '$items.quantity' }
            }}
        ]);

        // Calculate total sold items
        const totalSoldItems = soldItems.length > 0 
            ? soldItems[0].totalSold 
            : 0;

        // Calculate available stock
        const availableStock = Math.max(0, stockInfo.availableItems - totalReferencedQuantity - totalSoldItems);

        res.json({
            productId: productId,
            ...stockInfo,
            totalReferenced: totalReferencedQuantity,
            totalSold: totalSoldItems,
            availableStock: availableStock
        });
    } catch (error) {
        console.error('Error calculating product stock', error);
        res.status(500).json({ 
            message: 'Error calculating product stock', 
            error: process.env.NODE_ENV === 'development' ? error.message : undefined 
        });
    }
});

// Get product with detailed item counts
router.get('/:id/item-counts', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Get detailed item status counts
        const itemCounts = await product.getItemStatusCounts();

        res.json({
            product: product.toObject(),
            itemCounts
        });
    } catch (error) {
        console.error('Error fetching product item counts', error);
        res.status(500).json({ 
            message: 'Error fetching product item counts',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get all items for a specific product
router.get('/:id/items', async (req, res) => {
    try {
        // Verify product exists first
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Find items for this product
        const items = await Item.findByProduct(req.params.id);

        res.json({
            product: product.toObject(),
            items: items.map(item => item.toObject())
        });
    } catch (error) {
        console.error('Error fetching product items', error);
        res.status(500).json({ 
            message: 'Error fetching product items',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get stock for a specific product
router.get('/:id/stock', async (req, res) => {
    try {
        // Find the product
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Safely convert to ObjectId
        let productId;
        try {
            productId = new mongoose.Types.ObjectId(product._id.toString());
        } catch (idError) {
            console.error(`Invalid ObjectId for product ${product._id}:`, idError);
            return res.status(400).json({ 
                message: 'Invalid product ID', 
                error: idError.message 
            });
        }

        // Use aggregation to get stock counts
        const statusCounts = await mongoose.model('Item').aggregate([
            { $match: { productId: productId } },
            { 
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Create a map to easily access counts
        const countMap = statusCounts.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {});

        // Prepare stock response
        const stockResponse = {
            productId: product._id.toString(),
            productName: product.name,
            availableItems: countMap.inventory || 0,
            reservedItems: countMap.reserved || 0,
            deliveryItems: countMap.delivery || 0,
            demoItems: countMap.demo || 0,
            returnedItems: countMap.returned || 0,
            soldItems: countMap.sold || 0,
            totalItems: statusCounts.reduce((sum, item) => sum + item.count, 0)
        };

        res.json(stockResponse);
    } catch (error) {
        console.error(`Error retrieving stock for product ${req.params.id}:`, {
            message: error.message,
            name: error.name,
            stack: error.stack
        });

        res.status(500).json({ 
            message: 'Error retrieving product stock', 
            error: process.env.NODE_ENV === 'development' ? {
                message: error.message,
                name: error.name,
                stack: error.stack
            } : 'Internal server error'
        });
    }
});

module.exports = router;
