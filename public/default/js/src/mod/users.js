class User extends Master {
    constructor() {
        super();
    }
    
    getListUsers() { 
        $('.users-table').DataTable({
            destroy: true,
            paging: true,
            searching: true,
            ordering: true,
            info: true,
            lengthChange: true,
            ajax: ajaxDtParser(
                'GET', 
                '/users', 
                filtersParser('.usersFilters')
            ), 
            columns: [
                { data: 'fullName',},
                { data: 'userName' },  
                { data: 'email' }, 
                { data: 'role', defaultContent: 'N/A' },
                { data: 'status'},
                { data: 'actions', orderable: false, searchable: false },
            ],
            fnDrawCallback: () => {
                const inst = new User();
                inst.actionOnUsersRes();
                watchFilterChanges('.usersFilters', inst.getListUsers.bind(inst));
            },
            language: getDataTableLanguage(),
        });
    }

    actionOnUsersRes() { 
        // 
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const inst = new User(); 
    inst.getListUsers(); 
});