import RolesUtil from '@utils/RolesUtil'; 

async function getAllRoles() {
    return await RolesUtil.getAllRoles();
}

module.exports = {
    getAllRoles
};  