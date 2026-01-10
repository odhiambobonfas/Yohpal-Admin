import Util from '@utils/Util';
import Promotion from '@models/Promotion';
import { FirestoreDatabase } from '@utils/FirebaseUtil';

class PromotionUtil extends Util {
    constructor() {
        super();
    }

    /**
     * Get count of all active promotions (promoted accounts)
     *
     * Fields in promotion collection:
     * - followers_left: Number (remaining followers)
     * - package: String ('bronze', 'silver', 'gold', etc.)
     * - refereeCode: String (user reference code)
     * - promoted: Boolean (true if actively promoted)
     * - timestamp: Timestamp (creation date)
     *
     * @param {Object} redis - Redis cache instance
     * @param {Object} filters - Optional filters
     * @returns {number} Count of active promotions
     */
    async getPromotionsCount(redis, filters = {}) {
        try {
            const cacheKey = 'yp:promotions:count';

            const count = await redis.cacheParser(
                cacheKey,
                async () => {
                    // Query promotions where promoted = true
                    const query = FirestoreDatabase.collection(Promotion.collection)
                        .where('promoted', '==', true);

                    const snapshot = await query.count().get();
                    return snapshot.data().count;
                },
                300 // Cache for 5 minutes
            );

            return count;
        } catch (error) {
            console.error('Error getting promotions count:', error);
            return 0;
        }
    }

    /**
     * Get count of promotions by package type
     *
     * @param {Object} redis - Redis cache instance
     * @param {string} packageType - Package type ('bronze', 'silver', 'gold', etc.)
     * @returns {number} Count of promotions for specific package
     */
    async getPromotionsByPackage(redis, packageType) {
        try {
            const cacheKey = `yp:promotions:package:${packageType}:count`;

            const count = await redis.cacheParser(
                cacheKey,
                async () => {
                    const query = FirestoreDatabase.collection(Promotion.collection)
                        .where('promoted', '==', true)
                        .where('package', '==', packageType);

                    const snapshot = await query.count().get();
                    return snapshot.data().count;
                },
                300
            );

            return count;
        } catch (error) {
            console.error(`Error getting ${packageType} promotions count:`, error);
            return 0;
        }
    }

    /**
     * Get total count of ALL promotions (including inactive)
     *
     * @param {Object} redis - Redis cache instance
     * @returns {number} Total count of all promotion documents
     */
    async getTotalPromotionsCount(redis) {
        try {
            const cacheKey = 'yp:promotions:total:count';

            const count = await redis.cacheParser(
                cacheKey,
                async () => {
                    const query = FirestoreDatabase.collection(Promotion.collection);
                    const snapshot = await query.count().get();
                    return snapshot.data().count;
                },
                300
            );

            return count;
        } catch (error) {
            console.error('Error getting total promotions count:', error);
            return 0;
        }
    }

    /**
     * Get all active promotion documents
     *
     * @param {Object} redis - Redis cache instance
     * @param {Object} filters - Optional filters (orderBy, limit, package)
     * @returns {Array} Array of active promotion documents
     */
    async getAllPromotions(redis, filters = {}) {
        try {
            const cacheKey = 'yp:promotions:all';

            const promotions = await redis.cacheParser(
                cacheKey,
                async () => {
                    let query = FirestoreDatabase.collection(Promotion.collection)
                        .where('promoted', '==', true);

                    // Filter by package if specified
                    if (filters.package) {
                        query = query.where('package', '==', filters.package);
                    }

                    // Add orderBy if specified
                    if (filters.orderBy && filters.orderByDirection) {
                        query = query.orderBy(filters.orderBy, filters.orderByDirection);
                    }

                    // Add limit if specified
                    if (filters.limit) {
                        query = query.limit(filters.limit);
                    }

                    const snapshot = await query.get();

                    if (snapshot.empty) {
                        return [];
                    }

                    // Convert to array with timestamp parsing
                    const promotions = snapshot.docs.map(doc => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            ...data,
                            // Convert Firestore timestamp to Date for easier use
                            createdAt: data.timestamp?.toDate?.() || data.timestamp
                        };
                    });

                    return promotions;
                },
                300
            );

            return promotions;
        } catch (error) {
            console.error('Error getting promotions:', error);
            return [];
        }
    }
}

export default new PromotionUtil();
