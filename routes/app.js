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
import express from "express";
import { upload } from "@config/storage";
import authRoutes from "@routes/auth";
import YohPalController from "@app/controllers/api/YohPalController";
import DashboardController from "@app/controllers/web/DashboardController";
import RolesController from "@app/controllers/web/RolesController";
import SettingsController from "@app/controllers/web/SettingsController";
import UsersController from "@app/controllers/web/UsersController";
import HRMController from "@app/controllers/web/HRMController";
import authMiddleware from "@app/mwares/authMiddleware";
import routeMiddleware from "@app/mwares/routeMiddleware";

const router = express.Router();

// Auth Routes
authRoutes(router);

// Add New Routes here...
router.get('/dashboard', authMiddleware, DashboardController.index);

// API Routes - Yohpal Website Routes 
// router.get('/yohpal/api/documentation', routeMiddleware, YohPalController.index);

// router.post('/api/settings/update', routeMiddleware, SettingsController.updateSettings);
// router.get('/api/settings/get', routeMiddleware, SettingsController.getUserSettings);

// Users routes
router.get('/users', authMiddleware, UsersController.index);
router.route('/users/create')
    .get(authMiddleware, UsersController.createUser)
    .post(authMiddleware, upload.single('profile_picture'), UsersController.createUser);
    
router.route('/users/edit/:id')
    .get(authMiddleware, UsersController.editUser)
    .post(authMiddleware, upload.single('profile_picture'), UsersController.editUser);

router.patch('/users/update/:id', authMiddleware, UsersController.updateUserStatus); 
router.delete('/users/delete/:id', authMiddleware, UsersController.deleteUser); 

// RBAC routes
router.get('/roles', authMiddleware, RolesController.index);
router.get('/roles/create', authMiddleware, RolesController.createRoles);
router.post('/roles/create', authMiddleware, RolesController.createRoles);
router.route('/roles/edit/:id')
    .get(authMiddleware, RolesController.updateRoles)
    .post(authMiddleware, RolesController.updateRoles)
    .patch(authMiddleware, RolesController.updateRoleStatus);
router.delete('/roles/delete/:id', authMiddleware, RolesController.deleteRole); 

// Dashboard routes
router.get('/dashboard/card/stats', authMiddleware, DashboardController.index);
router.get('/dashboard/graphical/stats', authMiddleware, DashboardController.graphicalStats);

// HRM routes
router.get('/hrm/index', authMiddleware, HRMController.index);
router.route('/institution/departments')
    .get(authMiddleware, HRMController.departments)
    .post(authMiddleware, HRMController.departments);

router.post('/department/create', authMiddleware, HRMController.createDepartment);

router.route('/institution/designations')
    .get(authMiddleware, HRMController.designations)
    .post(authMiddleware, HRMController.designations);

router.post('/designation/create', authMiddleware, HRMController.createDesignation);

router.route('/employee/attendance')
    .get(authMiddleware, HRMController.employeeAttendance);

router.post('/attendance/create', authMiddleware, HRMController.createAttendanceRecord);

router.route('/holidays/list')
    .get(authMiddleware, HRMController.holidaysList);

router.post('/holidays/create', authMiddleware, HRMController.createHoliday);

// Settings routes
router.get('/settings', authMiddleware, SettingsController.index);
router.post('/api/setting/create', authMiddleware, upload.single('generalSetting[otherSettings][companyLogo]'), SettingsController.createUpdateSettings);
router.get('/api-settings', authMiddleware, SettingsController.getApiSettingsList);
router.get('/apps/list', authMiddleware, SettingsController.appsList);
router.get('/apps/create', authMiddleware, SettingsController.createAppUpdate);

export default router;