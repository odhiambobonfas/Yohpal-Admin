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

            console.log(data);

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
                        toast(response.status, 5000, response.message || lang.undefined_error);
                        return;
                    }

                    if (response && response.status && response.status == 'error') {
                        toast(response.status, 5000, response.message || lang.undefined_error);
                        return;
                    }

                    toast('error', 5000, lang.undefined_error);
                },
                error: error => {
                    console.log(error.message || error);
                    toggleButtonContent(btn, '', true);
                    enableElement(btn);
                    toast('error', 5000, lang.undefined_error);
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
        // ...
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const inst = new rbac();
    inst.createRoles();
    inst.getListRoles();
});