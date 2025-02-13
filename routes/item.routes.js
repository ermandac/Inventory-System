const express = require('express');
const router = express.Router();
const Item = require('../models/item');

// Get inventory report
router.get('/report', async (req, res) => {
    try {
        const today = new Date();
        const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));

        // Get all items with their products
        const items = await Item.find()
            .populate('productId', 'name model manufacturer')
            .lean()
            .exec();

        // Calculate total counts by status
        const totalCounts = items.reduce((acc, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
        }, {});

        // Group items by product and calculate counts
        const productCounts = await Item.aggregate([
            {
                $group: {
                    _id: '$productId',
                    totalCount: { $sum: 1 },
                    statuses: {
                        $push: '$status'
                    }
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            {
                $unwind: '$product'
            }
        ]);

        // Calculate status counts for each product
        const formattedProductCounts = productCounts.map(pc => ({
            product: {
                _id: pc.product._id,
                name: pc.product.name,
                model: pc.product.model,
                manufacturer: pc.product.manufacturer
            },
            totalCount: pc.totalCount,
            statuses: Object.entries(pc.statuses.reduce((acc, status) => {
                acc[status] = (acc[status] || 0) + 1;
                return acc;
            }, {})).map(([status, count]) => ({ status, count }))
        }));

        // Count alerts
        const maintenanceDue = await Item.countDocuments({
            'maintenanceSchedule.nextDueDate': { $lte: today }
        });

        const warrantyExpiring = await Item.countDocuments({
            'warranty.endDate': {
                $gte: today,
                $lte: thirtyDaysFromNow
            }
        });

        res.json({
            totalCounts,
            productCounts: formattedProductCounts,
            alerts: {
                maintenanceDue,
                warrantyExpiring
            },
            generatedAt: new Date()
        });
    } catch (error) {
        console.error('Error generating inventory report:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get items due for maintenance
router.get('/maintenance-due', async (req, res) => {
    try {
        const today = new Date();
        const items = await Item.find({
            'maintenanceSchedule.nextDueDate': { $lte: today }
        })
        .populate('productId', 'name model manufacturer')
        .lean()
        .exec();

        const transformedItems = items.map(item => ({
            ...item,
            product: item.productId ? {
                _id: item.productId._id,
                name: item.productId.name || '',
                model: item.productId.model || '',
                manufacturer: item.productId.manufacturer || ''
            } : {
                _id: '',
                name: 'Unknown Product',
                model: '',
                manufacturer: ''
            }
        }));

        res.json(transformedItems);
    } catch (error) {
        console.error('Error in GET /items/maintenance-due:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get items with expiring warranty
router.get('/warranty-expiring', async (req, res) => {
    try {
        const today = new Date();
        const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));

        const items = await Item.find({
            'warranty.endDate': {
                $gte: today,
                $lte: thirtyDaysFromNow
            }
        })
        .populate('productId', 'name model manufacturer')
        .lean()
        .exec();

        const transformedItems = items.map(item => ({
            ...item,
            product: item.productId ? {
                _id: item.productId._id,
                name: item.productId.name || '',
                model: item.productId.model || '',
                manufacturer: item.productId.manufacturer || ''
            } : {
                _id: '',
                name: 'Unknown Product',
                model: '',
                manufacturer: ''
            }
        }));

        res.json(transformedItems);
    } catch (error) {
        console.error('Error in GET /items/warranty-expiring:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get all items
router.get('/', async (req, res) => {
    try {
        const items = await Item.find()
            .populate('productId', 'name model manufacturer') // Only select needed fields
            .lean() // Convert to plain JavaScript objects
            .exec();

        console.log('Items from DB:', items);

        // Transform the items to match the frontend interface
        const transformedItems = items.map(item => ({
            ...item,
            product: item.productId ? {
                _id: item.productId._id,
                name: item.productId.name || '',
                model: item.productId.model || '',
                manufacturer: item.productId.manufacturer || ''
            } : {
                _id: '',
                name: 'Unknown Product',
                model: '',
                manufacturer: ''
            }
        }));

        console.log('Transformed items:', transformedItems);
        res.json(transformedItems);
    } catch (error) {
        console.error('Error in GET /items:', error);
        res.status(500).json({ message: error.message });
    }
});

// Create a new item
router.post('/', async (req, res) => {
    console.log('Received item creation request:', JSON.stringify(req.body, null, 2));
    console.log('Purchase info:', req.body.purchaseInfo);
    console.log('Purchase date type:', Object.prototype.toString.call(req.body.purchaseInfo?.date));
    // Parse the date string back into a Date object
    const purchaseDate = new Date(req.body.purchaseInfo.date);
    console.log('Parsed purchase date:', purchaseDate);

    const item = new Item({
        serialNumber: req.body.serialNumber,
        productId: req.body.productId,
        status: req.body.status || 'inventory',
        purchaseInfo: {
            date: purchaseDate,  // Use the parsed Date object
            cost: req.body.purchaseInfo.cost,
            supplier: req.body.purchaseInfo.supplier
        },
        warranty: req.body.warranty,
        maintenanceSchedule: {
            frequency: req.body.maintenanceFrequency || 180, // Default 6 months
            nextDueDate: new Date(Date.now() + (req.body.maintenanceFrequency || 180) * 24 * 60 * 60 * 1000)
        },
        calibrationSchedule: req.body.calibrationSchedule
    });
    
    console.log('Created item with purchase date:', item.purchaseInfo.date);

    try {
        console.log('Attempting to save item with schema:', item);
        const newItem = await item.save();
        res.status(201).json(newItem);
    } catch (error) {
        console.error('Error saving item:', error);
        console.error('Validation errors:', error.errors);
        res.status(400).json({ message: error.message, errors: error.errors });
    }
});

// Get item by ID
router.get('/:id', async (req, res) => {
    try {
        const item = await Item.findById(req.params.id).populate('productId');
        if (item) {
            res.json(item);
        } else {
            res.status(404).json({ message: 'Item not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update item status
router.patch('/:id/status', async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (item) {
            item.status = req.body.status;
            if (req.body.notes) {
                item.statusHistory.push({
                    status: req.body.status,
                    date: Date.now(),
                    notes: req.body.notes,
                    updatedBy: req.user._id
                });
            }
            item.lastUpdated = Date.now();
            const updatedItem = await item.save();
            res.json(updatedItem);
        } else {
            res.status(404).json({ message: 'Item not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update item
router.put('/:id', async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (item) {
            Object.assign(item, req.body);
            item.lastUpdated = Date.now();
            const updatedItem = await item.save();
            res.json(updatedItem);
        } else {
            res.status(404).json({ message: 'Item not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get maintenance due items
router.get('/maintenance-due', async (req, res) => {
    try {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const items = await Item.find({
            $or: [
                { 'maintenanceSchedule.nextDueDate': { $lte: thirtyDaysFromNow } },
                { 'calibrationSchedule.nextDueDate': { $lte: thirtyDaysFromNow } }
            ]
        }).populate('productId');

        res.json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get warranty expiring items
router.get('/warranty-expiring', async (req, res) => {
    try {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const items = await Item.find({
            'warranty.endDate': { 
                $exists: true,
                $ne: null,
                $lte: thirtyDaysFromNow,
                $gt: new Date()
            }
        }).populate('productId');

        res.json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add maintenance record
router.post('/:id/maintenance', async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (item) {
            // Add to maintenance history
            item.maintenanceHistory.push({
                date: req.body.date || Date.now(),
                type: req.body.type,
                notes: req.body.notes,
                performedBy: req.body.performedBy || req.user._id
            });

            // Update next maintenance due date
            const frequency = item.maintenanceSchedule?.frequency || 180; // Default 6 months
            item.maintenanceSchedule = {
                frequency,
                nextDueDate: new Date(Date.now() + frequency * 24 * 60 * 60 * 1000)
            };

            item.lastUpdated = Date.now();
            const updatedItem = await item.save();
            res.json(updatedItem);
        } else {
            res.status(404).json({ message: 'Item not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Add calibration record
router.post('/:id/calibration', async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (item) {
            // Add to calibration history
            item.calibrationHistory.push({
                date: req.body.date || Date.now(),
                notes: req.body.notes,
                performedBy: req.body.performedBy || req.user._id,
                nextDueDate: req.body.nextDueDate
            });

            // Update calibration schedule
            item.calibrationSchedule = {
                nextDueDate: req.body.nextDueDate
            };

            item.lastUpdated = Date.now();
            const updatedItem = await item.save();
            res.json(updatedItem);
        } else {
            res.status(404).json({ message: 'Item not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get inventory report
router.get('/report', async (req, res) => {
    try {
        // Get total counts
        const totalCounts = await Item.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get counts by product
        const productCounts = await Item.aggregate([
            {
                $group: {
                    _id: {
                        product: '$productId',
                        status: '$status'
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: '$_id.product',
                    statuses: {
                        $push: {
                            status: '$_id.status',
                            count: '$count'
                        }
                    },
                    totalCount: { $sum: '$count' }
                }
            }
        ]);

        // Get maintenance and warranty stats
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const maintenanceDueCount = await Item.countDocuments({
            $or: [
                { 'maintenanceSchedule.nextDueDate': { $lte: thirtyDaysFromNow } },
                { 'calibrationSchedule.nextDueDate': { $lte: thirtyDaysFromNow } }
            ]
        });

        const warrantyExpiringCount = await Item.countDocuments({
            'warranty.endDate': { 
                $exists: true,
                $ne: null,
                $lte: thirtyDaysFromNow,
                $gt: new Date()
            }
        });

        // Populate product details
        const populatedProductCounts = await Item.populate(productCounts, {
            path: '_id',
            model: 'Product',
            select: 'name model manufacturer'
        });

        res.json({
            totalCounts: totalCounts.reduce((acc, curr) => {
                acc[curr._id] = curr.count;
                return acc;
            }, {}),
            productCounts: populatedProductCounts.map(item => ({
                product: item._id,
                statuses: item.statuses,
                totalCount: item.totalCount
            })),
            alerts: {
                maintenanceDue: maintenanceDueCount,
                warrantyExpiring: warrantyExpiringCount
            },
            generatedAt: new Date()
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete item
router.delete('/:id', async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (item) {
            await item.remove();
            res.json({ message: 'Item deleted' });
        } else {
            res.status(404).json({ message: 'Item not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
