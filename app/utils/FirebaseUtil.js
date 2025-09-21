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
            type: config.FIREBASE.TYPE,
            project_id: config.FIREBASE.PROJECT_ID,
            private_key_id: config.FIREBASE.PRIVATE_KEY_ID,
            private_key: config.FIREBASE.PRIVATE_KEY,
            client_email: config.FIREBASE.CLIENT_EMAIL,
            client_id: config.FIREBASE.CLIENT_ID,
            auth_uri: config.FIREBASE.AUTH_URI,
            token_uri: config.FIREBASE.TOKEN_URI,
            auth_provider_x509_cert_url: config.FIREBASE.AUTH_PROVIDER_X509_CERT_URL,
            client_x509_cert_url: config.FIREBASE.CLIENT_X509_CERT_URL,
            universe_domain: config.FIREBASE.UNIVERSE_DOMAIN
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

const firebaseUtilInstance = new FirebaseUtil();

module.exports = {
    FirebaseUtil: FirebaseUtil, 
    FirestoreDatabase: firebaseUtilInstance.initFirebase().firestore(),
    RealTimeDatabase: firebaseUtilInstance.initFirebase().database()
};