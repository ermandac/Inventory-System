# Setup Guide

This document provides instructions on how to set up and configure the Medical Equipment Inventory System for both Windows and Linux environments.

## Prerequisites

### Backend Requirements
- Node.js (v18 or higher) - [Download](https://nodejs.org/)
- MongoDB (v4.4 or higher) - [Download](https://www.mongodb.com/try/download/community)
- npm (v8 or higher, included with Node.js)
- Git - [Download](https://git-scm.com/downloads)

### Frontend Requirements
- Angular CLI (v16 or higher)
- Node.js (v18 or higher)
- npm (v8 or higher)

## Installation

### Backend Setup

1. Clone the repository:
   ```shell
   git clone https://github.com/ermandac/Inventory-System.git
   cd Inventory-System
   ```

2. Install backend dependencies:
   ```shell
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Windows Command Prompt:
     ```cmd
     copy .env.example .env
     ```
   - Windows PowerShell:
     ```powershell
     Copy-Item .env.example .env
     ```
   - Linux/Mac:
     ```bash
     cp .env.example .env
     ```

4. Edit `.env` file with your settings:
   ```env
   # MongoDB Connection
   MONGODB_URI=mongodb://localhost:27017/inventory-system
   
   # JWT Configuration
   JWT_SECRET=your_secure_jwt_secret_here
   JWT_EXPIRATION=24h
   
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   
   # CORS Configuration (for development)
   CORS_ORIGIN=http://localhost:4200
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```shell
   cd src
   ```

2. Install frontend dependencies:
   ```shell
   npm install
   ```

3. Configure environment variables:
   - Windows Command Prompt:
     ```cmd
     copy src\environments\environment.example.ts src\environments\environment.ts
     ```
   - Windows PowerShell:
     ```powershell
     Copy-Item src\environments\environment.example.ts src\environments\environment.ts
     ```
   - Linux/Mac:
     ```bash
     cp src/environments/environment.example.ts src/environments/environment.ts
     ```

4. Update the environment file with your settings:
   ```typescript
   export const environment = {
     production: false,
     apiUrl: 'http://localhost:3000/api',
     defaultPageSize: 10,
     maintenanceAlertDays: 7,
     warrantyAlertDays: 30
   };
   ```

## Running the Application

### Start MongoDB

1. Windows:
   - MongoDB should be running as a Windows Service by default
   - If not, start MongoDB Compass or run from Command Prompt:
     ```cmd
     "C:\Program Files\MongoDB\Server\{version}\bin\mongod.exe"
     ```

2. Linux:
   ```bash
   sudo systemctl start mongod
   ```

### Start the Backend Server

1. Development mode with auto-reload:
   ```shell
   npm run dev
   ```

2. Production mode:
   ```shell
   npm start
   ```

### Start the Frontend Application

1. Start the Angular development server:
   ```shell
   ng serve
   ```

## Troubleshooting

### Windows-Specific Issues

1. **MongoDB Connection Issues**
   - Ensure MongoDB is installed and running as a Windows Service
   - Open Services app (Win + R, type 'services.msc')
   - Look for 'MongoDB Server' and ensure it's running
   - If not running, right-click and select 'Start'

2. **Permission Issues**
   - Run Command Prompt or PowerShell as Administrator when needed
   - Ensure you have write permissions in the project directory

3. **Path Issues**
   - Ensure MongoDB is added to your system's PATH
   - Check Node.js installation by running:
     ```cmd
     node --version
     npm --version
     ```

4. **Port Conflicts**
   - If port 3000 is in use, modify PORT in .env file
   - If port 4200 is in use, start Angular with a different port:
     ```shell
     ng serve --port 4201
     ```

### Initial Setup

1. Create an admin user:
   ```shell
   node scripts/create-admin.js
   ```
   This will create an admin user with the following credentials:
   - Email: admin@example.com
   - Password: admin123
   
   **Important**: Change these credentials immediately after first login!

### Database Seeding

To populate the database with sample data:

```shell
node seeds/seed.js
```

Note: Run this after creating the admin user.

### Accessing the Application

1. Backend API: http://localhost:3000/api
2. Frontend App: http://localhost:4200
3. MongoDB Compass: mongodb://localhost:27017/inventory-system

## Development Tools

### Database Management

1. MongoDB Compass (recommended for database management):
   - Download from: https://www.mongodb.com/try/download/compass
   - Connect using: `mongodb://localhost:27017`

### API Testing

1. Postman Collection:
   - Import the provided Postman collection from `docs/postman`
   - Set up environment variables:
     - `baseUrl`: http://localhost:3000/api
     - `token`: Your JWT token after login

## Troubleshooting

### Common Issues

1. MongoDB Connection Issues:
   ```bash
   # Check MongoDB status
   sudo systemctl status mongod
   
   # Start MongoDB if not running
   sudo systemctl start mongod
   ```

2. Port Already in Use:
   ```bash
   # Find process using port 3000 (backend)
   sudo lsof -i :3000
   
   # Find process using port 4200 (frontend)
   sudo lsof -i :4200
   ```

3. CORS Issues:
   - Verify CORS_ORIGIN in `.env` matches your frontend URL
   - Check browser console for CORS errors
   - Ensure both frontend and backend are running

### Getting Help

1. Check the logs:
   ```bash
   # Backend logs
   npm run logs
   
   # Frontend logs
   ng serve --verbose
   ```

2. Report issues:
   - Use the GitHub issue tracker
   - Include relevant logs and error messages
   - Describe steps to reproduce the issue

- `JWT_SECRET`: A secure random string used to sign JWT tokens
- `JWT_EXPIRATION`: Token expiration time (e.g., "24h", "7d")

Example:
```
JWT_SECRET=your_very_long_and_secure_random_string_here
JWT_EXPIRATION=24h
```

### Password Requirements

User passwords must meet these security requirements:
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port number | No | 3000 |
| `NODE_ENV` | Environment (development/production) | No | development |
| `MONGODB_URI` | MongoDB connection string | Yes | - |
| `JWT_SECRET` | Secret for JWT signing | Yes | - |
| `JWT_EXPIRATION` | JWT token expiration | No | 24h |

## Next Steps

After completing the setup:
1. Create additional users with appropriate roles
2. Configure email settings if needed
3. Set up regular database backups
4. Review and update security settings as needed
