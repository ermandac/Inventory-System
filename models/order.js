const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    customerVisibility: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'ready_for_delivery', 'in_delivery', 'completed', 'cancelled'],
        default: 'pending'
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        unitPrice: {
            type: Number,
            required: true
        },
        assignedItems: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Item'
        }],
        itemStatus: {
            type: String,
            enum: ['inventory', 'reserved', 'delivery', 'demo', 'returned'],
            default: 'inventory'
        }
    }],
    orderDate: {
        type: Date,
        default: Date.now
    },
    totalValue: {
        type: Number,
        required: true
    },
    forecastingMetadata: {
        seasonalityFactor: {
            type: Number,
            default: 1
        },
        historicalDemandTrend: [{
            date: Date,
            quantity: Number
        }]
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

orderSchema.virtual('totalValue').get(function() {
    return this.items.reduce((total, item) => total + (item.quantity * item.unitPrice), 0);
});

orderSchema.index({ orderDate: 1, status: 1 });
orderSchema.index({ 'items.product': 1 });

module.exports = mongoose.model('Order', orderSchema);
