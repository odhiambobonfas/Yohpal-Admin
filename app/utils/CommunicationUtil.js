import Util from '@utils/Util';
import config from '@config/config'; 
import Email from '@models/Email';
import RedisCache from '@config/redisCache';
import admin from 'firebase-admin';
import Exception from '@config/exceptions';
import LANG_EN from '@lang/en'; 
import { payloadExtras, ucwords, fbCollectionParser, reduceToObj, convertToCamelCaseKeys, normalizeFilters, jsonStringifier, jsonParser } from '@config/utils';  
import { FirestoreDatabase } from '@utils/FirebaseUtil';  
import { parseDateRange } from '@funcs/global_funcs'; 
import SettingsUtil from '@utils/SettingsUtil';
import jwt from 'jsonwebtoken';
import Binding from '@config/bindings';

class CommunicationUtil extends Util {
    constructor() {
        super();
    }

    async getAllEmails(redis, filters = {}) {
        const filtersKey = 'yp:emails:filters';
        const cacheKey = 'yp:emails:filtered';
        let ref = FirestoreDatabase.collection(Email.collection);

        const cachedFilters = await redis.getFunc(filtersKey);
        const currentFilters = JSON.stringify(normalizeFilters(filters) || {});
        const savedFilters = cachedFilters ? JSON.stringify(normalizeFilters(cachedFilters)) : null;

        if (savedFilters !== currentFilters) {
            await redis.deleteFunc(filtersKey);
            await redis.deleteFunc(cacheKey);
            await redis.cacheParser(filtersKey, async () => filters, 2000);
        }

        let data = await redis.cacheParser(
            cacheKey,
            async () => {
                let collection = await ref.get();
                let data = fbCollectionParser(collection);

                let fetched = await Promise.all(data.map(async (email) => {
                    let addedBy = {};
                    if (email.addedByRef && email.addedByRef.get) {
                        const userDoc = await email.addedByRef.get();
                        if (userDoc.exists) {
                            addedBy = { id: userDoc.id, ...userDoc.data() };
                        }
                    }

                    email.addedBy = addedBy;
                    return email;
                }));

                return fetched;
            },
            300
        );

        return data;
    }
    
    async extrapolateMailHost(domain) { 
        if (!domain) return null;

        domain = domain.replace(/^https?:\/\//, '').replace(/^www\./, ''); 
        domain = domain.replace(/\/$/, ''); 
        
        if (domain.startsWith('mail.')) return domain; 

        return `mail.${domain}`;
    }

    /**
     * Creates an email address record and syncs it to cPanel via your in-house API.
     * Runs inside FirestoreDatabase.runTransaction.
     */
    async createEmailAddressQuery(data, redis) { 
        try {
            const result = await FirestoreDatabase.runTransaction(async (transaction) => {  
                const col = FirestoreDatabase.collection(Email.collection);
                const ref = col.doc();
                let encryptedPassword = await this.encodeMessage(data.smtpPassword);
                const extras = payloadExtras({
                    userLoggedInUid: data?.userLoggedInUid,
                    userLoggedInUserName: data?.userLoggedInUserName
                }, false);

                const server = await SettingsUtil.getCpanelSettingById(redis, {id: data?.serverSelect}); 
                let mailHost = await this.extrapolateMailHost(server?.linkedDomain); 
                const emailAddress = `${data?.emailUsername}@${mailHost.replace(/^mail\./i, '')}`; 
                const emailDoc = {
                    addedBy: null,
                    addedByRefUser: null, 
                    diskQuota: data.diskQuota === 'limited'
                        ? Number(data.quotaValue || 0)
                        : 0,
                    domain: server?.linkedDomain,
                    email: emailAddress,
                    encrytpionType: data.encryptionType?.toLowerCase() || 'tls',
                    incomingPort: Number(data.incomingSmtpPort || 993),
                    ougoingPort: Number(data.outgoingSmtpPort || 465),
                    login: emailAddress,
                    name: data.emailName,
                    password: encryptedPassword, 
                    server: server?.linkedDomain,
                    host: mailHost,
                    settingSharedTo: Array.isArray(data.shareToEmail)
                        ? data.shareToEmail
                        : [],
                    status: data.status || 'active',
                    suspended_incoming: 0,
                    suspended_login: 0,
                    username: data.emailUsername,
                    ...extras
                };

                const existing = await col.where("email", "==", emailDoc?.email).get();
                if (!existing?.empty) {
                    throw new Exception(
                        201,
                        "EMAIL_ADDRESS_DUPLICATE",
                        LANG_EN.error.email_address_already_exists,
                        "NEW email record duplicate exception!"
                    );
                }
                
                transaction.set(ref, emailDoc);
                        
                const secret = jwt.sign({
                        yohpalApiSecret: process.env.APP_SECRET
                    },
                    process.env.APP_SECRET, {
                        expiresIn: "1h",
                    },
                );

                const endpoint = Binding.endpoints.createEmail; 
                const response = await fetch(endpoint.route, {
                    method: endpoint?.method || 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${secret}`,
                    },
                    body: JSON.stringify({
                        username: emailDoc.username,
                        domain: emailDoc.domain,
                        emailUsername: data?.emailUsername,
                        password: data?.smtpPassword,
                        encryption: data.encryptionType,
                        incomingPort: emailDoc.incomingPort || 993,
                        outgoingPort: emailDoc.ougoingPort || 465,
                        diskQuota: emailDoc.diskQuota,
                        quotaValue: emailDoc.diskQuota === 'limited'
                            ? emailDoc.quotaValue
                            : 0,
                        server: data?.serverSelect 
                    }),
                });
                
                const jsonResponse = await response.json();
                if (!response.ok || !jsonResponse.status || jsonResponse.status !== 'success') {
                    throw new Exception(
                        500,
                        "EMAIL_CREATE_FAILED",
                        LANG_EN.error.email_create_failed || "An error occurred while trying to create a new email address record",
                        "NEW email record exception!"
                    );
                }
                
                transaction.update(ref, { updatedAt: new Date() });
                return true
            });

            return result;
        } catch (error) {
            throw new Exception(
                error.status || 201,
                error.code || "INTERNAL_SERVER_ERROR",
                error.message || "Something went wrong. Please try again later.",
                error.title || "Unexpected Error",
            );
        }
    }

}

export default new CommunicationUtil();