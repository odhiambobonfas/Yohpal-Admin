const jwt = require('jsonwebtoken');
const config = require('@config/config');
const Util = require('@utils/Util');

export default (req, res, next) => { 
    const token = req.session.token;
	
    if (!token) {
        return res.redirect(
            `/login?auth=${Util.encodeMessage('You have been booted out. Please log in!')}`
        );
    }

    try {
        const decoded = jwt.verify(token, config.APP.JWT_SECRET);
        req.session.user = decoded;
        next();
    } catch (err) {
        res.redirect(
            `/login?auth=${Util.encodeMessage('Invalid or expired token, please log in!')}`
        );
    }
};
