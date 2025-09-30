class Settings extends Master {
    constructor () {
        super();
        this.createApiSettingBtn = document.querySelector('.create-api-setting-submit-btn');
    }

    initializePageSetup() {
        initListTransition('.ulg', '.content');
        initProviderToggle('provider', 'provider-form');
    }

    createApiSetting() {
        let btn = this.createApiSettingBtn;
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
                    toast(response.status, 5000, response.message || LANG_EN.undefined_error);
                    (new Settings()).getListApiSettings();
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
                    data: 'provider'
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
        // ...
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const inst = new Settings();
    inst.initializePageSetup();
    inst.getApiSettingsList();
    inst.createApiSetting();
});