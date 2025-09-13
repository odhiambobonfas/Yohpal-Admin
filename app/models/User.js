const { DataTypes, Model } = require('sequelize');
const config = require('@config/config');
const db = require('@config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

class User extends Model {
    static tableName = 'UserSettings';

    static get collection() {
        return this.tableName;
    }
    
    static query(sequelize) {  
        User.init({
            id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
            fullname: { type: DataTypes.STRING, allowNull: true, unique: false },
            username: { type: DataTypes.STRING, allowNull: true, unique: false },
            email: { type: DataTypes.STRING, allowNull: true, unique: false },
            contact: { type: DataTypes.STRING, allowNull: true, unique: false },
            password: { type: DataTypes.STRING, allowNull: true },
            role: { type: DataTypes.STRING, allowNull: true },
        }, { 
            sequelize,  
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            tableName: User.tableName,
        }); 
    }
}

User.query(db.getSequelize());
module.exports = User;