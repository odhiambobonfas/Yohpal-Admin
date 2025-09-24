import config from '@config/config';
import { createClient } from 'redis';

class RedisCache {
    constructor() {
        this.client = undefined;
        this.initRedisCaching();
    }

    /**
     * Initializes the Redis caching client and handles the redis 
     * connection utility
     */
    async initRedisCaching() {
        this.client = createClient({  
            username: config.CACHE.REDIS.REDIS_USERNAME,
            password: config.CACHE.REDIS.REDIS_PASSWORD,
            socket: {
                host: 'redis-14000.c341.af-south-1-1.ec2.redns.redis-cloud.com',
                port: config.CACHE.REDIS.REDIS_PORT,
                connectTimeout: config.CACHE.REDIS.CONNECTION_TIMEOUT
            }
        });

        this.client.on('error', (err) => {
            console.error('[Redis Error]', err);
        });

        await this.client.connect().then(() => {
            console.log('Redis Client Connected');
        }).catch((err) => {
            console.error('Redis Client Connection Failed: ', err);
        });
    }

    /**
     * Get cached data by key
     * 
     * @param {string} key - key used when setFuncting the data
     * @returns {any|null}
     */
    async getFunc(key) {
        try {
            const data = await this.client.get(key);
            return data ? JSON.parse(data) : null;
        } catch (err) {
            console.error(`Redis GET Error: ${key}: `, err);
            return null;
        }
    }

    /**
     * Set data into the redis cache
     * 
     * @param {string} key
     * @param {any} value
     * @param {number} expiryTimeInSeconds
     */
    async setFunc(key, value, expiryTimeInSeconds = 3600) {
        try {
            await this.client.set(key, JSON.stringify(value), {
                EX: expiryTimeInSeconds
            });
        } catch (err) {
            console.error(`Redis SET function Error ${key}:`, err);
        }
    }

    /**
     * Delete a cache already set.
     * 
     * @param {string} key
     */
    async deleteFunc(key) {
        try {
            await this.client.del(key);
        } catch (err) {
            console.error(`Redis DELETION function Error ${key}:`, err);
        }
    }

    /**
     * Cache parser - gets from cache, or setFunc if not present
     * 
     * @param {string} key
     * @param {Function} fetchCallback - function that returns new cache data. Well, logically, pass a DB Callback to get the new data or otherwise.
     * @param {number} expiryTimeInSeconds - Time the cache should take before expiry
     */
    async cacheParser(key, fetchCallback, expiryTimeInSeconds = 3600) {
        const cached = await this.getFunc(key);
        if (cached) return cached;

        const new_cache = await fetchCallback(); 
        if (new_cache) {
            await this.setFunc(key, new_cache, expiryTimeInSeconds);
        }
        return new_cache;
    }
}

module.exports = new RedisCache();
