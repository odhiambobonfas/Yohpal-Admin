import "dotenv/config"; // Load environment variables from .env file
import dayjs from 'dayjs';
import admin from 'firebase-admin';
/**
 * Getter function that helps to retrieve an environment 
 * variable once specified.
 * 
 * @param {string} key 
 * @returns 
 */
export function env(key) {
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
export function isInDevelopment() {
    if (env('APP_ENV') === 'production') {
        return false;
    }

    return true;
}

export function parseDateRange(rangeStr, CONVERT_FB_TIMESTAMP=false) {
    if (!rangeStr || typeof rangeStr !== "string") return null;

    const parts = rangeStr.split(" - ");
    if (parts.length !== 2) return null;  

    let start = parts[0];
    let end   = parts[1]; 

    if (CONVERT_FB_TIMESTAMP) { 
        const startISO = parseToISO(start);
        const endISO   = parseToISO(end); 
        start = new Date(`${startISO}T00:00:00Z`);
        end   = new Date(`${endISO}T23:59:59.999Z`);  
        start = admin.firestore.Timestamp.fromDate(start);
        end = admin.firestore.Timestamp.fromDate(end);
    }

    return {
        start: start,
        end: end
    };
}

export function parseToISO(dateStr) { 
  const [day, month, year] = dateStr.split("-");
  return `${year}-${month}-${day}`;
} 

/**
 * Format numbers into readable currency format.
 * 
 * @param {number} amount - The amount to format
 * @param {string} [currency='USD'] - The ISO 4217 currency code
 * @param {string} [locale='en-US'] - The locale string
 * @returns {string}
 */
export function currencyFormat(amount, currency = 'USD', locale = 'en-US') {
    if (amount === null || amount === undefined || isNaN(amount)) return '0.00';

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

let globalFuncs = {
    env, 
    currencyFormat,
    isInDevelopment,
    parseToISO,
    parseDateRange
};

export default globalFuncs;