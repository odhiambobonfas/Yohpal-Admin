// functions sits in here!

// Variables sits in this section
let resizeTimeout;
 
/**
 * Function gives room for cleaner approach of toastr lib usage.
 * The function accepts 3 parameters as defined/highlighted below. 
 * 
 * @param {string} status error, info, warning or success as defined by toastr lib 
 * @param {number} time number, to denote seconds for the toast to take to hide.
 * @param {string} message text message to show user, the outcome of a certain event. 
 */
function toast(status, time, message) {
    try {
        if (message != undefined || message != null) {
            toastr.options.newestOnTop = true;
            toastr.options.timeOut = time;
            toastr.options.extendedTimeOut = 0;
            toastr.options.progressBar = true;
            toastr.options.rtl = false;
            toastr.options.closeButton = true;
            toastr.options.closeMethod = 'fadeOut';
            toastr.options.closeDuration = 300;
            toastr.options.closeEasing = 'swing';
            toastr.options.preventDuplicates = true;

            if (status == 'success') {
                toastr.success(message);
                playSuccessAudio();
            } else if (status == 'warning') {
                toastr.warning(message);
                playWarningAudio();
            } else if (status == 'info') {
                toastr.info(message);
            } else if (status == 'error') {
                toastr.error(message);
                playErrorAudio();
            }
        }
    } catch (error) {
        console.log('Toast Error: ' + error);
    }
}

/**
 * Function to play success audio
 * 
 * @returns {void} void
 */
function playSuccessAudio() {
    var successAudio = document.getElementById('success-audio');
    if (documentContains(successAudio)) {
        successAudio.play();
    }
}

/**
 * Function to play error audio
 * 
 * @returns {void} void
 */
function playErrorAudio() {
    var errorAudio = document.getElementById('error-audio');
    if (documentContains(errorAudio)) {
        errorAudio.play();
    }
}

/**
 * Function to play warning audio
 * 
 * @returns {void} void
 */
function playWarningAudio() {
    var warningAudio = document.getElementById('warning-audio');
    if (documentContains(warningAudio)) {
        warningAudio.play();
    }
}

/**
 * Returns back to previous page.
 * 
 * @returns {void} void
 */
function goBack() {
    window.history.back();
}


/**
 * Disables one or multiple HTML elements.
 * Accepts a CSS selector string, an HTMLElement, or a NodeList/array of elements.
 *
 * @param {string | HTMLElement | NodeList | Array} selector - The target element(s) to disable.
 */
function disableElement(selector) {
    let elements;

    if (typeof selector === 'string') {
        elements = document.querySelectorAll(selector);
    } else if (selector instanceof HTMLElement) {
        elements = [selector];
    } else if (selector instanceof NodeList || Array.isArray(selector)) {
        elements = selector;
    } else {
        console.warn('Unsupported selector type:', selector);
        return;
    }

    elements.forEach(element => {
        element.disabled = true;
    });
}

/**
 * Enables one or multiple HTML elements.
 * Accepts a CSS selector string, an HTMLElement, or a NodeList/array of elements.
 *
 * @param {string | HTMLElement | NodeList | Array} selector - The target element(s) to enable.
 */
function enableElement(selector) {
    let elements;

    if (typeof selector === 'string') {
        elements = document.querySelectorAll(selector);
    } else if (selector instanceof HTMLElement) {
        elements = [selector];
    } else if (selector instanceof NodeList || Array.isArray(selector)) {
        elements = selector;
    } else {
        console.warn('Unsupported selector type:', selector);
        return;
    }

    elements.forEach(element => {
        element.disabled = false;
    });
}

/**
 * Checks if any field in the FormData is empty (after trimming).
 *
 * @param {FormData} formData
 * @returns {boolean}
 */
function formDataHasEmptyFields(formData) {
    for (const [key, value] of formData.entries()) {
        if (typeof value === 'string' && !value.trim()) {
            return true;
        }
    }
    return false;
}

/**
 * Temporarily changes button text, & restores original text when revert is true.
 * 
 * @param {HTMLButtonElement} button HTML button element to act on.
 * @param {Text} tempContent Text to apply to the button.
 * @param {Boolean} revet True or false: To Change back to original content or not.
 */
function toggleButtonContent(button, tempContent = 'Please wait...', revert = false) {
    if (!button) return;
  
    if (!revert) {
      // Save original content to data attribute
      button.dataset.originalContent = button.innerHTML;
      button.innerHTML = tempContent; 
    } else {
      // Restore original content
      if (button.dataset.originalContent) {
        button.innerHTML = button.dataset.originalContent;
        delete button.dataset.originalContent;
      } 
    }
}

/**
 * Removes all child elements from the specified HTML element. 
 * The function first checks if the element exists in the document using `documentContains`.
 * If found, it removes all of its child nodes.
 * 
 * @param {string} selector - A valid CSS selector for the target parent element.
 * @returns {void} void
 */
function removeHtmlElementChildren(selector) {
    const parent = document.querySelector(selector);

    if (!documentContains(parent)) {
        console.warn(`No element found for selector: "${selector}"`);
        return;
    }

    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

/**
 * Shows and Hides the navbar search bar - absolute position blocked.
 * Uses animation library for smooth & stable transition effect
 * 
 * @returns {void} void
 */
function handleShowNavbarSearchBarToggler() {
    const searchBox = document.getElementById('search_input_box');
    const closeBtn = document.getElementById('close_search');

    if (!searchBox || !closeBtn) return;

    searchBox.classList.remove('d-none');
    searchBox.classList.add('animate__animated', 'animate__fadeInDown');

    closeBtn.addEventListener('click', () => {
        searchBox.classList.remove('animate__fadeInDown');
        searchBox.classList.add('animate__fadeOutUp');

        searchBox.addEventListener('animationend', () => {
            searchBox.classList.add('d-none');
            searchBox.classList.remove('animate__animated', 'animate__fadeOutUp');
        }, {
            once: true
        });
    });
}

/**
 * Detect screen size in real time and return
 * 
 * @return {string} screen size annotations, xs, sm, md, lg or xl
 */
function detectScreenSize() {
    const width = window.innerWidth;

    if (width < 576) return 'xs';

    if (width >= 576 && width < 768) return 'sm';

    if (width >= 768 && width < 992) return 'md';

    if (width >= 992 && width < 1200) return 'lg';

    return 'xl';
}

/**
 * Checks if the element exists in a specified body/body-element
 * 
 * @returns {Boolean} True|False
 */
function documentContains(target) {
    if (target && document.body.contains(target)) {
        return true;
    }

    return false;
}

/**
 * Inserts or appends HTML content into an element.
 *
 * @param {string|number} content - The HTML string|number to insert.
 * @param {HTMLElement} element - The target DOM element.
 * @param {boolean} [append=false] - If true, appends content; otherwise, replaces it.
 * @param {string|null} [insertBeforeSelector=null] - Optional CSS selector to insert before a specific child.
 */
function __append_html(content, element, append = false, insertBeforeSelector = null) {
    if (!(element instanceof HTMLElement)) {
        console.warn('__append_html: Invalid target element.');
        return;
    }
    
    // Prepare content as DOM nodes
    const wrapper = document.createElement('div');
    wrapper.innerHTML = content;
    const fragment = document.createDocumentFragment();
    Array.from(wrapper.childNodes).forEach(node => fragment.appendChild(node));

    // Insert logic
    if (insertBeforeSelector) {
        const insertBeforeEl = element.querySelector(insertBeforeSelector);
        if (insertBeforeEl) {
            element.insertBefore(fragment, insertBeforeEl);
        } else {
            console.warn(`__append_html: Selector '${insertBeforeSelector}' not found. Appending to end.`);
            element.appendChild(fragment);
        }
    } else if (append) {
        element.appendChild(fragment);
    } else {
        element.innerHTML = '';
        element.appendChild(fragment);
    }
}

/**
 * Adds a 'sticky' class to the navbar when the page is scrolled,
 * enabling sticky behavior for elements with 'scrollStickyNav' class.
 */
function stickNavbarOnScroll() {
    const nav = document.querySelector('.scrollStickyNav');
    const banner = document.querySelector('.bg-gradient-warning-ltr-footer');
    const footer = document.querySelector('.footer-end');

    window.addEventListener('scroll', function () { 
        if (window.scrollY > 0) {  
            if (documentContains(nav)) nav.classList.add('fixed-top');
            if(documentContains(banner)) banner.classList.add('fixed-bottom');
        } else {
            if (documentContains(nav)) nav.classList.remove('fixed-top'); 
            if(documentContains(banner)) banner.classList.remove('fixed-bottom');
        } 
        
        // Show footer only at the very end of page
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
            if(documentContains(footer)) footer.classList.remove('d-none');
        } else {
            if(documentContains(footer)) footer.classList.add('d-none');
        }
    });
}

/**
 * Initializes Select2 with live search from API endpoint
 * 
 * @param {string} endpoint - Route URL for fetching search data
 * @param {number} minInputLength - Minimum characters to trigger search (default: 2)
 * @param {number} delay - Debounce delay in milliseconds (default: 500)
 */
function searchSelectInitializer(selector='.searchSelect', endpoint = '', minInputLength = 2, delay = 500) {
    $(selector).each(function () { 
        const currentSelect = $(this); 
        
        if (currentSelect.hasClass("select2-hidden-accessible")) return;  

        if (endpoint.length == 0) {
            currentSelect.select2({
                width: '100%',
                dropdownParent: currentSelect.parent()
            });

            return;
        }
        
        currentSelect.select2({
            width: '100%',
            dropdownParent: currentSelect.parent(),
            placeholder: currentSelect.attr('placeholder') || 'Search...',
            allowClear: true,
            minimumInputLength: minInputLength,
            ajax: {
                url: endpoint,
                dataType: 'json',
                delay: delay,
                data: function (params) {
                    return {
                        search: params.term,
                        page: params.page || 1,
                        context: currentSelect.data('context'),
                    };
                },
                processResults: function (data, params) {
                    params.page = params.page || 1;
                    return {
                        results: data.items || data,
                        pagination: {
                            more: data.more || false
                        }
                    };
                },
                cache: true
            },
            templateResult: function (item) {
                if (item.loading) return item.text;
                return $('<div>').text(item.text).addClass('select2-result-item');
            },
            escapeMarkup: function (markup) {
                return markup;
            }
        });
    });
}

/**
 * HTML element cloner function. This function prevents 
 * appending multiple listeners and avoiding call conflicts.
 * 
 * @param {HTMLSelectElement} element 
 * @returns {void} void
 */
function cloneNodeElement(element) {
    var newElement = null;
    if (documentContains(element)) {
        newElement = element.cloneNode(true);
        element.replaceWith(newElement);
    }

    return newElement;
}

function clearElementChildren(element) {
    if (!element) return;
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

/**
 * Initialize drag-and-drop file upload support.
 * Supports multiple drop zones and file inputs.
 * 
 * @param {string} [dropZoneSelector='.dropZone'] - CSS selector for drop zones.
 * @param {string} [fileInputSelector='.importFile'] - CSS selector for file inputs.
 */
function initDragAndDropFileUpload(dropZoneSelector = '.dropZone', fileInputSelector = '.importFile') {
    const dropZones = document.querySelectorAll(dropZoneSelector);

    if (!dropZones.length) return;

    dropZones.forEach(dropZone => {  
        dropZone.addEventListener('click', () => { 
            const fileInput = dropZone.querySelector(fileInputSelector);  
            let fileListDisplay = dropZone.querySelector('.zipFileDetails'); 
    
            const highlight = () => dropZone.classList.add('border-primary');
            const unhighlight = () => dropZone.classList.remove('border-primary');

            const waitAlert = document.querySelector('.wait-alert');
            let texthtml = fileInput.getAttribute('data-inner-html');
            if(texthtml){
                __append_html('Please wait...', waitAlert);
                console.log(texthtml);
            }

            const updateFileList = () => {
                clearElementChildren(fileListDisplay);
                if (fileInput.files.length > 0) {
                    [...fileInput.files].forEach(file => {
                        const strong = document.createElement('strong');
                        strong.textContent = `${file.name} (${Math.round(file.size / 1024)} KB)`;
                        fileListDisplay.appendChild(strong);
                    });
                }
            };
            
            dropZone.addEventListener('click', () => fileInput.click());
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                highlight();
            });
    
            dropZone.addEventListener('dragleave', unhighlight);
            dropZone.addEventListener('dragend', unhighlight);
            
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                unhighlight();
    
                if (e.dataTransfer.files?.length > 0) {
                    fileInput.files = e.dataTransfer.files;
                    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });

            fileInput.addEventListener('change', updateFileList);

            if(texthtml){
                __append_html(texthtml, waitAlert);
            }
        }); 
    });
}

/**
 * Serializes and captures form data to return as an array.
 * 
 * @param {HTMLFormElement} form 
 * @returns {Object} Objectified data
 */
function serializeFormToArray(form) {
    const formData = new FormData(form);
    const result = {};

    for (const [name, value] of formData.entries()) { 
        if (result.hasOwnProperty(name)) { 
            if (Array.isArray(result[name])) {
                result[name].push(value);
            } else { 
                result[name] = [result[name], value];
            }
        } else {
            result[name] = value;
        }
    }

    return result;
}

/**
 * Jsonify Form data and parse to backend as Json formatted.
 * 
 * @param {FormData} data 
 * @returns json
 */
function jsonifyFormData(data) {
    return JSON.stringify(Object.fromEntries(data));
}

/**
 * Hide bootstrap offcanvas gracefully.
 * 
 * @param {HTMLSelectElement} selector 
 * @return {void} void
 */
function hideCanvas(selector) {
    const bsCanvas = bootstrap.Offcanvas.getInstance(selector);
    if (bsCanvas) bsCanvas.hide();
}

/**
 * Get DataTables language configuration with optional customizations.
 *
 * @param {Object} overrides Optional overrides for the language strings.
 * @returns {Object} Language configuration object for DataTables.
 */
function getDataTableLanguage(overrides = {}) {
    const defaultLanguage = {
        emptyTable: 'No data found.',
        processing: '<i class="fa fa-spinner fa-spin fa-2x fa-fw"></i><span class="sr-only">Loading...</span>',
        search: 'Search:',
        searchPlaceholder: '',
        lengthMenu: 'Show _MENU_ entries',
        info: 'Showing _START_ to _END_ of _TOTAL_ entries',
        infoEmpty: 'Showing 0 to 0 of 0 entries',
        infoFiltered: '(filtered from _MAX_ total entries)',
        paginate: {
            first: '<i class="fa fa-angle-double-left"></i> First',
            last: 'Last <i class="fa fa-angle-double-right"></i>',
            previous: '<i class="fa fa-angle-left"></i> Previous',
            next: 'Next <i class="fa fa-angle-right"></i>'
        }
    };

    // Deep merge for nested `paginate` object
    if (overrides.paginate) {
        overrides.paginate = {
            ...defaultLanguage.paginate,
            ...overrides.paginate
        };
    }

    return {
        ...defaultLanguage,
        ...overrides
    };
}

/**
 * Accepts a route string and navigates 
 * the browser to the given route.
 * 
 * @param {string} endpoint - The URL or route to navigate to
 */
function route(endpoint) {
    if (typeof endpoint !== 'string' || !endpoint.trim()) {
        console.error('Invalid route: must be a non-empty string.');
        toast('error', 5000, LANG_EN.nav_route_error)
        return;
    }

    // Trim and normalize the endpoint
    const cleanedEndpoint = endpoint.trim().replace(/^\/+/, '/');

    // Navigate to the new route
    window.location.href = cleanedEndpoint;
}

/**
 * Parses filters from a given container selector.
 * 
 * @param {string} selector - The CSS selector for the filters container.
 * @returns {Object} An object with filter name/value pairs.
 */
function filtersParser(selector) {
    const container = document.querySelector(selector);
    if (!documentContains(container)) return {};

    const filters = {};
    const inputs = container.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
        input = cloneNodeElement(input);
        const name = input.name;
        const value = input.value;

        if (name) {
            filters[name] = value;
        }
    });

    return filters;
}

/**
 * Accepts form dom and parses the form on reset functioN, and 
 * closes the modal if modal appears to be the parent container of the form.
 * 
 * @param {HTMLSelectElement} form 
 */
function resetFormAndCloseModal(form) {  
    if (!documentContains(form)) return;
    
    // Clear all input, textarea, and select fields
    form.querySelectorAll('input, textarea, select').forEach(element => {
        switch (element.type) {
            case 'checkbox':
            case 'radio':
                element.checked = false;
                break;
            case 'select-one':
            case 'select-multiple':
                element.selectedIndex = -1;
                break;
            default:
                element.value = '';
        }
    });

    // clear validation or dynamic inputs...
    form.querySelectorAll('.is-valid, .is-invalid').forEach(element => {
        element.classList.remove('is-valid', 'is-invalid');
    }); 

    closeModal(form);
}

/**
 * Closes the modal if modal appears to be the parent container 
 * of the element specified.
 * 
 * @param {Element} domEl 
 */
function closeModal(domEl) {
    // Check if the form is inside a modal
    let modal = domEl.closest('.modal');
    if (modal) {
        let modalInstance = bootstrap.Modal.getInstance(modal);
        if (modalInstance) {
            modalInstance.hide();
        }
    } 
}

/**
 * Checks if the given HTML element has the specified class.
 *
 * @param {Element} element - Any valid DOM element.
 * @param {string} className - The class name to check for.
 * @returns {boolean} - True if the element has the class, & false otherwise.
 */
function containsClass(element, className) {
    if (!(element instanceof Element)) {
        console.warn('Argument parsed is not a valid DOM element.');
        return false;
    }

    return element.classList.contains(className);
}

/**
 * Accepts the modal HTML element selector (class name) and shows the modal.
 * Uses both versions of bootstrap, 4 and 5 if applicable.
 * 
 * @param {string} modal - Class name or selector (e.g. 'myModal' or '.myModal').
 * @returns {void}
 */
function __show_modal(modal) {
    let selector = modal.startsWith('.') ? modal : `.${modal}`;
    let modalElement = document.querySelector(selector);

    if (!modalElement) {
        console.warn(`Modal not found: ${modal}`);
        return;
    }

    const isBootstrap5 = typeof bootstrap !== 'undefined' && typeof bootstrap.Modal !== 'undefined';

    if (isBootstrap5) { 
        let bsModal = bootstrap.Modal.getOrCreateInstance(modalElement);

        if (modalElement.classList.contains('show')) {
            bsModal.hide();
            modalElement.addEventListener('hidden.bs.modal', function handler() {
                modalElement.removeEventListener('hidden.bs.modal', handler);
                bsModal.show();
            });
        } else {
            bsModal.show();
        }
    } else if (typeof $ === 'function' && typeof $(modalElement).modal === 'function') { 
        let $modal = $(modalElement);

        if ($modal.hasClass('show')) {
            $modal.modal('hide');
            $modal.on('hidden.bs.modal', function handler() {
                $modal.off('hidden.bs.modal', handler);
                $modal.modal('show');
            });
        } else {
            $modal.modal('show');
        }
    } else {
        console.warn('No supported Bootstrap version detected.');
    }
}

/**
 * Toggle Overlay loader for UX improvements
 * 
 * @param {boolean} show 
 * @returns {void} void
 */
function toggleLoadingOverlay(show = true) {
    const overlay = document.getElementById('loadingOverlay');
    if (!documentContains(overlay)) return;
    overlay.classList.toggle('d-none', !show);
}

/**
 * Toggles CRM sidebar, enhancing UI/UX
 * 
 * @returns {void} void
 */
function toggleCrmSideBar() {
    const toggleBtn = document.getElementById('sidebarToggleBtn');
    if (!documentContains(toggleBtn)) return;

    // Restore previous state on load
    if (localStorage.getItem('crmSidebarCollapsed') === 'true') {
        document.body.classList.add('sidebar-collapsed');
    }

    toggleBtn.addEventListener('click', function () {
        document.body.classList.toggle('sidebar-collapsed');

        // Save current state to localStorage
        const isCollapsed = document.body.classList.contains('sidebar-collapsed');
        localStorage.setItem('crmSidebarCollapsed', isCollapsed);
    });
}


/**
 * Parses and returns an action route from a specifified form
 * 
 * @param {HTMLSelectElement} form 
 * @returns {string|null} Form Route URL
 */
function formRouteParser(form) {
    return form.action || form.getAttribute('route')
}

/**
 * Parses both query parameters and dynamic path parameters.
 * Returns an object with { query, path }.
 *
 * @param {string} [url] - Optional URL to parse. Defaults to the current page's URL.
 * @returns {{ query: URLSearchParams, path: string[] }}
 */
function urlParamsParser(url = null) {
    try {
        if (!url && typeof window !== 'undefined' && window.location) {
            url = window.location.href;
        }

        if (url) {
            const parsedUrl = new URL(url);
            
            const queryParams = new URLSearchParams(parsedUrl.search);
            
            const pathParams = parsedUrl.pathname
                .split('/')
                .filter(Boolean);

            return {
                query: queryParams,
                path: pathParams
            };
        }

        return { query: new URLSearchParams(), path: [] };
    } catch (error) {
        console.error('Invalid URL provided:', error.message);
        return { query: new URLSearchParams(), path: [] };
    }
}

/**
 * Get DataTables language configuration with optional customizations.
 *
 * @param {Object} overrides Optional overrides for the language strings.
 * @returns {Object} Language configuration object for DataTables.
 */
function getDataTableLanguage(overrides = {}) {
    const defaultLanguage = {
        emptyTable: 'No data found.',
        processing: '<i class="fa fa-spinner fa-spin fa-2x fa-fw"></i><span class="sr-only">Loading...</span>',
        search: 'Search:',
        searchPlaceholder: '',
        lengthMenu: 'Show _MENU_ entries',
        info: 'Showing _START_ to _END_ of _TOTAL_ entries',
        infoEmpty: 'Showing 0 to 0 of 0 entries',
        infoFiltered: '(filtered from _MAX_ total entries)',
        paginate: {
            first: '<i class="fa fa-angle-double-left"></i> First',
            last: 'Last <i class="fa fa-angle-double-right"></i>',
            previous: '<i class="fa fa-angle-left"></i> Previous',
            next: 'Next <i class="fa fa-angle-right"></i>'
        }
    };

    // Deep merge for nested `paginate` object
    if (overrides.paginate) {
        overrides.paginate = {
            ...defaultLanguage.paginate,
            ...overrides.paginate
        };
    }

    return {
        ...defaultLanguage,
        ...overrides
    };
}

/**
 * Parses filters from a given container selector.
 * 
 * @param {string} selector - The CSS selector for the filters container.
 * @returns {Object} An object with filter name/value pairs.
 */
function filtersParser(selector) {
    const container = document.querySelector(selector);
    if (!documentContains(container)) return {};

    const filters = {};
    const inputs = container.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
        input = cloneNodeElement(input);
        const name = input.name;
        const value = input.value;

        if (name) {
            filters[name] = value;
        }
    }); 
    
    return filters;
}

/**
 * Watches inputs in a container and triggers a callback on change.
 * 
 * @param {string} selector - The CSS selector for the filters container.
 * @param {Array|Function} callback - The function|Array of Functions, to call when any input changes.
 */
function watchFilterChanges(selector, callback) {
    const container = document.querySelector(selector);  
    if (!documentContains(container)) return;

    const inputs = container.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        input = cloneNodeElement(input);
        input.addEventListener('change', (event) => { 
            if (Array.isArray(callback)) {
                callback.forEach(func => {
                    func();
                });
            }
            else {
                callback();
            }
        }); 
    }); 
}

/**
 * Assistive function for ajax complete callback
 * 
 * @param {Array|Function} callbackFunc 
 */
function ajaxCompleteFilterUtilFunc(selector, callback) {
    $(document).on('ajaxComplete', (e, jqxhr, settings) => {
        watchFilterChanges(selector, callback) 
    });
}

/**
 * Ajax Dt Util helper function.
 * Parses the expected server response, and passes on to the ajax dt table api
 */
function ajaxDtParser(method, url, data={}, callbackFuncs=[]) {
    return {
        type: method,
        url: url,
        data: data,
        dataType: 'json',
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        },
        dataSrc: function (response) { 
            if (Array.isArray(callbackFuncs) && callbackFuncs.length) {   
                callbackFuncs.forEach(item => { 
                    if (typeof item === 'function' && item.callback) { 
                        item(response.data ?? []);
                    }
                    else if (typeof item === 'object' && item.callback) {
                        const params = item.params ? item.params : {};  
                        item.callback({params: params, data: response.data});
                    }
                }); 
            }

            return response.data;
        },
        error: (err) => {
            console.log(err.message || err);
            toast('error', 3000, LANG_EN.undefined_error);
        }
    }
}

/**
 * Detect screen size in real time and return
 * 
 * @return {string} screen size annotations, xs, sm, md, lg or xl
 */
function detectScreenSize() {
    const width = window.innerWidth;

    if (width < 576) return 'xs';

    if (width >= 576 && width < 768) return 'sm';

    if (width >= 768 && width < 992) return 'md';

    if (width >= 992 && width < 1200) return 'lg';

    return 'xl';
}

/**
 * Creates a currency formatter with customizable formatting rules
 *
 * @param {number} amount - Amount to format (e.g. 10, 50, 1000)
 * @param {string} symbol - Currency symbol (e.g., 'KSh', etc..)
 * @param {number} decimal - Number of decimal places (default: 2)
 * @param {string} thousand - Thousands separator (default: ',')
 * @param {string} symbol_position - Position of symbol ('before' or 'after')
 * @param {boolean} space - Add space between symbol and amount (default: false)
 * @param {string} dec_separator - Decimal separator (default: '.')
 * @returns {string} - Formatted currency string
 */
function currencyFormatter(amount, symbol, decimal = 2, thousand = ',', symbol_position = 'before', space = true, dec_separator = '.') {
    if (isNaN(amount)) {
        throw new Error('Amount must be numeric');
    }

    const fixedAmount = Number(amount).toFixed(decimal);

    // Split into whole and decimal parts
    let [intPart, decPart] = fixedAmount.split('.');

    // Add thousand separators
    intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousand);
    
    let formattedAmount = decimal > 0
        ? intPart + dec_separator + decPart
        : intPart;

    const spaceString = space ? ' ' : '';

    return symbol_position === 'before'
        ? symbol + spaceString + formattedAmount
        : formattedAmount + spaceString + symbol;
}

/**
 * Fire up the search select library for initialization 
 * on modal select elements
 */
function fireUpSearchSelectFuncOnModals() {
    const modals = document.querySelectorAll('.modal');

    modals.forEach(modal => {
        if (!modal) return;
        modal.addEventListener('shown.bs.modal', () => { 
            searchSelectInitializer();
        })
    });
}

function addSpinnerGrowLoadingEffect(selector) {
    const elements = document.querySelectorAll(selector);
    
    if (!elements) return;

    elements.forEach(element => {
        const spinner = `
            <div class="col-12 d-flex spinner-container justify-content-center gap-4 align-items-container py-5"> 
                <div class="spinner-grow text-danger" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <div class="spinner-grow text-success" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <div class="spinner-grow text-warning" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;
    
        __append_html(spinner, element);
        
    });
}

function setupDateRangeWithBootstrapDatePickerLib() {
    let start, end;

    $('#daterange').datepicker({
        format: "dd-mm-yyyy",
        autoclose: false,
    });
    
    start = end = moment();
    $('#daterange').val(start.format("DD-MM-YYYY") + " - " + end.format("DD-MM-YYYY"));
    
    document.querySelectorAll(".dropdown-menu a").forEach(item => {
        item.addEventListener("click", e => {
            e.preventDefault();
            const range = e.target.dataset.range;
            let start, end;
      
            switch (range) {
                    case "today":
                        start = end = moment();
                        break;
                    case "yesterday":
                        start = end = moment().subtract(1, 'days');
                        break;
                    case "thismonth":
                        start = moment().startOf('month');
                        end   = moment().endOf('month');
                        break;
                    case "lastmonth":
                        start = moment().subtract(1, 'month').startOf('month');
                        end   = moment().subtract(1, 'month').endOf('month');
                        break;
            }

            if (!start && !end) return;
            $('#daterange').val(start.format("DD-MM-YYYY") + " - " + end.format("DD-MM-YYYY"));
        });
      });
}

/**
 * Enable preview for any file input
 * 
 * @param {string} inputId - ID of the file input element
 * @param {string} previewId - ID of the img element for preview
 */
function enableImagePreview(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);

    if (!input || !preview) return;

    input.addEventListener('change', function () {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = e => {
                preview.src = e.target.result; 
            };
            reader.readAsDataURL(file);
        } else {
            preview.src = "/store/images/avatars/default-avatar.jpg"; 
        }
    });
}

function fixDatatableRendering() {
    $('.dropdown-toggle').dropdown({
        dropdownParent: $('body')
    }); 

    const tableResponsive = $('.table-responsive');
    let openDropdowns = new Set();

    function updateTableHeight() {
        if (openDropdowns.size > 0) {
            tableResponsive
                .stop()
                .animate({ height: '50vh' }, 300)
                .addClass('dropdown-active');
        } else {
            tableResponsive
                .stop()
                .animate({ height: '' }, 300)
                .removeClass('dropdown-active');
        }
    }
    
    $(document).on('show.bs.dropdown', function(e) {
        const dropdown = e.target;
        const dropdownId = $(dropdown).find('.dropdown-toggle').data('id') || Math.random();
        
        openDropdowns.add(dropdownId);
        updateTableHeight();
    });

    $(document).on('hide.bs.dropdown', function(e) {
        const dropdown = e.target;
        const dropdownId = $(dropdown).find('.dropdown-toggle').data('id') || Math.random();
        
        openDropdowns.delete(dropdownId);
        updateTableHeight();
    });

    // Close dropdowns when clicking items
    $(document).on('click', '.dropdown-item', function(e) {
        e.preventDefault();
        const dropdown = $(this).closest('.dropdown');
        const dropdownId = dropdown.find('.dropdown-toggle').data('id');
        
        openDropdowns.delete(dropdownId);
        dropdown.removeClass('show');
        dropdown.find('.dropdown-menu').removeClass('show');
        
        updateTableHeight(); 
    });
}

function initListTransition(listSelector, contentSelector) {
  const listItems = document.querySelectorAll(`${listSelector} .list-group-item`);
  const contents = document.querySelectorAll(contentSelector);

  listItems.forEach(item => {
    if (!item) return;
    item.addEventListener('click', () => { 
      listItems.forEach(el => el.classList.remove('active'));
      item.classList.add('active');

      // hide all content
      contents.forEach(c => {
        c.classList.remove('show');
        c.classList.add('d-none');
      });

      // show target
      const targetId = item.getAttribute('data-id');
      const target = document.getElementById(targetId);
      if (target) {
        target.classList.remove('d-none');
        setTimeout(() => target.classList.add('show'), 10);
      }
    });
  });
}

function initProviderToggle(selectId, formClass) {
  const select = document.getElementById(selectId);
  const forms = document.querySelectorAll(`.${formClass}`);
    if (!select) return;
  select.addEventListener('change', () => {
    const provider = select.value; 
    forms.forEach(f => f.classList.add('d-none')); 
    if (provider) {
      const activeForm = document.getElementById(`${provider}-form`);
      if (activeForm) activeForm.classList.remove('d-none');
    }
  });
}

// Call functions Below.
document.addEventListener('DOMContentLoaded', async () => {
    document.querySelectorAll('.searchToggle').forEach(toggler => {
        toggler.addEventListener('click', handleShowNavbarSearchBarToggler);
    });

    toggleCrmSideBar(); 
    stickNavbarOnScroll();
    searchSelectInitializer();
    initDragAndDropFileUpload(); 
    fireUpSearchSelectFuncOnModals();
    const masterInstance = new Master(); 
    masterInstance.initOverlay('.main .content-section'); 
    masterInstance.initDonateNowFunc();  
    setupDateRangeWithBootstrapDatePickerLib();
    fixDatatableRendering();
});