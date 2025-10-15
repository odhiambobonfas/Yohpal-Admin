import path from 'path';
import bcrypt from 'bcryptjs';
import config from '@config/config';
import User from '@models/User';
import Exception from '@config/exceptions';
import RedisCache from '@config/redisCache';
import allowedRoutes from '@config/routes';
import {
    FirebaseUtility,
    FirestoreDatabase
} from '@utils/FirebaseUtil';
import mexDtParser from '@config/mexDtParser';
import {
    isAjaxRequest,
    ucfirst,
    ucwords,
    dateToISO8601Formatter,
    handleFileUploads,
    jsonParser,
    reduceToObj
} from '@config/utils';
import RolesUtil from '@utils/RolesUtil';
import HRMUtil from '@utils/HRMUtil';
import Binding from '@config/bindings';
import LANG_EN from '@lang/en';
import Util from '@utils/Util';
import Setting from '@models/Setting'
import Leave from '@models/Leave';
import SettingsUtil from '@utils/SettingsUtil';
import PayrollUtil from '@utils/PayrollUtil';
import {hasPermission, hasAnyPermission} from '@funcs/permissions';
import { departments, designations, employees } from "@funcs/hrm";
import { getAllRoles, isAdmin, isSuperAdmin } from "@funcs/roles";
import Attendance from "@models/Attendance";

class HRMController {
    static async index(req, res) {
        let settings = await SettingsUtil.getAllSettings();   

        let generalsettings = Object.assign({}, ...(settings?.generalsettings || [])); 
        let apisettings = Object.assign({}, ...(settings?.apisettings || [])); 
        let taxsettings = Object.assign({}, ...(settings?.taxsettings || [])); 
 
        return res.render("crm/hrm/index", {
            title: `${ config.APP.APP_NAME } || HRM`,
            user: req.session.user,
            generalsetting: generalsettings,
            apisetting: apisettings,
            taxsetting: taxsettings
        });
    }

    static async departments(req, res) {
        let user = req.session.user;

        if (isAjaxRequest(req)) {
            try {
                let departments = await HRMUtil.getAllDepartments(req?.redis, req.query);
            
                let mex = new mexDtParser(departments);
            
                departments = mex 
                    .addColumn('actions', (col) => {
                        let actions = '';
                        let id = col['id'] || col['uid'];
                        
                        if (hasPermission(user?.permissions || [], 'hrm.departments.edit')) {
                            actions += `<a class="btn btn-sm dropdown-item" href="javascript:void(0)" data-id="${id}">
                                <i class="fas fa-edit me-1"></i> Edit
                            </a>`;
                        }
            
                        if (hasPermission(user?.permissions || [], 'hrm.departments.delete')) {
                            actions += `<a class="btn btn-sm dropdown-item delete" href="javascript:void(0)" data-id="${id}">
                                <i class="fas fa-trash-alt me-1"></i> Delete
                            </a>`;
                        }
            
                        let actionDropdown = `
                            <div class="dropdown">
                                <button class="btn btn-secondary btn-xs dropdown-toggle" type="button" id="triggerId"
                                    data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                    Actions
                                </button>
                                <div class="dropdown-menu action-btns" aria-labelledby="triggerId">
                                    ${actions}
                                </div>
                            </div>
                        `;

                        return actionDropdown;
                    }) 
                    .addColumn('Name', (col) => {
                        return ucwords(col.departmentName || 'N/A');
                    }) 
                    .addColumn('Code', (col) => {
                        return (col.departmentCode || 'N/A').toUpperCase();
                    }) 
                    .addColumn('Description', (col) => {
                        return ucfirst(col.departmentDescription || 'N/A');
                    }) 
                    .addColumn('Head', (col) => {
                        return ucwords(col.departmentHead || 'N/A');
                    }) 
                    .addColumn('AddedBy', (col) => {
                        return ucwords(col.addedBy || 'N/A');
                    }) 
                    .addColumn('createdAt', (col) => {
                        return dateToISO8601Formatter(col.createdAt?.toDate?.() || col.createdAt || '');
                    })
                    .addColumn('updatedAt', (col) => {
                        return dateToISO8601Formatter(col.updatedAt?.toDate?.() || col.updatedAt || '');
                    })
            
                    .make();
            
                return res.status(200).json({
                    status: 'success',
                    message: 'Departments retrieved successfully.',
                    data: departments
                });
            } catch (error) {
                if (error instanceof Exception && config.APP.APP_DEBUG) {
                    error.mexLogger();
                }
                return res.status((error.status || 500)).json({
                    status: 'error',
                    message: error.message || 'Something went wrong. Please try again later.',
                    code: error.code || 'INTERNAL_SERVER_ERROR',
                    title: error.title || 'Unexpected Error'
                });
            }
        }

        return res.render("crm/hrm/departments", {
            title: `${ config.APP.APP_NAME } || HRM`,
            user: req.session.user, 
        });
    }

    static async createDepartment(req, res) {
        try {
            if (isAjaxRequest(req)) {
                const post = req.body;
                let user = req.session.user; 

                if (!post.departmentName || post.departmentName.trim() === "") {
                    throw new Exception(
                        201,
                        "DEPARTMENT_NAME_REQUIRED",
                        LANG_EN.req.department_name_required,
                        "Missing department name"
                    );
                }
    
                if (post.departmentCode && post.departmentCode.length > 10) {
                    throw new Exception(
                        201,
                        "DEPARTMENT_CODE_INVALID",
                        LANG_EN.req.department_code_too_long,
                        "Department code too long"
                    );
                }
    
                if (post.departmentHead && isNaN(post.departmentHead)) {
                    throw new Exception(
                        201,
                        "DEPARTMENT_HEAD_INVALID",
                        LANG_EN.req.department_head_invalid,
                        "Invalid department head ID"
                    );
                }
    
                if (post.departmentDescription && post.departmentDescription.length > 500) {
                    throw new Exception(
                        201,
                        "DEPARTMENT_DESCRIPTION_TOO_LONG",
                        LANG_EN.req.department_description_too_long,
                        "Description too long"
                    );
                }

                const finalPayload = {
                    userLoggedInUserName: user.name,
                    userLoggedInUid: user.uid,
                    ...post
                }

                const result = await HRMUtil.createDepartmentQuery(finalPayload);
    
                if (!result) {
                    throw new Exception(
                        500,
                        "DEPARTMENT_CREATE_FAILED",
                        LANG_EN.error.department_creation_failed,
                        "Database Error"
                    );
                }
    
                return res.status(200).json({
                    status: 'success',
                    message: LANG_EN.success.department_created,
                    data: result,
                });
            }    
        } catch (error) {
            console.log(error.message);
            if (error instanceof Exception && config.APP.APP_DEBUG) { 
                error.mexLogger();
            }

            return res.status((error.status || 500)).json({
                status: 'error',
                message: error.message || 'Something went wrong. Please try again later.',
                code: error.code ||  'INTERNAL_SERVER_ERROR',
                title: error.title || 'Unexpected Error'
            });
        } 
    }

    static async designations(req, res) { 
        let user = req.session.user;

        if (isAjaxRequest(req)) {
            try {
                let designations = await HRMUtil.getAllDesignations(req?.redis, req.query);

                let mex = new mexDtParser(designations);

                designations = mex 
                    .addColumn('actions', (col) => {
                        let actions = '';
                        let id = col['id'] || col['uid'];

                        if (hasPermission(user?.permissions || [], 'designations.edit')) {
                            actions += `<a class="btn btn-sm dropdown-item" href="javascript:void(0)" data-id="${id}">
                                <i class="fas fa-edit me-1"></i> Edit
                            </a>`;
                        }

                        if (hasPermission(user?.permissions || [], 'designations.delete')) {
                            actions += `<a class="btn btn-sm dropdown-item delete" href="javascript:void(0)" data-id="${id}">
                                <i class="fas fa-trash-alt me-1"></i> Delete
                            </a>`;
                        }

                        let actionDropdown = `
                            <div class="dropdown">
                                <button class="btn btn-secondary btn-xs dropdown-toggle" type="button" id="triggerId"
                                    data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                    Actions
                                </button>
                                <div class="dropdown-menu action-btns" aria-labelledby="triggerId">
                                    ${actions}
                                </div>
                            </div>
                        `;
                        
                        return actionDropdown;
                    }) 
                    .addColumn('Name', (col) => {
                        return ucwords(col.designationName || 'N/A');
                    }) 
                    .addColumn('Code', (col) => {
                        return (col.designationCode || 'N/A').toUpperCase();
                    }) 
                    .addColumn('BasicSalary', (col) => {
                        let salary = col.basicSalary || '0';
                        return `KES ${Number(salary).toLocaleString()}`;
                    }) 
                    .addColumn('Description', (col) => {
                        return ucfirst(col.designationDescription || 'N/A');
                    }) 
                    .addColumn('AddedBy', (col) => {
                        return ucwords(col.addedBy || 'N/A');
                    }) 
                    .addColumn('createdAt', (col) => {
                        return dateToISO8601Formatter(col.createdAt?.toDate?.() || col.createdAt || '');
                    })
                    .addColumn('updatedAt', (col) => {
                        return dateToISO8601Formatter(col.updatedAt?.toDate?.() || col.updatedAt || '');
                    }) 
                    .make();

                return res.status(200).json({
                    status: 'success',
                    message: 'Designations retrieved successfully.',
                    data: designations
                });

            } catch (error) {
                if (error instanceof Exception && config.APP.APP_DEBUG) {
                    error.mexLogger();
                }

                return res.status((error.status || 500)).json({
                    status: 'error',
                    message: error.message || 'Something went wrong. Please try again later.',
                    code: error.code || 'INTERNAL_SERVER_ERROR',
                    title: error.title || 'Unexpected Error'
                });
            }

        } 

        return res.render("crm/hrm/designations", {
            title: `${ config.APP.APP_NAME } || HRM`,
            user: req.session.user
        });
    }

    static async createDesignation(req, res) { 
        try {
            if (isAjaxRequest(req)) {
                const post = req.body;
                let user = req.session.user; 
                
                if (!post.designationName || post.designationName.trim() === "") {
                    throw new Exception(
                        201,
                        "DESIGNATION_NAME_REQUIRED",
                        LANG_EN.req.designation_name_required,
                        "Missing designation name"
                    );
                }

                if (post.designationCode && post.designationCode.length > 10) {
                    throw new Exception(
                        201,
                        "DESIGNATION_CODE_INVALID",
                        LANG_EN.req.designation_code_too_long,
                        "Designation code too long"
                    );
                } 

                if (post.basicSalary && (isNaN(post.basicSalary) || post.basicSalary < 0)) {
                    throw new Exception(
                        201,
                        "BASIC_SALARY_INVALID",
                        LANG_EN.req.basic_salary_invalid,
                        "Invalid basic salary value"
                    );
                }

                if (post.designationDescription && post.designationDescription.length > 500) {
                    throw new Exception(
                        201,
                        "DESIGNATION_DESCRIPTION_TOO_LONG",
                        LANG_EN.req.designation_description_too_long,
                        "Description too long"
                    );
                }

                const finalPayload = {
                    userLoggedInUserName: user.name,
                    userLoggedInUid: user.uid,
                    ...post
                }

                const result = await HRMUtil.createDesignationQuery(finalPayload);

                if (!result) {
                    throw new Exception(
                        500,
                        "DESIGNATION_CREATE_FAILED",
                        LANG_EN.error.designation_creation_failed,
                        "Database Error"
                    );
                }
                
                return res.status(200).json({
                    status: 'success',
                    message: LANG_EN.success.designation_created,
                    data: result,
                });
            } 
        } catch (error) {
            console.log(error);
            if (error instanceof Exception && config.APP.APP_DEBUG) { 
                error.mexLogger();
            }

            return res.status((error.status || 500)).json({
                status: 'error',
                message: error.message || 'Something went wrong. Please try again later.',
                code: error.code ||  'INTERNAL_SERVER_ERROR',
                title: error.title || 'Unexpected Error'
            });
        } 
    }

    static async employeeAttendance(req, res) { 
        let user = req.session.user;

        if (isAjaxRequest(req)) {
            try {
                let attendanceRecords = await HRMUtil.getAllAttendanceRecords(req?.redis, req.query);
                    
                let mex = new mexDtParser(attendanceRecords);
            
                attendanceRecords = mex 
                    .addColumn('actions', (col) => {
                        let actions = '';
                        let id = col['id'] || col['uid'];
                        if (hasPermission(user?.permissions || [], 'hrm.attendance.edit')) {
                            actions += `<a class="btn btn-sm dropdown-item" href="javascript:void(0)" data-id="${id}">
                                <i class="fas fa-edit me-1"></i> Edit
                            </a>`;
                        }
                        if (hasPermission(user?.permissions || [], 'hrm.attendance.delete')) {
                            actions += `<a class="btn btn-sm dropdown-item delete" href="javascript:void(0)" data-id="${id}">
                                <i class="fas fa-trash-alt me-1"></i> Delete
                            </a>`;
                        }
                        let actionDropdown = `
                            <div class="dropdown">
                                <button class="btn btn-secondary btn-xs dropdown-toggle" type="button" id="triggerId"  
                                    data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                    Actions
                                </button>  
                                <div class="dropdown-menu action-btns" aria-labelledby="triggerId">
                                    ${actions}
                                </div>
                            </div>
                        `;
                        return actionDropdown;
                    }) 
                    .addColumn('Employee', (col) => {
                        return ucwords(col.employeeName || (col.user.firstName + " " + col.user.lastName)  || 'N/A');
                    }) 
                    .editColumn('attendanceDate', (col) => {
                        return dateToISO8601Formatter(col?.toDate?.() || col || '');
                    }) 
                    .editColumn('shift', (col) => {
                        return ucfirst(col.shift || 'N/A');
                    }) 
                    .editColumn('attendanceStatus', (col) => {  
                        col = col ? col.attendanceStatus : 'inactive';

                        if (col === 'present') {
                            return `<span class="badge text-dark bg-success">${ucfirst(col)}</span>`;
                        } else if (col === 'leave') {
                            return `<span class="badge text-dark bg-warning">${ucfirst(col)}</span>`;
                        } else if (col === 'absent') {
                            return `<span class="badge text-dark bg-danger">${ucfirst(col)}</span>`;
                        } else if (col === 'holiday') {
                            return `<span class="badge text-dark bg-danger">${ucfirst(col)}</span>`;
                        } else {
                            return `<span class="badge text-dark bg-warning">N/A</span>`;
                        } 
                    }) 
                    .addColumn('CheckIn', (col) => {
                        return col.clockInTime || 'N/A';
                    }) 
                    .addColumn('CheckOut', (col) => {
                        return col.clockOutTime || 'N/A';   
                    })
                    .editColumn('remarks', (col) => {
                        return ucfirst(col || 'N/A');
                    }) 
                    .addColumn('AddedBy', (col) => {
                        return ucwords(col.addedBy || 'N/A');
                    }) 
                    .addColumn('createdAt', (col) => {
                        return dateToISO8601Formatter(col.createdAt?.toDate?.() || col.createdAt || '');
                    })
                    .addColumn('updatedAt', (col) => {
                        return dateToISO8601Formatter(col.updatedAt?.toDate?.() || col.updatedAt || '');
                    }) 
                    .make();

                return res.status(200).json({
                    status: 'success',
                    message: 'Attendance records retrieved successfully.',
                    data: attendanceRecords
                });
            } catch (error) {
                if (error instanceof Exception && config.APP.APP_DEBUG) {
                    error.mexLogger();
                }
                return res.status((error.status || 500)).json({
                    status: 'error',
                    message: error.message || 'Something went wrong. Please try again later.',
                    code: error.code || 'INTERNAL_SERVER_ERROR',
                    title: error.title || 'Unexpected Error'
                });
            }   
        }   
        
        // Get shifts data
        const shiftsData = await Attendance.getAllShifts(req.redis);

        // users
        const employeesData = await employees(req.redis);

        return res.render("crm/hrm/attendance", {
            title: `${ config.APP.APP_NAME } || List Attendance`,
            user: user, 
            shifts: shiftsData,
            employees: employeesData
        });
    }

    static async createAttendanceRecord(req, res) {
        try {  
            const post = req.body;
            let user = req.session.user; 
            
            if (!post.userId) {
                throw new Exception(
                    201,
                    "EMPLOYEE_ID_INVALID",
                    LANG_EN.req.employee_id_invalid,
                    "Invalid employee ID"
                );
            }
            
            if (!post.attendanceDate || isNaN(new Date(post.attendanceDate).getTime())) {
                throw new Exception(
                    201,
                    "ATTENDANCE_DATE_INVALID",
                    LANG_EN.req.attendance_date_invalid,
                    "Invalid attendance date"
                );
            }

            if (post.shiftType === 'custom') {
                if (!post.customShiftStart || isNaN(new Date(`1970-01-01T${post.customShiftStart}:00`).getTime())) {
                    throw new Exception(
                        201,
                        "CUSTOM_SHIFT_START_INVALID",
                        LANG_EN.req.custom_shift_start_invalid,
                        "Invalid custom shift start time"
                    );
                }

                if (!post.customShiftEnd || isNaN(new Date(`1970-01-01T${post.customShiftEnd}:00`).getTime())) {
                    throw new Exception(
                        201,
                        "CUSTOM_SHIFT_END_INVALID",
                        LANG_EN.req.custom_shift_end_invalid,
                        "Invalid custom shift end time"
                    );
                }

                if (new Date(`1970-01-01T${post.customShiftEnd}:00`).getTime() <= new Date(`1970-01-01T${post.customShiftStart}:00`).getTime()) {
                    throw new Exception(
                        201,
                        "CUSTOM_SHIFT_END_BEFORE_START",
                        LANG_EN.req.custom_shift_end_before_start,
                        "Custom shift end time must be after start time"
                    );
                }
            }

            if (!post.attendanceStatus || !['present', 'absent', 'leave', 'holiday'].includes(post.attendanceStatus)) {
                throw new Exception(
                    201,
                    "ATTENDANCE_STATUS_INVALID",
                    LANG_EN.req.attendance_status_invalid,
                    "Invalid attendance status"
                );
            }

            if (post.remarks && post.remarks.length > 500) {
                throw new Exception(
                    201,
                    "ATTENDANCE_REMARKS_TOO_LONG",
                    LANG_EN.req.attendance_remarks_too_long,
                    "Remarks too long"
                );
            }

            const finalPayload = {
                userLoggedInUserName: user.name,
                userLoggedInUid: user.uid,
                ...post
            };

            const result = await HRMUtil.createAttendanceRecordQuery(finalPayload);
            if (!result) {
                throw new Exception(
                    500,
                    "ATTENDANCE_RECORD_CREATE_FAILED",
                    LANG_EN.error.attendance_record_creation_failed,
                    "Database Error"
                );
            } 

            return res.status(200).json({
                status: 'success',
                message: LANG_EN.success.attendance_record_created,
                data: result,
            });  
        } catch (error) {
            console.log(error.message);
            if (error instanceof Exception && config.APP.APP_DEBUG) {
                error.mexLogger();
            }

            return res.status((error.status || 500)).json({
                status: 'error',
                message: error.message || 'Something went wrong. Please try again later.',
                code: error.code || 'INTERNAL_SERVER_ERROR',
                title: error.title || 'Unexpected Error'
            });
        }   
    }

    static async holidaysList(req, res) { 
        let user = req.session.user;

        if (isAjaxRequest(req)) {
            try {
                let holidays = await HRMUtil.getAllHolidays(req?.redis, req.query);

                let mex = new mexDtParser(holidays);

                holidays = mex 
                    .addColumn('actions', (col) => {
                        let actions = '';
                        let id = col['id'] || col['uid'];
                        if (hasPermission(user?.permissions || [], 'hrm.holidays.edit')) {
                            actions += `<a class="btn btn-sm dropdown-item" href="javascript:void(0)" data-id="${id}">
                                <i class="fas fa-edit me-1"></i> Edit
                            </a>`;
                        } 

                        if (hasPermission(user?.permissions || [], 'hrm.holidays.delete')) {
                            actions += `<a class="btn btn-sm dropdown-item delete" href="javascript:void(0)" data-id="${id}">
                                <i class="fas fa-trash-alt me-1"></i> Delete
                            </a>`;
                        }

                        let actionDropdown = `
                            <div class="dropdown">
                                <button class="btn btn-secondary btn-xs dropdown-toggle" type="button" id="triggerId"
                                    data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                    Actions
                                </button>
                                <div class="dropdown-menu action-btns" aria-labelledby="triggerId">
                                    ${actions}
                                </div>
                            </div>
                        `;
                        return actionDropdown;
                    }) 
                    .addColumn('Name', (col) => {
                        return ucwords(col.holidayName || 'N/A');
                    }) 
                    .addColumn('Type', (col) => {
                        let type = col.holidayType || 'N/A';
                        if (type === 'custom' && col.customHolidayType) {
                            type = `Custom (${ucwords(col.customHolidayType)})`;
                        }
                        return ucfirst(type);
                    }) 
                    .addColumn('StartDate', (col) => {
                        return dateToISO8601Formatter(col.startDate?.toDate?.() || col.startDate || '');    
                    })
                    .addColumn('EndDate', (col) => {
                        return dateToISO8601Formatter(col.endDate?.toDate?.() || col.endDate || '');    
                    })
                    .addColumn('Date', (col) => {
                        let start = dateToISO8601Formatter(col.startDate?.toDate?.() || col.startDate || '');    
                        let end = dateToISO8601Formatter(col.endDate?.toDate?.() || col.endDate || '');
                        if (start && end && start !== end) {
                            return `${start} to ${end}`;
                        }
                        return start || 'N/A';
                    })
                    .addColumn('Description', (col) => {
                        return ucfirst(col.holidayDescription || 'N/A');
                    }) 
                    .addColumn('AddedBy', (col) => {
                        return ucwords(col.addedBy || 'N/A');
                    }) 
                    .addColumn('createdAt', (col) => {
                        return dateToISO8601Formatter(col.createdAt?.toDate?.() || col.createdAt || '');
                    })
                    .addColumn('updatedAt', (col) => {
                        return dateToISO8601Formatter(col.updatedAt?.toDate?.() || col.updatedAt || '');
                    }) 
                    .make();

                return res.status(200).json({
                    status: 'success',
                    message: 'Holidays retrieved successfully.',
                    data: holidays
                });
            }
            catch (error) {
                if (error instanceof Exception && config.APP.APP_DEBUG) {
                    error.mexLogger();
                }

                return res.status((error.status || 500)).json({
                    status: 'error',
                    message: error.message || 'Something went wrong. Please try again later.',
                    code: error.code || 'INTERNAL_SERVER_ERROR',
                    title: error.title || 'Unexpected Error'
                });
            }   
        }
        
        // users
        const employeesData = await employees(req.redis);

        return res.render("crm/hrm/holidays", {
            title: `${ config.APP.APP_NAME } || List Holidays`,
            user: user,  
            employees: employeesData
        });
    }

    static async createHoliday(req, res) {
        try { 
            const post = req.body;
            let user = req.session.user; 

            if (!post.holidayName || post.holidayName.trim() === "") {
                throw new Exception(
                    201,
                    "HOLIDAY_NAME_REQUIRED",
                    LANG_EN.req.holiday_name_required,
                    "Missing holiday name"
                );
            }

            if (!post.startDate || isNaN(new Date(post.startDate).getTime())) {
                throw new Exception(
                    201,
                    "HOLIDAY_START_DATE_INVALID",
                    LANG_EN.req.holiday_start_date_invalid,
                    "Invalid holiday start date"
                );
            }   

            if (post.endDate && isNaN(new Date(post.endDate).getTime())) {
                throw new Exception(
                    201,
                    "HOLIDAY_END_DATE_INVALID",
                    LANG_EN.req.holiday_end_date_invalid,
                    "Invalid holiday end date"
                );
            }

            if (!post.holidayType || (post.holidayType !== 'public' && post.holidayType !== 'company' && post.holidayType !== 'custom')) {
                throw new Exception(
                    201,
                    "HOLIDAY_TYPE_INVALID",
                    LANG_EN.req.holiday_type_invalid,
                    "Invalid holiday type"
                );
            }

            if (post.holidayType === 'custom' && (!post.customHolidayType || post.customHolidayType.trim() === "")) {
                throw new Exception(
                    201,
                    "CUSTOM_HOLIDAY_TYPE_REQUIRED",
                    LANG_EN.req.custom_holiday_type_required,
                    "Missing custom holiday type"
                );
            }

            if (post.holidayDescription && post.holidayDescription.length > 500) {
                throw new Exception(
                    201,
                    "HOLIDAY_DESCRIPTION_TOO_LONG",
                    LANG_EN.req.holiday_description_too_long,
                    "Description too long"
                );
            }
            
            const finalPayload = {
                userLoggedInUserName: user.name,
                userLoggedInUid: user.uid,
                ...post
            }

            const result = await HRMUtil.createHolidayQuery(finalPayload);
            if (!result) {
                throw new Exception(
                    500,
                    "HOLIDAY_CREATE_FAILED",
                    LANG_EN.error.holiday_creation_failed,
                    "Database Error"
                );
            }

            return res.status(200).json({
                status: 'success',
                message: LANG_EN.success.holiday_created,
                data: result,
            }); 
        } catch (error) {
            console.log(error.message);
            if (error instanceof Exception && config.APP.APP_DEBUG) { 
                error.mexLogger();
            }

            return res.status((error.status || 500)).json({
                status: 'error',
                message: error.message || 'Something went wrong. Please try again later.',
                code: error.code ||  'INTERNAL_SERVER_ERROR',
                title: error.title || 'Unexpected Error'
            });
        }
    }

    static async leavesList(req, res) { 
        let user = req.session.user;

        if (isAjaxRequest(req)) {
            try {
                let leaves = await HRMUtil.getAllLeaveRequests(req?.redis, req.query);
                let mex = new mexDtParser(leaves);
                leaves = mex 
                    .addColumn('actions', (col) => {
                        let actions = '';
                        let id = col['id'] || col['uid'];
                        if (hasPermission(user?.permissions || [], 'hrm.leaves.edit')) {
                            actions += `<a class="btn btn-sm dropdown-item" href="javascript:void(0)" data-id="${id}">
                                <i class="fas fa-edit me-1"></i> Edit
                            </a>`;
                        }

                        if (hasPermission(user?.permissions || [], 'hrm.leaves.delete')) {
                            actions += `<a class="btn btn-sm dropdown-item delete" href="javascript:void(0)" data-id="${id}">
                                <i class="fas fa-trash-alt me-1"></i> Delete
                            </a>`;
                        }

                        let actionDropdown = `
                            <div class="dropdown">
                                <button class="btn btn-secondary btn-xs dropdown-toggle" type="button" id="triggerId"
                                    data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                    Actions
                                </button>
                                <div class="dropdown-menu action-btns" aria-labelledby="triggerId">
                                    ${actions}
                                </div>
                            </div>
                        `;
                        return actionDropdown;
                    }) 
                    .addColumn('Employee', (col) => {
                        return ucwords(col.employeeName || (col.user.firstName + " " + col.user.lastName)  || 'N/A');
                    }) 
                    .addColumn('LeaveType', (col) => {
                        let type = col.leaveType || 'N/A';
                        if (type === 'custom' && col.customLeaveType) {
                            type = `Custom (${ucwords(col.customLeaveType)})`;
                        }
                        return ucfirst(type);
                    }) 
                    .editColumn('startDate', (col) => {
                        return dateToISO8601Formatter(col?.toDate?.() || col || '');
                    })
                    .editColumn('endDate', (col) => {
                        return dateToISO8601Formatter(col?.toDate?.() || col || '');
                    })
                    .addColumn('Date', (col) => {
                        let start = dateToISO8601Formatter(col.startDate?.toDate?.() || col.startDate || '');
                        let end = dateToISO8601Formatter(col.endDate?.toDate?.() || col.endDate || '');
                        if (start && end && start !== end) {
                            return `${start} to ${end}`;
                        }
                        return start || 'N/A';
                    })
                    .editColumn('reason', (col) => {
                        return ucfirst(col || 'N/A');
                    }) 
                    .editColumn('status', (col) => {  
                        col = col ? col : 'pending'; 
                        if (col.toLowerCase() === 'approved') {
                            return `<span class="badge text-dark bg-success">${ucfirst(col)}</span>`;
                        } else if (col.toLowerCase() === 'rejected') {
                            return `<span class="badge text-dark bg-danger">${ucfirst(col)}</span>`;
                        } else {
                            return `<span class="badge text-dark bg-warning">${ucfirst(col)}</span>`;
                        }
                    }) 
                    .addColumn('addedBy', (col) => {
                        return ucwords(col || 'N/A');
                    }) 
                    .addColumn('createdAt', (col) => {
                        return dateToISO8601Formatter(col.createdAt?.toDate?.() || col.createdAt || '');
                    })
                    .addColumn('updatedAt', (col) => {
                        return dateToISO8601Formatter(col.updatedAt?.toDate?.() || col.updatedAt || '');
                    }) 
                    .make();

                return res.status(200).json({
                    status: 'success',
                    message: 'Leave requests retrieved successfully.',
                    data: leaves
                });
            }   
            catch (error) {
                if (error instanceof Exception && config.APP.APP_DEBUG) {
                    error.mexLogger();
                }   

                return res.status((error.status || 500)).json({
                    status: 'error',
                    message: error.message || 'Something went wrong. Please try again later.',
                    code: error.code || 'INTERNAL_SERVER_ERROR',
                    title: error.title || 'Unexpected Error'
                });
            }

        } 

        const leaveTypes = await Leave.getAllLeaveTypes(); 
        const leaveStatuses = await Leave.getAllLeaveStatuses(); 

        // Get shifts data
        const shiftsData = await Attendance.getAllShifts(req.redis);

        // users
        const employeesData = await employees(req.redis);
        
        return res.render("crm/hrm/leaves", {
            title: `${ config.APP.APP_NAME } || List Leave Requests`,
            user: user, 
            leaveTypes: leaveTypes,
            leaveStatuses: leaveStatuses,
            shifts: shiftsData,
            employees: employeesData
        });
    }

    static async createLeaveRequest(req, res) {
        try { 
            const post = req.body;
            let user = req.session.user;

            if (!post.employeeId) {
                throw new Exception(
                    201,
                    "EMPLOYEE_ID_INVALID",
                    LANG_EN.req.employee_id_invalid,
                    "Invalid employee ID"
                );
            }

            if (!post.startDate || isNaN(new Date(post.startDate).getTime())) {
                throw new Exception(
                    201,
                    "LEAVE_START_DATE_INVALID",
                    LANG_EN.req.leave_start_date_invalid,
                    "Invalid leave start date"
                );
            }

            if (post.endDate && isNaN(new Date(post.endDate).getTime())) {
                throw new Exception(
                    201,
                    "LEAVE_END_DATE_INVALID",
                    LANG_EN.req.leave_end_date_invalid,
                    "Invalid leave end date"
                );
            }

            const leaveTypes = await Leave.getAllLeaveTypes(); 
            if (!leaveTypes.some(type => type.slug === post.leaveType)) {
                throw new Exception(
                    201,
                    "LEAVE_TYPE_INVALID",
                    LANG_EN.req.leave_type_invalid,
                    "Invalid leave type"
                );
            }   

            if (post.leaveType === 'custom' && (!post.customLeaveType || post.customLeaveType.trim() === "")) {
                throw new Exception(
                    201,
                    "CUSTOM_LEAVE_TYPE_REQUIRED",
                    LANG_EN.req.custom_leave_type_required,
                    "Missing custom leave type"
                );
            }

            if (!post.reason || post.reason.trim() === "") {
                throw new Exception(
                    201,
                    "LEAVE_REASON_REQUIRED",
                    LANG_EN.req.leave_reason_required,
                    "Missing leave reason"
                );
            }

            if (post.reason && post.reason.length > 500) {
                throw new Exception(
                    201,
                    "LEAVE_REASON_TOO_LONG",
                    LANG_EN.req.leave_reason_too_long,
                    "Leave reason too long"
                );
            }
            
            let attachment = '';
            let fileUploadToFb = '';
            if (req.file && req.file?.fieldname == 'leaveAttachment') {  
                const uploadFilePath = handleFileUploads(req, 'docs/hrm/leaves'); 
                if (!uploadFilePath) {
                    throw new Exception(
                        500,
                        "LEAVE_ATTACHMENT_UPLOAD_FAILED",
                        LANG_EN.error.leave_attachment_upload_failed,
                        "File upload error"
                    );
                }
                
                attachment = path.relative(process.cwd(), (Array.isArray(uploadFilePath) ? uploadFilePath[0] : uploadFilePath)).replace(/\\/g, "/");
                const FBUTIL = new FirebaseUtility();
                fileUploadToFb = await FBUTIL.uploadFile(attachment, "company/yohpal/hrm/leaves", {
                    linkType: "firebase",
                    makePublic: true
                }); 
                if (!fileUploadToFb) {
                    throw new Exception(
                        500,
                        "LEAVE_ATTACHMENT_UPLOAD_FAILED",
                        LANG_EN.error.leave_attachment_upload_failed,
                        "File upload error"
                    );
                } 
            }

            post.attachmentLocalPath = attachment.replace('public', ''); 
            post.fbAttachmentFbPath = fileUploadToFb;

            console.log("Attachments:", attachment); 
            const leaveStatuses = await Leave.getAllLeaveStatuses(); 
            if (!leaveStatuses.some(status => status === post.status)) {
                throw new Exception(
                    201,
                    "LEAVE_STATUS_INVALID",
                    LANG_EN.req.leave_status_invalid,
                    "Invalid leave status"
                );
            }

            const finalPayload = {
                userLoggedInUserName: user.name,
                userLoggedInUid: user.uid,
                ...post
            }

            const result = await HRMUtil.createLeaveRequestQuery(finalPayload);
            if (!result) {
                throw new Exception(
                    500,
                    "LEAVE_REQUEST_CREATE_FAILED",
                    LANG_EN.error.leave_request_creation_failed,
                    "Database Error"
                );
            }

            return res.status(200).json({
                status: 'success',
                message: LANG_EN.success.leave_request_created,
                data: result,
            }); 
        } catch (error) {
            console.log(error.message);
            if (error instanceof Exception && config.APP.APP_DEBUG) { 
                error.mexLogger();
            }

            return res.status((error.status || 500)).json({
                status: 'error',
                message: error.message || 'Something went wrong. Please try again later.',
                code: error.code ||  'INTERNAL_SERVER_ERROR',
                title: error.title || 'Unexpected Error'
            });
        }   
    } 

    static async payrollView(req, res) {
        let user = req.session.user;
        
        return res.render("crm/hrm/payroll", {
            title: `${ config.APP.APP_NAME } || List Payment Components`,
            user: user,  
        });
    }

    static async getPaymentComponents(req, res) {
        let user = req.session.user; 
        try {
            let components = await PayrollUtil.getAllPaymentComponents(req?.redis, req.query);
            let mex = new mexDtParser(components);

            components = mex
                .addColumn('actions', (col) => {
                    let actions = '';
                    let id = col['id'] || col['uid'];

                    if (hasPermission(user?.permissions || [], 'hrm.payments.components.edit')) {
                        actions += `<a class="btn btn-sm dropdown-item" href="javascript:void(0)" data-id="${id}">
                            <i class="fas fa-edit me-1"></i> Edit
                        </a>`;
                    }

                    if (hasPermission(user?.permissions || [], 'hrm.payments.components.delete')) {
                        actions += `<a class="btn btn-sm dropdown-item delete" href="javascript:void(0)" data-id="${id}">
                            <i class="fas fa-trash-alt me-1"></i> Delete
                        </a>`;
                    }

                    return `
                        <div class="dropdown">
                            <button class="btn btn-secondary btn-xs dropdown-toggle" type="button" id="triggerId"
                                data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                Actions
                            </button>
                            <div class="dropdown-menu action-btns" aria-labelledby="triggerId">
                                ${actions}
                            </div>
                        </div>
                    `;
                })
                .editColumn('componentName', (col) => {
                    return ucwords(col || 'N/A');
                })
                .editColumn('componentCode', (col) => {
                    return ucwords(col || 'N/A');
                })
                .editColumn('componentDescription', (col) => {
                    return ucfirst(col || 'N/A');
                })
                .editColumn('componentCategory', (col) => {
                    return ucfirst(col || 'N/A');
                })
                .editColumn('componentScope', (col) => {
                    return ucfirst(col || 'N/A');
                })
                .editColumn('componentType', (col) => {
                    return ucfirst(col || 'N/A');
                })
                .addColumn('rate', (col) => {
                    let rate = col?.componentRate ?? 'N/A';
                    let type = col?.rateType === 'percentage' ? '%' : '';
                    return `${rate}${type}`;
                })
                .editColumn('addedBy', (col) => {
                    return ucwords(col || 'N/A');
                })
                .editColumn('createdAt', (col) => {
                    return dateToISO8601Formatter(col?.toDate?.() || col || '');
                })
                .addColumn('updatedAt', (col) => {
                    return dateToISO8601Formatter(col?.toDate?.() || col || '');
                })
                .make();

            return res.status(200).json({
                status: 'success',
                message: 'Payment components retrieved successfully.',
                data: components
            });
        }
        catch (error) {
            if (error instanceof Exception && config.APP.APP_DEBUG) {
                error.mexLogger();
            }

            return res.status(error.status || 500).json({
                status: 'error',
                message: error.message || 'Something went wrong. Please try again later.',
                code: error.code || 'INTERNAL_SERVER_ERROR',
                title: error.title || 'Unexpected Error'
            });
            } 
    }

    static async createPaymentComponent(req, res) {
        try {
            const post = req.body;
            const user = req.session.user;
            
            if (!post.componentName || post.componentName.trim() === "") {
                throw new Exception(
                    201,
                    "COMPONENT_NAME_REQUIRED",
                    LANG_EN.req.component_name_required,
                    "Component name is required"
                );
            }

            if (!post.componentType || !["earning", "deduction"].includes(post.componentType)) {
                throw new Exception(
                    201,
                    "COMPONENT_TYPE_INVALID",
                    LANG_EN.req.component_type_invalid,
                    "Invalid component type"
                );
            }
            
            if (post.componentScope && !["none", "tier", "bracket"].includes(post.componentScope)) {
                throw new Exception(
                    201,
                    "COMPONENT_SCOPE_INVALID",
                    LANG_EN.req.component_scope_invalid,
                    "Invalid component scope"
                );
            }
            
            if (post.componentRate) {
                if (isNaN(post.componentRate) || Number(post.componentRate) < 0) {
                    throw new Exception(
                        201,
                        "COMPONENT_RATE_INVALID",
                        LANG_EN.req.component_rate_invalid,
                        "Invalid component rate"
                    );
                }
            }

            if (post.rateType && !["value", "percentage"].includes(post.rateType)) {
                throw new Exception(
                    201,
                    "RATE_TYPE_INVALID",
                    LANG_EN.req.rate_type_invalid,
                    "Invalid rate type"
                );
            }

            if (post.componentCategory && !["basic", "allowance", "bonus", "tax", "benefit", "other"].includes(post.componentCategory)) {
                throw new Exception(
                    201,
                    "COMPONENT_CATEGORY_INVALID",
                    LANG_EN.req.component_category_invalid,
                    "Invalid component category"
                );
            }
            
            if (post.componentDescription && post.componentDescription.length > 1000) {
                throw new Exception(
                    201,
                    "COMPONENT_DESCRIPTION_TOO_LONG",
                    LANG_EN.req.component_description_too_long,
                    "Component description too long"
                );
            }
            
            const finalPayload = {
                userLoggedInUserName: user.name,
                userLoggedInUid: user.uid,
                ...post
            }
            
            const result = await PayrollUtil.createPaymentComponentQuery(finalPayload);
            if (!result) {
                throw new Exception(
                    500,
                    "PAYMENT_COMPONENT_CREATE_FAILED",
                    LANG_EN.error.payment_component_creation_failed,
                    "Database error creating payment component"
                );
            }
            
            return res.status(200).json({
                status: "success",
                message: LANG_EN.success.payment_component_created,
                data: result,
            });
        } catch (error) {
            console.log(error.message);
            if (error instanceof Exception && config.APP.APP_DEBUG) {
                error.mexLogger();
            }

            return res.status(error.status || 500).json({
                status: "error",
                message: error.message || "Something went wrong. Please try again later.",
                code: error.code || "INTERNAL_SERVER_ERROR",
                title: error.title || "Unexpected Error",
            });
        }
    }
}

export default HRMController;