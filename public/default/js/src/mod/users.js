class User extends Master {
    constructor() {
        super();
    }

    getDepartmentDesignationArray(form) {
        const departments = form.querySelectorAll('.department');
        const designations = form.querySelectorAll('.designation');
      
        const result = [];
        for (let i = 0; i < departments.length; i++) {
          result.push({
            department: departments[i].value,
            designation: designations[i].value
          });
        }
        return result;
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

            // map departments and designations to array of objects
            const departments = data.getAll('departmentDesignationPair[department][]');
            const designations = data.getAll('departmentDesignationPair[designation][]');

            // Zip into pairs
            const pairs = departments.map((dept, i) => ({
                department: dept,
                designation: designations[i] ?? null
            }));

            data.append('departmentDesignationPairs', JSON.stringify(pairs));

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
                    toast('error', 5000, LANG_EN.undefined_error);
                    return;
                }

                const response = await res.json();
                console.log(response);

                if (response?.status === 'success') {
                    resetFormAndCloseModal(form);
                    toast(response.status, 5000, response.message || LANG_EN.undefined_error);
                    setTimeout(() => {
                        if (response.route) route(response.route);
                    }, 2000);
                    return;
                }

                if (response?.status === 'error') {
                    toast(response.status, 5000, response.message || LANG_EN.undefined_error);
                    return;
                }

                toast('error', 5000, LANG_EN.undefined_error);

            } catch (error) {
                console.log(error.message || error);
                toggleButtonContent(btn, '', true);
                enableElement(btn);
                toast('error', 5000, LANG_EN.undefined_error);
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
                    toast('error', 5000, LANG_EN.undefined_error);
                    return;
                }

                const response = await res.json();
                console.log(response);

                if (response?.status === 'success') { 
                    toast(response.status, 5000, response.message || LANG_EN.undefined_error);
                    setTimeout(() => {
                        if (response.route) route(response.route);
                    }, 2000);
                    return;
                }

                if (response?.status === 'error') {
                    toast(response.status, 5000, response.message || LANG_EN.undefined_error);
                    return;
                }

                toast('error', 5000, LANG_EN.undefined_error);

            } catch (error) {
                console.log(error.message || error);
                toggleButtonContent(btn, '', true);
                enableElement(btn);
                toast('error', 5000, LANG_EN.undefined_error);
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
        const btns = document.querySelectorAll('.users-table .action-btns');
        btns.forEach(btn => {
            if (!documentContains(btn)) return;
            btn = cloneNodeElement(btn);
            btn.addEventListener('click', (event) => { 
                toggleLoadingOverlay(true);
                let clickedBtn = event.target;
                let clickedId = clickedBtn.getAttribute('data-id');


                if (containsClass(clickedBtn, 'reset-pass')) this.sendResetPasswordEmailPrompt(btn, clickedId, {
                    title: LANG_EN.swal.reset_password_title,
                    text: LANG_EN.swal.ready_to_send_reset_password_email_prompt,
                    confirmButtonText: LANG_EN.swal.reset_password_confirm_btn,
                    cancelButtonText: LANG_EN.swal.reset_password_cancel_btn,
                });

                if (containsClass(clickedBtn, 'suspend')) this.updateUserStatus(btn, clickedId, 'suspended', {
                    title: LANG_EN.swal.suspend_users_title,
                    text: LANG_EN.swal.ready_to_suspend_user,
                    confirmButtonText: LANG_EN.swal.suspend_users_confirm_btn,
                    cancelButtonText: LANG_EN.swal.suspend_users_cancel_btn,
                });

                if (containsClass(clickedBtn, 'deactivate')) this.updateUserStatus(btn, clickedId, 'inactive', {
                    title: LANG_EN.swal.inactivate_users_title,
                    text: LANG_EN.swal.ready_to_inactivate_user,
                    confirmButtonText: LANG_EN.swal.inactivate_users_confirm_btn,
                    cancelButtonText: LANG_EN.swal.inactivate_users_cancel_btn,
                });

                if (containsClass(clickedBtn, 'activate')) this.updateUserStatus(btn, clickedId, 'active', {
                    title: LANG_EN.swal.activate_users_title,
                    text: LANG_EN.swal.ready_to_activate_user,
                    confirmButtonText: LANG_EN.swal.activate_users_confirm_btn,
                    cancelButtonText: LANG_EN.swal.activate_users_cancel_btn,
                });

                if (containsClass(clickedBtn, 'delete')) this.deleteUser(btn, clickedId, 'active', {
                    title: LANG_EN.swal.delete_users_title,
                    text: LANG_EN.swal.ready_to_delete_users,
                    confirmButtonText: LANG_EN.swal.delete_users_confirm_btn,
                    cancelButtonText: LANG_EN.swal.delete_users_cancel_btn,
                });
            });
        })
    }

    updateUserStatus(btn, id, status, swlObj) {
        Swal.fire({
            title: swlObj?.title,
            text: swlObj?.text,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: swlObj?.confirmButtonText,
            cancelButtonText: swlObj?.cancelButtonText || 'Cancel',
            customClass: {
                confirmButton: "btn btn-warning me-3",
                cancelButton: "btn btn-outline-secondary"
            },
            buttonsStyling: false,
            showClass: {
                popup: 'animate__animated animate__fadeInDown'
            },
            hideClass: {
                popup: 'animate__animated animate__fadeOutUp'
            },
        }).then((result) => {
            if (result.isConfirmed) {
                (new Master()).showOverlay();

                setTimeout(() => {
                    if (!documentContains) return;
                    let data = new FormData();
                    data.append('status', status); 

                    $.ajax({
                        type: 'PATCH',
                        url: `/users/update/${id}`,
                        data: jsonifyFormData(data),
                        dataType: 'json', 
                        contentType: 'application/json',
                        processData: false,
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest'
                        },
                        success: function (response) {
                            enableElement(btn);
                            console.log(response);
                            toggleButtonContent(btn, '', true);
                            (new Master()).hideOverlay();

                            if (response && response.status && response.status == 'success') {
                                (new User()).getListUsers();
                                toast(response.status, 5000, response.message || LANG_EN.undefined_error);
                                return;
                            }

                            if (response && response.status && response.status == 'error') {
                                toast(response.status, 5000, response.message || LANG_EN.undefined_error);
                                return;
                            }

                            toast('error', 5000, LANG_EN.undefined_error);
                        },
                        error: error => {
                            enableElement(btn);
                            toggleButtonContent(btn, '', true);
                            console.log(error.message || error);
                            (new Master()).hideOverlay();
                            toast('error', 5000, LANG_EN.undefined_error);
                        }
                    });
                }, 2000);
            }
        });
    }

    sendResetPasswordEmailPrompt(btn, id, swalData) {
        // ...
    }

    deleteUser(btn, id, status, swlObj) {
        Swal.fire({
            title: swlObj?.title,
            text: swlObj?.text,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: swlObj?.confirmButtonText,
            cancelButtonText: swlObj?.cancelButtonText || 'Cancel',
            customClass: {
                confirmButton: "btn btn-danger me-3",
                cancelButton: "btn btn-outline-secondary"
            },
            buttonsStyling: false,
            showClass: {
                popup: 'animate__animated animate__fadeInDown'
            },
            hideClass: {
                popup: 'animate__animated animate__fadeOutUp'
            },
        }).then((result) => {
            if (result.isConfirmed) {
                (new Master()).showOverlay();

                setTimeout(() => {
                    if (!documentContains) return; 
                    
                    $.ajax({
                        type: 'DELETE',
                        url: `/users/delete/${id}`, 
                        dataType: "json",
                        contentType: false,
                        processData: false,
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest'
                        },
                        success: function (response) {
                            enableElement(btn);
                            console.log(response);
                            toggleButtonContent(btn, '', true);
                            (new Master()).hideOverlay();

                            if (response && response.status && response.status == 'success') {
                                (new User()).getListUsers();
                                toast(response.status, 5000, response.message || LANG_EN.undefined_error);
                                return;
                            }

                            if (response && response.status && response.status == 'error') {
                                toast(response.status, 5000, response.message || LANG_EN.undefined_error);
                                return;
                            }

                            toast('error', 5000, LANG_EN.undefined_error);
                        },
                        error: error => {
                            enableElement(btn);
                            toggleButtonContent(btn, '', true);
                            console.log(error.message || error);
                            (new Master()).hideOverlay();
                            toast('error', 5000, LANG_EN.undefined_error);
                        }
                    });
                }, 2000);
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const inst = new User(); 
    inst.getListUsers();
    inst.createInHouseUser();
    inst.updateInHouseUser();
    
    // Enable image preview for profile picture input
    enableImagePreview('.profile_picture', '.profile_preview_div img', false);
    cloneDeptDesignationSection('.addDeptDesignBtn', '.deptxdesignWrapper', '.deptxdesign');
});