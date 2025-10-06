import "dotenv/config"; // Load environment variables from .env file
import path from "path";

export default {
    APP: {
        APP_NAME: process.env.APP_NAME || 'Yohpal Admin',
        APP_ENV: process.env.APP_ENV || 'development',
        APP_PORT: process.env.APP_PORT || 5000,
        APP_IP: process.env.APP_IP || '0.0.0.0',
        APP_URL: process.env.APP_URL || 'https://admin.yohpal.com',
        APP_SECRET: process.env.APP_SECRET || 'app_secret',
        JWT_SECRET: process.env.JWT_SECRET || 'jwtsecretkey',
        SESSION_SECRET: process.env.SESSION_SECRET || 'session_secret',
        APP_DEBUG: process.env.APP_DEBUG || true,
    },
    VIEW_ENGINE: process.env.VIEW_ENGINE || 'ejs',
    PATHS: {
        ROUTES: process.env.ROUTES_PATH || path.join(path.resolve('.'), 'routes'),
        VIEWS: process.env.VIEWS_PATH || path.join(path.resolve('.'), 'resources'),
        PUBLIC: process.env.PUBLIC_PATH || path.join(path.resolve('.'), 'public'),
        STORAGE: path.join(path.resolve('.'), 'public/store'),
    },
    DATABASE: {
        DB_CONNECTION: process.env.DB_CONNECTION || 'mysql',
        DB_HOST: process.env.DB_HOST || '127.0.0.1',
        DB_PORT: process.env.DB_PORT || '3306',
        DB_NAME: process.env.DB_NAME || 'myexpress',
        DB_USER: process.env.DB_USER || 'root',
        DB_PASSWORD: process.env.DB_PASSWORD || '',
        DB_SSL: process.env.DB_SSL || false 
    },
    AUTH: {
        JWT_SECRET: process.env.JWT_SECRET || 'jwtsecret',
        TOKEN_EXPIRY: process.env.TOKEN_EXPIRY || '1h',
        BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10,
    },
    MAIL: {
        HOST: process.env.MAIL_HOST || '',
        PORT: process.env.MAIL_PORT || '465',
        SOURCE_ADDRESS: process.env.MAIL_SOURCE_ADDRESS || '',
        SOURCE_USERNAME: process.env.MAIL_SOURCE_USERNAME || 'MyExpress Framework',
        ENCRYPTION: process.env.MAIL_ENCRYPTION_CRITERIA || 'ssl',
    },
    ROUTES: {
        PREFIX: '/api',
    },
    REQUESTS: {
        ALLOW_HEADERS_LIST: {
            "Content-Security-Policy": "",
            // Add new or other headers applicable.
        }
    },
    UPLOADS: {
        AUTOSAVE: false,
        AUTORENAME: true,
        MAX_UPLOADS: 100,
        MAX_FILE_SIZE: 5 * 1024 * 1024,
        ALLOWED_FILE_TYPES: [
            "image/png", 
            "image/jpeg", 
            "image/jpg", 
            "application/pdf"
        ],
        PRESERVE_PATH: false,
        UNIQUE_UPLOAD_NAME: ''
    },
    SESSION: {
        SESSION_STORAGE: process.env.SESSION_STORAGE || 'memory',
        SESSION_NAME: "yohpal_admin_sess", // leave empty to default to connect.sid
        SESSION_SECRET: process.env.SESSION_SECRET || '',
        LOCAL_FILE_PATH: "./public/store/sessions",
        TTL: 360000,
        RESAVE: false,
        PROXY: true,
        PREFIX: 'sess:'
    },
    COOKIES: { 
        USE_COOKIES: true,
        COOKIE_NAME: 'yohpal_admin',
        MAXAGE: 24 * 60 * 60 * 1000,
        SECURE: process.env.APP_ENV === 'production',
        HTTPONLY: true,
        SAMESITE: process.env.APP_ENV === 'production' ? 'None' : 'Lax', // or Lax, Strict, None, or false 
        PATH: '/',
        DOMAIN: process.env.APP_ENV === 'production' ? (new URL(process.env.APP_URL).hostname || 'admin.yohpal.com') : undefined,
        REFRESH: true
    },
    FIREBASE: {
        USE_SERVICE_ACCOUNT: true,
        SERVICE_ACCOUNT: path.join(path.resolve('.'), 'public/store/services/accounts/serviceAccountKey.json'),
        DATABASE_URL: 'https://rental-management-system-pro.firebaseio.com',
        FIREBASE_AUTH_KEY: process.env.FIREBASE_AUTH_KEY || '',
        
        TYPE: process.env.FIREBASE_TYPE || '',
        PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '',
        PRIVATE_KEY_ID: process.env.FIREBASE_PRIVATE_KEY_ID || '',
        PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
        STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET || '',
        CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
        CLIENT_ID: process.env.FIREBASE_CLIENT_ID || '',
        AUTH_URI: process.env.FIREBASE_AUTH_URI || '',
        TOKEN_URI: process.env.FIREBASE_TOKEN_URI || '',
        AUTH_PROVIDER_X509_CERT_URL: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || '',
        CLIENT_X509_CERT_URL: process.env.FIREBASE_CLIENT_X509_CERT_URL || '',
        UNIVERSE_DOMAIN: process.env.FIREBASE_UNIVERSE_DOMAIN || ''
    },
    CACHE: {
        REDIS: {
            USE_REDIS_LOCAL: process.env.USE_REDIS_LOCAL || false,
            REDIS_USERNAME: process.env.REDIS_USERNAME || '',
            REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
            REDIS_URL: process.env.REDIS_URL || '127.0.0.1',
            REDIS_PORT: process.env.REDIS_PORT || 14000,
            CONNECTION_TIMEOUT: process.env.CONNECTION_TIMEOUT || 10000
        }
    }
};
