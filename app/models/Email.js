import jwt from 'jsonwebtoken';
import config from '@config/config';
import AppModel from '@models/AppModel';  
import CommunicationUtil from '@utils/CommunicationUtil';

class Email extends AppModel {
    static table = ''; 

    static collection = 'emailsBank';

    static fields = {};

    static nullableFields = [];

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

    static async emailsListForDropdown(redis) { 
        let html = '';
        const allEmail = await CommunicationUtil.getAllEmails(redis);
        
        allEmail.forEach(email => {
            html += `<option value="${email.id}">${email.email}</option>`;
        });

        return html;
    }
}

export default Email;
