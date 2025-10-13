class HRM extends Master {
    constructor() {
        super();
        this.createDeptBtns = document.querySelectorAll('.create-department-submit-btn');
        this.createDesignationBtns = document.querySelectorAll('.create-designation-submit-btn');
        this.createAttendanceBtns = document.querySelectorAll('.create-attendance-submit-btn');
        this.holidayTypeSelect = document.querySelector('.holidayTypeSelect');
        this.createHolidayBtns = document.querySelectorAll('.create-holiday-submit-btn');
        this.shiftSelect = document.querySelector('.shiftSelect');
        this.createAttendanceBtns = document.querySelectorAll('.create-attendance-submit-btn');
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
                const inst = new HRM();
                inst.actionOnDesignationsRes(); 
                watchFilterChanges('.designationsFilters', inst.getDesignationListing.bind(inst));
            },
            language: getDataTableLanguage(),
        });
    }

    actionOnDesignationsRes() {
        // ...
    }
    
    createDepartment() {
        const btns = this.createDeptBtns;

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

    getDepartmentListing() { 
        $('.departments-table').DataTable({
            destroy: true,
            paging: true,
            searching: true,
            ordering: true,
            info: true,
            lengthChange: true,
            ajax: ajaxDtParser(
                'GET', 
                '/institution/departments', 
                filtersParser('.departmentsFilters')
            ), 
            columns: [
                { 
                    data: 'actions', 
                    orderable: false, 
                    searchable: false 
                },
                { data: 'Name',},
                { data: 'Code' },  
                { data: 'Description' }, 
            ],
            fnDrawCallback: () => {
                const inst = new HRM();
                inst.actionOnDepartmentsRes(); 
                watchFilterChanges('.departmentsFilters', inst.getDepartmentListing.bind(inst));
            },
            language: getDataTableLanguage(),
        });
    }

    actionOnDepartmentsRes() {
        // ...
    }

    setupHoldayPage() {
        const holidayTypeSelect = this.holidayTypeSelect;
        if (!documentContains(holidayTypeSelect)) return; 
        holidayTypeSelect.addEventListener('change', (event) => {
            const selectedValue = event.target.value;
            const customHolidayTypeInput = document.querySelector('.customHolidayType'); 
            if (!documentContains(customHolidayTypeInput)) return;  
            if (selectedValue === 'custom') {
                customHolidayTypeInput.parentElement.classList.remove('d-none');
                customHolidayTypeInput.setAttribute('required', 'required');
            } else {
                customHolidayTypeInput.parentElement.classList.add('d-none');
                customHolidayTypeInput.removeAttribute('required');
                customHolidayTypeInput.value = '';      
            }
        });
    }

    createHoliday() {
        const btns = this.createHolidayBtns;
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

    getHolidayListing() {
        $('.holidays-table').DataTable({
            destroy: true,
            paging: true,
            searching: true,
            ordering: true,
            info: true,
            lengthChange: true,
            ajax: ajaxDtParser(
                'GET', 
                '/holidays/list', 
                filtersParser('.holidaysFilters')
            ), 
            columns: [
                {
                    data: 'actions',
                    orderable: false,
                    searchable: false
                }, 
                { data: 'Name' },  
                { data: 'Type' },  
                { data: 'Date' }, 
                { data: 'Description' },
            ],
            fnDrawCallback: () => {
                const inst = new HRM();
                inst.actionOnHolidaysRes();
                watchFilterChanges('.holidaysFilters', inst.getHolidayListing.bind(inst));
            },
        });
    }

    actionOnHolidaysRes() {
        // ...
    }

    setupAttendancePage() {
        const shiftSelect = document.querySelector('.shiftSelect');
        if (!documentContains(shiftSelect)) return;
        shiftSelect.addEventListener('change', (event) => {
            const selectedValue = event.target.value;
            const customeSelectSection = document.querySelector('.customShiftSection');  
            if (!documentContains(customeSelectSection)) return;
            if (selectedValue === 'custom') {
                customeSelectSection.classList.remove('d-none'); 
            } else {
                customeSelectSection.classList.add('d-none'); 
            }
        });
    }

    createAttendance() {
        const btns = this.createAttendanceBtns; 
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
                }
                catch (error) {
                    console.log(error.message || error);
                    toggleButtonContent(btn, '', true);
                    enableElement(btn);
                    toast('error', 5000, LANG_EN.undefined_error);
                }   
            });
        });
    }

    getAttendanceListing() {
        $('.attendances-table').DataTable({
            destroy: true,
            paging: true,
            searching: true,
            ordering: true,
            info: true,
            lengthChange: true,
            ajax: ajaxDtParser(
                'GET', 
                '/employee/attendance', 
                filtersParser('.attendancesFilters')
            ), 
            columns: [
                { 
                    data: 'actions', 
                    orderable: false,
                    searchable: false
                },
                { data: 'Employee',},
                { data: 'attendanceDate' },
                { data: 'shift' },  
                { data: 'CheckIn' }, 
                { data: 'CheckOut' }, 
                { data: 'remarks' }, 
                { data: 'attendanceStatus' }, 
            ],
            fnDrawCallback: () => {
                const inst = new HRM();
                inst.actionOnAttendanceRes(); 
                watchFilterChanges('.attendancesFilters', inst.getAttendanceListing.bind(inst));
            },
        });
    }

    actionOnAttendanceRes() {
        // ...
    }
}

document.addEventListener('DOMContentLoaded', async() => {
    const inst = new HRM();
    inst.createDesignation();
    inst.getDesignationListing();
    inst.createDepartment();
    inst.getDepartmentListing();
    inst.setupHoldayPage();
    inst.createHoliday();
    inst.setupAttendancePage();
    inst.createAttendance();
    inst.getHolidayListing();
    inst.getAttendanceListing();
});