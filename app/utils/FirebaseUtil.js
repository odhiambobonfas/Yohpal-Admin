import path from 'path';
import mime from "mime-types";
import admin from 'firebase-admin';
import Utils from '@utils/Util';
import config from '@config/config';

class FirebaseUtil extends Utils {
    constructor() {
        super();
    }

    initFirebase() {
        if (admin.apps.length) return admin;

        try {
            const fsakey = {
                type: config.FIREBASE.TYPE || 'service_account',
                project_id: config.FIREBASE.PROJECT_ID,
                private_key_id: config.FIREBASE.PRIVATE_KEY_ID,
                private_key: config.FIREBASE.PRIVATE_KEY,
                client_email: config.FIREBASE.CLIENT_EMAIL,
                client_id: config.FIREBASE.CLIENT_ID,
                auth_uri: config.FIREBASE.AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
                token_uri: config.FIREBASE.TOKEN_URI || 'https://oauth2.googleapis.com/token',
                auth_provider_x509_cert_url: config.FIREBASE.AUTH_PROVIDER_X509_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
                client_x509_cert_url: config.FIREBASE.CLIENT_X509_CERT_URL,
                universe_domain: config.FIREBASE.UNIVERSE_DOMAIN || 'googleapis.com'
            };

            const credentials = config.FIREBASE.USE_SERVICE_ACCOUNT
                ? admin.credential.cert(fsakey)
                : admin.credential.applicationDefault();

            const firebaseOptions = { 
                credential: credentials,
                storageBucket: config.FIREBASE.STORAGE_BUCKET || `${config.FIREBASE.PROJECT_ID}`,
            };

            if (config.FIREBASE.DATABASE_URL) {
                firebaseOptions.databaseURL = config.FIREBASE.DATABASE_URL;
            }

            admin.initializeApp(firebaseOptions);

            console.log(`Firebase initialized using ${config.FIREBASE.USE_SERVICE_ACCOUNT ? 'service account' : 'application default credentials'}`);
        } catch (error) {
            console.error('Failed to initialize Firebase:', error.message);
        }

        return admin;
    }

    /**
     * Verify ID token - Call this function to verify the Id token returned 
     * from the authentication request.
     * 
     * @param {string} idToken 
     */
    verifyAuthToken(idToken) {
        const res = admin.auth().verifyIdToken(idToken)
        return res;
    }

    /**
     * Upload file to Firebase Storage
     * 
     * @param {String} filePath Local file path
     * @param {String} destinationPath destination path for our file
     * @param {Object} options
     * @param {"gs"|"gcs"|"firebase"|"signed"} options.linkType Type of link to return
     * @param {Number} options.signedExpiry Expiry in ms for signed URLs (default 1hr)
     * @param {Boolean} options.makePublic Whether to make the uploaded object public
     * @returns {String|null} URL or path a path to file storage bucket
     */
    async uploadFile(filePath, destinationPath, options = { linkType: "gs", signedExpiry: 60 * 60 * 1000, makePublic: false }) {
        try {
            const bucket = admin.storage().bucket();
            const destination = destinationPath + path.basename(filePath);

            const contentType = mime.lookup(filePath) || "application/octet-stream";

            await bucket.upload(filePath, {
                destination,
                metadata: { contentType },
            });

            const file = bucket.file(destination);
            
            if (options.makePublic) {
                await file.makePublic();
            }

            switch (options.linkType) {
                case "gs":
                    return `gs://${bucket.name}/${destination}`;

                case "gcs":
                    return `https://storage.googleapis.com/${bucket.name}/${destination}`;

                case "firebase":
                    return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(destination)}?alt=media`;

                case "signed":
                    const [url] = await file.getSignedUrl({
                        action: "read",
                        expires: Date.now() + (options.signedExpiry || 60 * 60 * 1000),
                    });
                    return url;

                default:
                    return `gs://${bucket.name}/${destination}`;
            }

        } catch (error) {
            console.error("Error uploading file:", error);
            return null;
        }
    }
}

let firebaseUtilInstance = new FirebaseUtil();
export const FirebaseUtility = FirebaseUtil;
export const FirestoreDatabase = firebaseUtilInstance.initFirebase().firestore();
export const RealTimeDatabase = firebaseUtilInstance.initFirebase().database();