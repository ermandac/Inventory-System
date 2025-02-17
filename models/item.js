const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    history: [{
        date: Date,
        type: String,
        description: String
    }],
    serialNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    status: {
        type: String,
        required: true,
        enum: ['inventory', 'reserved', 'delivery', 'demo', 'returned', 'sold'],
        default: 'inventory'
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        validate: {
            validator: async function(v) {
                const Product = mongoose.model('Product');
                const product = await Product.findById(v);
                return product !== null;
            },
            message: props => `Product with ID ${props.value} does not exist!`
        }
    },
    associatedOrder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        default: null
    },
    // For items in 'demo' or 'delivery' status
    destinationInfo: {
        customerName: String,
        address: String,
        contactPerson: String,
        contactNumber: String,
        expectedReturnDate: Date  // for demo units
    },
    maintenanceHistory: [{
        date: Date,
        type: {
            type: String,
            enum: ['preventive', 'corrective', 'inspection']
        },
        description: String,
        performedBy: String,
        nextDueDate: Date,
        attachments: [String],
        cost: Number
    }],
    calibrationHistory: [{
        date: Date,
        notes: String,
        performedBy: String,
        certificate: String,
        nextDueDate: Date,
        results: String
    }],
    warranty: {
        startDate: Date,
        endDate: Date,
        claimHistory: [{
            date: Date,
            description: String,
            status: String,
            resolution: String
        }]
    },
    purchaseInfo: {
        date: {
            type: Date,
            required: true
        },
        cost: Number,
        supplier: String,
        orderReference: String
    },
    notes: String,
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    nextMaintenanceDate: Date,
    nextCalibrationDate: Date,
    maintenanceType: {
        type: String,
        enum: ['preventive', 'corrective', 'calibration']
    }
});

// Static method to calculate total stock for a product
itemSchema.statics.calculateProductStock = async function(productId) {
    // Count items in different statuses for the specific product
    const statusCounts = await this.aggregate([
        // Match items for the specific product
        { $match: { productId: mongoose.Types.ObjectId(productId) } },
        
        // Group by status and count
        { $group: {
            _id: '$status',
            count: { $sum: 1 }
        }}
    ]);

    // Convert aggregate result to an easy-to-use object
    const stockBreakdown = statusCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
    }, {});

    // Return comprehensive stock information
    return {
        // Total items across all statuses
        totalItems: statusCounts.reduce((sum, item) => sum + item.count, 0),
        
        // Available for sale
        availableItems: stockBreakdown.inventory || 0,
        
        // Reserved but not yet sold
        reservedItems: stockBreakdown.reserved || 0,
        
        // Items in delivery or demo
        inDeliveryItems: stockBreakdown.delivery || 0,
        demoItems: stockBreakdown.demo || 0,
        
        // Sold items
        soldItems: stockBreakdown.sold || 0,
        
        // Returned items
        returnedItems: stockBreakdown.returned || 0
    };
};

// Instance method to check if an item is available
itemSchema.methods.isAvailable = function() {
    return this.status === 'inventory';
};

// Instance method to get item's age
itemSchema.methods.getAge = function() {
    if (!this.purchaseInfo || !this.purchaseInfo.date) {
        return null;
    }
    return Math.floor((Date.now() - this.purchaseInfo.date.getTime()) / (1000 * 60 * 60 * 24));
};

// Add a method to populate product details
itemSchema.methods.populateProduct = async function() {
    return this.populate({
        path: 'productId',
        select: 'name sku model manufacturer category unitPrice' // Select only relevant fields
    });
};

// Pre-find hook to automatically populate product for certain queries
itemSchema.pre('find', function() {
    this.populate({
        path: 'productId', 
        select: 'name sku model manufacturer category unitPrice'
    });
});

// Static method to find items by product
itemSchema.statics.findByProduct = async function(productId) {
    return this.find({ productId: productId });
};

// Add a pre-save hook to update lastUpdated
itemSchema.pre('save', function(next) {
    this.lastUpdated = new Date();
    next();
});

// Add index for faster queries
itemSchema.index({ productId: 1, status: 1 });

module.exports = mongoose.model('Item', itemSchema);
