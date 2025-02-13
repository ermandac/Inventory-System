# Data Models Documentation

## Product Model
Represents a type of medical equipment in the catalog.

### Schema
```javascript
{
    name: {
        type: String,
        required: true,
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
    specifications: {
        type: Map,
        of: String
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
        frequency: Number,  // in days
        requirements: [String],
        calibrationNeeded: Boolean,
        calibrationFrequency: Number  // in days
    }
}
```

## Item Model
Represents an individual unit of medical equipment.

### Schema
```javascript
{
    serialNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    status: {
        type: String,
        required: true,
        enum: ['demo', 'inventory', 'delivery'],
        default: 'inventory'
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
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
            enum: ['preventive', 'corrective', 'calibration', 'inspection']
        },
        description: String,
        performedBy: String,
        nextDueDate: Date
    }],
    warranty: {
        startDate: Date,
        endDate: Date
    },
    purchaseInfo: {
        date: Date,
        supplier: String,
        orderReference: String
    }
}
```

## Status Workflows

### Demo Workflow
1. Item starts in 'inventory' status
2. Changed to 'demo' status when sent for demonstration
   - Requires destination information
   - Includes expected return date
3. Returns to 'inventory' or changes to 'delivery' status

### Delivery Workflow
1. Item can move from 'inventory' or 'demo' to 'delivery' status
2. Requires complete destination information
3. Status is final (item has left inventory)

## Example Usage

### Creating a New Product
```javascript
const product = new Product({
    name: "Advanced Patient Monitor",
    model: "LifeWatch Pro 2000",
    manufacturer: "MedTech Solutions",
    category: "Patient Monitoring",
    specifications: {
        "screenSize": "15-inch HD",
        "parameters": "ECG, SpO2, NIBP, Temp, Resp"
    }
});
```

### Creating a New Item
```javascript
const item = new Item({
    serialNumber: "LWP2000-2025-0042",
    productId: productId,  // Reference to product
    status: "inventory",
    purchaseInfo: {
        date: new Date(),
        supplier: "MedTech Solutions",
        orderReference: "PO-2025-042"
    }
});
```
