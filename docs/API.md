# API Documentation

## Authentication Endpoints

### Register User (Admin Only)
```http
POST /api/auth/users
Authorization: Bearer <admin_token>

{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "secure_password",
    "role": "inventory_staff",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+1234567890",
    "organization": "Hospital ABC"
}
```

### Login
```http
POST /api/auth/users/login

{
    "email": "john@example.com",
    "password": "secure_password"
}
```

### Logout
```http
POST /api/auth/users/logout
Authorization: Bearer <token>
```

### Logout All Sessions
```http
POST /api/auth/users/logoutAll
Authorization: Bearer <token>
```

### Get Current User Profile
```http
GET /api/auth/users/me
Authorization: Bearer <token>
```

### Update Current User Profile
```http
PATCH /api/auth/users/me
Authorization: Bearer <token>

{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phoneNumber": "+1234567890",
    "organization": "Hospital ABC"
}
```

### Get All Users (Admin Only)
```http
GET /api/auth/users
Authorization: Bearer <admin_token>
```

### Update User (Admin Only)
```http
PATCH /api/auth/users/:id
Authorization: Bearer <admin_token>

{
    "role": "inventory_staff",
    "isActive": true
}
```

## Role-Based Access Control

### Available Roles
- `admin`: Full system access
- `customer`: Can create and review purchase orders
- `inventory_staff`: Can manage stock levels
- `logistics_manager`: Can track shipments and coordinate deliveries

### Role Permissions
- **Admin**
  - User management
  - System configuration
  - Full access to all features

- **Customer**
  - Create purchase orders
  - Review order history
  - View product catalog

- **Inventory Staff**
  - Manage stock levels
  - Update product information
  - Generate inventory reports

- **Logistics Manager**
  - Track shipments
  - Update delivery status
  - Manage delivery routes



## Products API

### List All Products
```http
GET /api/products
```
Returns a list of all product types in the catalog.

#### Response
```javascript
[
    {
        "name": "Advanced Patient Monitor",
        "model": "LifeWatch Pro 2000",
        "manufacturer": "MedTech Solutions",
        "category": "Patient Monitoring",
        // ... other product details
    }
]
```

### Create Product
```http
POST /api/products
```
Add a new product type to the catalog.

#### Request Body
```javascript
{
    "name": "Digital X-Ray System",
    "model": "DR-2000",
    "manufacturer": "Medical Imaging Corp",
    "category": "Imaging Equipment",
    "specifications": {
        "resolution": "3.5 lp/mm",
        "detector": "43x43cm Flat Panel"
    },
    "certifications": [
        {
            "type": "CE",
            "number": "CE123456",
            "validUntil": "2026-12-31"
        }
    ]
}
```

## Items API

### List All Items
```http
GET /api/items
```
Returns a list of all individual equipment units.

#### Response
```javascript
[
    {
        "serialNumber": "LWP2000-2025-0042",
        "status": "inventory",
        "productId": "ref_to_product",
        // ... other item details
    }
]
```

### Create Item
```http
POST /api/items
```
Add a new equipment unit.

#### Request Body
```javascript
{
    "serialNumber": "LWP2000-2025-0042",
    "productId": "ref_to_product",
    "status": "inventory",
    "purchaseInfo": {
        "date": "2025-02-13",
        "supplier": "MedTech Solutions",
        "orderReference": "PO-2025-042"
    }
}
```

### Update Item Status
```http
PUT /api/items/:id
```
Update an item's status and information.

#### Request Body for Demo Status
```javascript
{
    "status": "demo",
    "destinationInfo": {
        "customerName": "City General Hospital",
        "address": "123 Healthcare Ave",
        "contactPerson": "Dr. Sarah Chen",
        "contactNumber": "+65 9123 4567",
        "expectedReturnDate": "2025-03-13"
    }
}
```

#### Request Body for Delivery Status
```javascript
{
    "status": "delivery",
    "destinationInfo": {
        "customerName": "Southeast Medical Center",
        "address": "456 Hospital Road",
        "contactPerson": "Mr. David Lim",
        "contactNumber": "+65 8765 4321"
    }
}
```

## Error Responses
All endpoints may return the following errors:

```javascript
// 400 Bad Request
{
    "message": "Invalid request parameters"
}

// 404 Not Found
{
    "message": "Resource not found"
}

// 500 Internal Server Error
{
    "message": "Internal server error"
}
```
