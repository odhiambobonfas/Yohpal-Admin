import Util from '@utils/Util';
import qs from 'qs';
import config from '@config/config';
import User from '@models/User';
import RedisCache from '@config/redisCache';
import admin from 'firebase-admin';
import Exception from '@config/exceptions';
import LANG_EN from '@lang/en'; 
import { ucwords, parseFirestoreDate, fbCollectionParser } from '@config/utils';  
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
}

export default new StatsUtil();