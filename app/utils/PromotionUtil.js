import Util from '@utils/Util';
import User from '@models/User';
import Promotion from '@models/Promotion'; 
import { FirestoreDatabase } from '@utils/FirebaseUtil';

class PromotionUtil extends Util {
    constructor() {
        super();
    }

    /**
     * Get list of promoted users with their profile data
     * Assumes Promotion Document ID == User UID
     */
    async getPromotedUsers(redis, filters = {}) {
        try {
            console.log('getPromotedUsers Filters:', JSON.stringify(filters));
            const limit = parseInt(filters.limit) || parseInt(filters.length) || 10;
            let offset = 0;
            let page = 1;

            if (filters.start !== undefined) {
                 offset = parseInt(filters.start);
                 page = Math.floor(offset / limit) + 1;
            } else {
                 page = parseInt(filters.page) || 1;
                 offset = (page - 1) * limit;
            }
            console.log(`Pagination: Offset ${offset}, Limit ${limit}, Page ${page}`);
            
            // Create a unique cache key based on filters (v2 to burst cache)
            const cacheKey = `yp:promotions:list:v2:${JSON.stringify(filters)}`;

            const result = await redis.cacheParser(
                cacheKey,
                async () => {
                    let query = FirestoreDatabase.collection(Promotion.collection)
                        .where('promoted', '==', true);

                    // Apply filters if needed (e.g. by package)
                    if (filters.package) {
                        query = query.where('package', '==', filters.package);
                    }

                    // Count total for pagination
                    const countSnapshot = await query.count().get();
                    const total = countSnapshot.data().count;
                    query = query.orderBy('__name__'); 
                    
                    query = query.offset(offset).limit(limit);

                    console.log(`Executing Firestore Query with offset: ${offset}, limit: ${limit}`);
                    const snapshot = await query.get();

                    if (snapshot.empty) {
                        console.log('Firestore returned empty snapshot.');
                        return { data: [], pagination: { total, page: (offset/limit)+1, limit, pages: 0 } };
                    }

                    // 1. Get promotions for this page
                    const promotions = snapshot.docs.map(doc => ({
                        id: doc.id, // This is the UID
                        ...doc.data(),
                        createdAt: doc.data().timestamp?.toDate?.() || doc.data().timestamp
                    }));

                    // 2. Fetch corresponding Users
                    const userPromises = promotions.map(async (promo) => {
                        try {
                            const userDoc = await FirestoreDatabase.collection(User.collection).doc(promo.id).get();
                            if (userDoc.exists) {
                                return {
                                    ...promo,
                                    user: {
                                        id: userDoc.id,
                                        ...userDoc.data()
                                    }
                                };
                            }
                            return { ...promo, user: null };
                        } catch (e) {
                            return { ...promo, user: null };
                        }
                    });

                    const joinedData = await Promise.all(userPromises);

                    return {
                        data: joinedData,
                        pagination: {
                            total,
                            page,
                            limit,
                            pages: Math.ceil(total / limit)
                        }
                    };
                },
                300
            );

            return result;
        } catch (error) {
            console.error('Error getting promoted users:', error);
            return { data: [], pagination: { total: 0, page: 1, limit: 10, pages: 0 } };
        }
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
