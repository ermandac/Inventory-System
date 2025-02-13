# Development Guide

## Project Context
This inventory management system is designed for medical equipment distribution companies. It tracks individual units of medical equipment through various states: inventory, demo, and delivery.

## Core Concepts

### 1. Two-Tier Data Model
```
Product (Catalog)           Item (Individual Units)
├── Specifications    →     ├── Serial Number
├── Requirements            ├── Status
└── Documentation          └── Current Location
```

#### Product Model (Template)
- Represents a type of medical equipment
- Contains shared specifications
- Stores compliance and maintenance requirements

#### Item Model (Instance)
- Represents individual units
- Tracks current status
- Manages location and assignment

### 2. Status Flow
```
                    ┌─────────────┐
                    │  Inventory  │
                    └─────┬───────┘
                          │
                    ┌─────┴───────┐
              ┌─────┤    Demo     ├─────┐
              │     └─────────────┘     │
              │                         │
        Return to                       │
        Inventory                       │
              │                         │
              ▼                         ▼
    ┌─────────────────┐         ┌─────────────┐
    │    Inventory    │         │  Delivery   │
    └─────────────────┘         └─────────────┘
```

## Quick Reference

### 1. Status Definitions
- **Inventory**: Equipment in warehouse
- **Demo**: Out for customer evaluation
- **Delivery**: Sold and being delivered

### 2. Key API Endpoints
```
Products
GET    /api/products      # List all products
POST   /api/products      # Create product
GET    /api/products/:id  # Get product
PUT    /api/products/:id  # Update product

Items
GET    /api/items         # List all items
POST   /api/items         # Create item
GET    /api/items/:id     # Get item
PUT    /api/items/:id     # Update item
```

### 3. Common Code Patterns

#### Creating a New Product
```javascript
const product = {
    name: "Digital X-Ray System",
    model: "DR-2000",
    manufacturer: "Medical Imaging Corp",
    category: "Imaging Equipment",
    specifications: {
        resolution: "3.5 lp/mm",
        detector: "43x43cm Flat Panel"
    }
};

// POST /api/products
```

#### Adding New Inventory
```javascript
const item = {
    serialNumber: "DR2000-2025-001",
    productId: "product_id_reference",
    status: "inventory",
    purchaseInfo: {
        date: "2025-02-13",
        supplier: "Medical Imaging Corp",
        orderReference: "PO-2025-042"
    }
};

// POST /api/items
```

#### Sending for Demo
```javascript
const demoUpdate = {
    status: "demo",
    destinationInfo: {
        customerName: "City General Hospital",
        address: "123 Healthcare Ave",
        contactPerson: "Dr. Sarah Chen",
        contactNumber: "+65 9123 4567",
        expectedReturnDate: "2025-03-13"
    }
};

// PUT /api/items/:id
```

### 4. Database Indexes
```javascript
// Item Model Indexes
itemSchema.index({ status: 1 });
itemSchema.index({ serialNumber: 1 }, { unique: true });

// Product Model Indexes
productSchema.index({ model: 1 });
productSchema.index({ category: 1 });
```

## Common Development Tasks

### 1. Adding New Product Fields
1. Update Product schema in `models/product.js`
2. Add validation if required
3. Update API documentation
4. Test with existing products

### 2. Modifying Status Flow
1. Update status enum in Item schema
2. Modify status validation logic
3. Update status flow documentation
4. Test all status transitions

### 3. Adding New API Endpoints
1. Create route handler
2. Add to appropriate router file
3. Document in API.md
4. Add example in USAGE.md

## Testing Guidelines

### 1. API Testing
```bash
# Create product
curl -X POST -H "Content-Type: application/json" -d '{
    "name": "Test Product",
    "model": "TEST-001",
    "category": "Testing"
}' http://localhost:3000/api/products

# Create item
curl -X POST -H "Content-Type: application/json" -d '{
    "serialNumber": "TEST001-001",
    "productId": "product_id",
    "status": "inventory"
}' http://localhost:3000/api/items
```

### 2. Status Transition Testing
```javascript
// Test all valid transitions
inventory → demo
demo → inventory
demo → delivery
inventory → delivery
```

## Troubleshooting

### 1. Common Errors
- Duplicate serial number
- Invalid status transition
- Missing required fields
- Invalid product reference

### 2. Debug Checklist
1. Check MongoDB connection
2. Verify request payload
3. Check status transitions
4. Validate references

## Future Development

### 1. Planned Features
- [ ] User authentication
- [ ] Role-based access control
- [ ] Automated reports
- [ ] Email notifications
- [ ] Maintenance scheduling

### 2. Technical Debt
- Implement request validation
- Add comprehensive error handling
- Improve query performance
- Add automated tests

## Environment Setup

### Development
```bash
# Install dependencies
npm install

# Start MongoDB
mongod

# Start server
npm run dev
```

### Production
```bash
# Set environment variables
export NODE_ENV=production
export MONGODB_URI=your_mongodb_uri

# Start server
npm start
```

## Maintenance

### 1. Database Maintenance
- Regular backups
- Index optimization
- Data cleanup

### 2. Code Maintenance
- Keep dependencies updated
- Review error logs
- Monitor performance

## Security Considerations

### 1. Data Validation
- Sanitize all inputs
- Validate status transitions
- Check references

### 2. API Security
- Rate limiting
- Input validation
- Error handling

## Support and Resources
- Project Documentation: `/docs`
- MongoDB Documentation: [MongoDB Docs](https://docs.mongodb.com)
- Express.js Guide: [Express Guide](https://expressjs.com/guide)
