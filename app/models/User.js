import jwt from 'jsonwebtoken';
import config from '@config/config';
import AppModel from '@models/AppModel'; 

class User extends AppModel {
    static table = ''; 

    static collection = 'users';

    static fields = {
        fullname: 'STRING',
        username: 'STRING',
        email: 'STRING',
        password: 'STRING',
        contact: 'STRING', 
        role: 'STRING'
    };

    static nullableFields = [
        'contact', 'role'
    ];
    
    /**
     * Updates the session with a JWT token.
     * 
     * @param {Object} req - The request object
     * @returns {boolean} - Whether the session update was successful
     */
    async updateSession(req) {
        let cookie = req.session.user;
        token = jwt.sign(cookie, config.APP.JWT_SECRET, { expiresIn: config.AUTH.TOKEN_EXPIRY });
        cookie = token || null;
        return !!cookie;
    } 

    /**
     * Defines all model associations and relationships.
     * This method is automatically called after all models are initialized.
     * 
     * @param {Object.<string, Model>} models - Dictionary of all initialized models,
     *   keyed by model name. Use this to reference other models when defining associations.
     */
    static associate(models) {
        // Define all associations here
    }
}

export default User;
