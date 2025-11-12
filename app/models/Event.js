import jwt from 'jsonwebtoken';
import config from '@config/config';
import AppModel from '@models/AppModel'; 

class EventLogger extends AppModel {
    static table = ''; 

    static collection = 'events';

    static fields = {};

    static nullableFields = [];

    /**
     * Defines all model associations and relationships.
     * This method is automatically called after all models are initialized.
     * 
     * @param {Object.<string, Model>} models - Dictionary of all initialized models,
     *   keyed by model name. Use this to reference other models when defining associations.
     */
    static associate(models) {
        // Define all associations here
    }
    
    static async dispatch(redis, data) {
        const cacheKey = `yp:events:${data.eventType}`;  
        let request = await redis.cacheParser(cacheKey, 
            () => {
                return data.eventPayload;
            },
            259200, // cached for three days!
            true
        ); 

        return request;
    }
}

export default EventLogger;
