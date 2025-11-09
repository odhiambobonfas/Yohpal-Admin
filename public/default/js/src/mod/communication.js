class Communication extends Master {
    constructor() {
        super();
        this.createEmailAddressSettingSubmitBtn = document.querySelectorAll('.create-email-address-submit-btn');
    } 

    setupEmailManagerView() {
        const diskQuotaSelectors = document.querySelectorAll('.diskQuota');

        diskQuotaSelectors.forEach(select => {
            select.addEventListener('change', function() {
                const parent = this.closest('.row, form, .modal-body') || document;
                const wrapper = parent.querySelector('.quotaValueWrapper');
                const quotaInput = parent.querySelector('.quotaValue');

                if (wrapper && quotaInput) {
                    if (this.value === 'limited') {
                        wrapper.classList.remove('d-none');
                        quotaInput.required = true;
                    } else {
                        wrapper.classList.add('d-none');
                        quotaInput.required = false;
                        quotaInput.value = '';
                    }
                }
            });
        });
    }

    getEmailsListing() {
        $('.emails-table').DataTable({
            destroy: true,
            paging: true,
            searching: true,
            ordering: true,
            info: true,
            lengthChange: true,
            ajax: ajaxDtParser(
                'GET',
                '/communication/emails/list',
                filtersParser('.emailFilters')
            ),  
            columns: [
                {
                    data: 'actions',
                    orderable: false,
                    searchable: false
                },
                {
                    data: 'email',
                    title: 'Email Address'
                },
                {
                    data: 'emailExtras',
                    title: 'Extras'
                },
                {
                    data: 'server',
                    title: 'Server'
                }, 
                {
                    data: 'status',
                    title: 'Status'
                },
                {
                    data: 'createdBy',
                    title: 'Added By'
                },
                {
                    data: 'timestamps',
                    title: 'Time Created'
                }
            ],
            
            fnDrawCallback: () => {
                const inst = new Communication();
                inst.actionOnEmailsRes();
                watchFilterChanges('.emailFilters', inst.getEmailsListing.bind(inst));
            },
            language: getDataTableLanguage(),
        });
    }

    actionOnEmailsRes() {
        // ...
    }

    createEmailAddress() {
        const btns = this.createEmailAddressSettingSubmitBtn;
        
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
                        (new Communication()).getEmailsListing(); 
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
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const inst = new Communication();
    inst.getEmailsListing(); 
    inst.setupEmailManagerView();
    inst.createEmailAddress();
});