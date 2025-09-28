import bcrypt from 'bcryptjs';
import config from '@config/config';
import User from '@models/User'; 
import Exception from '@config/exceptions';
import RedisCache from '@config/redisCache';
import allowedRoutes from '@config/routes';
import { FirebaseUtility, FirestoreDatabase, RealTimeDatabase } from '@utils/FirebaseUtil';
import Util from '@utils/Util';

class SettingsController {
    static async getUserSettings(req, res) {
        try {        
            if (!allowedRoutes[req.path] || !allowedRoutes[req.path].includes(req.method)) {
                throw new Exception(
                    405,
                    'INVALID_ROUTE_OR_METHOD',
                    'The requested operation is not allowed on this endpoint!',
                    'Request Method Restriction'
                );
            }

            const { id } = req.query; 

            if (!id) {
                throw new Exception(400, 'MISSING_AUTH_ID', 'Authentication Denied!', 'Invalid User Session ID');
            }
            const rd = new RedisCache();
            await rd.initRedisCaching();

            const cacheKey = `frontend:settings:user:${id}`;
            
            const settingsData = await rd.cacheParser(
                cacheKey,
                async () => {
                    const settingsRef = FirestoreDatabase.collection(User.collection)
                        .doc(id)
                        .collection('settings');
    
                    const collection = await settingsRef.get();
                    if (collection.empty) {
                        throw new Exception(404, 'NOT_FOUND', 'Settings not found!', 'Settings Error');
                    }   
    
                    const settingsData = Object.fromEntries(
                        collection.docs.map(doc => [doc.id, doc.data()])
                    );
                    
                    return settingsData;
                },
                3600
            );
    
            return res.status(200).json({
                status: 'success',
                message: 'User settings retrieved successfully.',
                data: settingsData
            });
    
        } catch (error) {
            if (error instanceof Exception) {
                if (config.APP.APP_DEBUG) error.mexLogger();
                return res.status(error.status).json({
                    status: 'error',
                    message: error.message,
                    code: error.code,
                    title: error.title
                });
            } else {
                (new Exception(500, error.code, error.message, error?.reason)).mexLogger();
                return res.status(500).json({
                    status: 'error',
                    message: 'Something went wrong. Please try again later.',
                    code: 'INTERNAL_SERVER_ERROR',
                    title: 'Unexpected Error'
                });
            }
        }
    }

    static async updateSettings(req, res) {
        try {  
            if (!allowedRoutes[req.path] || !allowedRoutes[req.path].includes(req.method)) {
                throw new Exception(
                    405,
                    'INVALID_ROUTE_OR_METHOD',
                    'The requested operation is not allowed on this endpoint!',
                    'Request Method Restriction'
                );
            }

            const { id, type, ...rest } = req.body; 
            let updatedSettings = { ...rest };

            if (!id || !type) { 
                throw new Exception(400, 'MISSING_FIELDS', 'All fields are required!', 'Validation Error');
            }

            const rd = new RedisCache();
            await rd.initRedisCaching(); 

            const allowed_settings_type = ['profile', 'appearance', 'security', 'font'];

            if (!allowed_settings_type.includes(type)) {
                throw new Exception(
                    400,
                    'INVALID_SETTINGS_TYPE',
                    `The provided settings type '${type}' is not supported.`,
                    'Validation Error'
                );
            }

            if (type === 'security') {
                const { currentpassword, newpassword, confirmnewpassword } = updatedSettings;
                console.log(newpassword);
                
                if (!currentpassword || !newpassword || !confirmnewpassword) {
                    throw new Exception(
                        400,
                        'MISSING_PASSWORD_FIELDS',
                        'Current password, new password, and confirm password are required.',
                        'Validation Error'
                    );
                }
                
                if (!Util.isBcryptHash(newpassword) && newpassword !== confirmnewpassword) {
                    throw new Exception(
                        400,
                        'PASSWORD_MISMATCH',
                        'New password and confirmation do not match.',
                        'Validation Error'
                    );
                }
            
                if (newpassword.length < 8) {
                    throw new Exception(
                        400,
                        'WEAK_PASSWORD',
                        'New password must be at least 8 characters long.',
                        'Validation Error'
                    );
                }
            
                let password;
                if (Util.isBcryptHash(newpassword)) {
                    password = newpassword;
                }
                else {
                    const salt = await bcrypt.genSalt(10);
                    password = await bcrypt.hash(newpassword, salt);
                }

                console.log(password);
                
                // Only store hashed password in updatedSettings
                updatedSettings = { password: password };
            }
            const settingsRef = FirestoreDatabase.collection(User.collection)
                .doc(id)
                .collection('settings')
                .doc(type);
            
            const doc = await settingsRef.get();
            
            let query;
            if (!doc.exists) {
                query = await settingsRef.set(updatedSettings, { merge: true });  
            }
            else {
                query = await settingsRef.update(updatedSettings); 
            }

            if (!query || typeof query.writeTime === 'undefined') {
                throw new Exception(500, 'FIRESTORE_WRITE_FAILED', 'An error occurred, Please try again!',
                    'Firestore Settings Error'
                );
            } 

            const cacheKey = `frontend:settings:user:${id}`;
            await rd.deleteFunc(cacheKey);

            return res.status(200).json({
                status: 'success',
                message: 'Settings updated successfully',
                code: 'SETTINGS_UPDATED',
                title: 'Update Success'
            });
        } catch (error) { 
            if (error instanceof Exception) {
                if (config.APP.APP_DEBUG) error.mexLogger();
                return res.status(error.status).json({
                    status: 'error',
                    message: error.message,
                    code: error.code,
                    title: error.title
                });
            } else { 
                (new Exception(500, error.code, error.message, error?.reason)).mexLogger();
                return res.status(500).json({
                    status: 'error',
                    message: 'Something went wrong. Please try again later.',
                    code: 'INTERNAL_SERVER_ERROR',
                    title: 'Unexpected Error'
                });
            }
        }
    } 
}

export default SettingsController;
