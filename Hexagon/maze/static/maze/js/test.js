// script.js
document.addEventListener('click', function(event) {
    const container = document.getElementById('container');
    const number = document.createElement('div');
    number.className = 'floating-number';
    number.style.left = `${event.clientX}px`;
    number.style.top = `${event.clientY}px`;
    number.textContent = Math.floor(Math.random() * 100); // Random number for demonstration
    number.textContent = "+14";

    container.appendChild(number);

    // Remove the number after the animation ends
    number.addEventListener('animationend', () => {
        container.removeChild(number);
    });
});
