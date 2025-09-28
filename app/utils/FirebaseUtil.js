import admin from 'firebase-admin';
import Utils from '@utils/Util';
import config from '@config/config';

class FirebaseUtil extends Utils {
    constructor() {
        super();
    }

    initFirebase() {
        if (admin.apps.length) return admin;

        const fsakey = {
            type: config.FIREBASE.TYPE || 'service_account',
            project_id: config.FIREBASE.PROJECT_ID || 'test-project',
            private_key_id: config.FIREBASE.PRIVATE_KEY_ID || 'dummy-key-id',
            private_key: config.FIREBASE.PRIVATE_KEY || '-----BEGIN PRIVATE KEY-----\nFAKEKEY\n-----END PRIVATE KEY-----\n',
            client_email: config.FIREBASE.CLIENT_EMAIL || 'test@test.iam.gserviceaccount.com',
            client_id: config.FIREBASE.CLIENT_ID || '1234567890',
            auth_uri: config.FIREBASE.AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
            token_uri: config.FIREBASE.TOKEN_URI || 'https://oauth2.googleapis.com/token',
            auth_provider_x509_cert_url: config.FIREBASE.AUTH_PROVIDER_X509_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
            client_x509_cert_url: config.FIREBASE_CLIENT_X509_CERT_URL || 'https://www.googleapis.com/robot/v1/metadata/x509/test@test.iam.gserviceaccount.com',
            universe_domain: config.FIREBASE.UNIVERSE_DOMAIN || 'googleapis.com'
        };

        const credentials = config.FIREBASE.USE_SERVICE_ACCOUNT
            ? admin.credential.cert(fsakey)
            : admin.credential.applicationDefault();

        const firebaseOptions = { credential: credentials };

        if (config.FIREBASE.DATABASE_URL) {
            firebaseOptions.databaseURL = config.FIREBASE.DATABASE_URL;
        }

        admin.initializeApp(firebaseOptions);

        console.log(`Firebase initialized using ${config.FIREBASE.USE_SERVICE_ACCOUNT ? 'service account' : 'application default credentials'}`);

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
}

let firebaseUtilInstance = new FirebaseUtil();
export const FirebaseUtility = FirebaseUtil;
export const FirestoreDatabase = firebaseUtilInstance.initFirebase().firestore();
export const RealTimeDatabase = firebaseUtilInstance.initFirebase().database();