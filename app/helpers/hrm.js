import HRMUtil from '@utils/HRMUtil';

export async function departments(redis) { 
    const res = await HRMUtil.getAllDepartments(redis);
    return res;
} 

export async function designations(redis) { 
    const res = await HRMUtil.getAllDesignations(redis);
    return res;
} 

export async function employees(redis) { 
    const res = await HRMUtil.getAllEmployees(redis);
    return res;
}
