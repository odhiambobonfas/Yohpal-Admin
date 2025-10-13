import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '@config/config';
import User from '@models/User';
import db from '@database/database';
import CryptoJS from 'crypto-js';

class Util {
    /**
     * Encodes a parsed payload which later gets decoded using the same algorithm
     * 
     * @param {mixed} message 
     * @returns {mixed} Encoded payload
     */
    static encodeMessage(message) {
        try {
            const secretKey = config.APP.APP_SECRET;
            const encrypted = CryptoJS.AES.encrypt(message, secretKey).toString();
            return encodeURIComponent(encrypted);
        } catch (error) {
            console.error("Error encoding message:", error);
            return null;
        }
    }

    /**
     * Decodes a parsed payload
     * 
     * @param {mixed} message 
     * @returns {mixed} Encoded payload
     */
    static decodeMessage(message) {
        try {
            const secretKey = config.APP.APP_SECRET;
            const decryptedBytes = CryptoJS.AES.decrypt(decodeURIComponent(message), secretKey);
            const decryptedMessage = decryptedBytes.toString(CryptoJS.enc.Utf8);

            if (!decryptedMessage) throw new Error("Invalid decryption result"); 
            return decryptedMessage;
        } catch (error) {
            console.error("Error decoding message:", error);
            return null;
        }
    }

    /**
     * Checks whether the password given is an instance of BYCRYPT Hash.
     * 
     * @param {string} password 
     * @returns {boolean} True|False if the password is evaluated.
     */
    static isBcryptHash(password) {
        // Regular expression to check if the string matches bcrypt hash format
        const bcryptRegex = /^\$2[aby]\$.{56}$/;
        return bcryptRegex.test(password);
    }

    /**
     * Compares and validates the password given.
     * 
     * @param {string} plainTextPassword 
     * @param {string} hashedPassword 
     * @returns {boolean} True|False If the password is a match
     */
    async validatePassword(plainTextPassword, hashedPassword) {
        const isMatch = await bcrypt.compare(plainTextPassword, hashedPassword);
        return isMatch;
    }

    /**
     * Generate an employee number
     *
     * @return {string} Employee number
     */
    generateEmployeeNumber(prefix = 'EMP') { 
        const randomNumber = Math.floor(100000 + Math.random() * 900000);
        return `${prefix}-${randomNumber}`;
    }
}

export default Util;