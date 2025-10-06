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

		if (
			config.APP.APP_ENV?.trim() === "development" &&
			config.CACHE.REDIS.USE_REDIS_LOCAL
		) {
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
			const data = await Promise.race([
				this.client.get(key),
				new Promise((_, reject) =>
					setTimeout(() => reject(new Error("Redis GET timeout")), 500)
				),
			]);
			return data ? JSON.parse(data) : null;
		} catch (err) {
			console.error(`Redis GET Error: ${key}: `, err);
			return null;
		}
	}

    /**
     * Set data into the redis cache
     * 
     * @param {string} key  A key to hold up the cache values(s)
     * @param {any} value  A value to dump as the cache values(s)
     * @param {number} expiryTimeInSeconds
     */
	async setFunc(key, value, expiryTimeInSeconds = 3600) {
		try {
			let payload = typeof value === "string" ? value : JSON.stringify(value);

			await Promise.race([
				this.client.set(key, payload, "EX", expiryTimeInSeconds),
				new Promise((_, reject) =>
					setTimeout(() => reject(new Error("Redis SET timeout")), 500)
				),
			]);
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
     * Cache parser - gets from cache, or setFunc if not present
     * 
     * @param {string} key A key to hold up the cache values(s)
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