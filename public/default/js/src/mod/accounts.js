class Account extends Master {
    constructor() {
        super();
        this.createAccountSubmitBtns = document.querySelectorAll('.create-account-submit-btn');
        this.createAccountCategorySubmitBtns = document.querySelectorAll('.create-account-category-submit-btn');
    }

    createAccountCategory() {
        let btns = this.createAccountCategorySubmitBtns;

        btns.forEach(btn => { 
            if (!documentContains(btn)) return;
            btn = cloneNodeElement(btn); // avoid race conditions

            btn.addEventListener('click', event => {
                event.preventDefault();
                toggleButtonContent(btn);
                disableElement(btn);

                let form = btn.closest('form');
                let data = new FormData(form); 

                fetch(formRouteParser(form), {
                    method: form.method || 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: jsonifyFormData(data)
                })
                .then(async res => {
                    let response;
                    try {
                        response = await res.json();
                    } catch (e) {
                        throw new Error(LANG_EN.res.invalid_json_exception);
                    }

                    console.log(response);
                    toggleButtonContent(btn, '', true);
                    enableElement(btn);

                    if (response && response.status === 'success') {
                        resetFormAndCloseModal(form);
                        toast(response.status, 5000, response.message || LANG_EN.undefined_error);
                        (new Account()).accountCategoriesListing();
                        return;
                    }

                    if (response && response.status === 'error') {
                        toast(response.status, 5000, response.message || LANG_EN.undefined_error);
                        return;
                    }

                    toast('error', 5000, LANG_EN.undefined_error);
                })
                .catch(error => {
                    console.error(error.message || error);
                    toggleButtonContent(btn, '', true);
                    enableElement(btn);
                    toast('error', 5000, LANG_EN.undefined_error);
                });
            }); 
        })
    }

    createAccount() {
        let btns = this.createAccountSubmitBtns;

        btns.forEach(btn => { 
            if (!documentContains(btn)) return;
            btn = cloneNodeElement(btn); // avoid race conditions

            btn.addEventListener('click', event => {
                event.preventDefault();
                toggleButtonContent(btn);
                disableElement(btn);

                let form = btn.closest('form');
                let data = new FormData(form);

                fetch(formRouteParser(form), {
                    method: form.method,
                    headers: { 
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: jsonifyFormData(data)
                })
                .then(async res => {
                    let response;
                    try {
                        response = await res.json();
                    } catch (e) {
                        throw new Error(LANG_EN.res.invalid_json_exception);
                    }

                    console.log(response);
                    toggleButtonContent(btn, '', true);
                    enableElement(btn);

                    if (response && response.status === 'success') {
                        resetFormAndCloseModal(form);
                        toast(response.status, 5000, response.message || LANG_EN.undefined_error);
                        (new Account()).accountsListing();
                        return;
                    }

                    if (response && response.status === 'error') {
                        toast(response.status, 5000, response.message || LANG_EN.undefined_error);
                        return;
                    }

                    toast('error', 5000, LANG_EN.undefined_error);
                })
                .catch(error => {
                    console.error(error.message || error);
                    toggleButtonContent(btn, '', true);
                    enableElement(btn);
                    toast('error', 5000, LANG_EN.undefined_error);
                });
            }); 
        })
    }

    accountCategoriesListing() {
        $('.account-categories-table').DataTable({
            destroy: true,
            paging: true,
            searching: true,
            ordering: true,
            info: true,
            lengthChange: true,
            ajax: ajaxDtParser(
                'GET', 
                '/accounts/categories', 
                filtersParser('.accountCategoriesFilters')
            ),             
            columns: [
                {
                    data: 'actions',
                    orderable: false,
                    searchable: false
                },   
                { data: 'name' }, 
                { data: 'code' }, 
                { data: 'description' }, 
                { data: 'createdAt' }, 
            ],
            fnDrawCallback: () => {
                const inst = new Account();
                inst.actionOnAccountRes();
                watchFilterChanges('.accountCategoriesFilters', inst.accountCategoriesListing.bind(inst));
            },
        });
    }

    accountsListing() {
        $('.payment-accounts-table').DataTable({
            destroy: true,
            paging: true,
            searching: true,
            ordering: true,
            info: true,
            lengthChange: true,
            ajax: ajaxDtParser(
                'GET', 
                '/accounts/list', 
                filtersParser('.accountsFilters')
            ),             
            // columns: [
            //     {
            //         data: 'actions',
            //         orderable: false,
            //         searchable: false
            //     },   
            // ],
            fnDrawCallback: () => {
                const inst = new Account();
                inst.actionOnAccountRes();
                watchFilterChanges('.accountsFilters', inst.accountsListing.bind(inst));
            },
        });
    }

    actionOnAccountRes() {
        // ...
    }
}

document.addEventListener('DOMContentLoaded', async() => {
    const inst = new Account();
    inst.createAccountCategory(); 
    inst.accountCategoriesListing(); 
    inst.createAccount(); 
    inst.accountsListing(); 
});