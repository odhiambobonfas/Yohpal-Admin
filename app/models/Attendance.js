import jwt from 'jsonwebtoken';
import config from '@config/config';
import AppModel from '@models/AppModel'; 

class Attendance extends AppModel {
    static table = ''; 

    static collection = 'attendance';

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
    
    static async getAllShifts() {
        return [
            { id: 'early_morning_1', name: 'Early Morning Shift', startTime: '8:00 AM', endTime: '5:00 PM' },
            { id: 'late_morning_2', name: 'Late Morning Shift', startTime: '10:00 AM', endTime: '08:00 PM' }, 
        ];
    }
}

export default Attendance;
