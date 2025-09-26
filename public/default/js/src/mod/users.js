class User extends Master {
    constructor() {
        super();
    }

    createInHouseUser() {
        let btn = document.querySelector('.create-user-submit-btn');
        if (!documentContains(btn)) return;
        btn = cloneNodeElement(btn);

        btn.addEventListener('click', async event => {
            event.preventDefault();
            toggleButtonContent(btn);
            disableElement(btn);

            let form = btn.closest('form');
            let data = new FormData(form);

            try {
                const res = await fetch(formRouteParser(form), {
                    method: form.method || 'POST',
                    credentials: 'include',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: data
                });

                toggleButtonContent(btn, '', true);
                enableElement(btn);

                if (!res.ok) {
                    toast('error', 5000, lang.undefined_error);
                    return;
                }

                const response = await res.json();
                console.log(response);

                if (response?.status === 'success') {
                    resetFormAndCloseModal(form);
                    toast(response.status, 5000, response.message || lang.undefined_error);
                    setTimeout(() => {
                        if (response.route) route(response.route);
                    }, 2000);
                    return;
                }

                if (response?.status === 'error') {
                    toast(response.status, 5000, response.message || lang.undefined_error);
                    return;
                }

                toast('error', 5000, lang.undefined_error);

            } catch (error) {
                console.log(error.message || error);
                toggleButtonContent(btn, '', true);
                enableElement(btn);
                toast('error', 5000, lang.undefined_error);
            }
        });
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
                { data: 'roleName', defaultContent: 'N/A' },
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
    inst.createInHouseUser(); 
});