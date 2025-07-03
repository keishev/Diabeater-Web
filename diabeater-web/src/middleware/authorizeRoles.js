const authorizeRoles = (roles = []) => {
    // roles can be a single string or an array of strings (e.g., 'admin' or ['admin', 'nutritionist'])
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return (req, res, next) => {
        // Assuming your authentication middleware (`authMiddleware`) has attached `req.user`
        // and that `req.user` contains a `role` property (e.g., 'nutritionist', 'admin').
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