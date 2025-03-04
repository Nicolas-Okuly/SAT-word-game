/**
 * Handle when an input box receives a value and move to the next box.
 * @param {HTMLInputElement} input The actual HTML element.
 * @param {Number} index The index of the input box.
 */
function moveNext(input, index) {
    let inputs = document.querySelectorAll('.word-input');
    
    if (input.value.length === 1 && index < inputs.length - 1) {
        inputs[index + 1].focus();
    } else if (input.value.length === 0 && index > 0) {
        inputs[index - 1].focus();
    }
}

/**
 * Handle backspaces to clear boxes.
 * @param {EventTarget} event The event object.
 * @param {HTMLInputElement} input Input of the current box.
 * @param {Number} index The index of the current box.
 */
function handleBackspace(event, input, index) {
    let inputs = document.querySelectorAll('.word-input');

    if (event.key === "Backspace" && input.value.length === 0 && index > 0) {
        inputs[index - 1].focus();
        inputs[index - 1].value = "";
    }

    if (event.key === "ArrowLeft") inputs[index - 1].focus();
    if (event.key === "ArrowRight") inputs[index + 1].focus();
}

/**
 * 
 * @param {String} notification 
 * @param {String} title
 */
function sendAlert(notification, title) {
    let notif = document.getElementById("notification");
    let notifTitle = document.getElementById("notif-title");
    let notifDesc = document.getElementById("notif-description");

    notifTitle.innerHTML = title;
    notifDesc.innerHTML = notification;
    notif.style.display = "block";
    notif.addEventListener("click", () => {
        notif.style.display = "none";
    });
}

document.getElementById("wordlist").style.maxHeight = "300px";