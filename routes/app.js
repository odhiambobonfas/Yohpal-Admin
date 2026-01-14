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
import AccountsController from "@app/controllers/web/AccountsController";
import MpesaController from "@app/controllers/web/MpesaController";
import CommunicationController from "@app/controllers/web/CommunicationController";
import FollowerController from "@app/controllers/yohpal/FollowerController";
import LiveSessionController from "@app/controllers/yohpal/LiveSessionController";
import NotificationController from "@app/controllers/web/NotificationController";
import VideosController from "@app/controllers/web/VideosController";
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
router.get('/reports/users', authMiddleware, UsersController.getAllUsers);
router.route('/users/create')
    .get(authMiddleware, UsersController.createUser)
    .post(authMiddleware, upload.single('profile_picture'), UsersController.createUser);

router.route('/users/edit/:id')
    .get(authMiddleware, UsersController.editUser)
    .post(authMiddleware, upload.single('profile_picture'), UsersController.editUser);

router.patch('/users/update/:id', authMiddleware, UsersController.updateUserStatus);
router.delete('/users/delete/:id', authMiddleware, UsersController.deleteUser);

router.post('/users/block/:id', authMiddleware, UsersController.blockUser);
router.post('/users/unblock/:id', authMiddleware, UsersController.unblockUser);
router.post('/users/flag/:id', authMiddleware, UsersController.flagUser);
router.post('/users/unflag/:id', authMiddleware, UsersController.unflagUser);

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

router.route('/leaves/list')
    .get(authMiddleware, HRMController.leavesList);

router.post('/leaves/create', authMiddleware, upload.single('leaveAttachment'), HRMController.createLeaveRequest);

router.route('/payroll')
    .get(authMiddleware, HRMController.payrollView);

router.get('/payroll/components', authMiddleware, HRMController.getPaymentComponents);
router.post('/payroll/component/create', authMiddleware, HRMController.createPaymentComponent);

router.get('/payroll/brackets', authMiddleware, HRMController.getComponentBrackets);
router.post('/payroll/brackets/create', authMiddleware, HRMController.createBracketScope);

router.post('/payroll/tiers/create', authMiddleware, HRMController.createTierScope);
router.get('/payroll/tiers', authMiddleware, HRMController.getComponentTiers);

// Accounts Routes
router.get('/accounts/list', authMiddleware, AccountsController.index);
router.post('/accounts/create', authMiddleware, AccountsController.createAccount);
router.get('/accounts/categories', authMiddleware, AccountsController.accountCategories);
router.post('/accounts/categories/create', authMiddleware, AccountsController.createAccountCategory);

// Settings routes
router.get('/settings', authMiddleware, SettingsController.index);
router.post('/api/setting/create', authMiddleware, upload.single('generalSetting[otherSettings][companyLogo]'), SettingsController.createUpdateSettings);
router.get('/api-settings', authMiddleware, SettingsController.getApiSettingsList);
router.get('/apps/list', authMiddleware, SettingsController.appsList);
router.get('/apps/create', authMiddleware, SettingsController.createAppUpdate);
router.get('/api/settings/edit', authMiddleware, SettingsController.editApiSettingRes);
router.post('/api/settings/edit/:id', authMiddleware, SettingsController.editApiSettingRes);
router.get('/cdn-settings', authMiddleware, SettingsController.getCdnSettingsList);
router.post('/settings/cdn/create', authMiddleware, SettingsController.createCdnSettingsList);
router.route('/settings/cdn/edit/:id')
    .get(authMiddleware, SettingsController.updateCdnSettingsList)
    .post(authMiddleware, SettingsController.updateCdnSettingsList);
router.post('/settings/cpanel/create', authMiddleware, SettingsController.createCpanelSettingsList);
router.get('/cpanel-settings', authMiddleware, SettingsController.getCpanelSettingsList);
router.route('/settings/cpanel/edit/:id')
    .get(authMiddleware, SettingsController.updateCpanelSettingsList)
    .post(authMiddleware, SettingsController.updateCpanelSettingsList);

// Folowers/Following
router.get('/followers/top/followed', authMiddleware, FollowerController.getTopFollowersListing);
router.get('/accounts/promoted', authMiddleware, DashboardController.getPromotedAccounts);

// Live Sessions
router.get('/live/active', authMiddleware, LiveSessionController.activeSessions);
router.get('/live/history', authMiddleware, LiveSessionController.historySessions);
router.get('/live/analytics', authMiddleware, LiveSessionController.analytics);
router.get('/live/api/active', authMiddleware, LiveSessionController.getActiveSessionsApi);
router.get('/live/api/history', authMiddleware, LiveSessionController.getHistorySessionsApi);
router.get('/live/api/analytics', authMiddleware, LiveSessionController.getAnalyticsApi);
router.get('/live/api/count/active', authMiddleware, LiveSessionController.getActiveCountApi);

// Settings CRUD Operations
router.route('/callbacks/register')
    .get(authMiddleware, MpesaController.registerEndpoint)
    .post(authMiddleware, MpesaController.registerEndpoint);

// Communication Routes
router.get('/communication', authMiddleware, CommunicationController.mailBox);
router.get('/communication/emails/list', authMiddleware, CommunicationController.emailsList);

// Email Handlers Routes
router.post('/emails/create', authMiddleware, CommunicationController.createEmailAddress);

// Notification Templates Handlers Routes
router.get('/notification/templates', authMiddleware, NotificationController.index);
router.post('/notification/template/create', authMiddleware, NotificationController.createNtTemplate);
router.route('/notification/templates/edit/:id')
    .get(authMiddleware, NotificationController.updateNtTemplate)
    .post(authMiddleware, NotificationController.updateNtTemplate);

// TINYMCE settings
router.get('/tinymce/settings', authMiddleware, SettingsController.tinyMceSetting);

// Videos routes
router.get('/videos', authMiddleware, VideosController.index);
router.get('/videos/reported', authMiddleware, VideosController.getReportedVideos);
router.post('/videos/:videoId/flag', authMiddleware, VideosController.flag);
router.post('/videos/:videoId/unflag', authMiddleware, VideosController.unflag);
router.post('/videos/user/:userId/block', authMiddleware, VideosController.blockUser);
router.post('/videos/user/:userId/unblock', authMiddleware, VideosController.unblockUser);

export default router;