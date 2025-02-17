const mongoose = require('mongoose');
const Product = require('../models/product');
const Item = require('../models/item');
const Role = require('../models/role');
const User = require('../models/user');
const Order = require('../models/order');
require('dotenv').config();

const medicalProducts = [
    {
        name: 'Digital X-Ray Machine',
        sku: 'XR3000-001',
        model: 'XR-3000',
        manufacturer: 'MedTech Imaging',
        category: 'Imaging Equipment',
        specifications: {
            power: '220V',
            dimensions: '200x150x180 cm',
            weight: '300 kg',
            resolution: '3072 x 3072 pixels',
            detector: 'Flat Panel Detector'
        },
        certifications: [
            {
                type: 'FDA',
                number: '510(k)123456',
                validUntil: new Date('2026-12-31')
            },
            {
                type: 'CE',
                number: 'CE123456',
                validUntil: new Date('2026-12-31')
            },
            {
                type: 'ISO',
                number: 'ISO13485-123456',
                validUntil: new Date('2026-12-31')
            }
        ],
        maintenanceRequirements: [
            'Annual calibration',
            'Monthly detector check',
            'Weekly software updates'
        ],
        documentation: {
            userManual: 'xr3000_manual.pdf',
            serviceGuide: 'xr3000_service.pdf',
            warrantyTerms: '2 years parts and labor'
        },
        unitPrice: 4200000.00
    },
    {
        name: 'Patient Monitor',
        sku: 'PM2000-001',
        model: 'LifeWatch Pro',
        manufacturer: 'BioMed Systems',
        category: 'Patient Monitoring',
        specifications: {
            power: '110-240V',
            dimensions: '35x28x25 cm',
            weight: '4.5 kg',
            screenSize: '12.1 inches',
            parameters: 'ECG, SpO2, NIBP, Temp, Resp'
        },
        certifications: [
            {
                type: 'FDA',
                number: '510(k)123456',
                validUntil: new Date('2026-12-31')
            },
            {
                type: 'CE',
                number: 'CE123456',
                validUntil: new Date('2026-12-31')
            },
            {
                type: 'ISO',
                number: 'ISO13485-123456',
                validUntil: new Date('2026-12-31')
            }
        ],
        maintenanceRequirements: [
            'Biannual calibration',
            'Monthly accuracy check',
            'Daily cleaning'
        ],
        documentation: {
            userManual: 'lifewatch_manual.pdf',
            serviceGuide: 'lifewatch_service.pdf',
            warrantyTerms: '1 year standard warranty'
        },
        unitPrice: 476000.00
    },
    {
        name: 'Anesthesia Machine',
        sku: 'AM5000-001',
        model: 'AnesthesiaPro 5000',
        manufacturer: 'MedVent Solutions',
        category: 'Medical Supplies',
        specifications: {
            power: '220V',
            dimensions: '145x80x70 cm',
            weight: '130 kg',
            flowRange: '0-10 L/min',
            vaporizers: '2 slots'
        },
        certifications: [
            {
                type: 'FDA',
                number: '510(k)123456',
                validUntil: new Date('2026-12-31')
            },
            {
                type: 'CE',
                number: 'CE123456',
                validUntil: new Date('2026-12-31')
            },
            {
                type: 'ISO',
                number: 'ISO13485-123456',
                validUntil: new Date('2026-12-31')
            }
        ],
        maintenanceRequirements: [
            'Quarterly calibration',
            'Monthly leak test',
            'Daily system check'
        ],
        documentation: {
            userManual: 'anesthesia_manual.pdf',
            serviceGuide: 'anesthesia5000_service.pdf',
            warrantyTerms: '3 years limited warranty'
        },
        unitPrice: 25200000.00
    },
    {
        name: 'Surgical Light',
        sku: 'SL4000-001',
        model: 'SurgicalLED 4K',
        manufacturer: 'OptiMed Devices',
        category: 'Surgical Equipment',
        specifications: {
            power: '110V',
            dimensions: '180x120x50 cm',
            weight: '45 kg',
            lightIntensity: '160,000 lux',
            colorTemperature: '4300K'
        },
        certifications: [
            {
                type: 'FDA',
                number: '510(k)123456',
                validUntil: new Date('2026-12-31')
            },
            {
                type: 'CE',
                number: 'CE123456',
                validUntil: new Date('2026-12-31')
            },
            {
                type: 'ISO',
                number: 'ISO13485-123456',
                validUntil: new Date('2026-12-31')
            }
        ],
        maintenanceRequirements: [
            'Annual calibration',
            'Monthly cleaning',
            'Quarterly LED check'
        ],
        documentation: {
            userManual: 'surgical_led_manual.pdf',
            serviceGuide: 'surgical_led_service.pdf',
            warrantyTerms: '2 years warranty'
        },
        unitPrice: 672000.00
    },
    {
        name: 'Ultrasound System',
        sku: 'US6000-001',
        model: 'SonoXpert 6000',
        manufacturer: 'DiagnoScan Technologies',
        category: 'Diagnostic System',
        specifications: {
            power: '220V',
            dimensions: '90x60x180 cm',
            weight: '250 kg',
            resolution: '1920x1080 pixels',
            probeTypes: ['Linear', 'Convex', 'Endocavitary']
        },
        certifications: [
            {
                type: 'FDA',
                number: '510(k)123456',
                validUntil: new Date('2026-12-31')
            },
            {
                type: 'CE',
                number: 'CE123456',
                validUntil: new Date('2026-12-31')
            },
            {
                type: 'ISO',
                number: 'ISO13485-123456',
                validUntil: new Date('2026-12-31')
            }
        ],
        maintenanceRequirements: [
            'Biannual software update',
            'Annual probe calibration',
            'Quarterly system diagnostic'
        ],
        documentation: {
            userManual: 'sonoxpert_manual.pdf',
            serviceGuide: 'sonoxpert_service.pdf',
            warrantyTerms: '1 year warranty'
        },
        unitPrice: 19600000.00
    }
];

const generateItems = (products) => {
    const items = [];
    products.forEach(product => {
        // Generate 3-5 items for each product
        const numItems = Math.floor(Math.random() * 3) + 3;
        for (let i = 0; i < numItems; i++) {
            const serialNumber = `${product.model}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
            items.push({
                productId: product._id,
                serialNumber: serialNumber,
                status: ['inventory', 'demo', 'delivery'][Math.floor(Math.random() * 3)],
                purchaseInfo: {
                    date: new Date(Date.now() - Math.random() * 31536000000), // Random date within last year
                    price: product.unitPrice * (0.9 + Math.random() * 0.2), // ±10% of product price
                    supplier: ['MedSupply Corp', 'Global Medical', 'HealthTech Solutions'][Math.floor(Math.random() * 3)]
                },
                warranty: {
                    startDate: new Date(Date.now() - Math.random() * 31536000000),
                    endDate: new Date(Date.now() + Math.random() * 63072000000), // Random date within next 2 years
                    terms: product.documentation.warrantyTerms
                },
                maintenanceHistory: [
                    {
                        date: new Date(Date.now() - Math.random() * 15768000000), // Random date within last 6 months
                        type: ['preventive', 'corrective'][Math.floor(Math.random() * 2)],
                        description: 'Routine maintenance check',
                        technician: 'John Doe',
                        cost: Math.floor(Math.random() * 1000)
                    }
                ]
            });
        }
    });
    return items;
};

const seedDatabase = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing data
        await Product.deleteMany({});
        await Item.deleteMany({});
        console.log('Cleared existing data');

        // Insert products
        const insertedProducts = await Product.insertMany(medicalProducts);
        console.log('Products seeded');

        // Generate and insert items
        const items = generateItems(insertedProducts);
        await Item.insertMany(items);
        console.log('Items seeded');

        console.log('Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();
