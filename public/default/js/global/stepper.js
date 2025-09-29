class DynamicStepper extends Master {
    constructor(options = {}) {
        super();
        // Default configuration
        this.config = {  
            containerSelector: '.stepper-wrapper',
            stepItemSelector: '.stepper-item',
            stepPaneSelector: '.step-pane',
            nextBtnSelector: '.btn-stepper-next',
            prevBtnSelector: '.btn-secondary-prev',
            completedClass: 'completed',
            activeClass: 'active',
            ...options
        }; 

        this.currentStep = 1;
        this.totalSteps = document.querySelectorAll(this.config.stepItemSelector).length;
        this.initialized = false;

        this.init();
    }

    init() {
        if (this.initialized) return;
        const nextBtnSelector = document.querySelector(this.config.nextBtnSelector);
        const prevBtnSelector = document.querySelector(this.config.prevBtnSelector);

        if (!documentContains(nextBtnSelector)) return;

        // Set up event listeners
        nextBtnSelector.addEventListener('click', () => this.nextStep());
        prevBtnSelector.addEventListener('click', () => this.prevStep());

        // Initialize first step
        this.updateStepUI();
        this.initialized = true;
    }

    nextStep() {
        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.updateStepUI();

            if (this.currentStep === this.totalSteps) { 
                __append_html(this.config.submitBtnText ?? 'Submit', document.querySelector(this.config.nextBtnSelector));
            }
        } else {
            this.submitStepperUtil();
        }
    }

    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepUI();
            __append_html('Next', document.querySelector(this.config.nextBtnSelector));
        }
    }

    submitStepperUtil() { 
        console.log('Form submitted! Current step:', this.currentStep);
        
        const btn = document.querySelector(this.config.nextBtnSelector);
        const donateModalDialog = document.querySelector('.donate-now-modal-dialog');
        
        Swal.fire({
            title: this.config.swalTitle || "Student Registration",
            text: this.config.swalText || "Ready to save this student's details?",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: this.config.confirmButtonText ||  "Add Student",
            cancelButtonText: "Review Details",
            customClass: {
                confirmButton: "btn btn-warning me-3",
                cancelButton: "btn btn-outline-secondary"
            },
            buttonsStyling: false,
            showClass: {
                popup: 'animate__animated animate__fadeInDown'
            },
            hideClass: {
                popup: 'animate__animated animate__fadeOutUp'
            },  
        }).then((result) => { 
            if (result.isConfirmed) {   
                (new Master()).showOverlay(); 

                setTimeout(() => {
                    if (!documentContains) return;
                    let form = btn.closest('form'); 
                    let data = new FormData(form);

                    console.log(data);

                    $.ajax({
                        type: form.method,
                        url: formRouteParser(form),
                        data: data,
                        dataType: "json", 
                        contentType: false,
                        processData: false, 
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest'
                        },
                        success: function (response) {
                            enableElement(btn);
                            console.log(response);
                            toggleButtonContent(btn, '', true); 
                            (new Master()).hideOverlay();

                            if (response && response.status && response.status == 'success') {
                                if (!donateModalDialog) resetFormAndCloseModal(form);

                                if (response.route) route(response.route);
                                
                                if (donateModalDialog && response.donate_modal_dialog_dom); {
                                    __append_html(response.donate_modal_dialog_dom, donateModalDialog)
                                }

                                toast(response.status, 5000, response.message || LANG_EN.undefined_error);
                                return;
                            }

                            if (response && response.status && response.status == 'error') {
                                toast(response.status, 5000, response.message || LANG_EN.undefined_error);
                                return;
                            }

                            toast('error', 5000, LANG_EN.undefined_error);
                        },
                        error: error => {
                            enableElement(btn);
                            toggleButtonContent(btn, '', true);
                            console.log(error.message || error); 
                            (new Master()).hideOverlay();
                            toast('error', 5000, LANG_EN.undefined_error);
                        }
                    });
                }, 2000);
            }  
        }); 
    } 

    updateStepUI() { 
        document.querySelectorAll(this.config.stepItemSelector).forEach((item, index) => {
            if (index < this.currentStep) {
                item.classList.add(this.config.completedClass);
            } else {
                item.classList.remove(this.config.completedClass);
            }
        });
        
        document.querySelectorAll(this.config.stepPaneSelector).forEach(pane => {
            pane.classList.remove(this.config.activeClass);
        });
        
        document.querySelector(`${this.config.stepPaneSelector}[data-step="${this.currentStep}"]`).classList.add(this.config.activeClass);

        document.querySelector(this.config.prevBtnSelector).disabled = this.currentStep === 1;
    }

    goToStep(stepNumber) {
        if (stepNumber >= 1 && stepNumber <= this.totalSteps) {
            this.currentStep = stepNumber;
            this.updateStepUI();
        }
    }
}

document.addEventListener('DOMContentLoaded', function() { 
    const stepper = new DynamicStepper();
    stepper.init();
});