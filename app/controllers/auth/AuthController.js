import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '@config/config';
import User from '@models/User';
import Util from '@utils/Util';
import UserUtil from '@utils/UserUtil';
import Exception from '@config/exceptions';
import LANG_EN from '@lang/en';
import Binding from '@config/bindings';
import RedisCache from '@config/redisCache';
import { FirebaseUtility, FirestoreDatabase } from '@utils/FirebaseUtil';
import {env, isInDevelopment} from "@funcs/global_funcs";  

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

        const test_username = isInDevelopment() ? env('TEST_USERNAME') : ''
        const test_password = isInDevelopment() ? env('TEST_PASSWORD') : ''

        return res.render("auth/login", {
            title: "Login Page",
            status: 'error',
            message: message,
            test_username: test_username,
            test_password: test_password,
        },(err, html) => {
            if (err) {
                console.error("Render error:", err);
                return res.status(500).send("Template rendering failed");
            }
            res.send(html);
        });
    }

    static async authlogin(req, res) {
        try { 
            const { email, password } = req.body;

            if (!email || !password) { 
                throw new Exception(201, 'AUTHENTICATION_ERROR', LANG_EN.invalid_username_password_warning, 'Auth Error!');
            }

            const auth_endpoint = Binding.endpoints.firebase_auth; 

            let response = await fetch(auth_endpoint.route + config.FIREBASE.FIREBASE_AUTH_KEY, {
                credentials: 'include',
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
                throw new Exception(201, 'AUTHENTICATION_ERROR', LANG_EN.generic_auth_error, 'Auth Error!');
            }

            const data = await response.json();   
            
            const firebase = new FirebaseUtility();

            const { idToken, refreshToken } = data;
            
            const v = await firebase.verifyAuthToken(idToken); 
            
            if (!v) {
                throw new Exception(201, 'AUTHENTICATION_ERROR', LANG_EN.generic_auth_error, 'Auth Error!');
            }
            
            let {user, role, permissions} = await UserUtil.getUserByDocid(v.uid);

            permissions = permissions.permissions ?? []; 

            if (!permissions.includes('auth.access')) {
                throw new Exception(201, 'AUTHORIZATION_ERROR', LANG_EN.authentication_error_exception, 'Auth Error!');
            }
            
            if (permissions.includes('auth.suspend')) {
                throw new Exception(201, 'ACCOUNT_SUSPENDED', LANG_EN.account_suspended_exception, 'Auth Error!');
            }

            let userPayload = {
                email: user.email,
                username: user.userName,
                name: `${user.firstName} ${user.lastName}`,
                first_name: user.firstName,
                last_name: user.lastName,
                bio: user.bio || '',
                uid: user.uid,
                country: user.country,
                phone_number: user.phoneNumber,
                adminType: user.adminType || 'user',
                role: role || null,
                permissions: permissions,
                refreshToken: refreshToken,
                status: user.status || 'inactive'
            }; 
            
            if (user.status !== 'active') {
                throw new Exception(201, 'AUTHENTICATION_ERROR', LANG_EN.authentication_error_exception, 'Auth Error!');
            }

            if (!role.status || role.status !== 'active') {
                throw new Exception(201, 'AUTHENTICATION_ERROR', LANG_EN.authentication_error_exception, 'Auth Error!');
            }

            let token = jwt.sign(userPayload, config.APP.JWT_SECRET, {
                expiresIn: config.AUTH.TOKEN_EXPIRY
            }); 
            
            req.session.token = token;

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
                console.log('Server Side Error: ', error);
                return res.status(500).json({ status: 'error', message: 'Something went wrong. Please try again later.' });
            }
        }
    }

    static async logout(req, res) {
        try { 
            res.clearCookie(config.COOKIES.COOKIE_NAME); 
            res.clearCookie(config.SESSION.SESSION_NAME); 
            res.redirect(`/login?auth=${Util.encodeMessage('You have logged out successfully.')}`);
        } catch (error) { 
            res.redirect('back');
        }
    }
}

export default AuthController;