const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    sku: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    model: {
        type: String,
        required: true,
        trim: true
    },
    manufacturer: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Diagnostic System', 'Patient Monitoring', 'Laboratory Equipment', 
               'Imaging Equipment', 'Surgical Equipment', 'Medical Supplies']
    },
    unitPrice: {
        type: Number,
        required: true,
        min: 0,
        validate: {
            validator: Number.isFinite,
            message: 'Unit price must be a valid number'
        }
    },
    specifications: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    },
    certifications: [{
        type: {
            type: String,
            enum: ['CE', 'FDA', 'ISO', 'Other']
        },
        number: String,
        validUntil: Date
    }],
    technicalDetails: {
        powerRequirements: String,
        dimensions: String,
        weight: String,
        operatingConditions: {
            temperature: String,
            humidity: String
        }
    },
    maintenanceSchedule: {
        frequency: {
            type: Number,  // in days
            default: 90
        },
        requirements: [String],
        calibrationNeeded: {
            type: Boolean,
            default: false
        },
        calibrationFrequency: {
            type: Number,  // in days
            default: 180
        }
    },
    warranty: {
        duration: Number,  // in months
        coverage: String,
        supplier: String
    },
    documentation: {
        userManual: String,
        serviceManual: String,
        calibrationProcedure: String
    },
    support: {
        supplier: String,
        contact: String,
        serviceLevel: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual method to get item status counts
productSchema.virtual('availableItems').get(function() {
    return this.getItemStatusCounts().availableItems;
});

productSchema.virtual('reservedItems').get(function() {
    return this.getItemStatusCounts().reservedItems;
});

productSchema.virtual('deliveryItems').get(function() {
    return this.getItemStatusCounts().deliveryItems;
});

productSchema.virtual('demoItems').get(function() {
    return this.getItemStatusCounts().demoItems;
});

productSchema.virtual('returnedItems').get(function() {
    return this.getItemStatusCounts().returnedItems;
});

productSchema.virtual('soldItems').get(function() {
    return this.getItemStatusCounts().soldItems;
});

productSchema.virtual('totalItems').get(function() {
    return this.getItemStatusCounts().totalItems;
});

// Method to get detailed item status counts
productSchema.methods.getItemStatusCounts = async function() {
    try {
        const Item = mongoose.model('Item');
        const statusCounts = await Item.aggregate([
            { $match: { productId: this._id } },
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

        // Return structured stock information
        return {
            availableItems: countMap.inventory || 0,
            reservedItems: countMap.reserved || 0,
            deliveryItems: countMap.delivery || 0,
            demoItems: countMap.demo || 0,
            returnedItems: countMap.returned || 0,
            soldItems: countMap.sold || 0,
            totalItems: statusCounts.reduce((sum, item) => sum + item.count, 0)
        };
    } catch (error) {
        console.error('Error calculating item status counts:', error);
        return {
            availableItems: 0,
            reservedItems: 0,
            deliveryItems: 0,
            demoItems: 0,
            returnedItems: 0,
            soldItems: 0,
            totalItems: 0
        };
    }
};

module.exports = mongoose.model('Product', productSchema);
