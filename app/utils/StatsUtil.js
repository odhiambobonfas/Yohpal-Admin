import Util from '@utils/Util';
import qs from 'qs';
import config from '@config/config';
import User from '@models/User';
import Application from '@models/Application';
import Transaction from '@models/Transaction';
import RedisCache from '@config/redisCache';
import admin from 'firebase-admin';
import Exception from '@config/exceptions';
import LANG_EN from '@lang/en'; 
import { ucwords, parseFirestoreDate, fbCollectionParser, normalizeFilters } from '@config/utils';  
import { FirestoreDatabase } from '@utils/FirebaseUtil';  
import { parseDateRange } from '@funcs/global_funcs';

class StatsUtil extends Util {
    constructor() {
        super();
    }

    async computeAgeDemographics(users) {
        return {
            labels: [
                "18-24 years (25%)",
                "25-34 years (35%)", 
                "35-44 years (20%)",
                "45-50 years (12%)",
                "51+ years (8%)"
            ],
            data: [25, 35, 20, 12, 8],
            backgroundColor: [
                "#ff6b6b",
                "#ff4c4c",
                "#b33c3c",
                "#ff8e8e",
                "#4d1a1a"
            ]
        }
    }

    async computeMarketSizeGrowth(users, filters = {}) {
        filters.year = filters?.year || (new Date()).getFullYear();
        const monthlyCounts = new Array(12).fill(0); 
        let createdDate;
        users?.forEach(user => {
            if (!user.createdAt) return;
            createdDate = parseFirestoreDate(user.createdAt); 
            
            const year = createdDate.getUTCFullYear();
            const month = createdDate.getUTCMonth();

            if (filters?.year && year !== filters.year) return;

            monthlyCounts[month] += 1;
        });
        
        return {
            headerLabel: `Market Size As At ${filters?.year}`,
            labels: [
                "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
            ],
            data: monthlyCounts,
            backgroundColor: "rgba(255, 76, 76, 0.3)"
        };
    }

    async getFollowersStats(redis, filters={}) {
        try { 
            const filtersKey = 'yp:usersFollowersStats:filters';
            const cacheKey = 'yp:usersFollowersStats:filtered';

            const cachedFilters = await redis.getFunc(filtersKey);
            const currentFilters = JSON.stringify(normalizeFilters(filters) || {});
            const savedFilters = cachedFilters ? JSON.stringify(normalizeFilters(cachedFilters)) : null;
            
            // If filters changed, have to invalidate the cache
            await redis.deleteFunc(filtersKey);
            await redis.deleteFunc(cacheKey);
            if (savedFilters !== currentFilters) {
                await redis.deleteFunc(filtersKey);
                await redis.deleteFunc(cacheKey);

                await redis.cacheParser(filtersKey, async () => filters, 2000);
            } 

            let users = await redis?.cacheParser(
                cacheKey,
                async () => {  
                    let query = FirestoreDatabase.collection(User.collection);
                    
                    if (filters.orderBy && filters.orderByDirection) {
                        query = query.orderBy(filters.orderBy, filters.orderByDirection); 
                    }

                    if (filters.limit) {
                        query = query.limit(filters.limit);
                    }

                    const snapshot = await query.get(); 

                    if (snapshot.empty) {
                        return [];
                    }

                    let fetched =  fbCollectionParser(snapshot);  

                    return fetched;
                },
                7200
            );

            const filtered = [...users].sort((a, b) => (Number(b.followersCount) || 0) - (Number(a.followersCount) || 0));
            
            return filtered;
        } catch (error) {
            console.error('Error getting users:', error);
        }

        return [];
    }

    async getApplicationsCount(redis, filters={}) {
        try {
            const filtersKey = 'yp:applications:count:filters';
            const cacheKey = 'yp:applications:count';

            const cachedFilters = await redis.getFunc(filtersKey);
            const currentFilters = JSON.stringify(normalizeFilters(filters) || {});
            const savedFilters = cachedFilters ? JSON.stringify(normalizeFilters(cachedFilters)) : null;

            if (savedFilters !== currentFilters) {
                await redis.deleteFunc(filtersKey);
                await redis.deleteFunc(cacheKey);
                await redis.cacheParser(filtersKey, async () => filters, 2000);
            }

            let query = FirestoreDatabase.collection(Application.collection);

            if (filters?.daterange?.length) {
                let daterange = parseDateRange(filters.daterange, true);   
                if (daterange.start && daterange.end) { 
                    query = query.where("timestamp", ">=", daterange.start);
                    query = query.where("timestamp", "<=", daterange.end);
                }
            }

            const count = await redis.cacheParser(
                cacheKey,
                async () => {
                    const snapshot = await query.count().get();
                    return snapshot.data().count;
                },
                300
            );

            return count;
        } catch (error) {
            console.error('Error getting applications count:', error);
            return 0;
        }
    }

    async getTransactionsCount(redis, filters={}) {
        try {
            const filtersKey = 'yp:transactions:count:filters';
            const cacheKey = 'yp:transactions:count';

            const cachedFilters = await redis.getFunc(filtersKey);
            const currentFilters = JSON.stringify(normalizeFilters(filters) || {});
            const savedFilters = cachedFilters ? JSON.stringify(normalizeFilters(cachedFilters)) : null;

            if (savedFilters !== currentFilters) {
                await redis.deleteFunc(filtersKey);
                await redis.deleteFunc(cacheKey);
                await redis.cacheParser(filtersKey, async () => filters, 2000);
            }

            let query = FirestoreDatabase.collection(Transaction.collection);

            if (filters?.daterange?.length) {
                let daterange = parseDateRange(filters.daterange, true);   
                if (daterange.start && daterange.end) { 
                    query = query.where("timestamp", ">=", daterange.start);
                    query = query.where("timestamp", "<=", daterange.end);
                }
            }

            const count = await redis.cacheParser(
                cacheKey,
                async () => {
                    const snapshot = await query.count().get();
                    return snapshot.data().count;
                },
                300
            );
            
            return count;
        } catch (error) {
            console.error('Error getting transactions count:', error);
            return 0;
        }
    }

    async getTotalDepositedAmount(redis, filters={}) {
        try {
            const filtersKey = 'yp:transactions:deposit:filters';
            const cacheKey = 'yp:transactions:deposit:sum';

            const cachedFilters = await redis.getFunc(filtersKey);
            const currentFilters = JSON.stringify(normalizeFilters(filters) || {});
            const savedFilters = cachedFilters ? JSON.stringify(normalizeFilters(cachedFilters)) : null;

            if (savedFilters !== currentFilters) {
                await redis.deleteFunc(filtersKey);
                await redis.deleteFunc(cacheKey);
                await redis.cacheParser(filtersKey, async () => filters, 2000);
            }

            let query = FirestoreDatabase.collection(Transaction.collection)
            query = query.where('status', '==', 'success');

            if (filters?.daterange?.length) {
                let daterange = parseDateRange(filters.daterange, true);   
                if (daterange.start && daterange.end) { 
                    query = query.where("timestamp", ">=", daterange.start);
                    query = query.where("timestamp", "<=", daterange.end);
                }
            }

            const total = await redis.cacheParser(
                cacheKey,
                async () => {
                    const snapshot = await query.get();
                    let sum = 0;
                    if (!snapshot.empty) {
                        snapshot.forEach(doc => {
                            const data = doc.data();
                            if (data.amount && !isNaN(data.amount)) {
                                sum += Number(data.amount);
                            }
                        });
                    }
                    return sum;
                },
                300
            );

            return total;
        } catch (error) {
            console.error('Error getting total deposited amount:', error);
            return 0;
        }
    }
}

export default new StatsUtil();