import RolesUtil from '@utils/RolesUtil'; 

async function getAllRoles() {
    return await RolesUtil.getAllRoles();
}

export default {
    getAllRoles
};  