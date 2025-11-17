class NotificationTemplate extends Master {
    constructor() {
        super(); 
        this.createNotificationTempSubmitBtn = document.querySelectorAll('.create-notification-template-submit-btn');
    }

    setupNotifactionTemplateView() {   
        // Show/hide associated email based on channel selection
        const templateChannel = document.querySelector('.templateChannel');
        templateChannel.addEventListener('change', function() {
            var selectedChannel = this.value;
            const parentDiv = templateChannel.closest('form');
            var emailDiv = parentDiv.querySelector('.associatedEmailDiv'); 
            var emailSubjectDiv = parentDiv.querySelector('.emailSubjectDiv');

            if (selectedChannel === 'email') {
                [emailDiv, emailSubjectDiv].forEach(div => div.classList.remove('d-none'));
            } else {
                [emailDiv, emailSubjectDiv].forEach(div => div.classList.add('d-none'));
            }
        });
    }

    createNotificationTemplate() { 
        const btns = this.createNotificationTempSubmitBtn;

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
                        (new NotificationTemplate()).listNotificationTemps();
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

    listNotificationTemps() {
        $('.notification-templates-table').DataTable({
            destroy: true,
            paging: true,
            searching: true,
            ordering: true,
            info: true,
            lengthChange: true,
            ajax: ajaxDtParser(
                'GET', 
                '/notification/templates', 
                filtersParser('.templateFilters')
            ),
            columns: [
                {
                    data: 'actions',
                    title: 'Action',
                    orderable: false,
                    searchable: false
                },
                {
                    data: 'templateName',
                    title: 'Name'
                },
                {
                    data: 'emailSubject',
                    title: 'Subject',
                },
                {
                    data: 'templateChannel',
                    title: 'Channel'
                },
                {
                    data: 'linkedEmail',
                    title: 'Linked Email'
                },
                {
                    data: 'templateCategory',
                    title: 'Category'
                },
                {
                    data: 'status',
                    title: 'Status',
                    orderable: false,
                    searchable: false
                },
                {
                    data: 'createdAt',
                    title: 'Created At'
                }
            ],
            fnDrawCallback: () => {
                const inst = new NotificationTemplate();
                inst.actionOnNotificationTemplatesRes();
                watchFilterChanges('.templateFilters', inst.listNotificationTemps.bind(inst));
                dtClickableRowHandler('.notification-templates-table', this.actionRowParser, ['dropdown-toggle']);
            },
            language: getDataTableLanguage(),
        });
    } 

    actionOnNotificationTemplatesRes() {
        const btns = document.querySelectorAll('.notification-templates-table .action-btns');
        btns.forEach(btn => {
            if (!documentContains(btn)) return;
            btn = cloneNodeElement(btn); // counter race conditions
            btn.addEventListener('click', (event) => { 
                toggleLoadingOverlay(true);
                let clickedBtn = event.target;
                let clickedId = clickedBtn.getAttribute('data-id');   

                if (containsClass(clickedBtn, 'edit')) {
                    this.assistiveModalActionParser(
                        event, 
                        `/notification/templates/edit/${clickedId}?modal=true}`, 
                        'GET',
                        [ 
                            { callback: this.editNotificationTemplateRes, params: [] }, 
                            { callback: this.setupNotifactionTemplateView, params: [] },
                            { callback: initializeTinyMce, params: [`.edit-template-editor-${clickedId}`] }
                        ]
                    );
                }
            });
        })
    }

    editNotificationTemplateRes() {
        let btns = document.querySelectorAll('.edit-notification-template-submit-btn');
        btns.forEach(btn => { 
            if (!documentContains(btn)) return;
            btn = cloneNodeElement(btn); // avoid race conditions

            btn.addEventListener('click', event => {
                event.preventDefault();
                toggleButtonContent(btn);
                disableElement(btn);

                let form = btn.closest('form');
                tinymce.triggerSave();
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
                        (new NotificationTemplate()).listNotificationTemps();
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

    actionRowParser(rowData) { 
        const modalContent = rowData?.viewTemplate;
        if (!modalContent) return;
        __append_html(modalContent, '.notificationTemplateViewModal', false);
        __show_modal('.notificationTemplateViewModal');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const inst = new NotificationTemplate();
    inst.listNotificationTemps();
    inst.createNotificationTemplate();
    inst.setupNotifactionTemplateView();

    // initialize Tiny Mce 
    initializeTinyMce('.create-template-editor');
});