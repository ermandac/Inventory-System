# Inventory Management System: Developer Onboarding Guide

## 🚀 Prerequisites

### Required Software
    - Node.js (v18 or higher)
    - MongoDB (v6 or higher)
    - Angular CLI
    - Git

### Development Tools
    - VS Code (recommended)
    - MongoDB Compass (optional)
    - Postman (optional)

## 🏗️ Technology Stack

 - **Frontend**: Angular, Material UI
 - **Backend**: Node.js, Express.js
 - **Database**: MongoDB
 - **Authentication**: JWT
 - **Testing**: Jest, Jasmine

## 🛠 Local Development Setup

### Step 1: Clone the Repository
```bash
git clone https://github.com/yourusername/inventory-system.git
cd inventory-system
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Environment Configuration
1. Copy `.env.example` to `.env`
2. Update configuration values
   - MongoDB connection string
   - JWT secret
   - VPN configurations

### Step 4: Start MongoDB
```bash
# Make sure MongoDB is running on your system
mongod
```

### Step 5: Development Modes
```bash
# Start both frontend and backend
npm run dev
   
# Or start them separately:
npm run dev:client  # Frontend
npm run dev:server  # Backend
```

### Step 6: Seed the Database
```bash
npm run seed
npm run seed:roles
```

The application will be available at:
- Frontend: http://localhost:4200
- Backend API: http://localhost:3000

## 🔍 Debugging

Common debugging tools:
- Chrome DevTools
- VS Code debugger
- MongoDB Compass
- Backend logs

## 🔐 Security Considerations

### Authentication
- JWT-based authentication
- Role-based access control
- Secure password hashing
- Environment-specific configurations

### Best Practices
- Never commit sensitive information
- Use environment variables
- Implement proper input validation
- Follow principle of least privilege

## 📚 Learning Resources

### Project-Specific
- `docs/ARCHITECTURE.md`
- `docs/API_DOCUMENTATION.md`
- `docs/ROLE_PERMISSIONS.md`

### Recommended External Learning
- [Angular Official Documentation](https://angular.dev)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [MongoDB University](https://university.mongodb.com/)

## 🤝 Contributing Guidelines

1. Create feature branches
2. Write unit tests
3. Follow existing code style
4. Update documentation
5. Submit pull requests with clear descriptions

## 🚨 Troubleshooting

### Common Issues
- Dependency conflicts
- Port binding problems
- MongoDB connection errors

### Debugging Tools
- Chrome DevTools
- Node.js debugger
- MongoDB logs

## 📞 Support

- Project Maintainer: [Your Name]
- Email: [contact@example.com]
- Slack/Discord Channel: #inventory-system-dev

---

**Remember**: This project values clean code, security, and continuous learning. 
Ask questions, explore the codebase, and don't be afraid to improve things! 🌟
