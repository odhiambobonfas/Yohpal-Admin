/**
 * MyExpress Framework - Lightweight MVC Web Framework for Node
 * ---------------------------------------------------------------
 * Designed and Developed by Giceha Junior
 * GitHub: https://github.com/Gicehajunior
 * 
 * MyExpress is a minimal yet powerful Node framework built on 
 * Express, following the MVC architecture for better code organization. 
 * It is designed to be modular, scalable, and developer-friendly.
 * 
 * Features:
 * - Modular structure with alias support
 * - Secure HTTP headers using Helmet
 * - CORS enabled for cross-origin requests
 * - Logging with Morgan in debug mode
 * - Automatic view directory configuration
 * - Express-based routing with centralized route handling
 * - Easy database initialization
 * 
 * Ensure that the configuration files are properly set before starting.
 */   
require ('dotenv').config(); // Load environment variables from .env file
require('module-alias/register'); // Enable module aliasing
import express from "express"; 
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import fs from "fs";
import path from "path";

import LANG_EN from "./public/default/js/lang/en.js"; 
import config from "./config/config.js";
import bindings from "./config/bindings.js";
import corsconfig from "./config/cors.js"; 

import permissionHelperFuncs from "./app/helpers/permissions.js";
import authentHelperFuncs from "./app/helpers/authentication.js";
import globalHelperFuncs from "./app/helpers/global_funcs.js";
import rolesHelperFuncs from "./app/helpers/roles.js";

import routes from "./routes/app.js";

import jwt from "jsonwebtoken";
import session from "express-session";

import RedisStoreFactory from "connect-redis";
import RedisCache from "./config/redisCache.js";
import blocklist from "./config/ipsConfig/blocklist.js";
import whitelist from "./config/ipsConfig/whitelist.js";

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: corsconfig.ORIGIN,
    credentials: corsconfig.CREDENTIALS,
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie']
}));

app.use(helmet());

// Setup Morgan logging for HTTP requests
if (config.APP.APP_DEBUG) {
    // Development environment
    app.use(morgan('dev'));
} else {
    // Production environment
    app.use(morgan('combined'));
}

const RedisStore = RedisStoreFactory(session);  

// Session Middleware with Redis Store  
app.use(
    session({
        name: config.SESSION.SESSION_NAME,
        store: new RedisStore({ client: RedisCache.client }),
        secret: config.APP.SESSION_SECRET,
        resave: config.SESSION.RESAVE,
        saveUninitialized: true,
        proxy: config.SESSION.PROXY,  
        cookie: {
            httpOnly: config.COOKIES.HTTPONLY,
            secure: config.COOKIES.SECURE,
            sameSite: config.COOKIES.SAMESITE,
            maxAge: config.COOKIES.MAXAGE,
            path: config.COOKIES.PATH,
            domain: config.COOKIES.DOMAIN || undefined
        },
    })
);

// import everything to the views, custom functions i.e helper 
// functions
app.use(async(req, res, next) => { 
    let clientIp = req.ip;

    // normalize IPv6-wrapped IPv4 addresses
    if (clientIp.startsWith('::ffff:')) {
        clientIp = clientIp.substring(7);
    }

    if (blocklist.includes(clientIp)) {
        console.warn(`Blocked request from IP: ${clientIp}`);
        return res.status(403).send(LANG_EN.req.request_denied);
    }

    res.locals.message = null;
    res.locals.status = null;
    res.locals.permissionBindings = Object.values(bindings.permissions); 
    
    let user = {};
    let token = (req as any).session.token;

    if (token) {
        try {
            user = jwt.verify(token, config.APP.JWT_SECRET);
        } catch (err) {
            console.error("Invalid JWT:", err.message); 
        }
    } 

    // expose user to views
    res.locals.user = user;

    // global function helpers
    Object.keys(globalHelperFuncs).forEach((key) => {
        res.locals[key] = globalHelperFuncs[key];
    });

    // permission helpers
    res.locals.hasPermission = (key) => permissionHelperFuncs.hasPermission(user['permissions'] || [], key);
    res.locals.hasAnyPermission = (keys) => permissionHelperFuncs.hasAnyPermission(user['permissions'] || [], keys);
    res.locals.allRoles = await rolesHelperFuncs.getAllRoles();

    next();
});

// Serve Public Assets 
app.use(express.static(config.PATHS.PUBLIC, {
    setHeaders: (res, path) => {
        if (path.endsWith('')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));

// Argument of type 'unknown' is not assignable to parameter of type 'string | number | readonly string[]'.ts(2345)

app.use((req, res, next) => {
    Object.entries(config.REQUESTS.ALLOW_HEADERS_LIST).forEach(([key, value]) => {
        res.setHeader(key, value as string | number | readonly string[]);
    });
    next();
});

const getAllDirectories = (dirPath) => {
    let results = [dirPath];
    const items = fs.readdirSync(dirPath, {
        withFileTypes: true
    });

    for (const item of items) {
        const fullPath = path.join(dirPath, item.name);
        if (item.isDirectory()) {
            results = results.concat(getAllDirectories(fullPath)); // Recursively get subdirectories
        }
    }

    return results;
};

const viewBase = config.PATHS.VIEWS;
const viewFolders = getAllDirectories(viewBase);

app.set("views", viewFolders);
app.set('view engine', config.VIEW_ENGINE);

// Load Routes
app.use(routes);

// Start Server only if DB is ready
(async () => {
    // await database.init();
    let port: string | number = process.env.PORT || 3000;
    
    if (typeof port === "string") {
        port = parseInt(port, 10);
    }

    let ip_address = config.APP.APP_IP;
    let environment = config.APP.APP_ENV;
    let protocol_annotation;

    if (environment === 'production') {
        protocol_annotation = 'https';
    } else {
        protocol_annotation = 'http';
    } 
    
    app.listen(port, ip_address, () => {
        console.log(`Server running at ${protocol_annotation}://${ip_address}:${port}`);
    });
})();

export default app; // Export for testing purposes