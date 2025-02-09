document.addEventListener("DOMContentLoaded", function () {
    const steps = document.querySelectorAll(".form-step"); 
    const proceedButtons = document.querySelectorAll(".proceed-btn");
    const emailInput = document.getElementById("email");
    const continueBtn = document.getElementById("continue-btn");
    const toggleIcons = document.querySelectorAll(".toggle-icon");

    let emailEntered = false;    
    const fileInput = document.getElementById('file-input');
const allFiles = [];
const fileContainer = document.getElementById('file-container');

fileInput?.addEventListener('change', (event) => {
  const input = event.target;
  const fileList = input.files;
  console.log("File input changed. Number of files:", fileList ? fileList.length : 0);

  if (fileList && fileList.length > 0) {
    
    const newFiles = Array.from(fileList);
    newFiles.forEach(file => {
      
      allFiles.push({ file: file, wordCount: 0 });
    });

    renderFiles(); 
    input.value = ""; 
  }
});

// Function to render files in the container
function renderFiles() {
  // Clear any previous file display
  fileContainer.innerHTML = "";

  if (allFiles.length > 0) {
    allFiles.forEach((fileObj, index) => {
      const file = fileObj.file;

      // Create file display element
      const fileElement = document.createElement('div');
      fileElement.classList.add('file-item');

      const fileName = document.createElement('span');
      // Get file extension from MIME type (if available) or default to "unknown"
      const fileType = file.type ? file.type.split('/')[1] : 'unknown';
      fileName.textContent = `${file.name} (${fileType})`;
      fileElement.appendChild(fileName);

      // Create an input for the word count
      const wordCountInput = document.createElement('input');
      wordCountInput.type = 'number';
      wordCountInput.value = fileObj.wordCount;
      wordCountInput.min = 0; // Prevent negative word counts
      wordCountInput.addEventListener('input', (e) => {
        // Update the word count in the array when the user changes it
        allFiles[index].wordCount = parseInt(e.target.value, 10);
      });
      fileElement.appendChild(wordCountInput);

      // Create the trash bin icon
      const removeIcon = document.createElement('i');
      removeIcon.classList.add('fas', 'fa-trash', 'remove-icon');
      removeIcon.addEventListener('click', () => {
        // Remove the file from the allFiles array and re-render
        allFiles.splice(index, 1);
        renderFiles();
      });
      fileElement.appendChild(removeIcon);

      // Append the file element to the file container
      fileContainer.appendChild(fileElement);
    });
  }
}

    
    
    function validateEmail(email) {
        const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        return regex.test(email);
    }

    // Make checkEmail globally accessible
    window.checkEmail = function () {
        const emailInputValue = emailInput.value;
        if (validateEmail(emailInputValue)) {
            alert("Valid email!");
        }
    };

    // Initially hide all step content except the email input step
    steps.forEach((step, index) => {
        if (index !== 0) {
            const content = step.querySelector(".form-cont, .upload-box, .service-container, .form-con");
            if (content) {
                content.style.display = "none"; // Hide all step content except the first step
            }
        }
    });

    // Disable toggle icons initially
    toggleIcons.forEach((icon) => {
        icon.style.pointerEvents = "none"; // Disable clicking
        icon.style.opacity = "0.5"; // Reduce visibility
    });

    // Correct the continue button event listener to use 'click' instead of 'change'
    continueBtn.addEventListener("click", function () {
        const emailInputValue = emailInput.value.trim();

        // Check if email is entered
        if (emailInputValue === "") {
            alert("Please enter your email to proceed.");
        } else if (!validateEmail(emailInputValue)) {
            // Check if email is valid
            alert("Invalid email! Please enter a correct email address.");
        } else {
            emailEntered = true; // Mark email as entered

            // Show Step 1 content
            const step1Content = steps[1].querySelector(".form-cont, .upload-box, .service-container, .form-con");
            if (step1Content) {
                step1Content.style.display = "block";
            }

            // Enable toggle icons
            toggleIcons.forEach((icon) => {
                icon.style.pointerEvents = "auto"; // Enable clicking
                icon.style.opacity = "1"; // Restore visibility
            });
        }
    });

    // Proceed through steps
    proceedButtons.forEach((button) => {
        button.addEventListener("click", function (e) {
            e.preventDefault();

            if (!emailEntered) {
                alert("Please enter your email first.");
                return;
            }

            const currentStep = button.closest(".form-step");
            const currentStepContent = currentStep.querySelector(".form-cont, .upload-box, .service-container, .form-con");
            const nextStep = currentStep.nextElementSibling;

            if (!nextStep) {
                alert("No more steps to proceed.");
                return; // Stop if no next step exists
            }

            // Validate required fields in the current step
            const requiredFields = currentStep.querySelectorAll("input[required], textarea[required], select[required]");
            let allFilled = true;

            requiredFields.forEach((field) => {
                if (field.value.trim() === "") {
                    allFilled = false;
                    field.style.border = "2px solid red"; // Highlight empty required fields
                } else {
                    field.style.border = ""; // Reset border for filled fields
                }
            });

            if (!allFilled) {
                alert("Please fill out all required fields before proceeding.");
            } else {
                // Hide current step content
                if (currentStepContent) {
                    currentStepContent.style.display = "none";
                }

                // Show next step content
                const nextStepContent = nextStep.querySelector(".form-cont, .upload-box, .service-container, .form-con");
                if (nextStepContent) {
                    nextStepContent.style.display = "block";
                }
            }
        });
    });

    // Toggle step content when clicking icons
    toggleIcons.forEach((icon) => {
        icon.addEventListener("click", function () {
            if (!emailEntered) {
                alert("Please enter your email first.");
                return;
            }

            const stepContent = this.closest(".form-step").querySelector(".form-cont, .upload-box, .service-container, .form-con");
            if (stepContent.style.display === "none") {
                stepContent.style.display = "block";
            } else {
                stepContent.style.display = "none";
            }
        });
    });
});

var editLink = document.getElementById("editLink");
var startEditing = document.getElementById("startEditing");
var getQuote = document.getElementById("getQuote");
var optionStart = document.getElementById("optionStart");
var optionQuote = document.getElementById("optionQuote");
// ✅ Ensure `editLink` exists before adding an event listener
editLink === null || editLink === void 0 ? void 0 : editLink.addEventListener("click", function (event) {
    event.preventDefault();
    var newLimit = prompt("Enter your new budget limit:");
    if (newLimit) {
        alert("New budget limit set to $".concat(newLimit));
    }
});
// ✅ Ensure `startEditing` exists before adding an event listener
startEditing === null || startEditing === void 0 ? void 0 : startEditing.addEventListener("change", function () {
    console.log("User chose to start editing.");
    updateSelection();
});
// ✅ Ensure `getQuote` exists before adding an event listener
getQuote === null || getQuote === void 0 ? void 0 : getQuote.addEventListener("change", function () {
    console.log("User requested a quote.");
    updateSelection();
});
// ✅ Function to update selection styles
function updateSelection() {
    if (startEditing === null || startEditing === void 0 ? void 0 : startEditing.checked) {
        optionStart === null || optionStart === void 0 ? void 0 : optionStart.classList.add("green-box");
        optionQuote === null || optionQuote === void 0 ? void 0 : optionQuote.classList.remove("green-box");
    }
    else if (getQuote === null || getQuote === void 0 ? void 0 : getQuote.checked) {
        optionQuote === null || optionQuote === void 0 ? void 0 : optionQuote.classList.add("green-box");
        optionStart === null || optionStart === void 0 ? void 0 : optionStart.classList.remove("green-box");
    }
}
document.addEventListener("DOMContentLoaded", () => {
    const deliveryOptions = document.querySelectorAll(".delivery-option");
    const serviceOptions = document.querySelectorAll(".service-option");

    // For delivery options
    deliveryOptions.forEach(option => {
        option.addEventListener("click", () => {
            // Remove 'selected' and 'green-box' from all delivery options
            deliveryOptions.forEach(opt => opt.classList.remove("selected", "green-box"));

            // Add 'selected' and 'green-box' to clicked delivery option
            option.classList.add("selected", "green-box");

            // Set checked state for the radio button inside the option
            const radioInput = option.querySelector("input[type='radio']");
            if (radioInput) {
                radioInput.checked = true;
            }
        });
    });

    // For service options
    serviceOptions.forEach(option => {
        option.addEventListener("click", () => {
            // Remove 'selected' and 'green-box' from all service options
            serviceOptions.forEach(opt => opt.classList.remove("selected", "green-box"));

            // Add 'selected' and 'green-box' to clicked service option
            option.classList.add("selected", "green-box");

            // Set checked state for the radio button inside the option
            const radioInput = option.querySelector("input[type='radio']");
            if (radioInput) {
                radioInput.checked = true;
            }
        });
    });
});


function handleSelection(service, addonId) {
    toggleTable(service);
    showAddOns(addonId);
}

function toggleTable(service) {
    const scientificTable = document.getElementById("scientificTable");
    const substantiveTable = document.getElementById("substantiveTable");

    if (service === "scientific") {
        scientificTable.classList.remove("hidden");
        substantiveTable.classList.add("hidden");
    } else if (service === "substantive") {
        scientificTable.classList.add("hidden");
        substantiveTable.classList.remove("hidden");
    }
}

function showAddOns(addonId) {
    // Hide all add-ons sections
    document.querySelectorAll(".add-ons").forEach(addon => addon.classList.add("hidden"));

    // Show the selected add-ons section
    const selectedAddon = document.getElementById(addonId);
    if (selectedAddon) {
        selectedAddon.classList.remove("hidden");
    }
}
// JavaScript for applying promo code
document.getElementById("apply-promo").addEventListener("click", function () {
    const promoCode = document.getElementById("promo-code").value;
    if (promoCode.trim() === "") {
        alert("Please enter a promo code.");
    } else {
        alert(`Promo code "${promoCode}" applied successfully!`);
        // You can add logic here to validate and apply the promo code
    }
});

function toggleWordCountInput(event) {
    event.preventDefault(); // Prevent default link behavior

    const wordCountLink = document.getElementById('word-count-toggle-link');
    const wordCountContainer = document.getElementById('word-count-container');
    const uploadBox = document.getElementById('uplaod'); // Correct the selector to target the right ID

    // Hide the "Enter an approximate word count" link, hide the upload box, and show the word count input container
    wordCountLink.style.display = 'none'; // Hide the link
    uploadBox.style.display = 'none'; // Hide the entire upload box
    wordCountContainer.style.display = 'block'; // Show the input container

    // Show the back link ("Upload files for editing")
    const wordCountBackLink = document.getElementById('word-count-back-link');
    wordCountBackLink.style.display = 'inline'; // Show the back link to switch back
}

// Function to go back to the original "Enter an approximate word count" link
function toggleWordCountInputBack(event) {
    event.preventDefault(); // Prevent default link behavior

    const wordCountLink = document.getElementById('word-count-toggle-link');
    const wordCountContainer = document.getElementById('word-count-container');
    const uploadBox = document.getElementById('uplaod'); // Correct the selector to target the right ID

    // Hide the word count input container and show the original link again
    wordCountContainer.style.display = 'none'; // Hide the word count container
    wordCountLink.style.display = 'inline'; // Show the original link again

    // Show the upload box again
    uploadBox.style.display = 'block'; // Show the upload box again
}
