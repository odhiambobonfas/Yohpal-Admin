const bindings = {
    // API endpoints bindings
    endpoints: {
        auth_user: {
            method: 'POST',
            route : 'https://yohpal-market-apis.onrender.com/auth/signin',
            action: 'Sign In User API service - log in to ...',
        },
        firebase_auth: {
            method: "POST",
            route : 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=',
            action: 'Firebase authentication API endpoint'
        }
    },

    // Role Permission Bindings
    permissions: {
        // ...
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = bindings;
}