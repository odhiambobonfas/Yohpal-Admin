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
            access_accounts: 'accounts.access',
            view_accounts: 'accounts.view',
            create_accounts: 'accounts.create',
            edit_accounts: 'accounts.edit',
            delete_accounts: 'accounts.delete',
            deposit_amount: 'accounts.deposit',
            transfer_amount: 'accounts.transfer',
            access_bank_accounts: 'accounts.bank.access',
            edit_account_categories: 'accounts.categories.edit',
            delete_account_categories: 'accounts.categories.delete',
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
            access_dashboard: 'hrm.dashboard.access',
            access_employees: 'hrm.employees.access',
            access_departments: 'hrm.departments.access',
            edit_departments: 'hrm.departments.edit',
            delete_departments: 'hrm.departments.delete',
            access_designation: 'hrm.designation.access',
            edit_designations: 'hrm.designations.edit',
            delete_designations: 'hrm.designations.delete',
            access_payroll: 'hrm.payroll.access',
            access_attendance: 'hrm.attendance.access',
            edit_attendance: 'hrm.attendance.edit',
            view_attendance: 'hrm.attendance.view',
            create_attendance_shift: 'hrm.attendance.customShifts.create',
            access_holidays: 'hrm.holidays.access',
            edit_holidays: 'hrm.holidays.edits',
            view_holidays: 'hrm.holidays.view',
            access_leaves: 'hrm.leaves.access',
            view_leaves: 'hrm.leaves.view',
            edi_leaves: 'hrm.leaves.edit',
            confirm_leaves: 'hrm.leaves.confirm',
            reject_leaves: 'hrm.leaves.reject',
            delete_leaves: 'hrm.leaves.delete',
            create_leaves: 'hrm.leaves.create',
            create_custom_leave_type: 'hrm.leaves.custom.create',
            edit_components: 'hrm.payments.components.edit',
            delete_components: 'hrm.payments.components.delete',
            edit_component_brackets: 'hrm.payments.brackets.edit',
            delete_component_brackets: 'hrm.payments.brackets.delete',
            edit_component_tiers: 'hrm.payments.tiers.edit',
            delete_component_tiers: 'hrm.payments.tiers.delete', 
            manage_account_types: 'accounts.types.manage',
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
            access_account_report: 'reports.accounts.access'
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