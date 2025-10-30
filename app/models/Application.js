import jwt from 'jsonwebtoken';
import config from '@config/config';
import AppModel from '@models/AppModel';  

class Transaction extends AppModel {
    static table = ''; 

    static collection = 'ypApplications';

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

    static async ypApplications(redis) { 
        const cacheKey = `yp:applications`
        const apps = redis.cacheParser(
            cacheKey,
            () => {
                return [
                    { name: 'Yohpal', slug: 'yohpal', default: true, description: "Meant for the main Yohpal application" },
                    { name: 'Yohpal Chat', slug: 'chat', description: "Handles messaging, group chats, and real-time communication" },
                    { name: 'Yohpal Manager', slug: 'manager', description: "For management and administrative operations" },
                    { name: 'Yohpal Market', slug: 'market', description: "Marketplace for buying, selling, and trading" },
                    { name: 'Yohpal Admin', slug: 'admin', description: "Administrative control panel for the Yohpal ecosystem" },
                    { name: 'Yohpal Hustle', slug: 'hustle', description: "Freelance and gig management platform" },
                    { name: 'Yohpal Other', slug: 'other', description: "For miscellaneous or experimental Yohpal modules" },
                ];
            },
            7200
        );

        return apps
    } 
}

export default Transaction;
