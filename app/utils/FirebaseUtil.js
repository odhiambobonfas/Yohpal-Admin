import admin from 'firebase-admin';
import Utils from '@utils/Util';
import config from '@config/config';
import serviceAccount from '@service/accounts/serviceAccountKey.json';

class FirebaseUtil extends Utils {
    constructor() {
        super();
    }

    initFirebase() {
        if (admin.apps.length) return admin;

        const credentials = config.FIREBASE.USE_SERVICE_ACCOUNT
            ? admin.credential.cert(serviceAccount)
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