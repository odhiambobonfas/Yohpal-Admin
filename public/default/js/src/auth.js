class Auth {
    constructor() {
        // 
    }

    register() {
        let registerBtn = document.querySelector(".register-btn");
        let registerForm = document.querySelector(".register-user-form");
        if (documentContains(registerBtn)) {
            registerBtn = cloneNodeElement(registerBtn);
            registerBtn.addEventListener('click', event => {
                event.preventDefault();
                registerBtn.disabled = true;
                __append_html('Please Wait...', registerBtn);

                if (!documentContains(registerForm)) {
                    toast('error', 5000, 'Oops, an error occurred!');
                    return;
                }
                
                const data = new FormData(registerForm); 

                $.ajax({
                    type: registerForm.getAttribute('method'),
                    url: registerForm.getAttribute('action'),
                    data: data,
                    dataType: 'json', 
                    contentType: false,
                    processData: false,
                    success: function (res) { 
                        registerBtn.disabled = false;
                        __append_html('Register', registerBtn);
                        
                        if (res && res.message) {
                            toast(res.status, 8000, res.message);
                        }

                        if (res && res.redirectUrl) {
                            route(res.redirectUrl);
                        }
                    },
                    error: error => {
                        registerBtn.disabled = false;
                        __append_html('Register', registerBtn); 
                        console.log(`Ajax Error: ${error.message || error.responseText || JSON.stringify(error)}`);
                        toast('error', 8000, error.message || 'An error occurred. Please try again!');
                    }
                });
            });
        }
    }

    login() {
        let btn = document.querySelector(".login-btn"); 
        if (!btn) return;

        btn.addEventListener('click', event => {
            event.preventDefault();
            toggleButtonContent(btn);
            disableElement(btn);
            let form = btn.closest('form');

            if (!documentContains(form)) {
                toast('error', 5000, 'Oops, an error occurred!');
                return;
            }

            const data = new FormData(form); 

            $.ajax({
                type: form.getAttribute('method'),
                url: form.getAttribute('action'),
                data: jsonifyFormData(data),
                dataType: 'json', 
                contentType: 'application/json',
                processData: false,
                success: function (res) {  
                    toggleButtonContent(btn, null, true);

                    if (res && res.status && res.status == 'success') {  
                        setTimeout(() => {  
                            if(res.redirectUrl) route(res.redirectUrl); 
                        }, 2000);
                        return;
                    }
                    
                    enableElement(btn);
                    
                    if (res && res.status && res.status == 'error') {
                        toast(res.status, 5000, res.message || lang.undefined_error);
                        return;
                    }

                    toast('error', 5000, lang.undefined_error);
                },
                error: error => {
                    enableElement(btn);
                    toggleButtonContent(btn, null, true); 
                    console.log(`Ajax Error: ${error.message || error.responseText || JSON.stringify(error)}`);
                    toast('error', 8000, error.message || 'An error occurred. Please try again!');
                }
            });
        }); 
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const authInstance = new Auth();
    authInstance.register();
    authInstance.login();
});