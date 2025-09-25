require('dotenv').config();

/**
 * Getter function that helps to retrieve an environment 
 * variable once specified.
 * 
 * @param {string} key 
 * @returns 
 */
function env(key) {
    if (!key) {
        return null;
    }

    return process.env[key.toUpperCase()];
}

/**
 * Chceks whether the application is in development mode, or 
 * production mode otherwise.
 * 
 * @returns bool
 */
function isInDevelopment() {
    if (env('APP_ENV') === 'production') {
        return false;
    }

    return true;
}

module.exports = {
    env, 
    isInDevelopment
};