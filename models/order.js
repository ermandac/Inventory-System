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
    visibleToRoles: [{
        type: String,
        enum: ['admin', 'customer', 'inventory_staff', 'logistics_manager'],
        default: ['customer']
    }],
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
    forecastingMetadata: {
        seasonalityFactor: {
            type: Number,
            default: 1.0
        },
        predictedDemand: {
            type: Number
        },
        historicalDemandTrend: {
            type: [Number]
        }
    },
    orderDate: {
        type: Date,
        default: Date.now,
        required: true
    },
    deliveryDate: {
        type: Date
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    methods: {
        isVisibleTo(user) {
            // Check if the user can view this order
            if (!user) return false;
            
            // Admin can see all orders
            if (user.role === 'admin') return true;
            
            // Customer can only see their own orders
            if (user.role === 'customer') {
                return this.customer.toString() === user._id.toString();
            }
            
            // Inventory staff and logistics managers can see orders based on their role
            return this.visibleToRoles.includes(user.role);
        }
    }
});

orderSchema.virtual('totalValue').get(function() {
    return this.items.reduce((total, item) => total + (item.quantity * item.unitPrice), 0);
});

orderSchema.index({ orderDate: 1, status: 1 });
orderSchema.index({ 'items.product': 1 });

module.exports = mongoose.model('Order', orderSchema);
