class App extends Master {
    constructor() {
        super();
    }

    listApps() {
        $('.apps-table').DataTable({
            destroy: true,
            paging: true,
            searching: true,
            ordering: true,
            info: true,
            lengthChange: true,
            ajax: ajaxDtParser(
                'GET', 
                '/apps', 
                filtersParser('.appsFilters')
            ),
            fnDrawCallback: () => {
                const inst = new App();
                inst.actionOnAppsRes();
                watchFilterChanges('.apps-filters', inst.listApps.bind(inst));
            },
            language: getDataTableLanguage(),
        });
    }

    actionOnAppsRes() {
        // ...
    }

    uploadAppUpdates() {
        // ...
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const inst = new App();
    inst.listApps(); 
    inst.uploadAppUpdates(); 
});