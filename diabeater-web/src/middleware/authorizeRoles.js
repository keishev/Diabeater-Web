const authorizeRoles = (roles = []) => {
    
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return (req, res, next) => {
        
        
        if (!req.user || !req.user.role) {
            return res.status(401).json({ message: 'Authentication required: User role not found.' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden: You do not have permission to access this resource.' });
        }
        next();
    };
};

module.exports = authorizeRoles;