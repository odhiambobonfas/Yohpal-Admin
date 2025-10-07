import fs from 'fs';
import path from 'path';
import config from '@config/config';
import Exception from '@config/exceptions';

export function ucwords(str) {
    return str?.length ?
        str.split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ') :
        null;
}

export function ucfirst(str) {
    return str?.length ? str.charAt(0).toUpperCase() + str.slice(1) : null;
}

export function dateToISO8601Formatter(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function nl2br(text) {
    return text.replace(/\n/g, '<br>');
}

export function isAjaxRequest(req) {
    return req.get('X-Requested-With') === 'XMLHttpRequest';
}

export function parseFirestoreDate(value) {
    if (!value) return null;
    if (typeof value.toDate === "function") return value.toDate();
    if (value._seconds) return new Date(value._seconds * 1000);
    const parsed = new Date(value);
    return isNaN(parsed) ? null : parsed;
}

export function fbCollectionParser(snapshot = {}) {
    if (!snapshot || snapshot.empty) return [];

    return snapshot.docs.map(doc => {
        const data = doc.data();

        const createdAt = data?.createdAt ?
            dateToISO8601Formatter(
                typeof data.createdAt.toDate === "function" ?
                data.createdAt.toDate() :
                new Date(data.createdAt)
            ) :
            dateToISO8601Formatter(doc.createTime?.toDate());

        const updatedAt = data?.updatedAt ?
            dateToISO8601Formatter(
                typeof data.updatedAt.toDate === "function" ?
                data.updatedAt.toDate() :
                new Date(data.updatedAt)
            ) :
            dateToISO8601Formatter(doc.updateTime?.toDate());

        return {
            id: doc.id,
            ...data,
            createdAt,
            updatedAt,
        };
    });
}

export function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function jsonParser(data) {
    return JSON.parse(JSON.stringify(data));
}

export function jsonStringifier(data) {
    return JSON.stringify(data, null, 2);
}

export function reduceToObj(array) {
    const obj = array.reduce((acc, item) => {
        if (item) {
            const [key, value] = Object.entries(item)[0];
            acc[key] = value;
        }
        return acc;
    }, {});

    return obj;
}

/**
 * Handles single/multiple file uploads and attaches them to req.body.attachments
 * 
 * @param {Object} req - Express request object
 * @param {String} uniqueDestName - File destination path you want the file to be written to.
 */
export function handleFileUploads(req, uniqueDestName = (req.session.user.id || '')) {
    let attachment = [];

    let files = [];
    if (req.file) {
        files = [req.file];
    } else if (req.files) {
        files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
    }

    if (files.length === 0) {
        return;
    }

    const uploadPath = path.join(config.PATHS.STORAGE, String(uniqueDestName));

    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, {
            recursive: true
        });
    }

    files.forEach(file => {
        const fileDest = path.join(uploadPath, file.filename);
        const publicPath = path.join(config.PATHS.STORAGE, String(uniqueDestName), file.filename);

        if (files.length == 1) {
            attachment = publicPath;
        }

        if (files.length > 1) {
            attachment.push(publicPath);
        }

        try {
            if (file.buffer) {
                fs.writeFileSync(fileDest, file.buffer);
            } else if (file.path) {
                fs.copyFileSync(file.path, fileDest);
            } else {
                console.error(`Skipping file ${file.filename}: No valid data source`);
                return null;
            }
        } catch (error) {
            console.error(`Error saving file ${file.filename}:`, error);
            return null;
        }
    });

    return attachment;
}

/**
 * Recursively converts object keys to camelCase
 * 
 * @returns {Object} parsed object - already in camel case
 */
export function convertToCamelCaseKeys(obj) {
    if (Array.isArray(obj)) {
        return obj.map(convertToCamelCaseKeys);
    } else if (obj && typeof obj === 'object') {
        return Object.entries(obj).reduce((acc, [key, value]) => {
            const camelKey = key.replace(/([-_][a-z])/gi, (s) => s.toUpperCase().replace('-', '').replace('_', ''));
            acc[camelKey] = convertToCamelCaseKeys(value);
            return acc;
        }, {});
    }

    return obj;
}

/**
 * Parse the filters and remove transient keys and values.
 * 
 * @param {Object} filters filters from the users frontend
 * @returns 
 */
export function normalizeFilters(filters = {}) {
    const clone = {
        ...filters
    };
    delete clone._;
    return clone;
}