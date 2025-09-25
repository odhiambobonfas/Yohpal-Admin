/**
 * MyExpress Framework - Lightweight MVC Web Framework for Node.js
 * ---------------------------------------------------------------
 * Designed and Developed by Giceha Junior
 * GitHub: https://github.com/Gicehajunior
 * 
 * MyExpress is a minimal yet powerful Node.js framework built on 
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
require("@babel/register")({
    presets: ["@babel/preset-env"]
});
require('module-alias/register');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const Exception = require('@config/exceptions');
const config = require('@config/config');
const bindings = require('@config/bindings');
const corsconfig = require('@config/cors');
const database = require('@database/database');
const permissionHelperFuncs = require("@funcs/permissions");
const authentHelperFuncs = require("@funcs/authentication");
const globalHelperFuncs = require("@funcs/global_funcs");
const routes = require("@routes/app");  
const jwt = require('jsonwebtoken');
const session = require('express-session'); 
const RedisCache = require('@config/redisCache');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
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

app.use(
    session({
        name: config.SESSION.SESSION_NAME || 'connect.sid',
        secret: config.APP.SESSION_SECRET,
        resave: config.SESSION.RESAVE,
        saveUninitialized: true,
        proxy: config.SESSION.PROXY, 
        secret: config.SESSION.SESSION_SECRET || '', 
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
app.use((req, res, next) => { 
    res.locals.message = null;
    res.locals.status = null;
    res.locals.permissionBindings = Array.from(bindings.permissions);    
    
    let user = {};
    let token = req.session.token;

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
    res.locals.hasPermission = (key) => permissionHelperFuncs.hasPermission(user?.permissions || [], key);
    res.locals.hasAnyPermission = (keys) => permissionHelperFuncs.hasAnyPermission(user?.permissions || [], keys);

    next();
});

// Serve Public Assets 
app.use(express.static(config.PATHS.PUBLIC, {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));

app.use((req, res, next) => {
    Object.entries(config.REQUESTS.ALLOW_HEADERS_LIST).forEach(([key, value]) => {
        res.setHeader(key, value);
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
    let port = config.APP.APP_PORT;
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

module.exports = app; // Export for testing purposes