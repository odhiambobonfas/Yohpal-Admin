class Communication extends Master {
    constructor() {
        super();
        // ANY CONSTRUCTOR LOGIC APPLICABLE
    } 

    getEmailsListing() {
        $('.emails-table').DataTable({
            destroy: true,
            paging: true,
            searching: true,
            ordering: true,
            info: true,
            lengthChange: true,
            // ajax: ajaxDtParser(
            //     'GET',
            //     '/emails-listing',
            //     filtersParser('.emailFilters')
            // ),  
            fnDrawCallback: () => {
                const inst = new Communication();
                inst.actionOnCpanelSettingsRes();
                watchFilterChanges('.emailFilters', inst.getCpanelListingList.bind(inst));
            },
            language: getDataTableLanguage(),
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const inst = new Communication();
    inst.getEmailsListing(); 
});