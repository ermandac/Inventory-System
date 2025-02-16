const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { auth, authorize } = require('../middleware/auth');

// Define roles as constants to ensure consistency
const ROLES = {
    ADMIN: 'admin',
    CUSTOMER: 'customer',
    INVENTORY_STAFF: 'inventory_staff',
    LOGISTICS_MANAGER: 'logistics_manager'
};

router.post('/', 
    auth, 
    authorize(ROLES.ADMIN, ROLES.CUSTOMER, ROLES.INVENTORY_STAFF), 
    orderController.createOrder
);

router.get('/', 
    auth, 
    authorize(ROLES.ADMIN, ROLES.INVENTORY_STAFF, ROLES.LOGISTICS_MANAGER), 
    orderController.getOrders
);

router.get('/:id', 
    auth, 
    authorize(ROLES.ADMIN, ROLES.INVENTORY_STAFF, ROLES.LOGISTICS_MANAGER, ROLES.CUSTOMER), 
    orderController.getOrderById
);

router.patch('/:id/status', 
    auth, 
    authorize(ROLES.ADMIN, ROLES.INVENTORY_STAFF, ROLES.LOGISTICS_MANAGER), 
    orderController.updateOrderStatus
);

module.exports = router;
