const bindings = {
    // API endpoints bindings
    endpoints: {
        auth_user: {
            method: 'POST',
            route: 'https://yohpal-market-apis.onrender.com/auth/signin',
            action: 'Sign In User API service - log in to ...',
        },
        firebase_auth: {
            method: "POST",
            route: 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=',
            action: 'Firebase authentication API endpoint'
        }
    },

    // Role Permission Bindings
    permissions: {
        // Authentication
        auth: {
            access: 'auth.access',
            suspend: 'auth.suspend',
            reset_password: 'auth.reset_password'
        },

        // Dashboard
        dashboard: {
            view: 'dashboard.view',
            access: 'crm.access',
        },

        // Users Panel
        users: {
            access: 'users.access',
            list: 'users.list',
            view: 'users.view',
            create: 'users.create',
            edit: 'users.edit',
            delete: 'users.delete',
            activate: 'users.activate',
            deactivate: 'users.deactivate',
            suspend: 'users.suspend',
        },

        // Roles Management
        roles: {
            access: 'roles.access',
            view: 'roles.view',
            create: 'roles.create',
            edit: 'roles.edit',
            delete: 'roles.delete',
            assign: 'roles.assign',
        },

        // Contacts Panel
        contacts: {
            access: 'contacts.access',
            create: 'contacts.create',
            edit: 'contacts.edit',
            delete: 'contacts.delete',
            groups: 'contacts.view.groups',
            students: 'contacts.view.students',
            fosters: 'contacts.view.fosters',
        },

        // Communication Panel
        communication: {
            access: 'communication.access',
            access_chat: 'communication.chat.access',
            chat: 'communication.chat',
            announcements: 'communication.announcements',
            messages: 'communication.messages',
            emails: 'communication.emails',
            broadcasts: 'communication.broadcasts',
        },

        // Payment Accounts
        accounts: {
            access: 'accounts.access',
            view: 'accounts.view',
            create: 'accounts.create',
            edit: 'accounts.edit',
            delete: 'accounts.delete',
        },

        // Transactions
        transactions: {
            access: 'transactions.access',
            view_incoming: 'transactions.view.incoming',
            view_outgoing: 'transactions.view.outgoing',
            view_reversals: 'transactions.view.reversals',
            create: 'transactions.create',
            edit: 'transactions.edit',
            delete: 'transactions.delete',
        },

        // Accounting Panel
        accounting: {
            access: 'accounting.access',
            overview: 'accounting.view.overview',
            ledgers: 'accounting.view.ledgers',
            statements: 'accounting.view.statements',
        },

        // Reports Panel
        reports: {
            access: 'reports.access',
            students: 'reports.students',
            sponsors: 'reports.view.sponsors',
            fosters: 'reports.view.fosters',
            payments: 'reports.view.payments',
            communication: 'reports.view.communication',
            system: 'reports.view.system',
        },

        // Notifications Panel
        notifications: {
            access: 'notifications.access',
            all: 'notifications.view.all',
            system: 'notifications.view.system',
            emails: 'notifications.view.emails',
            sms: 'notifications.view.sms',
        },

        // Settings Panel
        settings: {
            access: 'settings.access',
            app_settings_access: 'settings.view.app',
            payment_methods: 'settings.view.payment.methods',
            access_payment_gateways: 'settings.view.payment.access',
            view_mpesa_payment_gateways: 'settings.view.payment.mpesa.gateways',
            view_pesapal_payment_gateways: 'settings.view.payment.pesapal.gateways',
            create_mpesa_payment_gateways: 'settings.create.payment.mpesa.gateways',
            create_pesapal_payment_gateways: 'settings.create.payment.pesapal.gateways',
            others: 'settings.view.others',
        },

        // Developer Panel
        developer: {
            access: 'developer.access',
            create_app: 'developer.apps.create',
            view_app: 'developer.view.apps',
            edit_app: 'developer.apps.update',
            delete_app: 'developer.apps.delete',
            upload_updates: 'developer.zip.upload',
            unpack_updates: 'developer.zip.unpack',
        },
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = bindings;
}