import jwt from "jsonwebtoken";
import config from "@config/config";
import Util from "@utils/Util";

export default async (req, res, next) => { 
    let msg;
    const token = req.session.token;
	
    if (!token) {
        msg = await (new Util()).encodeMessage('You have been booted out. Please log in!');
        return res.redirect(
            `/login?auth=${msg}`
        );
    }

    try {
        const decoded = jwt.verify(token, config.APP.JWT_SECRET);
        req.session.user = decoded;
        next();
    } catch (err) {
        msg = await (new Util()).encodeMessage('Invalid or expired token, please log in!');
        res.redirect(
            `/login?auth=${msg}`
        );
    }
};
