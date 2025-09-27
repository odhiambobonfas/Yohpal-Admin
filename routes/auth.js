const auth = (router) => { 
    const { upload } = require('@config/storage');
    const AuthController = require('@app/controllers/auth/AuthController');
    const WebController = require('@app/controllers/other/WebController'); 

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
