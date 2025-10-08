class Designation extends Master {
    constructor() {
        super();
        this.createDesignationBtns = document.querySelectorAll('.create-designation-submit-btn');
    }

    createDesignation() {
        const btns = this.createDesignationBtns;

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

    getDesignationListing() { 
        $('.designations-table').DataTable({
            destroy: true,
            paging: true,
            searching: true,
            ordering: true,
            info: true,
            lengthChange: true,
            ajax: ajaxDtParser(
                'GET', 
                '/institution/designations', 
                filtersParser('.designationsFilters')
            ), 
            columns: [
                { 
                    data: 'actions', 
                    orderable: false, 
                    searchable: false 
                },
                { data: 'Name' },
                { data: 'Code' },
                { data: 'BasicSalary' },
                { data: 'Description' },
            ],
            fnDrawCallback: () => {
                const inst = new Designation();
                inst.actionOnDesignationsRes(); 
                watchFilterChanges('.designationsFilters', inst.getDesignationListing.bind(inst));
            },
            language: getDataTableLanguage(),
        });
    }

    actionOnDesignationsRes() {
        // ...
    }
}

document.addEventListener('DOMContentLoaded', async() => {
    const inst = new Designation();
    inst.createDesignation();
    inst.getDesignationListing();
});