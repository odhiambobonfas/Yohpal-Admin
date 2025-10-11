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
            activate: 'roles.activate',
            deactivate: 'roles.deactivate',
            suspend: 'roles.suspend',
        },

        // Contacts Panel
        contacts: {
            access: 'contacts.access',
            create: 'contacts.create',
            edit: 'contacts.edit',
            delete: 'contacts.delete',
            groups: 'contacts.view.groups',
            contact_groups: 'contacts.group.access',
        }, 
        
        // Communication Panel (merged with chat)
        communication: {
            access: 'communication.access',
            access_chat: 'communication.chat.access',
            chat: 'communication.chat',
            announcements: 'communication.announcements',
            messages: 'communication.messages',
            emails: 'communication.emails',
            broadcasts: 'communication.broadcasts',
        },

        chat: {
            messages: 'chat.messages',
            groups: 'chat.groups',
            contacts: 'chat.contacts',
        },

        // Payment Accounts
        accounts: {
            access: 'accounts.access',
            view: 'accounts.view',
            create: 'accounts.create',
            edit: 'accounts.edit',
            delete: 'accounts.delete',
            bank_accounts_access: 'accounts.bank.access',
        }, 

        invoices: {
            access: 'invoices.access',
        },

        expenses: {
            access: 'expenses.access',
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
        
        hrm: {
            dashboard_access: 'hrm.dashboard.access',
            employees_access: 'hrm.employees.access',
            departments_access: 'hrm.departments.access',
            designation_access: 'hrm.designation.access',
            payroll_access: 'hrm.payroll.access',
            attendance_access: 'hrm.attendance.access',
            attendance_edit: 'hrm.attendance.edit',
            attendance_view: 'hrm.attendance.view',
            holidays_access: 'hrm.holidays.access',
            holidays_edit: 'hrm.holidays.edits',
            holidays_view: 'hrm.holidays.view',
            departments_edit: 'hrm.departments.edit',
            departments_delete: 'hrm.departments.delete',
            designations_edit: 'hrm.designations.edit',
            designations_delete: 'hrm.designations.delete',
        },

        // Wallet
        wallet: {
            deposit: 'wallet.deposit',
            withdraw: 'wallet.withdraw',
            transactions: 'wallet.transactions',
        },

        // Market
        market: {
            products: 'market.products',
            orders: 'market.orders',
            vendors: 'market.vendors',
        },

        // Hustle
        hustle: {
            hustle_jobs_access: 'hustle.jobs.access',
            hustle_projects_access: 'hustle.projects.access',
            access_hustle_clients_access: 'hustle.clients.access',
            hustle_hustlers_access: 'hustle.hustlers.access',
        },

        // Accounting
        accounting: {
            access: 'accounting.access',
            overview: 'accounting.view.overview',
            ledgers: 'accounting.view.ledgers',
            statements: 'accounting.view.statements',
        },

        // Reports
        reports: {
            access: 'reports.access',
            users: 'reports.users',
            financial: 'reports.financial',
            activity: 'reports.activity',
            payments: 'reports.view.payments',
            communication: 'reports.view.communication',
            system: 'reports.view.system',
        },

        // Profile
        profile: {
            view: 'profile.view',
            edit: 'profile.edit',
        },

        // Notifications
        notifications: {
            access: 'notifications.access',
            all: 'notifications.view.all',
            system: 'notifications.view.system',
            emails: 'notifications.view.emails',
            sms: 'notifications.view.sms',
        },

        // Settings
        settings: {
            access: 'settings.access',
            app_settings_access: 'settings.view',
            view_general_settings: 'settings.general.view', 
            update_general_settings: 'settings.general.update', 
            create_api_settings: "settings.api.create", 
            edit_api_settings: "settings.api.edit", 
            delete_api_settings: "settings.api.delete", 
            update_status_api_settings: "settings.api.statusUpdate",  
        },

        // Developer
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

export default bindings;