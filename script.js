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
    newFiles.forEach((file) => {
      const reader = new FileReader();

      reader.onload = function (e) {
        const text = e.target.result;
        const wordCount = countWords(text);
        allFiles.push({ file: file, wordCount: wordCount });
        renderFiles();
      };

      if (file.type === "text/plain") {
        reader.readAsText(file);
      } else {
        allFiles.push({ file: file, wordCount: "N/A" });
        renderFiles();
      }
    });

    input.value = "";
  }
});

// Function to count words in a text
function countWords(text) {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

// Function to render files in the container
function renderFiles() {
  fileContainer.innerHTML = "";

  if (allFiles.length > 0) {
    allFiles.forEach((fileObj, index) => {
      const file = fileObj.file;

      const fileElement = document.createElement("div");
      fileElement.classList.add("file-item");

      const fileName = document.createElement("span");
      const fileType = file.type ? file.type.split("/")[1] : "unknown";
      fileName.textContent = `${file.name} (${fileType})`;
      fileElement.appendChild(fileName);

      const wordCountDisplay = document.createElement("span");
      wordCountDisplay.textContent = `Words: ${fileObj.wordCount}`;
      fileElement.appendChild(wordCountDisplay);
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


const services = document.querySelectorAll(".service-option input[name='service']");
const addOnsContainers = document.querySelectorAll(".add-ons");
const orderSummary = document.querySelector(".order-summary .service-details p");
const addOnsSummary = document.querySelector(".order-summary .add-ons-summary ul");
const totalPriceEl = document.getElementById("total-price");
const promoInput = document.getElementById("promo-code");
const applyPromoBtn = document.getElementById("apply-promo");

let totalPrice = 0;
let promoApplied = false;

function updateTotalPrice() {
    totalPriceEl.textContent = totalPrice.toFixed(2);
}

function handleSelection(serviceId, addOnsId) {
    // Hide all add-ons sections
    addOnsContainers.forEach(container => container.classList.add("hidden"));

    // Reset order summary
    addOnsSummary.innerHTML = "";
    totalPrice = 0;

    // Get the selected add-ons container
    const selectedService = document.getElementById(addOnsId);
    if (!selectedService) {
        console.error(`Error: Add-ons container with ID '${addOnsId}' not found.`);
        return;
    }

    // Show the selected add-ons container
    selectedService.classList.remove("hidden");

    // Update order summary with selected service
    const serviceText = document.querySelector(`#${serviceId} + .option-content`).textContent.trim();
    orderSummary.textContent = serviceText;

    const freeServices = selectedService.querySelectorAll(".free-services input");
    if (freeServices.length > 0) {
        addToOrderSummary(freeServices[0].parentNode.textContent.trim(), 0);
    }

    // Add free services to order summary
    selectedService.querySelectorAll(".free-services input").forEach(service => {
        addToOrderSummary(service.parentNode.textContent.trim(), 0);
    });

    updateTotalPrice();
}

function addToOrderSummary(name, price) {
    // Check if the item already exists in the summary
    if ([...addOnsSummary.children].some(li => li.textContent.includes(name))) return;

    const li = document.createElement("li");

    // Show "FREE" if price is 0, otherwise show the actual price
    li.innerHTML = `${name} - ${price === 0 ? '<span style="color: green; font-weight: bold;">FREE</span>' : `<span style="color: black; font-weight: bold;">$${price.toFixed(2)}</span>`} <button class="remove-btn">❌</button>`;
    addOnsSummary.appendChild(li);

    if (price > 0) {
        totalPrice += price;
        updateTotalPrice();
    }

    // Remove item when ❌ is clicked
    li.querySelector(".remove-btn").addEventListener("click", function () {
        if (price > 0) {
            totalPrice -= price;
            updateTotalPrice();
        }
        li.remove();
    });
}
document.addEventListener("DOMContentLoaded", function () {
    const defaultFreeServices = document.querySelectorAll("#addons1 .free-services input[type='checkbox']");
    defaultFreeServices.forEach(checkbox => {
        const label = checkbox.parentNode;
        const serviceName = label.childNodes[1].textContent.trim();
        addToOrderSummary(serviceName, 0); // Adding free services as "FREE"
    });
});

// Add-ons selection functionality
document.querySelectorAll(".add-ons input[type='checkbox']").forEach(checkbox => {
    checkbox.addEventListener("change", function () {
        const label = this.parentNode;
        // Clone the label and remove unwanted elements to extract only the service name
        const labelClone = label.cloneNode(true);
        // Remove all spans (which include pricing info)
        labelClone.querySelectorAll("span").forEach(el => el.remove());
        // Remove any select elements (if present)
        labelClone.querySelectorAll("select").forEach(el => el.remove());
        const serviceName = labelClone.textContent.trim();

        // Get the price from the original label
        const priceElement = label.querySelector(".price strong");
        const price = priceElement ? parseFloat(priceElement.textContent.replace("$", "")) : 0;

        if (this.checked) {
            addToOrderSummary(serviceName, price);
        } else {
            // Remove the item from the order summary if unchecked
            const listItem = [...addOnsSummary.children].find(li => li.textContent.includes(serviceName));
            if (listItem) {
                totalPrice -= price;
                listItem.remove();
                updateTotalPrice();
            }
        }
    });
    // Keep checkboxes checked if they were checked by default
    if (checkbox.hasAttribute("checked")) {
        checkbox.checked = true;
    }
});


// Promo code functionality
applyPromoBtn.addEventListener("click", function () {
    if (promoApplied) {
        alert("Promo code already applied.");
        return;
    }

    if (promoInput.value.trim() === "DISCOUNT10") {
        totalPrice *= 0.9;
        updateTotalPrice();
        alert("Promo code applied! 10% discount.");
        promoApplied = true;
    } else {
        alert("Invalid promo code.");
    }
});
