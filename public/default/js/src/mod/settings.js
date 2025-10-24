class Settings extends Master {
    constructor () {
        super();
        this.createupdatesettingBtn = document.querySelectorAll('.create-setting-submit-btn');
        this.editUpdateSettingBtn = document.querySelectorAll('.edit-setting-submit-btn');
    }

    initializePageSetup() {
        initListTransition('.ulg', '.content');
        initProviderToggle('#provider', '.provider-form');
        enableImagePreview('.companyLogo', '.preview-on-edit img', true);
    }

    createupdatesetting() {
        let btns = this.createupdatesettingBtn;

        btns.forEach(btn => { 
            if (!documentContains(btn)) return;
            btn = cloneNodeElement(btn); // avoid race conditions

            btn.addEventListener('click', event => {
                event.preventDefault();
                toggleButtonContent(btn);
                disableElement(btn);

                let form = btn.closest('form');
                let data = new FormData(form);
                data.append('type', form.getAttribute('id'));

                fetch(formRouteParser(form), {
                    method: form.method,
                    headers: { 
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: data
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
                        (new Settings()).getApiSettingsList();
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

    getApiSettingsList() {
        $('.api-settings-table').DataTable({
            destroy: true,
            paging: true,
            searching: true,
            ordering: true,
            info: true,
            lengthChange: true,
            ajax: ajaxDtParser(
                'GET', 
                '/api-settings', 
                filtersParser('.apiSettingsFilters')
            ), 
            columns: [
                {
                    data: 'actions',
                    title: 'Action',
                    orderable: false,
                    searchable: false
                },
                {
                    data: '_provider'
                },
                {
                    data: 'code'
                }, 
                {
                    data: 'targetApp'
                },
                {
                    data: 'linked_to'
                },
                {
                    data: 'environ'
                },
                {
                    data: 'status'
                }
            ],
            fnDrawCallback: () => {
                const inst = new Settings();
                inst.actionOnApiSettingsRes();
                watchFilterChanges('.api-settings-filters', inst.getApiSettingsList.bind(inst));
            },
            language: getDataTableLanguage(),
        });
    }

    actionOnApiSettingsRes() {
        const btns = document.querySelectorAll('.api-settings-table .action-btns');
        btns.forEach(btn => {
            if (!documentContains(btn)) return;
            btn = cloneNodeElement(btn);
            btn.addEventListener('click', (event) => { 
                toggleLoadingOverlay(true);
                let clickedBtn = event.target;
                let clickedId = clickedBtn.getAttribute('data-id'); 
                let targetApp = clickedBtn.getAttribute('data-target'); 

                if (containsClass(clickedBtn, 'edit')) {
                    this.assistiveModalActionParser(
                        event, 
                        `/api/callbacks/edit?modal=true&clickedId=${clickedId}&targetApp=${targetApp}`, 
                        'GET',
                        [ 
                            { callback: this.editApiSettingRes, params: [clickedId, targetApp] }, 
                        ]
                    );
                }

                if (containsClass(clickedBtn, 'register_endpoint')) {
                    this.assistiveModalActionParser(
                        event, 
                        `/callbacks/register?modal=true&clickedId=${clickedId}&targetApp=${targetApp}`, 
                        'GET',
                        [
                            { callback: this.registerEndpoint, params: [clickedId, targetApp] }
                        ]
                    );
                }
            });
        })
    }
    
    editApiSettingRes(clickedId, targetApp) {  
        let btns = this.editUpdateSettingBtn;

        btns.forEach(btn => { 
            if (!documentContains(btn)) return;
            btn = cloneNodeElement(btn); // avoid race conditions

            btn.addEventListener('click', event => {
                event.preventDefault();
                toggleButtonContent(btn);
                disableElement(btn);

                let form = btn.closest('form');
                let data = new FormData(form);
                data.append('type', form.getAttribute('id'));
                data.append('clickedId', clickedId);
                data.append('targetApp', targetApp);

                fetch(formRouteParser(form), {
                    method: form.method,
                    headers: { 
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: data
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
                        (new Settings()).getApiSettingsList();
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

    registerEndpoint(clickedId, targetApp) {
        let btns = document.querySelectorAll('.register-callbacks-submit-btn');

        btns.forEach(btn => { 
            if (!documentContains(btn)) return;
            btn = cloneNodeElement(btn); // avoid race conditions

            btn.addEventListener('click', event => {
                event.preventDefault();
                toggleButtonContent(btn);
                disableElement(btn);

                let form = btn.closest('form');
                let data = new FormData(form);
                data.append('clickedId', clickedId);
                data.append('targetApp', targetApp);
                data.append('settingType', 'apisetting');

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
    const inst = new Settings();
    inst.initializePageSetup();
    inst.getApiSettingsList();
    inst.createupdatesetting();
    inst.editApiSettingRes();
});