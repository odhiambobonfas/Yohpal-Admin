/**
 * Master Class
 * ----------------------------------------------
 * Global JS class - master sits in here.
 * Use this class to group shared, reusable utility methods
 * for frontend site-wide behavior (e.g. restrictions, UI controls, etc).
 * 
 * Here for YohPal forever!
 */
class Master {
    constructor() {
        // Any constructor logic applicable
        this.debounceTimer;
    }

    /**
     * Creates and appends a reusable overlay element to the given container.
     * If no container is provided, it defaults to document.body. 
     */
    initOverlay(container = document.body) {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        
        if (!container) {
            container = document.body;
        }

        this.overlay = document.createElement('div');
        this.overlay.classList.add('global-overlay');

        __append_html(
            `<div class="loading-message text-center">
                <div class="spinner-border text-danger mb-2" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <div>Loading...</div>
            </div>`, 
            this.overlay
        );

        container.appendChild(this.overlay);
        this.hideOverlay();
    }

    /**
     * Displays the global overlay by adding the 'active' class.
     * Useful for blocking UI and showing a loading state.
     */
    showOverlay() {
        this.overlay = document.querySelector('.global-overlay');
        if (this.overlay) {
            this.overlay.classList.add('active'); 
        }
    }

    /**
     * Hides the global overlay by removing the 'active' class.
     */
    hideOverlay() {
        this.overlay = document.querySelector('.global-overlay');
        if (this.overlay) {
            this.overlay.classList.remove('active');
        }
    }

    /**
     * Parses and handles modal actions triggered from DataTables UI elements.
     * 
     * Typically used when clicking a button/link inside a DataTable row to open a modal
     * (e.g. edit, view, or delete). Supports invoking an action (e.g. AJAX call), then 
     * optionally runs one or more callbacks after the action is completed.
     *
     * @param {Event} event - The event triggered from a DataTable element (e.g. button click).
     * @param {string} action - The URL or route to fetch or post data to (usually tied to the modal's content).
     * @param {string} [method='GET'] - HTTP method to use when performing the action (e.g., 'GET', 'POST').
     * @param {Function[]|undefined} [callbackFuncs=undefined] - Optional array of callback functions to run after action completes.
     * @param {string} [attribute='.target-modal'] - Selector for the modal element to show (default: '.target-modal').
     * @param {Object} [stepperOptions={}] - Stepper Options to append to the stepper global class...
     */
    assistiveModalActionParser(event, action, method='GET', callbackFuncs = undefined, attribute='target-modal', stepperOptions={}) {
        (new Master()).showOverlay();
        setTimeout(() => {
            $.ajax({
                type: `${method}`,
                url: `${action}`,
                dataType: 'json', 
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                },
                success: function (response) { 
                    enableElement(event.target);
                    toggleButtonContent(event.target, '', true);
                    
                    (new Master()).hideOverlay();

                    if (!response) {
                        toast('error', 5000, LANG_EN.undefined_error);
                        return;
                    }
                    
                    if (response.status && response.status == 'error') {
                        toast(response.status, 5000, response.message);
                        return;
                    }
    
                    let target_modal = event.target.getAttribute(attribute);

                    if (!target_modal?.length) {
                        toast('error', 5000, LANG_EN.undefined_error);
                        return;
                    }
    
                    let modal = document.querySelector(`${target_modal}`);
    
                    if (!response.modal) {
                        toast('error', 5000, LANG_EN.undefined_error);
                        return;
                    }
    
                    __append_html(response.modal, modal);
                    __show_modal(target_modal); 
    
                    setTimeout(() => { 
                        if (callbackFuncs !== undefined) { 
                            if (Array.isArray(callbackFuncs)) {
                                callbackFuncs.forEach(item => { 
                                    if (typeof item === 'function') {
                                        item();
                                    }
                                    else if (typeof item === 'object' && item.callback) {
                                        item.callback(...(item.params?.length ? item.params : []));
                                    }
                                });
                            }
                        }
                    }, 1000); // Avoid Race conditions 

                    (new DynamicStepper(stepperOptions)).init(); 
                    
                    // Remove every modal child to return the initial state of the 
                    // modal div container...
                    modal.addEventListener('hide.bs.modal', () => {  
                        Array.from(modal.children).forEach(child => { 
                            child.remove(); 
                        });
                    });
                },
                error: (error) => {
                    console.log(error);
                    (new Master()).hideOverlay();
                    event.target.disabled = false;
                    toast('error', 5000, error.message || LANG_EN.undefined_error);
                }
            });
        }, 1000);
    }

    /**
     * This function is made to Handle sliders responsiveness. The UI uses assistive backend processing
     * to enhance the Responsive capabilities.
     * 
     * @param {string} action - Endpoint url the ajax request is supposed to act upon.
     */
    handleCarouselSildersResponsiveness(action) {
        if (!action) return;
        $.ajax({
            type: "GET",
            url: action,
            data: {
                screenSize: detectScreenSize()
            },
            dataType: "json",
            success: function (response) { 
                // append the any defined Dynamic carousel to the Page 
                if (response.carousels) {
                    let carousels = response.carousels;
                    carousels.forEach(carousel => { 
                        const carouselDom = document.querySelector(`.${carousel.name}`);
                        if (documentContains(carouselDom)) { 
                            __append_html(carousel.dom, carouselDom);
                        }
                    });

                    let $classInst = new Master();
                    $classInst.initDonateNowFunc();
                }
            },
            error: error => {
                console.log(error);
            }
        });
    }

    /**
     * Initialize donate now 
     */
    initDonateNowFunc() {
        const btns = document.querySelectorAll('.donate-now-btn');
        btns.forEach(btn => {
            if (!documentContains(btn)) return;
            btn = cloneNodeElement(btn);
            btn.addEventListener('click', (event) => {
                event.preventDefault();
                toggleButtonContent(btn);
                disableElement(btn);

                let action = btn.getAttribute('data-href'); 

                this.assistiveModalActionParser(
                    event, 
                    action, 
                    'GET',
                    [
                        {
                            callback: this.setupDonateNowModalFunc,
                            params: []
                        }
                    ],
                    undefined,
                    { 
                        submitBtnText: 'Confirm and Donate',
                        swalTitle: 'Student Donations',
                        swalText: 'Ready to submit your donation?',
                        confirmButtonText: 'Donate'
                    }
                )
            });
        });
    }

    /**
     * Setup donate now modal function.
     * Activates payment channel selection and Confirmation section UX
     */
    setupDonateNowModalFunc() {
        const payment_channels = document.querySelectorAll('.payment-channel');
        const amount_btns = document.querySelectorAll('.amount-btn');
        const customAmtinput = document.querySelector('.custom-amount-input');
        const makeRecurringDonation = document.querySelector('.make-recurring-donation');
        const confirm_method = document.querySelector('.confirm-donation .confirm-method');
        const confirm_amount = document.querySelector('.confirm-donation .confirm-amount');
        const confirm_frequency = document.querySelector('.confirm-donation .confirm-frequency');

        payment_channels.forEach(channel => {  
            channel = cloneNodeElement(channel);
            const parentContainer = channel.closest('.col-md-4'); 
            parentContainer.addEventListener('click', () => { 
                document.querySelectorAll('.payment-channel').forEach(input => {
                    input.checked = false;
                    const box = input.closest('.col-md-4');
                    if (box) box.classList.remove('active');
                }); 

                channel.checked = true; 
                const method = channel.value;
                __append_html(method.charAt(0).toUpperCase() + method.slice(1), confirm_method);
                parentContainer.classList.add('active'); 
            }); 
        });

        amount_btns.forEach(amount_btn => {
            amount_btn = cloneNodeElement(amount_btn);
            amount_btn.addEventListener('click', () => {  
                customAmtinput.value = parseFloat(amount_btn.getAttribute('data-amount'));
                __append_html(currencyFormatter(customAmtinput.value, 'Ksh'), confirm_amount); 
            }); 
        });

        customAmtinput.addEventListener('input', () => { 
            __append_html(currencyFormatter(customAmtinput.value, 'Ksh'), confirm_amount); 
        });

        makeRecurringDonation.addEventListener('change', () => {  
            __append_html((makeRecurringDonation?.checked ? 'Recurring' : 'One-time'), confirm_frequency);
        });
    }
}