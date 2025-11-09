import jwt from 'jsonwebtoken';
import config from '@config/config';
import AppModel from '@models/AppModel'; 

class Leave extends AppModel {
    static table = ''; 

    static collection = 'leaves';

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
    
    static async getAllLeaveTypes() {
        return [
            { name: 'Annual', slug: 'annual', description: 'Annual Leave' },
            { name: 'Sick', slug: 'sick', description: 'Sick Leave' },
            { name: 'Maternity', slug: 'maternity', description: 'Maternity Leave' },
            { name: 'Paternity', slug: 'paternity', description: 'Paternity Leave' },
            { name: 'Unpaid', slug: 'unpaid', description: 'Unpaid Leave' },
            { name: 'Compassionate', slug: 'compassionate', description: 'Compassionate Leave' },
            { name: 'Bereavement', slug: 'bereavement', description: 'Bereavement Leave' },
            { name: 'Study', slug: 'study', description: 'Study Leave' },
            { name: 'Other', slug: 'other', description: 'Other Leave' },
        ];
    }

    static async getAllLeaveStatuses() { 
        return [
            { name: 'Pending', slug: 'pending', default: true, description: "Mean't for pending leaves" },
            { name: 'Approved', slug: 'approved', default: false, description: "Mean't for approved leaves" },
            { name: 'Rejected', slug: 'rejected', default: false, description: "Mean't for rejected leaves" },
            { name: 'Cancelled', slug: 'cancelled', default: false, description: "Mean't for cancelled leaves" }, 
        ];
    }
}

export default Leave;
