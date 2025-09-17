class rbac extends Master {
    constructor() {
        super();
    }

    getListRoles() { 
        $('.roles-table').DataTable({
            destroy: true,
            paging: true,
            searching: true,
            ordering: true,
            info: true,
            lengthChange: true,
            ajax: ajaxDtParser(
                'GET', 
                '/roles', 
                filtersParser('.rolesFilters')
            ),
            columns: [
                {
                    data: 'actions',
                    title: 'Action',
                    orderable: false,
                    searchable: false
                },
                {
                    data: 'name'
                },
                {
                    data: 'code'
                }, 
                {
                    data: 'status'
                },
                {
                    data: 'added_by'
                },
                {
                    data: 'description'
                }
            ],
            fnDrawCallback: () => {
                const inst = new rbac();
                inst.actionOnRolesRes();
                watchFilterChanges('.roles-filters', inst.getListRoles.bind(inst));
            },
            language: getDataTableLanguage(),
        });
    }

    actionOnRolesRes() {
        // ...
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const inst = new rbac();
    inst.getListRoles();
});