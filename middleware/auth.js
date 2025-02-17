const jwt = require('jsonwebtoken');
const User = require('../models/user');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            console.log('[Auth Middleware] No token provided');
            throw new Error('Authentication token is required');
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('[Auth Middleware] Decoded token:', decoded);
        
        const user = await User.findOne({
            _id: decoded.userId || decoded._id, // Support both userId and _id
            'tokens.token': token
        });
        
        if (!user) {
            console.log('[Auth Middleware] No user found for token');
            throw new Error('User not found');
        }
        
        console.log('[Auth Middleware] User details:', {
            _id: user._id,
            username: user.username,
            role: user.role,
            email: user.email,
            isActive: user.isActive
        });
        
        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        console.error('[Auth Middleware] Authentication error:', error.message);
        res.status(401).json({ error: 'Please authenticate.' });
    }
};

// Middleware for role-based access control
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            console.log('[Authorization Middleware] Checking authorization');
            console.log('[Authorization Middleware] Raw allowed roles:', allowedRoles);
            console.log('[Authorization Middleware] User:', {
                id: req.user?._id,
                role: req.user?.role,
                username: req.user?.username
            });
            
            // Ensure user and role exist
            if (!req.user || !req.user.role) {
                console.log('[Authorization Middleware] No user or role found');
                return res.status(403).json({
                    error: 'Authorization failed',
                    message: 'No user role found'
                });
            }
            
            // Flatten the roles array since it might be nested due to the spread operator
            const flattenedRoles = allowedRoles.flat();
            
            // Normalize roles for comparison
            const userRole = String(req.user.role).toLowerCase().replace(/\s+/g, '_');
            const normalizedAllowedRoles = flattenedRoles.map(role => 
                String(role).toLowerCase().replace(/\s+/g, '_')
            );
            
            console.log('[Authorization Middleware] Normalized user role:', userRole);
            console.log('[Authorization Middleware] Normalized allowed roles:', normalizedAllowedRoles);
            
            const hasPermission = normalizedAllowedRoles.includes(userRole);
            
            if (!hasPermission) {
                console.log('[Authorization Middleware] Authorization failed');
                console.log('[Authorization Middleware] User role not in allowed roles');
                return res.status(403).json({
                    error: 'You do not have permission to perform this action',
                    requiredRoles: flattenedRoles,
                    userRole: req.user.role,
                    normalizedUserRole: userRole,
                    normalizedAllowedRoles
                });
            }
            
            console.log('[Authorization Middleware] Authorization successful');
            next();
        } catch (error) {
            console.error('[Authorization Middleware] Error:', error);
            return res.status(500).json({
                error: 'Something went wrong!',
                message: error.message
            });
        }
    };
};

module.exports = {
    auth,
    authorize
};
