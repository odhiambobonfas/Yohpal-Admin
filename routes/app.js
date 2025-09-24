/**
 * MyExpress Framework - Centralized Routing Module
 * ------------------------------------------------
 * This file serves as the core routing hub for MyExpress, 
 * ensuring that all application routes are well-structured 
 * and maintainable.
 *
 * - Auth routes are modularized and loaded from the `auth` module.
 * - Additional routes should be added below for better organization.
 * - Middleware (such as authentication) is applied to protect routes.
 *
 * Designed and Developed by Giceha Junior
 * GitHub: https://github.com/Gicehajunior
 */
const express = require('express');
const {
    upload
} = require('@config/storage');
const authRoutes = require('@routes/auth');
const DashboardController = require('@app/controllers/web/DashboardController');
const RolesController = require('@app/controllers/web/RolesController');
const SettingsController = require('@app/controllers/web/SettingsController');
const YohPalController = require('@app/controllers/api/YohPalController');
const authMiddleware = require('@app/mwares/authMiddleware');
const routeMiddleware = require('@app/mwares/routeMiddleware');

const router = express.Router();

// Auth Routes
authRoutes(router);

// Add New Routes here...
router.get('/dashboard', authMiddleware, DashboardController.index);

// API Routes - Yohpal Website Routes 
// router.get('/yohpal/api/documentation', routeMiddleware, YohPalController.index);

// router.post('/api/settings/update', routeMiddleware, SettingsController.updateSettings);
// router.get('/api/settings/get', routeMiddleware, SettingsController.getUserSettings);

// RBAC routes
router.get('/roles', authMiddleware, RolesController.index);
router.get('/roles/create', authMiddleware, RolesController.createRoles);
router.post('/roles/create', authMiddleware, RolesController.createRoles);
router.get('/roles/edit/:id', authMiddleware, RolesController.updateRoles);
router.post('/roles/update/:id', authMiddleware, RolesController.updateRoles);

// Dashboard routes
router.get('/dashboard/stats', authMiddleware, DashboardController.index);

// Settings routes
router.get('/apps/list', authMiddleware, SettingsController.index);
router.get('/apps/create', authMiddleware, SettingsController.createAppUpdate);

module.exports = router;