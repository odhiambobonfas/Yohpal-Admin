class rbac extends Master {
    constructor() {
        super();
    }
    
    /**
     * Ajax function that handles create roles requests.
     * 
     * @returns {JSON} json response which denotes true or success and other associated response needed.
     */
    createRoles() {
        let btn = document.querySelector('.create-roles-submit-btn');
        if (!documentContains(btn)) return; 
        btn = cloneNodeElement(btn);
        btn.addEventListener('click', event => {
            event.preventDefault();
            toggleButtonContent(btn);
            disableElement(btn);
            let form = btn.closest('form'); 
            let data = serializeFormToArray(form); 

            $.ajax({
                type: form.method,
                url: formRouteParser(form),
                data: data,
                dataType: "json", 
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                },
                success: function (response) {
                    console.log(response);
                    toggleButtonContent(btn, '', true);
                    enableElement(btn);

                    if (response && response.status && response.status == 'success') {
                        resetFormAndCloseModal(form);
                        toast(response.status, 5000, response.message || LANG_EN.undefined_error);
                        setTimeout(() => {
                            if(response.route) route(response.route);
                        }, 2000);
                        return;
                    }

                    if (response && response.status && response.status == 'error') {
                        toast(response.status, 5000, response.message || LANG_EN.undefined_error);
                        return;
                    }

                    toast('error', 5000, LANG_EN.undefined_error);
                },
                error: error => {
                    console.log(error.message || error);
                    toggleButtonContent(btn, '', true);
                    enableElement(btn);
                    toast('error', 5000, LANG_EN.undefined_error);
                }
            });
        });
    }
    
    /**
     * Ajax function that handles update roles requests.
     * 
     * @returns {JSON} json response which denotes true or success and other associated response needed.
     */
    updateRoles() {
        let btn = document.querySelector('.update-roles-submit-btn');
        if (!documentContains(btn)) return; 
        btn = cloneNodeElement(btn);
        btn.addEventListener('click', event => {
            event.preventDefault();
            toggleButtonContent(btn);
            disableElement(btn);
            let form = btn.closest('form'); 
            let data = serializeFormToArray(form); 

            $.ajax({
                type: form.method,
                url: formRouteParser(form),
                data: data,
                dataType: "json", 
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                },
                success: function (response) {
                    console.log(response);
                    toggleButtonContent(btn, '', true);
                    enableElement(btn);

                    if (response && response.status && response.status == 'success') { 
                        toast(response.status, 5000, response.message || LANG_EN.undefined_error);
                        setTimeout(() => {
                            if(response.route) route(response.route);
                        }, 2000);
                        return;
                    }

                    if (response && response.status && response.status == 'error') {
                        toast(response.status, 5000, response.message || LANG_EN.undefined_error);
                        return;
                    }

                    toast('error', 5000, LANG_EN.undefined_error);
                },
                error: error => {
                    console.log(error.message || error);
                    toggleButtonContent(btn, '', true);
                    enableElement(btn);
                    toast('error', 5000, LANG_EN.undefined_error);
                }
            });
        });
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
                    data: 'addedBy'
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
        const btns = document.querySelectorAll('.roles-table .action-btns');
        btns.forEach(btn => {
            if (!documentContains(btn)) return;
            btn = cloneNodeElement(btn);
            btn.addEventListener('click', (event) => {
                event.preventDefault();
                toggleLoadingOverlay(true);
                let clickedBtn = event.target;
                let clickedId = clickedBtn.getAttribute('data-id'); 

                if (containsClass(clickedBtn, 'suspend')) this.updateRoleStatus(btn, clickedId, 'suspended', {
                    title: LANG_EN.swal.suspend_role_title,
                    text: LANG_EN.swal.ready_to_suspend_role,
                    confirmButtonText: LANG_EN.swal.suspend_role_confirm_btn,
                    cancelButtonText: LANG_EN.swal.suspend_role_cancel_btn
                });

                if (containsClass(clickedBtn, 'deactivate')) this.updateRoleStatus(btn, clickedId, 'inactive', { 
                    title: LANG_EN.swal.inactivate_role_title,
                    text: LANG_EN.swal.ready_to_inactivate_role,
                    confirmButtonText: LANG_EN.swal.inactivate_role_confirm_btn,
                    cancelButtonText: LANG_EN.swal.inactivate_role_cancel_btn

                });

                if (containsClass(clickedBtn, 'activate')) this.updateRoleStatus(btn, clickedId, 'active', { 
                    title: LANG_EN.swal.activate_role_title,
                    text: LANG_EN.swal.ready_to_activate_role,
                    confirmButtonText: LANG_EN.swal.activate_role_confirm_btn,
                    cancelButtonText: LANG_EN.swal.activate_role_cancel_btn
                });

                if (containsClass(clickedBtn, 'delete')) this.deleteRole(btn, clickedId, 'active', {
                    title: LANG_EN.swal.delete_role_title,
                    text: LANG_EN.swal.ready_to_delete_role,
                    confirmButtonText: LANG_EN.swal.delete_role_confirm_btn,
                    cancelButtonText: LANG_EN.swal.delete_role_cancel_btn,
                });
            });
        })
    }
    
    updateRoleStatus(btn, id, status, swalConfig) {
        Swal.fire({
            title: swalConfig?.title,
            text: swalConfig?.text,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: swalConfig?.confirmButtonText,
            cancelButtonText: swalConfig?.cancelButtonText || 'Cancel',
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
                        url: `/roles/status/update/${id}`,
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
                                (new rbac()).getListRoles();
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

    deleteRole(btn, id, status, swalConfig) {
        // ...
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const inst = new rbac();
    inst.createRoles();
    inst.getListRoles();
    inst.updateRoles();
});