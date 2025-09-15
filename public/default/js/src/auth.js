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

                console.log(data);

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
                        error = JSON.parse(error.responseText) || error;
                        console.log(`Ajax Error: ${error.message || JSON.parse(error.responseText) || JSON.stringify(error)}`);
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

            let form = btn.closest('form');

            if (!documentContains(form)) {
                toast('error', 5000, 'Oops, an error occurred!');
                return;
            }

            const data = new FormData(form);

            console.log(data);

            $.ajax({
                type: form.getAttribute('method'),
                url: form.getAttribute('action'),
                data: data,
                dataType: 'json', 
                contentType: false,
                processData: false,
                success: function (res) { 
                    btn.disabled = false;
                    toggleButtonContent(btn, null, true);

                    if (res && res.redirectUrl) {  
                        route(res.redirectUrl);
                    }
                },
                error: error => {
                    toggleButtonContent(btn, null, true);
                    error = JSON.parse(error.responseText) || error;
                    console.log(`Ajax Error: ${error.message || JSON.parse(error.responseText) || JSON.stringify(error)}`);
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