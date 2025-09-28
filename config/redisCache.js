import config from '@config/config';
import { createClient } from 'redis';

class RedisCache {
    constructor() {
        this.client = undefined;  
    }

    /**
     * Initializes the Redis caching client and handles the redis 
     * connection utility
     */
    async initRedisCaching() {
        let redisOptions; 
        if (config.APP.APP_ENV?.trim() == 'development' && config.CACHE.REDIS.USE_REDIS_LOCAL) { 
            const host = config.CACHE.REDIS.REDIS_URL || 'redis://127.0.0.1';
            const port = config.CACHE.REDIS.REDIS_PORT || 6379; 
            redisOptions = {
                url: `${host}:${port}`
            };
        } else { 
            redisOptions = { 
                username: config.CACHE.REDIS.REDIS_USERNAME,
                password: config.CACHE.REDIS.REDIS_PASSWORD,
                socket: {
                    host: config.CACHE.REDIS.REDIS_URL,
                    port: config.CACHE.REDIS.REDIS_PORT,
                    connectTimeout: config.CACHE.REDIS.CONNECTION_TIMEOUT,
                    tls: {},
                    reconnectStrategy: (retries) => {
                        return Math.min(retries * 100, config.CACHE.REDIS.CONNECTION_TIMEOUT);
                    }
                }
            };
        }
        
        this.client = createClient(redisOptions);

        this.client.on('error', (error) => {
            if (error.name === 'ConnectionTimeoutError') {
                console.log('[Redis Error] Connection timeout - reconnecting...'); 
            } else {
                console.error('[Redis Error]', error.message || error);
            }
        });
    
        this.client.on('connect', () => {
            console.log('[Redis] Connecting...');
        });
    
        this.client.on('ready', () => {
            console.log('[Redis] Client Connected and Ready');
        });
    
        this.client.on('end', () => {
            console.warn('[Redis] Connection closed');
        });

        this.client.on('reconnecting', (info) => {
            if (info && typeof info.attempt !== 'undefined' && typeof info.delay !== 'undefined') {
                console.log(`[Redis] Reconnecting attempt #${info.attempt} in ${info.delay}ms`);
            } else {
                console.log('[Redis] Reconnecting...');
            }
        });

        return this.client;
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

export default RedisCache;
