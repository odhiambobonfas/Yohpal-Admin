import { upload } from "@config/storage";
import AuthController from "@app/controllers/auth/AuthController";
import WebController from "@app/controllers/other/WebController";

const auth = (router) => { 
    // login routes
    router.get('/', AuthController.login);
    router.get('/login', AuthController.login);
    router.post('/login', AuthController.authlogin); 

    // register routes
    router.get('/register', AuthController.login);
    router.post('/register', upload.none(), AuthController.authregister);

    // log out route
    router.get('/logout', AuthController.logout);
}

export default auth;
