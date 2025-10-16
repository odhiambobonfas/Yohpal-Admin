class Payroll extends HRM {
    constructor () {
        super();
        this.createPaymentComponentBtns = document.querySelectorAll('.create-component-submit-btn');
        this.createBracketScopeBtns = document.querySelectorAll('.create-bracket-submit-btn');
        this.createTierScopeBtns = document.querySelectorAll('.create-tier-submit-btn');
    }

    createPaymentComponent() {
        const btns = this.createPaymentComponentBtns;
        btns.forEach(btn => {
            if (!documentContains(btn)) return;  
            btn = cloneNodeElement(btn); // counter race conditions
            btn.addEventListener('click', async (event) => { 
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
                            'Content-Type': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest', 
                        },
                        body: jsonifyFormData(data)
                    });
                    enableElement(btn); 
                    toggleButtonContent(btn, '', true);
                    if (!res.ok) {
                        toast('error', 5000, LANG_EN.undefined_error);
                        return;
                    }
                    const response = await res.json();
                    console.log(response);
                    if (response?.status === 'success') {
                        resetFormAndCloseModal(form);
                        toast(response.status, 5000, response.message || LANG_EN.undefined_error); 
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
        });
    }

    paymentComponentsListing() {
        $('.components-table').DataTable({
            destroy: true,
            paging: true,
            searching: true,
            ordering: true,
            info: true,
            lengthChange: true,
            ajax: ajaxDtParser(
                'GET', 
                '/payroll/components', 
                filtersParser('.paymentComponentsFilters')
            ), 
            columns: [
                {
                    data: 'actions',
                    orderable: false,
                    searchable: false
                }, 
                { data: 'componentName' },  
                { data: 'componentType' },  
                { data: 'componentScope' },  
                { data: 'componentCode' }, 
                { data: 'rate' }, 
                { data: 'componentCategory' }, 
                { data: 'componentDescription' },
            ],
            fnDrawCallback: () => {
                const inst = new Payroll();
                inst.actionOnPaymentComponentsRes();
                watchFilterChanges('.paymentComponentsFilters', inst.paymentComponentsListing.bind(inst));
            },
        });
    }

    actionOnPaymentComponentsRes() {
        // ...
    }

    createBracketScope() {
        const btns = this.createBracketScopeBtns;
        btns.forEach(btn => {
            if (!documentContains(btn)) return;  
            btn = cloneNodeElement(btn); // counter race conditions
            btn.addEventListener('click', async (event) => { 
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
                            'Content-Type': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest', 
                        },
                        body: jsonifyFormData(data)
                    });
                    enableElement(btn); 
                    toggleButtonContent(btn, '', true);
                    if (!res.ok) {
                        toast('error', 5000, LANG_EN.undefined_error);
                        return;
                    }
                    const response = await res.json();
                    console.log(response);
                    if (response?.status === 'success') {
                        resetFormAndCloseModal(form);
                        toast(response.status, 5000, response.message || LANG_EN.undefined_error); 
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
        });
    }

    bracketScopesListing() {
        $('.brackets-table').DataTable({
            destroy: true,
            paging: true,
            searching: true,
            ordering: true,
            info: true,
            lengthChange: true,
            ajax: ajaxDtParser(
                'GET', 
                '/payroll/brackets', 
                filtersParser('.bracketScopesFilters')
            ), 
            columns: [
                {
                    data: 'actions',
                    orderable: false,
                    searchable: false
                }, 
                { data: 'essentials' },  
            ],
            fnDrawCallback: () => {
                const inst = new Payroll();
                inst.actionOnPaymentComponentsRes();
                watchFilterChanges('.bracketScopesFilters', inst.paymentComponentsListing.bind(inst));
            },
        });
    }

    createTierScope() {
        const btns = this.createTierScopeBtns;
        btns.forEach(btn => {
            if (!documentContains(btn)) return;  
            btn = cloneNodeElement(btn); // counter race conditions
            btn.addEventListener('click', async (event) => { 
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
                            'Content-Type': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest', 
                        },
                        body: jsonifyFormData(data)
                    });
                    enableElement(btn); 
                    toggleButtonContent(btn, '', true);
                    if (!res.ok) {
                        toast('error', 5000, LANG_EN.undefined_error);
                        return;
                    }
                    const response = await res.json();
                    console.log(response);
                    if (response?.status === 'success') {
                        resetFormAndCloseModal(form);
                        toast(response.status, 5000, response.message || LANG_EN.undefined_error); 
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
        });
    }

    tierScopesListing() {
        $('.tiers-table').DataTable({
            destroy: true,
            paging: true,
            searching: true,
            ordering: true,
            info: true,
            lengthChange: true,
            ajax: ajaxDtParser(
                'GET', 
                '/payroll/tiers', 
                filtersParser('.tierScopesFilters')
            ),             
            columns: [
                {
                    data: 'actions',
                    orderable: false,
                    searchable: false
                }, 
                { data: 'essentials' },  
            ],
            fnDrawCallback: () => {
                const inst = new Payroll();
                inst.actionOnPaymentComponentsRes();
                watchFilterChanges('.tierScopesFilters', inst.paymentComponentsListing.bind(inst));
            },
        });
    }
}

document.addEventListener('DOMContentLoaded', async() => {
    const inst = new Payroll();
    inst.createPaymentComponent();
    inst.paymentComponentsListing();
    inst.createBracketScope();
    inst.createTierScope();
    inst.bracketScopesListing();
    inst.tierScopesListing();
});