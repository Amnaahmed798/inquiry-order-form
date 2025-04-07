// Global variables
const allFiles = [];
let totalPrice = 0;
let promoApplied = false;
let emailEntered = false;
let selectedFreeServices = [
    "Certificate of Editing",
    "Manuscript Rate Card",
    "Artwork Rework",
    "Resubmission Support"
];
let serviceDetailsElement;
let addOnsSummaryList;
let totalPriceElement;

// Helper function to create free services section if it doesn't exist
function createFreeServicesList() {
    const orderSummary = document.querySelector('.order-summary');
    if (!orderSummary) return null;
    
    // Check if the free services section already exists
    if (document.querySelector('.free-services-summary')) {
        return document.querySelector('.free-services-summary ul');
    }
    
    // Create free services section
    const freeServicesSection = document.createElement('div');
    freeServicesSection.className = 'free-services-summary';
    
    const sectionTitle = document.createElement('h4');
    sectionTitle.textContent = 'Free Services';
    sectionTitle.style.marginBottom = '10px';
    sectionTitle.style.color = '#333';
    
    const servicesList = document.createElement('ul');
    servicesList.style.listStyleType = 'none';
    servicesList.style.padding = '0';
    servicesList.style.margin = '0';
    
    freeServicesSection.appendChild(sectionTitle);
    freeServicesSection.appendChild(servicesList);
    
    // Insert after add-ons summary
    const addOnsSection = document.querySelector('.add-ons-summary');
    if (addOnsSection) {
        orderSummary.insertBefore(freeServicesSection, addOnsSection.nextSibling);
    } else {
        orderSummary.appendChild(freeServicesSection);
    }
    
    return servicesList;
}

// Helper function to update the free services list
function updateFreeServicesList() {
    const freeServicesList = document.querySelector('.free-services-summary ul') || 
                             createFreeServicesList();
    
    if (!freeServicesList) return;
    
    // Clear existing items
    freeServicesList.innerHTML = "";
    
    // Add each free service to the list
    selectedFreeServices.forEach(service => {
        const listItem = document.createElement('li');
        listItem.style.padding = '6px 0';
        listItem.style.display = 'flex';
        listItem.style.justifyContent = 'space-between';
        listItem.style.alignItems = 'center';
        listItem.style.borderBottom = '1px solid #eee';
        
        // Create service name span
        const serviceNameSpan = document.createElement('span');
        serviceNameSpan.textContent = service;
        serviceNameSpan.style.fontSize = '14px';
        serviceNameSpan.style.color = '#555';
        
        // Create badge for "Free"
        const freeBadge = document.createElement('span');
        freeBadge.textContent = 'Free';
        freeBadge.style.fontSize = '12px';
        freeBadge.style.backgroundColor = '#e6f7ff';
        freeBadge.style.color = '#0086d1';
        freeBadge.style.padding = '2px 6px';
        freeBadge.style.borderRadius = '12px';
        freeBadge.style.marginLeft = '8px';
        
        // Create container for service name and free badge
        const serviceInfoContainer = document.createElement('div');
        serviceInfoContainer.style.display = 'flex';
        serviceInfoContainer.style.alignItems = 'center';
        serviceInfoContainer.appendChild(serviceNameSpan);
        serviceInfoContainer.appendChild(freeBadge);
        
        // Create remove button
        const removeButton = document.createElement('button');
        removeButton.innerHTML = '&times;'; // × symbol
        removeButton.className = 'remove-free-service';
        removeButton.title = 'Remove this service';
        removeButton.style.background = 'none';
        removeButton.style.border = '1px solid #ff6b6b';
        removeButton.style.borderRadius = '50%';
        removeButton.style.color = '#ff6b6b';
        removeButton.style.width = '20px';
        removeButton.style.height = '20px';
        removeButton.style.lineHeight = '16px';
        removeButton.style.textAlign = 'center';
        removeButton.style.fontWeight = 'bold';
        removeButton.style.fontSize = '14px';
        removeButton.style.cursor = 'pointer';
        removeButton.style.display = 'flex';
        removeButton.style.justifyContent = 'center';
        removeButton.style.alignItems = 'center';
        removeButton.style.padding = '0';
        
        // Hover effect
        removeButton.onmouseover = function() {
            this.style.backgroundColor = '#ff6b6b';
            this.style.color = 'white';
            this.style.transition = 'all 0.2s ease';
        };
        removeButton.onmouseout = function() {
            this.style.backgroundColor = 'transparent';
            this.style.color = '#ff6b6b';
            this.style.transition = 'all 0.2s ease';
        };
        
        removeButton.addEventListener('click', function() {
            // Remove from selected free services
            const index = selectedFreeServices.indexOf(service);
            if (index !== -1) {
                selectedFreeServices.splice(index, 1);
            }
            
            // Uncheck the corresponding checkbox
            const checkboxes = document.querySelectorAll('.free-service-checkbox');
            checkboxes.forEach(checkbox => {
                if (checkbox.parentElement.textContent.trim() === service) {
                    checkbox.checked = false;
                }
            });
            
            // Update the list
            updateFreeServicesList();
            
            // Animation for removal
            listItem.style.transition = 'all 0.3s ease';
            listItem.style.opacity = '0';
            listItem.style.height = '0';
            listItem.style.overflow = 'hidden';
            
            setTimeout(() => {
                listItem.remove();
            }, 300);
        });
        
        // Append elements to list item
        listItem.appendChild(serviceInfoContainer);
        listItem.appendChild(removeButton);
        
        // Add to list
        freeServicesList.appendChild(listItem);
    });
    
    // Show/hide the section based on whether there are any free services
    const freeServicesSection = document.querySelector('.free-services-summary');
    if (freeServicesSection) {
        freeServicesSection.style.display = selectedFreeServices.length > 0 ? 'block' : 'none';
    }
}

// Main initialization - wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM fully loaded - initializing form functionality");
    
    // Get critical DOM elements
    const steps = document.querySelectorAll(".form-step");
    const toggleIcons = document.querySelectorAll(".toggle-icon");
    const proceedButtons = document.querySelectorAll(".proceed-btn");
    const emailInput = document.getElementById("email");
    const continueBtn = document.getElementById("continue-btn");
    const fileInput = document.getElementById("file-input");
    const fileContainer = document.getElementById("file-container");
    const dropZone = document.getElementById("drop-zone");
    const submitButton = document.getElementById("btn");
    
    // Order Summary Elements
    serviceDetailsElement = document.querySelector(".service-details p");
    addOnsSummaryList = document.querySelector(".add-ons-summary ul");
    const freeServicesList = document.querySelector(".free-services-summary ul") || 
                             createFreeServicesList();
    totalPriceElement = document.getElementById("total-price");
    const applyPromoBtn = document.getElementById("apply-promo");
    const promoInput = document.getElementById("promo-code");
    
    // Log available elements
    console.log("Elements found:", {
        steps: steps.length,
        toggleIcons: toggleIcons.length,
        proceedButtons: proceedButtons.length,
        emailInput: !!emailInput,
        continueBtn: !!continueBtn,
        fileInput: !!fileInput,
        fileContainer: !!fileContainer,
        dropZone: !!dropZone,
        submitButton: !!submitButton,
        serviceDetails: !!serviceDetailsElement,
        addOnsSummary: !!addOnsSummaryList,
        totalPrice: !!totalPriceElement,
        freeServicesList: !!freeServicesList
    });
    
    // Initialize - hide all step contents except the first one
    steps.forEach((step, index) => {
        const content = step.querySelector(".form-cont, .upload-box, .service-container, .form-con");
        if (content) {
            content.style.display = index === 0 ? "block" : "none";
        }
    });
    
    // Disable all toggle icons initially except the first one
    toggleIcons.forEach((icon, index) => {
        icon.style.pointerEvents = index === 0 ? "auto" : "none";
        icon.style.opacity = index === 0 ? "1" : "0.5";
    });
    
    // Initialize the free services display
    updateFreeServicesList();
    
    // Check the corresponding free service checkboxes based on default selections
    const initialFreeServiceCheckboxes = document.querySelectorAll('.free-service-checkbox');
    initialFreeServiceCheckboxes.forEach(checkbox => {
        const serviceName = checkbox.parentElement.textContent.trim();
        if (selectedFreeServices.includes(serviceName)) {
            checkbox.checked = true;
        }
    });
    
    // Email continue button click handler
    if (continueBtn) {
        continueBtn.addEventListener("click", function() {
            const email = emailInput.value.trim();
            if (email === "") {
                alert("Please enter your email address.");
                return;
            }
            
            if (!validateEmail(email)) {
                alert("Please enter a valid email address.");
                return;
            }
            
            emailEntered = true;
            
            // Hide all step contents
            steps.forEach(step => {
                const content = step.querySelector(".form-cont, .upload-box, .service-container, .form-con");
                if (content) content.style.display = "none";
            });
            
            // Show the next step content (index 1)
            if (steps[1]) {
                const content = steps[1].querySelector(".form-cont, .upload-box, .service-container, .form-con");
                if (content) content.style.display = "block";
                
                // Enable toggle icons for first two steps
                if (toggleIcons[0]) toggleIcons[0].style.opacity = "1";
                if (toggleIcons[0]) toggleIcons[0].style.pointerEvents = "auto";
                if (toggleIcons[1]) toggleIcons[1].style.opacity = "1";
                if (toggleIcons[1]) toggleIcons[1].style.pointerEvents = "auto";
            }
        });
    }
    
    // Toggle icon click handlers
    toggleIcons.forEach((icon, index) => {
        icon.addEventListener("click", function() {
            if (!emailEntered && index > 0) {
                alert("Please enter your email first.");
                return;
            }
            
            // Hide all step contents
            steps.forEach(step => {
                const content = step.querySelector(".form-cont, .upload-box, .service-container, .form-con");
                if (content) content.style.display = "none";
            });
            
            // Show the clicked step's content
            if (steps[index]) {
                const content = steps[index].querySelector(".form-cont, .upload-box, .service-container, .form-con");
                if (content) content.style.display = "block";
            }
        });
    });
    
    // Proceed button click handlers
    proceedButtons.forEach((button, index) => {
        button.addEventListener("click", function(e) {
            e.preventDefault();
            
            if (!emailEntered) {
                alert("Please enter your email first.");
                return;
            }
            
            const currentStep = button.closest(".form-step");
            const currentStepIndex = Array.from(steps).indexOf(currentStep);
            const nextStepIndex = currentStepIndex + 1;
            
            if (nextStepIndex >= steps.length) {
                alert("This is the last step.");
                return;
            }
            
            // Validate required fields in current step
            const requiredFields = currentStep.querySelectorAll("[required]");
            let allValid = true;
            
            requiredFields.forEach(field => {
                if (field.value.trim() === "") {
                    field.style.border = "2px solid red";
                    allValid = false;
                } else {
                    field.style.border = "";
                }
            });
            
            if (!allValid) {
                alert("Please fill all required fields.");
                return;
            }
            
            // Hide all step contents
            steps.forEach(step => {
                const content = step.querySelector(".form-cont, .upload-box, .service-container, .form-con");
                if (content) content.style.display = "none";
            });
            
            // Show the next step's content
            if (steps[nextStepIndex]) {
                const content = steps[nextStepIndex].querySelector(".form-cont, .upload-box, .service-container, .form-con");
                if (content) content.style.display = "block";
                
                // Enable the toggle icon for the next step
                if (toggleIcons[nextStepIndex]) {
                    toggleIcons[nextStepIndex].style.opacity = "1";
                    toggleIcons[nextStepIndex].style.pointerEvents = "auto";
                }
            }
        });
    });
    
    // Function to clear all add-ons selections and summary
    function clearAddOns() {
        // Uncheck all add-on checkboxes
        const allAddOnCheckboxes = document.querySelectorAll('.add-ons input[type="checkbox"]:not(.free-service-checkbox)');
        allAddOnCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Clear add-ons summary
        if (addOnsSummaryList) {
            addOnsSummaryList.innerHTML = '';
        }
        
        // Reset total price to base service price
        const selectedService = document.querySelector('input[name="service"]:checked');
        if (selectedService) {
            totalPrice = getBaseServicePrice();
            updateTotalPrice();
        } else {
            totalPrice = 0;
            updateTotalPrice();
        }
    }

    // Direct service selection click handlers
    const serviceRadios = document.querySelectorAll('input[name="service"]');
    serviceRadios.forEach(radio => {
        radio.addEventListener('click', function() {
            // Clear previous add-ons selections and summary
            clearAddOns();
            
            // Get the addons section ID based on the radio button ID
            const addonsMap = {
                'scientificEditing': 'addons1',
                'substantiveEditing': 'addons2',
                'copyEditing': 'addons3',
                'proofreading': 'addons4'
            };
            
            const addonsId = addonsMap[this.id];
            
            // Hide all add-ons sections first
            const allAddons = document.querySelectorAll('.add-ons');
            allAddons.forEach(addon => {
                addon.style.display = 'none';
            });

            // Show the selected service's add-ons
            const selectedAddons = document.getElementById(addonsId);
            if (selectedAddons) {
                selectedAddons.style.display = 'block';
            }

            // Update service name in order summary
            const serviceName = this.parentElement.querySelector('.option-content').textContent.trim();
            const serviceDetails = document.querySelector('.service-details p');
            if (serviceDetails) {
                serviceDetails.textContent = serviceName;
            }

            // Update total price with new base price
                updateTotalPrice();
        });
    });

    // Add-on selection handlers
    function setupAddOnHandlers() {
        const addOnCheckboxes = document.querySelectorAll('.add-ons input[type="checkbox"]:not(.free-service-checkbox)');
        addOnCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const label = this.closest('label');
                const name = label.querySelector('.addon-name').textContent;
                const priceElement = label.querySelector('.price strong');
                const price = priceElement ? parseFloat(priceElement.textContent.replace('$', '')) : 0;

                if (this.checked) {
                    addToOrderSummary(name, price);
                } else {
                    removeFromOrderSummary(name, price);
            }
        });
    });
    }

    // Call setupAddOnHandlers after DOM is loaded
    setupAddOnHandlers();
    
    // Free services selection handlers
    const freeServiceCheckboxes = document.querySelectorAll('.free-service-checkbox');
    freeServiceCheckboxes.forEach(checkbox => {
        checkbox.addEventListener("change", function() {
            const serviceName = this.parentElement.textContent.trim();
            
            if (this.checked) {
                // Add to selected free services if not already present
                if (!selectedFreeServices.includes(serviceName)) {
                    selectedFreeServices.push(serviceName);
                }
            } else {
                // Remove from selected free services
                const index = selectedFreeServices.indexOf(serviceName);
                if (index !== -1) {
                    selectedFreeServices.splice(index, 1);
                }
            }
            
            updateFreeServicesList();
        });
    });
    
    // Promo code application
    if (applyPromoBtn) {
        applyPromoBtn.addEventListener("click", function() {
            if (promoInput && promoInput.value.trim() !== "") {
                // Apply a 10% discount for demo purposes
                if (!promoApplied) {
                    totalPrice = totalPrice * 0.9; // 10% discount
                    promoApplied = true;
                    alert("Promo code applied! 10% discount.");
                    updateTotalPrice();
                    
                    // Disable the button and input after applying
                    promoInput.disabled = true;
                    applyPromoBtn.disabled = true;
                } else {
                    alert("Promo code already applied!");
                }
            } else {
                alert("Please enter a promo code");
            }
        });
    }
    
    // File input change handler
    if (fileInput) {
        fileInput.addEventListener("change", function() {
            if (this.files && this.files.length > 0) {
                processFiles(this.files);
            }
        });
    }
    
    // Drag and drop handlers
    if (dropZone) {
        dropZone.addEventListener("dragover", function(e) {
            e.preventDefault();
            this.classList.add("drag-over");
        });
        
        dropZone.addEventListener("dragleave", function(e) {
            e.preventDefault();
            this.classList.remove("drag-over");
        });
        
        dropZone.addEventListener("drop", function(e) {
            e.preventDefault();
            this.classList.remove("drag-over");
            
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                processFiles(e.dataTransfer.files);
            }
        });
    }
    
    // Submit button click handler
    if (submitButton) {
        submitButton.addEventListener("click", async function(e) {
            e.preventDefault();
            console.log("Submit button clicked");
            
            // Validate required fields
            const isFormValid = validateForm();
            if (!isFormValid) {
                console.error("Form validation failed");
                return;
            }
            
            // Get form data
            const email = document.getElementById("email").value.trim();
            const fullName = document.getElementById("fullName").value.trim();
            const mobile = document.getElementById("mobile")?.value?.trim() || "";
            const subjectArea = document.getElementById("subject-area")?.value?.trim() || "";
            const journalName = document.getElementById("journal-name")?.value?.trim() || "";
            const orderInstructions = document.getElementById("order-instructions")?.value?.trim() || "";
            
            // Get selected service and its details
            const selectedServiceRadio = document.querySelector('input[name="service"]:checked');
            const selectedService = {
                id: selectedServiceRadio?.id || '',
                name: selectedServiceRadio?.parentElement?.querySelector('.option-content')?.textContent?.trim() || '',
                price: getBaseServicePrice()
            };
            
            // Get selected add-ons with full details
            const addOns = [];
            const addOnCheckboxes = document.querySelectorAll('.add-ons input[type="checkbox"]:not(.free-service-checkbox):checked');
            addOnCheckboxes.forEach(checkbox => {
                const label = checkbox.closest('label');
                const name = label.querySelector('.addon-name')?.textContent?.trim() || '';
                const priceElement = label.querySelector('.price strong');
                const price = priceElement ? parseFloat(priceElement.textContent.replace('$', '')) : 0;
                const addonId = checkbox.id || `addon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                
                addOns.push({
                    id: addonId,
                    name: name,
                    price: price,
                    selected: true
                });
            });
            
            // Get last step radio button selections
            const quickStartSelection = document.querySelector('input[name="quickStart"]:checked')?.id || '';
            const receiveUpdates = document.getElementById('updates')?.checked || false;
            
            // Prepare form data
            const formData = {
                email,
                personalInfo: {
                    fullName,
                    mobile
                },
                subjectArea,
                journalName,
                orderInstructions,
                selectedService,
                addOns,
                quickStart: quickStartSelection,
                receiveUpdates,
                freeServices: selectedFreeServices,
                totalPrice,
                promoApplied,
                files: allFiles.map(file => {
                    // Create a unique ID for each file
                    const fileId = file.fileId || `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    
                    return {
                        fileId,
                        name: file.name || file.file?.name || "Manual Entry",
                        size: file.size || file.file?.size || 0,
                        wordCount: file.wordCount || 0,
                        type: file.type || file.file?.type || "text/plain",
                        isManualEntry: file.isManualEntry || false,
                        timestamp: file.timestamp || Date.now(),
                        status: file.status || 'processed',
                        originalName: file.file?.name || file.name,
                        fileName: file.file?.name || file.name,
                        filePath: file.file?.path || '',
                        fileSize: file.file?.size || file.size || 0
                    };
                })
            };
            
            console.log("Preparing to submit form data:", formData);
            
            try {
                // Display loading state
                this.disabled = true;
                this.innerHTML = '<span class="spinner"></span> Submitting...';
                
                // Send form data to the server
                const response = await fetch('http://localhost:5000/api/submit-form', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                const result = await response.json();
                console.log("Form submission result:", result);
                
                if (result.success) {
                    // Send the form data to the admin dashboard
                    try {
                        // Send to admin dashboard if it's open
                        if (window.opener) {
                            window.opener.postMessage({ 
                                type: 'formSubmission', 
                                formData: {
                                    ...formData,
                                    submittedAt: new Date()
                                }
                            }, '*');
                        }
                        // Also save to localStorage for demonstration purposes
                        const submissions = JSON.parse(localStorage.getItem('formSubmissions') || '[]');
                        submissions.push({
                            ...formData,
                            submittedAt: new Date()
                        });
                        localStorage.setItem('formSubmissions', JSON.stringify(submissions));
                        console.log('Form data saved to localStorage and sent to admin dashboard');
                    } catch (error) {
                        console.log('Error sending to admin dashboard:', error);
                    }
                    
                    // Show success message
                    showSuccessMessage(formData);
                } else {
                    // Show error
                    alert(result.message || "Error submitting form. Please try again.");
                    this.disabled = false;
                    this.innerHTML = 'SUBMIT';
                }
            } catch (error) {
                console.error("Error submitting form:", error);
                
                // Save data locally if server is not reachable
                try {
                    // Store submission locally
                    const submissions = JSON.parse(localStorage.getItem('formSubmissions') || '[]');
                    const localFormData = {
                        ...formData,
                        submittedAt: new Date(),
                        id: Date.now().toString()
                    };
                    submissions.push(localFormData);
                    localStorage.setItem('formSubmissions', JSON.stringify(submissions));
                    
                    console.log('Form data saved locally due to server error');
                    showSuccessMessage(formData);
                } catch (localError) {
                    console.error("Error saving form locally:", localError);
                    alert("Error submitting form. Please try again.");
                    this.disabled = false;
                    this.innerHTML = 'SUBMIT';
                }
            }
        });
    }
    
    // Test backend connection
    testBackendConnection();

    // Add event listeners to toggle links
    const wordCountToggleLink = document.getElementById("word-count-toggle-link");
    const wordCountBackLink = document.getElementById("word-count-back-link");
    const uploadSection = document.getElementById("upload");
    const wordCountContainer = document.getElementById("word-count-container");

    if (wordCountToggleLink) {
        wordCountToggleLink.addEventListener("click", function(event) {
            event.preventDefault();
            if (uploadSection && wordCountContainer) {
                uploadSection.style.display = "none";
                wordCountContainer.style.display = "block";
            }
        });
    }

    if (wordCountBackLink) {
        wordCountBackLink.addEventListener("click", function(event) {
            event.preventDefault();
            if (uploadSection && wordCountContainer) {
                uploadSection.style.display = "block";
                wordCountContainer.style.display = "none";
            }
        });
    }

    // Handle word count input
    const wordCountInput = document.getElementById("word-count-input");
    if (wordCountInput) {
        wordCountInput.addEventListener("change", function() {
            const wordCount = parseInt(this.value) || 0;
            const fileObj = {
                name: "Manual Word Count",
                wordCount: wordCount,
                type: "text/plain",
                size: 0,
                timestamp: Date.now(),
                status: 'processed'
            };
            
            // Add to global files array
            allFiles.push(fileObj);
            
            // Create file element
            const fileElement = document.createElement("div");
            fileElement.className = "file-item";
            fileElement.innerHTML = `
                <div class="file-info">
                    <span class="file-name">Manual Entry</span>
                    <div class="processing-container">
                        <span class="word-count-text">Words: ${wordCount}</span>
                    </div>
                </div>
                <i class="fas fa-trash remove-icon" tabindex="0" title="Remove file"></i>
            `;
            
            // Add to file container
            const fileContainer = document.getElementById("file-container");
            if (fileContainer) {
                fileContainer.appendChild(fileElement);
            }
            
            // Add remove functionality
            const removeIcon = fileElement.querySelector(".remove-icon");
            if (removeIcon) {
                removeIcon.addEventListener("click", function() {
                    const index = allFiles.findIndex(f => f.name === "Manual Word Count");
                    if (index !== -1) {
                        allFiles.splice(index, 1);
                        fileElement.remove();
            }
        });
    }
    
            // Switch back to upload view
            if (uploadSection && wordCountContainer) {
                uploadSection.style.display = "block";
                wordCountContainer.style.display = "none";
            }
            
            // Clear the input
            this.value = "";
        });
    }

    // Function to show step content
    function showStepContent(step) {
        const content = step.querySelector(".form-cont, .upload-box, .service-container, .form-con");
        if (content) {
            content.style.display = "block";
        }
    }

    // Show step 3 content when its toggle icon is clicked
    const step3Toggle = document.querySelector(".form-step:nth-child(4) .toggle-icon");
    if (step3Toggle) {
        step3Toggle.addEventListener("click", function() {
            const step3 = this.closest(".form-step");
            const content = step3.querySelector(".form-cont");
            if (content) {
                if (content.style.display === "none") {
                    content.style.display = "block";
                } else {
                    content.style.display = "none";
                }
            }
        });
    }

    // Show step 3 content when proceeding from step 2
    const step2ProceedBtn = document.querySelector(".form-step:nth-child(3) .proceed-btn");
    if (step2ProceedBtn) {
        step2ProceedBtn.addEventListener("click", function(e) {
            e.preventDefault();
            if (!emailEntered) {
                alert("Please enter your email first.");
                return;
            }

            const step3 = document.querySelector(".form-step:nth-child(4)");
            if (step3) {
                showStepContent(step3);
                step3.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
});

// Helper functions
function validateEmail(email) {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
}

function processFiles(files) {
    const fileContainer = document.getElementById("file-container");
    const loadingCapsule = document.querySelector(".loading-capsule");
    
    if (!fileContainer) {
        console.error("File container not found");
        return;
    }
    
    // Create loading capsule if it doesn't exist
    if (!loadingCapsule) {
        const loadingHTML = `
            <div class="loading-capsule">
                <div class="loading-capsule-wrapper">
                    <div class="loading-capsule-bar">
                        <div class="loading-capsule-progress"></div>
                    </div>
                    <i class="material-icons loading-capsule-lock">lock</i>
                </div>
            </div>
        `;
        fileContainer.insertAdjacentHTML('afterend', loadingHTML);
    }

    // Show loading capsule
    document.querySelector(".loading-capsule").style.display = "block";
    
    // Process each file
    Array.from(files).forEach((file, index) => {
        console.log("Processing file:", file.name);
        
        // Create initial file element with processing state
        const fileElement = document.createElement("div");
        fileElement.className = "file-item";
        fileElement.innerHTML = `
            <div class="file-info">
                <span class="file-name">${file.name}</span>
                <div class="processing-container">
                    <span class="processing-text">Processing<span class="processing-dots"></span></span>
                </div>
            </div>
            <i class="fas fa-trash remove-icon" tabindex="0" title="Remove file"></i>
        `;
        
        // Add to container immediately to show processing state
        fileContainer.appendChild(fileElement);

        // Function to count words in text
        const countWords = (text) => {
            return text.trim().split(/\s+/).filter(word => word.length > 0).length;
        };

        // Function to process PDF files
        const processPDF = async (arrayBuffer) => {
            try {
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                let text = '';
                
                // Extract text from all pages
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    text += content.items.map(item => item.str).join(' ') + ' ';
                }
                
                return countWords(text);
            } catch (error) {
                console.error('Error processing PDF:', error);
                return Math.floor(file.size / 6); // Fallback to size-based estimation
            }
        };

        // Function to process DOCX files
        const processDOCX = async (arrayBuffer) => {
            try {
                const result = await mammoth.extractRawText({ arrayBuffer });
                return countWords(result.value);
            } catch (error) {
                console.error('Error processing DOCX:', error);
                return Math.floor(file.size / 6); // Fallback to size-based estimation
            }
        };

        // Read and process the file
        const reader = new FileReader();
        reader.onload = async function(e) {
            let wordCount = 0;
            
            try {
                // Process different file types
                if (file.type.includes('text/') || file.name.endsWith('.txt')) {
                    // Text files
                    const text = e.target.result;
                    wordCount = countWords(text);
                } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
                    // PDF files
                    wordCount = await processPDF(e.target.result);
                } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                          file.name.endsWith('.docx')) {
                    // DOCX files
                    wordCount = await processDOCX(e.target.result);
                } else {
                    // Other files - estimate based on size
                    wordCount = Math.floor(file.size / 6);
                }

                // Create file object with actual word count
        const fileObj = {
            file: file,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    wordCount: wordCount,
                    timestamp: Date.now(),
                    encrypted: true,
                    status: 'processing'
        };
        
        // Add to global files array
        allFiles.push(fileObj);
        
                // Show processing state for 3 seconds
                setTimeout(() => {
                    // First update: Show word count
                    const processingContainer = fileElement.querySelector(".processing-container");
                    processingContainer.innerHTML = `
                        <span class="word-count-text">Words: ${fileObj.wordCount}</span>
                    `;
                    
                    // Update file object status
                    fileObj.status = 'processed';
                    
                    // Second update: Show encryption status after a delay
                    setTimeout(() => {
                        processingContainer.innerHTML = `
                            <span class="word-count-text">Words: ${fileObj.wordCount}</span>
                            <div class="encryption-status">
                                <i class="material-icons encryption-icon">lock</i>
                                <span class="encryption-text">Encrypted</span>
                            </div>
                        `;
                        
                        // Update file object status
                        fileObj.status = 'encrypted';
                        fileObj.encryptedAt = Date.now();
                        
                        // Hide loading capsule after all files are processed
                        if (index === files.length - 1) {
                            setTimeout(() => {
                                document.querySelector(".loading-capsule").style.display = "none";
                                
                                // Log processed files for admin dashboard
                                console.log("Processed files for admin dashboard:", allFiles.map(f => ({
                                    name: f.name,
                                    size: f.size,
                                    type: f.type,
                                    wordCount: f.wordCount,
                                    status: f.status,
                                    encryptedAt: f.encryptedAt
                                })));
                            }, 500);
                        }
                    }, 3300); // Show encryption status after processing (3000ms + 300ms buffer)
                }, 3000); // Show processing state for 3000ms
            } catch (error) {
                console.error('Error processing file:', error);
                // Handle error state in UI
                const processingContainer = fileElement.querySelector(".processing-container");
                processingContainer.innerHTML = `
                    <span class="word-count-text" style="color: #ff4444;">Error processing file</span>
                `;
            }
        
        // Add click handler for remove icon
        const removeIcon = fileElement.querySelector(".remove-icon");
        if (removeIcon) {
            removeIcon.addEventListener("click", function() {
                const index = allFiles.findIndex(f => f.file === file);
                if (index !== -1) {
                    allFiles.splice(index, 1);
                        fileElement.style.opacity = "0";
                        fileElement.style.transform = "translateY(10px)";
                        setTimeout(() => fileElement.remove(), 300);
                        
                        // Log file removal for admin dashboard
                        console.log("File removed:", file.name);
                }
            });
        }
        };

        // Start reading the file based on type
        if (file.type === 'application/pdf' || file.name.endsWith('.pdf') ||
            file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            file.type.endsWith('.docx')) {
            reader.readAsArrayBuffer(file);
        } else if (file.type.includes('text/') || file.name.endsWith('.txt')) {
            reader.readAsText(file);
        } else {
            // For other files, trigger the onload directly with size-based estimation
            reader.onload();
        }
    });
}

function testBackendConnection() {
    fetch('http://localhost:5000/api/health')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showBackendStatus(true);
            } else {
                showBackendStatus(false);
            }
        })
        .catch(error => {
            console.error("Backend connection error:", error);
            showBackendStatus(false);
        });
}

function showSuccessMessage(formData) {
    // Create success message with free services list
    let freeServicesHtml = '';
    if (formData.freeServices && formData.freeServices.length > 0) {
        freeServicesHtml = `
            <div style="margin-top: 15px; text-align: left; max-width: 400px; margin-left: auto; margin-right: auto;">
                <h4 style="color: #555; margin-bottom: 8px;">Free Services Included:</h4>
                <ul style="padding-left: 20px; color: #666;">
                    ${formData.freeServices.map(service => `<li>${service}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    const successMessage = `
        <div style="text-align: center; padding: 20px;">
            <h2 style="color: #4CAF50;">Form Submitted Successfully!</h2>
            <p>Thank you for your submission${formData.fullName ? ', ' + formData.fullName : ''}.</p>
            <p>We have received your order for ${formData.selectedService || 'our services'}.</p>
            <p>Total Price: ${formData.totalPrice}</p>
            ${freeServicesHtml}
            <p>A confirmation email will be sent to: <strong>${formData.email}</strong></p>
            <div style="margin-top: 20px;">
                <button onclick="window.location.reload()" style="padding: 10px 15px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; margin: 0 10px;">Start New Submission</button>
            </div>
        </div>
    `;
    
    // Replace form with success message
    const formContainer = document.querySelector(".form-container");
    if (formContainer) {
        formContainer.innerHTML = successMessage;
        // Scroll to top to show the message
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        alert("Form submitted successfully!");
    }
}

function calculateTotalPrice() {
    // Get base price from selected service
    const basePrice = getBaseServicePrice();
    
    // Get all selected add-ons prices
    const addOnPrices = Array.from(document.querySelectorAll('.add-ons-summary li'))
        .map(item => {
            const priceElement = item.querySelector('.addon-price strong');
            if (!priceElement || priceElement.classList.contains('free')) return 0;
            return parseFloat(priceElement.textContent.replace('$', '')) || 0;
        })
        .reduce((sum, price) => sum + price, 0);
    
    // Calculate total
    let total = basePrice + addOnPrices;
    
    // Apply promo discount if active
    if (promoApplied) {
        total = total * 0.9; // 10% discount
    }
    
    return total;
}

function updateTotalPrice() {
    if (totalPriceElement) {
        const newTotal = calculateTotalPrice();
        totalPrice = newTotal; // Update global total price
        totalPriceElement.textContent = newTotal.toFixed(2);
    }
}

function addToOrderSummary(name, price) {
    const addOnsSummary = document.querySelector('.add-ons-summary ul');
    if (!addOnsSummary) return;

    // Ensure price is a valid number
    price = parseFloat(price) || 0;

    // Check if item already exists
    const existingItem = Array.from(addOnsSummary.children).find(item => 
        item.querySelector('.addon-name')?.textContent === name
    );
    if (existingItem) return;

    const li = document.createElement('li');
    li.innerHTML = `
        <span class="addon-name">${name}</span>
        <span class="addon-price">${price === 0 ? '<strong class="free">FREE</strong>' : `<strong>$${price.toFixed(2)}</strong>`}</span>
    `;
    addOnsSummary.appendChild(li);

    // Update total price after adding the add-on
    updateTotalPrice();
}

function removeFromOrderSummary(name, price = 0) {
    const addOnsSummary = document.querySelector('.add-ons-summary ul');
    if (!addOnsSummary) return;

    const item = Array.from(addOnsSummary.children).find(item => 
        item.querySelector('.addon-name')?.textContent === name
    );
    
    if (item) {
        item.remove();
        // Update total price after removing the add-on
    updateTotalPrice();
    }
}

function getBaseServicePrice() {
    const selectedService = document.querySelector('input[name="service"]:checked');
    if (!selectedService) return 0;
    
    switch(selectedService.id) {
        case 'scientificEditing': return 350;
        case 'substantiveEditing': return 280;
        case 'copyEditing': return 220;
        case 'proofreading': return 180;
        default: return 0;
    }
}

function getSelectedAddOns() {
    const addOns = [];
    const checkedAddOns = document.querySelectorAll('.add-ons input[type="checkbox"]:not([checked]):checked');
    
    checkedAddOns.forEach(addOn => {
        const addOnLabel = addOn.parentElement.textContent.trim();
        const priceSpan = addOn.parentElement.querySelector('.price');
        let price = 0;
        
        if (priceSpan) {
            const priceText = priceSpan.textContent.trim();
            price = parseFloat(priceText.replace(/[^\d.]/g, ''));
        }
        
        addOns.push({
            name: addOnLabel,
            price: price
        });
    });
    
    return addOns;
}

function validateForm() {
    // Check if email is entered
    if (!emailEntered) {
        alert("Please enter your email first.");
        return false;
    }
    
    // Validate all required fields across all steps
    const requiredFields = document.querySelectorAll("[required]");
    let allValid = true;
    
    requiredFields.forEach(field => {
        if (field.value.trim() === "") {
            field.style.border = "2px solid red";
            allValid = false;
        } else {
            field.style.border = "";
        }
    });
    
    if (!allValid) {
        alert("Please fill all required fields before submitting.");
        return false;
    }
    
    // Check if files are uploaded
    if (allFiles.length === 0) {
        alert("Please upload at least one file.");
        return false;
    }
    
    return true;
}

function submitWordCount() {
    const wordCountInput = document.getElementById("word-count-input");
    const wordCount = parseInt(wordCountInput.value) || 0;
    
    if (wordCount <= 0) {
        alert("Please enter a valid word count");
        return;
    }
    
    // Create a more detailed file object for manual entries
    const fileObj = {
        name: "Manual Word Count Entry",
        wordCount: wordCount,
        type: "manual-entry",
        size: 0,
        timestamp: Date.now(),
        status: 'processed',
        isManualEntry: true,
        entryDate: new Date().toISOString(),
        metadata: {
            entryType: 'manual',
            source: 'user-input',
            submissionType: 'word-count'
        }
    };
    
    // Add to global files array
    allFiles.push(fileObj);
    
    // Create file element with more details
    const fileElement = document.createElement("div");
    fileElement.className = "file-item";
    fileElement.innerHTML = `
        <div class="file-info">
            <span class="file-name">Manual Entry</span>
            <div class="processing-container">
                <span class="word-count-text">Words: ${wordCount}</span>
                <div class="manual-entry-info">
                    <span class="entry-date">${new Date().toLocaleDateString()}</span>
                    <span class="entry-type">Manual Input</span>
                </div>
            </div>
        </div>
        <i class="fas fa-trash remove-icon" tabindex="0" title="Remove file"></i>
    `;
    
    // Add to file container
    const fileContainer = document.getElementById("file-container");
    if (fileContainer) {
        fileContainer.appendChild(fileElement);
    }
    
    // Add remove functionality
    const removeIcon = fileElement.querySelector(".remove-icon");
    if (removeIcon) {
        removeIcon.addEventListener("click", function() {
            const index = allFiles.findIndex(f => f.isManualEntry && f.timestamp === fileObj.timestamp);
            if (index !== -1) {
                allFiles.splice(index, 1);
                fileElement.style.opacity = "0";
                fileElement.style.transform = "translateY(10px)";
                setTimeout(() => fileElement.remove(), 300);
                
                // Log manual entry removal for admin dashboard
                console.log("Manual entry removed:", fileObj);
            }
        });
    }
    
    // Switch back to upload view
    const uploadSection = document.getElementById("upload");
    const wordCountContainer = document.getElementById("word-count-container");
    if (uploadSection && wordCountContainer) {
        uploadSection.style.display = "block";
        wordCountContainer.style.display = "none";
    }
    
    // Clear the input
    wordCountInput.value = "";
    
    // Log the manual entry for admin dashboard
    console.log("Manual entry added:", fileObj);
}