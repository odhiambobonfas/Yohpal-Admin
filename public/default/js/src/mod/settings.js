class Settings extends Master {
    constructor () {
        super();
        this.editUpdateSettingBtn;
        this.createupdatesettingBtn = document.querySelectorAll('.create-setting-submit-btn');
        this.createCdnSettingSubmitBtn = document.querySelectorAll('.create-cdn-setting-submit-btn');
        this.createCpanelSettingSubmitBtn = document.querySelectorAll('.create-cpanel-setting-submit-btn');
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
                        `/api/settings/edit?modal=true&clickedId=${clickedId}&targetApp=${targetApp}`, 
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
        let btns = document.querySelectorAll('.edit-setting-submit-btn');

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

    createCdnSetting() {
        let btns = this.createCdnSettingSubmitBtn

        btns.forEach(btn => {
            if (!documentContains(btn)) return;
            btn = cloneNodeElement(btn); // avoid race conditions

            btn.addEventListener('click', event => {
                event.preventDefault();
                toggleButtonContent(btn);
                disableElement(btn);

                let form = btn.closest('form');
                let data = new FormData(form);  
                data.append('settingType', 'cdnSettings');

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
                        (new Settings()).getCdnSettingsList(); 
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

    // CDN SETTINGS
    getCdnSettingsList() {
        $('.cdn-settings-table').DataTable({
            destroy: true,
            paging: true,
            searching: true,
            ordering: true,
            info: true,
            lengthChange: true,
            ajax: ajaxDtParser(
                'GET',
                '/cdn-settings',
                filtersParser('.cdnSettingsFilters')
            ),
            columns: [
                {
                    data: 'actions',
                    title: 'Action',
                    orderable: false,
                    searchable: false
                },
                {
                    data: 'code',
                    title: 'Code'
                },
                {
                    data: 'provider',
                    title: 'Provider'
                },
                {
                    data: 'baseUrl',
                    title: 'Base URL'
                },
                {
                    data: 'zoneId',
                    title: 'Zone / Distribution ID'
                },
                {
                    data: 'cacheDuration',
                    title: 'Cache Duration (hrs)'
                },
                {
                    data: 'module',
                    title: 'Module'
                },
                {
                    data: 'linkedTo',
                    title: 'Linked'
                },
                {
                    data: 'status',
                    title: 'Status'
                }
            ],
            fnDrawCallback: () => {
                const inst = new Settings();
                inst.actionOnCdnSettingsRes();
                watchFilterChanges('.cdn-settings-filters', inst.getCdnSettingsList.bind(inst));
            },
            language: getDataTableLanguage(),
        });
    }

    actionOnCdnSettingsRes() {
        const btns = document.querySelectorAll('.cdn-settings-table .action-btns');
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
                        `/settings/cdn/edit/${clickedId}?modal=true&targetApp=${targetApp}`, 
                        'GET',
                        [ 
                            { callback: this.editCdnSettingRes, params: [clickedId, targetApp] }, 
                        ]
                    );
                } 
            });
        })
    }

    editCdnSettingRes(clickedId, targetApp) {
        let btns = document.querySelectorAll('.edit-cdn-setting-submit-btn');
        console.log(btns);
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
                data.append('targetApp', targetApp);

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
                        (new Settings()).getCdnSettingsList();
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

    // CDN SETTINGS
    createCpanelSetting() {
        let btns = this.createCpanelSettingSubmitBtn

        btns.forEach(btn => {
            if (!documentContains(btn)) return;
            btn = cloneNodeElement(btn); // avoid race conditions

            btn.addEventListener('click', event => {
                event.preventDefault();
                toggleButtonContent(btn);
                disableElement(btn);

                let form = btn.closest('form');
                let data = new FormData(form);  
                data.append('settingType', 'cpanelSettings');

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
                        (new Settings()).getCpanelSettingsList(); 
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

    getCpanelSettingsList() {
        $('.cpanel-settings-table').DataTable({
            destroy: true,
            paging: true,
            searching: true,
            ordering: true,
            info: true,
            lengthChange: true,
            ajax: ajaxDtParser(
                'GET',
                '/cpanel-settings',
                filtersParser('.cpanelSettingsFilters')
            ), 
            columns: [
                {
                    data: 'actions',
                    title: 'Action',
                    orderable: false,
                    searchable: false
                }, 
                { 
                    data: 'cpanelHost', 
                    title: 'Host', 
                    render: (data) => data || 'N/A' 
                },
                { 
                    data: 'cpanelUsername', 
                    title: 'Username', 
                    render: (data) => data || 'N/A' 
                },
                { 
                    data: 'cpanelApiToken', 
                    title: 'API Token'
                },
                { 
                    data: 'linkedDomain', 
                    title: 'Linked Domain', 
                    render: (data) => data || 'N/A' 
                }, 
                { 
                    data: 'status', 
                    title: 'Server Status',  
                }, 
            ],
            fnDrawCallback: () => {
                const inst = new Settings();
                inst.actionOnCpanelSettingsRes();
                watchFilterChanges('.cpanel-settings-filters', inst.getCpanelSettingsList.bind(inst));
            },
            language: getDataTableLanguage(),
        });
    }

    actionOnCpanelSettingsRes() {
        const btns = document.querySelectorAll('.cpanel-settings-table .action-btns');
        btns.forEach(btn => {
            if (!documentContains(btn)) return;
            btn = cloneNodeElement(btn);
            btn.addEventListener('click', (event) => { 
                toggleLoadingOverlay(true);
                let clickedBtn = event.target;
                let clickedId = clickedBtn.getAttribute('data-id');  

                if (containsClass(clickedBtn, 'edit')) {
                    this.assistiveModalActionParser(
                        event, 
                        `/settings/cpanel/edit/${clickedId}?modal=true&`, 
                        'GET',
                        [ 
                            { callback: this.editCpanelSettingRes, params: [clickedId] }, 
                        ]
                    );
                } 
            });
        })
    }

    editCpanelSettingRes(clickedId) {
        let btns = document.querySelectorAll('.edit-cpanel-setting-submit-btn'); 
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
                data.append('targetApp', targetApp);

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
                        (new Settings()).getCpanelSettingsList();
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
    inst.getCdnSettingsList();
    inst.createCdnSetting();
    inst.createCpanelSetting();
    inst.getCpanelSettingsList();
});