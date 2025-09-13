import config from '@config/config';
import User from '@models/User'; 
import Exception from '@config/exceptions';
import RedisCache from '@config/redisCache';
import allowedRoutes from '@config/routes'; 

class YohPalController {
    static async index(req, res) { 
        return res.render("web/documentation/yohphal-api", { title: "YohPal API Documentation" });
    }
}

module.exports = YohPalController;