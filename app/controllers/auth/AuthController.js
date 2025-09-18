import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '@config/config';
import User from '@models/User';
import Util from '@utils/Util';
import Exception from '@config/exceptions';
import LANG_EN from '@lang/en';
import Binding from '@config/bindings';
import { FirebaseUtil, FirestoreDatabase } from '@utils/FirebaseUtil';

class AuthController {
    static async register(req, res) {
        return res.render("auth/register", {
            title: "Register Page"
        });
    }

    static async authregister(req, res) {
        try {
            const fullname = req.body.fullname ?? null;
            const username = req.body.username ?? null;
            const email = req.body.email ?? null;
            const contact = req.body.contact ?? null;
            const password = req.body.password ?? null;
            const confirmPassword = req.body.confirmPassword ?? null;

            // Check if all fields are present
            if (!fullname || !username || !email || !contact || !password || !confirmPassword) {
                throw new Exception(400, 'MISSING_FIELDS', 'All fields are required!', 'Validation Error');
            }

            if (password !== confirmPassword) {
                throw new Exception(400, 'VALIDATION_ERROR', `Password mismatch error!`);
            }

            // Check if user already exists
            const existingUser = await User.findOne({
                where: {
                    email
                }
            });
            if (existingUser) {
                throw new Exception(400, 'VALIDATION_ERROR', 'Email already registered');
            }

            // Hash password and create user
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            const user = await User.create({
                fullname: fullname,
                username: username,
                email: email,
                contact: contact,
                password: hashedPassword
            });
            res.status(200).json({
                status: 'success',
                message: 'User registered successfully',
                redirectUrl: '/login',
                user
            });
        } catch (error) {
            if (error instanceof Exception) {
                if (config.APP.APP_DEBUG) error.mexLogger();
                return res.status(error.status).json({
                    status: 'error',
                    message: error.message,
                    code: error.code
                });
            } else {
                return res.status(500).json({
                    status: 'error',
                    message: error.message || 'Something went wrong. Please try again later.'
                });
            }
        }
    }

    static async login(req, res) {
        let message = 'Please login to access your account!';

        if (req.query.message || req.query.auth) {
            try {
                const decodedMessage = Util.decodeMessage(req.query.message || req.query.auth);
                message = decodedMessage || message;
            } catch (error) {
                console.error("Error decoding message:", error);
            }
        }

        try {
            req.session.destroy();
            res.clearCookie(config.SESSION.SESSION_NAME ?? 'connect.sid');
        } catch (error) {
            console.error("Error logging out: ", error);
        }

        return res.render("auth/login", {
            title: "Login Page",
            status: 'error',
            message: message
        });
    }

    static async authlogin(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                throw new Error(LANG_EN.invalid_username_password_warning);
            }

            const auth_endpoint = Binding.endpoints.firebase_auth; 

            let response = await fetch(auth_endpoint.route + config.FIREBASE.FIREBASE_AUTH_KEY, {
                method: auth_endpoint.method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password,
                    returnSecureToken: true
                })
            }); 

            if (!response.ok) {
                throw new Error(LANG_EN.generic_auth_error);
            }

            const data = await response.json();   
            
            const firebase = new FirebaseUtil();

            const { idToken, refreshToken } = data;
            
            const user = await firebase.verifyAuthToken(idToken);
            
            if (!user) {
                throw new Error(LANG_EN.generic_auth_error);
            }

            let userPayload = {
                email: user.email,
                username: user.username || ('user' + Math.floor(Math.random() * 1000)),
                name: `${user.first_name} ${user.last_name}`,
                first_name: user.first_name,
                last_name: user.last_name,
                bio: user.bio || '',
                uid: user.uid,
                role: user.adminType || 'user',
                refreshToken: refreshToken
            }; 

            const token = jwt.sign(userPayload, config.APP.JWT_SECRET, {
                expiresIn: config.AUTH.TOKEN_EXPIRY
            });
            
            res.cookie(config.COOKIES.COOKIE_NAME, token, {
                httpOnly: config.COOKIES.HTTPONLY,
                secure: config.COOKIES.SECURE,
                sameSite: config.COOKIES.SAMESITE,
                maxAge: config.COOKIES.MAXAGE || 3600000
            }); 

            res.status(200).json({
                status: 'success',
                redirectUrl: '/dashboard',
                token
            });
        } catch (error) {
            if (error instanceof Exception) {  
                if (config.APP.APP_DEBUG) error.mexLogger();
                return res.status(error.status).json({ status: 'error', message: error.message, code: error.code, data: [] });
            } else {   
                return res.status(500).json({ status: 'error', message: 'Something went wrong. Please try again later.' });
            }
        }
    }

    static async logout(req, res) {
        try { 
            res.clearCookie(config.COOKIES.COOKIE_NAME, {
                httpOnly: config.COOKIES.HTTPONLY,
                secure: config.COOKIES.SECURE,
                sameSite: config.COOKIES.SAMESITE,
                path: config.COOKIES.PATH || '/'
            });
    
            req.flash('status', 'success');
            req.flash('message', 'You have logged out successfully.');
    
            res.redirect(`/login?auth=${Util.encodeMessage('You have logged out successfully.')}`);
        } catch (error) {
            req.flash('status', 'error');
            req.flash('message', 'Unexpected error occurred');
            res.redirect('back');
        }
    }
}

module.exports = AuthController;