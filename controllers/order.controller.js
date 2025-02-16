const Order = require('../models/order');
const Product = require('../models/product');

exports.createOrder = async (req, res) => {
    try {
        const { items, customer } = req.body;
        
        // Generate unique order number
        const orderNumber = `ORD-${Date.now()}`;

        // Validate and create order
        const order = new Order({
            orderNumber,
            customer: customer || req.user._id,
            items,
            status: 'Pending'
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

exports.getOrders = async (req, res) => {
    try {
        const { status, startDate, endDate } = req.query;
        const filter = {};

        if (status) filter.status = status;
        if (startDate && endDate) {
            filter.orderDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const orders = await Order.find(filter)
            .populate('customer', 'name email')
            .populate('items.product', 'name sku');

        res.json(orders);
    } catch (error) {
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
