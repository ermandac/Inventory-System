const Order = require('../models/order');
const Product = require('../models/product');

exports.createOrder = async (req, res) => {
    try {
        const { items, customer, orderNumber } = req.body;
        
        // Use the order number from frontend if provided, otherwise generate a new one
        const finalOrderNumber = orderNumber || generateOrderNumber();

        // Validate and create order
        const order = new Order({
            orderNumber: finalOrderNumber,
            customer: customer || req.user._id,
            customerVisibility: customer || req.user._id,
            items,
            status: 'pending',
            orderDate: new Date(),
            totalValue: calculateTotalValue(items),
            visibleToRoles: req.user.role === 'admin' ? 
                ['admin', 'customer', 'inventory_staff', 'logistics_manager'] : 
                ['customer']
        });

        await order.save();

        res.status(201).json({
            message: 'Order created successfully',
            order
        });
    } catch (error) {
        res.status(400).json({ 
            message: 'Error creating order', 
            error: error.message 
        });
    }
};

// Helper function to generate order number
function generateOrderNumber() {
    const prefix = 'ORD';
    const timestamp = new Date().getTime();
    const randomComponent = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}-${timestamp}-${randomComponent}`;
}

// Helper function to calculate total value
function calculateTotalValue(items) {
    return items.reduce((total, item) => {
        return total + (item.quantity * item.unitPrice);
    }, 0);
}

exports.getOrders = async (req, res) => {
    try {
        const { status, startDate, endDate } = req.query;
        const filter = {};

        // Ensure user exists
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        console.log('[GetOrders] Current User Role:', req.user.role);
        console.log('[GetOrders] Current User ID:', req.user._id);

        // Simplified role-based filtering
        switch (req.user.role.toLowerCase()) {
            case 'admin':
                // Admin sees all orders, no filter needed
                break;
            case 'customer':
                // Customer sees only their own orders
                filter.customer = req.user._id;
                break;
            case 'inventory_staff':
                // Inventory staff sees all orders (for management purposes)
                break;
            case 'logistics_manager':
                // Logistics manager sees all orders (for logistics management)
                break;
            default:
                return res.status(403).json({ 
                    error: 'You do not have permission to perform this action',
                    requiredRoles: ['admin', 'customer', 'inventory_staff', 'logistics_manager'],
                    userRole: req.user.role
                });
        }

        // Additional filtering options
        if (status) filter.status = status;
        if (startDate && endDate) {
            filter.orderDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        console.log('[GetOrders] Constructed Filter:', filter);

        // Fetch orders with populated product details
        const orders = await Order.find(filter)
            .populate({
                path: 'items.product',
                select: 'name description' // Select only necessary product details
            })
            .sort({ orderDate: -1 }); // Sort by most recent first

        res.json(orders);
    } catch (error) {
        console.error('[GetOrders] Error:', error);
        res.status(500).json({ 
            message: 'Error retrieving orders', 
            error: error.message 
        });
    }
};

exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('customer', 'name email')
            .populate('items.product');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check order visibility based on user role
        if (!order.isVisibleTo(req.user)) {
            return res.status(403).json({ 
                message: 'You do not have permission to view this order' 
            });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error retrieving order', 
            error: error.message 
        });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.id, 
            { status }, 
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json({
            message: 'Order status updated successfully',
            order
        });
    } catch (error) {
        res.status(400).json({ 
            message: 'Error updating order status', 
            error: error.message 
        });
    }
};
