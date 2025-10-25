import jwt from 'jsonwebtoken';
import config from '@config/config';
import AppModel from '@models/AppModel';  

class Transaction extends AppModel {
    static table = ''; 

    static collection = 'yohpalTransactions';

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

    static async paymentMethods() {
        let paymentMethods = [
            { slug: 'mpesa', name: 'M-Pesa', description: '' },
            { slug: 'cash', name: 'Cash', description: '' },
            { slug: 'bank-transfer', name: 'Bank Transfer', description: '' },
            { slug: 'card', name: 'Credit/Debit Card', description: '' }
        ];

        return paymentMethods;
    }

    static async paymentMethodsForDropdown() {
        let html = '';
        let paymentMethods = await Transaction.paymentMethods();

        paymentMethods.forEach(method => {
            html += `<option value="${method.slug}">${method.name}</option>`;
        });
        
        return html;
    }
}

export default Transaction;
