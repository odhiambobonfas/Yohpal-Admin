import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '@models/User';
import config from '@config/config';

class WebController {
    static async index(req, res) {
        return res.render("home", { title: "Home Page" });
    }
}

export default WebController;