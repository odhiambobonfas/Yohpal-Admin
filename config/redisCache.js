import config from "@config/config";
import Redis from "ioredis";

class RedisCache {
	constructor() {
		this.client = undefined;
	}

	/**
	 * Initializes the Redis caching client
	 */
	async initRedisCaching() {
		if (this.client) {
			console.log("CLIENT already exists:", this.client.status);
			return this.client;
		}

		console.warn("Redis not connected, Reconnecting again...");

		let redisOptions;

		if (config.CACHE.REDIS.USE_REDIS_LOCAL == true || config.CACHE.REDIS.USE_REDIS_LOCAL === 'true') {
			const host = config.CACHE.REDIS.REDIS_URL || "127.0.0.1";
			const port = config.CACHE.REDIS.REDIS_PORT || 6379;

			redisOptions = {
				host,
				port,
				retryStrategy: (times) => {
					return Math.min(times * 100, 2000);
				},
			};
		} else {
			redisOptions = {
				host: config.CACHE.REDIS.REDIS_URL,
				port: config.CACHE.REDIS.REDIS_PORT,
				username: config.CACHE.REDIS.REDIS_USERNAME,
				password: config.CACHE.REDIS.REDIS_PASSWORD, 
				connectTimeout: config.CACHE.REDIS.CONNECTION_TIMEOUT,
				retryStrategy: (times) => {
					return Math.min(times * 100, config.CACHE.REDIS.CONNECTION_TIMEOUT);
				}
			};
            
            if (config.CACHE.REDIS.REDIS_CONNECTION == 'tls' || config.CACHE.REDIS.REDIS_CONNECTION == 'ssl') {
                redisOptions.tls = config.CACHE.REDIS.REDIS_CONNECTION;
            }
		}

		this.client = new Redis(redisOptions);

		this.client.on("connect", () => {
			console.log("[Redis] Connecting...");
		});

		this.client.on("ready", () => {
			console.log("[Redis] Client Connected and Ready");
		});

		this.client.on("error", (err) => {
			console.error("[Redis Error]", err.message || err);
		});

		this.client.on("end", () => {
			console.warn("[Redis] Connection closed");
		});

		return this.client;
	}

    /**
     * Get cached data by key
     * 
     * @param {string} key - A key to hold up the cache values(s)
     * @returns {any|null}
     */
	async getFunc(key) {
		try {
			const keyType = await this.client.type(key);

			if (keyType === 'list') {
				const items = await this.client.lrange(key, 0, -1);
				return items
					.filter(item => item && item.trim() !== "")
					.map(item => JSON.parse(item));
			}
			
			if (keyType === 'string') {
				const data = await this.client.get(key);
				return data ? JSON.parse(data) : null;
			}

			return null;
		} catch (err) {
			console.error(`Redis GET Error: ${key}: `, err);
			return null;
		}
	}

    /**
     * Get all Keys that match a given pattern.
     * 
     * @param {string} pattern - Key pattern, e.g., 'yp:events:*'
     * @param {number} [count=100] - Number of keys to fetch per scan iteration
     * @returns {Promise<string[]>} List of matched keys
     */
    async getKeysByPattern(pattern, count = 100) {
        try {
            const keys = [];
            let cursor = '0';

            while (cursor !== '0' || keys.length === 0) {
                const [nextCursor, foundKeys] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', count);
                if (foundKeys.length) keys.push(...foundKeys);
                cursor = nextCursor;
            }

            return keys;
        } catch (err) {
            console.error(`Redis SCAN Error (pattern: ${pattern}):`, err);
            return [];
        }
    }

    /**
     * Set data into the redis cache
     * 
     * @param {string} key  A key to hold up the cache values(s)
     * @param {any} value  A value to dump as the cache values(s)
     * @param {number} expiryTimeInSeconds expiry time in seconds
     */
	async setFunc(key, value, expiryTimeInSeconds = 0) {
		try {
			let payload = typeof value === "string" ? value : JSON.stringify(value);
			await this.client.set(key, payload); 
			if (expiryTimeInSeconds == 0) {
				await this.client.persist(key);
			}
			else {
				await this.client.expire(key, expiryTimeInSeconds);
			}
		} catch (err) {
			console.error(`Redis SET function Error ${key}:`, err.message);
		}
	}

    /**
     * Sets/pushes data(list) into the redis cache
     * 
     * @param {string} key  A key to hold up the cache values(s)
     * @param {any} value  A value to dump as the cache values(s)
     * @param {number} expiryTimeInSeconds expiry time in seconds
	 * @param {boolean} [useListPush=false] - Whether to push list items instead of setting
     */
	async pushListFunc(key, value, expiryTimeInSeconds = 0) {
		try {
			let payload = typeof value === "string" ? value : JSON.stringify(value);
			await this.client.lpush(key, payload); 
			if (expiryTimeInSeconds == 0) {
				await this.client.persist(key);
			}
			else {
				await this.client.expire(key, expiryTimeInSeconds);
			}
		} catch (err) {
			console.error(`Redis SET function Error ${key}:`, err.message);
		}
	}

    /**
     * Delete a cache already set.
     * 
     * @param {string} key A key to hold up the cache values(s)
     */
	async deleteFunc(key) {
		try {
			await this.client.del(key);
		} catch (err) {
			console.error(`Redis DELETION function Error ${key}:`, err);
		}
	}

	/**
	 * Removes an item from a Redis list if it exists.
	 *
	 * @param {string} key - The Redis list key
	 * @param {any} value - The value to remove (object or string)
	 * @param {number} [count=0] - Number of occurrences to remove (0 = all)
	 */
	async removeFromListIfExists(key, value, count = 0) {
		try {
			const payload = typeof value === "string" ? value : JSON.stringify(value);
			
			const removedCount = await this.client.lrem(key, count, payload);

			if (removedCount > 0) {
				console.log(`Removed ${removedCount} occurrence(s) from list ${key}`);
			} else {
				console.log("PAYLOAD TO REMOVE: ", value);
				console.log(`No matching entry found in list ${key}`);
			}
		} catch (err) {
			console.error(`Redis LREM Error ${key}:`, err.message);
		}
	}

    /**
     * Cache parser - gets from cache, or setFunc if not present
     * 
     * @param {string} key A key to hold up the cache values(s)
     * @param {Function} fetchCallback - function that returns new cache data. Well, logically, pass a DB Callback to get the new data or otherwise.
     * @param {number} expiryTimeInSeconds expiry time in seconds - Time the cache should take before expiry
     */
	async cacheParser(key, fetchCallback, expiryTimeInSeconds = 0, useListPush = false) {
		const cached = await this.getFunc(key); 
		if (cached && cached?.length) return cached; 
		const new_cache = await fetchCallback();
		
		if (useListPush) { 
			await this.pushListFunc(key, new_cache, expiryTimeInSeconds);
		} else {
			await this.setFunc(key, new_cache, expiryTimeInSeconds);
		}

		return new_cache;
	}
}

export default RedisCache;