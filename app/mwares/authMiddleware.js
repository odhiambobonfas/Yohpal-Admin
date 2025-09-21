const jwt = require('jsonwebtoken');
const config = require('@config/config');
const Util = require('@utils/Util');

module.exports = (req, res, next) => { 
    try {   
        const cookie_name = config.COOKIES.COOKIE_NAME;
        const token = req.cookies[cookie_name] || req.session[cookie_name] || req.headers[cookie_name];
        if (!token) {
            req.flash('status', 'error');
            req.flash('message', 'Access denied. Please Log in again!');
            res.redirect(`/login?auth=${Util.encodeMessage('You have been booted out. Please log in!')}`);
        }

        const decoded = jwt.verify(token, config.APP.JWT_SECRET);
        req.session.user = req.cookies.user = decoded;  
        next();
    } catch (error) {
        req.flash('status', 'error');
        req.flash('message', error.message ?? 'Invalid token');
        res.redirect(`/login?auth=${Util.encodeMessage('You have been booted out. Please log in!')}`); 
    }
};
