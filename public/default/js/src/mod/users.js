class User extends Master {
    constructor() {
        super();
    }

    createInHouseUser() {
        let btn = document.querySelector('.create-user-submit-btn');
        if (!documentContains(btn)) return;
        btn = cloneNodeElement(btn);

        // Handle form submission
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

    updateInHouseUser() {
        let btn = document.querySelector('.update-user-submit-btn');
        if (!documentContains(btn)) return;
        btn = cloneNodeElement(btn);

        // Handle form submission
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
                const btns = document.querySelectorAll('.usersTable .action-btns');
        btns.forEach(btn => {
            if (!documentContains(btn)) return;
            btn = cloneNodeElement(btn);
            btn.addEventListener('click', (event) => {
                event.preventDefault();
                toggleLoadingOverlay(true);
                let clickedBtn = event.target;
                let clickedId = clickedBtn.getAttribute('data-id');

                if (containsClass(clickedBtn, 'suspend')) this.updateUserStatus(btn, clickedId, 'suspended', {
                    title: lang.swal.suspend_users_title,
                    text: lang.swal.ready_to_suspend_user,
                    confirmButtonText: lang.swal.suspend_users_confirm_btn,
                    cancelButtonText: lang.swal.suspend_users_cancel_btn,
                });

                if (containsClass(clickedBtn, 'reset-pass')) this.sendResetPasswordEmailPrompt(btn, clickedId, {
                    title: lang.swal.reset_password_title,
                    text: lang.swal.ready_to_send_reset_password_email_prompt,
                    confirmButtonText: lang.swal.reset_password_confirm_btn,
                    cancelButtonText: lang.swal.reset_password_cancel_btn,
                });

                if (containsClass(clickedBtn, 'deactivate')) this.updateUserStatus(btn, clickedId, 'inactive', {
                    title: lang.swal.inactivate_users_title,
                    text: lang.swal.ready_to_inactivate_user,
                    confirmButtonText: lang.swal.inactivate_users_confirm_btn,
                    cancelButtonText: lang.swal.inactivate_users_cancel_btn,
                });

                if (containsClass(clickedBtn, 'activate')) this.updateUserStatus(btn, clickedId, 'active', {
                    title: lang.swal.activate_users_title,
                    text: lang.swal.ready_to_activate_user,
                    confirmButtonText: lang.swal.activate_users_confirm_btn,
                    cancelButtonText: lang.swal.activate_users_cancel_btn,
                });
            });
        })
    }

    updateUserStatus(btn, id, status, swalData) {
        // ...
    }

    sendResetPasswordEmailPrompt(btn, id, swalData) {
        // ...
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const inst = new User(); 
    inst.getListUsers();
    inst.createInHouseUser();
    inst.updateInHouseUser();
    
    // Enable image preview for profile picture input
    enableImagePreview('profile_picture', 'profile_preview');
 
});