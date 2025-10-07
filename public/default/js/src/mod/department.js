class Department extends Master {
    constructor() {
        super();
        this.createDeptBtns = document.querySelectorAll('.create-department-submit-btn');
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
}

document.addEventListener('DOMContentLoaded', async() => {
    const inst = new Department();
    inst.createDepartment();
});