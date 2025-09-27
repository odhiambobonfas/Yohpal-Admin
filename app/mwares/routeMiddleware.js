import config from '@config/config';
import Exception from '@config/exceptions';
import allowedRoutes from '@config/routes';

export default (req, res, next) => { 
    try {  
        if (!allowedRoutes[req.path] || !allowedRoutes[req.path].includes(req.method)) {
            throw new Exception(
                405,
                'INVALID_ROUTE_OR_METHOD',
                'The requested operation is not allowed on this endpoint!',
                'Request Method Restriction'
            );
        }

        next();
    } catch (error) {
        if (error instanceof Exception) {
            if (config.APP.APP_DEBUG) error.mexLogger(); 
            return res.status(error.status).send(error.message);
        } else {
            (new Exception(500, error.code, error.message, error?.reason)).mexLogger();
            return res.status(404).send("Page not found");
        }
    }
};
