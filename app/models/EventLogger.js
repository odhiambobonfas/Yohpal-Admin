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
        const cacheKey = `yp:events:${data.eventType}:${data.eventActor}`;  
        let request = await redis.cacheParser(cacheKey, 
            () => {
                return data?.eventPayload;
            },
            259200, // cached for three days! 
        ); 

        return request;
    }

    static async getRecentEvents(redis, limit = 10) {
        const pattern = 'yp:events:*';
        const keys = await redis.getKeysByPattern(pattern);
        const events = [];  

        // PROMISE ALL 
        await Promise.all(keys.map(async (key) => {
            const eventData = await redis.getFunc(key);
            if (eventData) {
                events.push({
                    key,
                    data: eventData
                });
            }
        }));

        // Sort events by Descending order
        events.sort((a, b) => {
            const dateA = new Date(a.data.createdAt || 0);
            const dateB = new Date(b.data.createdAt || 0);
            return dateB - dateA;
        });

        return events.slice(0, limit);
    }

    static async allEvents(redis) {
        const pattern = 'yp:events:*';
        const keys = await redis.getKeysByPattern(pattern);
        const events = []; 

        // PROMISE ALL
        await Promise.all(keys.map(async (key) => {
            const eventData = await redis.getFunc(key);
            if (eventData) {
                events.push({
                    key,
                    data: eventData
                });
            }
        }));

        // Sort events by Descending order
        events.sort((a, b) => {
            const dateA = new Date(a.data.createdAt || 0);
            const dateB = new Date(b.data.createdAt || 0);
            return dateB - dateA;
        });

        return events;
    }

    static async clearEvents(redis) {
        const pattern = 'yp:events:*';
        const keys = await redis.getKeysByPattern(pattern);
        if (keys.length > 0) {
            await redis.client.deleteFunc(keys);
        }

        return true;
    }
}

export default EventLogger;
