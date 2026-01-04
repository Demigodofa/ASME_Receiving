window.addEventListener('DOMContentLoaded', () => {
    const accessTokenInput = document.getElementById('accessTokenInput');
    const activateBtn = document.getElementById('activateBtn');
    const statusMessage = document.getElementById('statusMessage');

    activateBtn.addEventListener('click', async () => {
        const token = accessTokenInput.value.trim();
        if (!token) {
            showStatus('Please enter a valid access code.', 'error');
            return;
        }

        // Disable button to prevent multiple clicks
        activateBtn.disabled = true;
        activateBtn.textContent = 'Activating...';
        clearStatus();

        try {
            // The cloudSettings object is available from cloud_settings.js
            const result = await window.cloudSettings.redeemAccessToken(token);

            if (result.success) {
                showStatus(result.message, 'success');
                // Optionally, redirect after a short delay
                setTimeout(() => {
                    window.location.href = 'home.html';
                }, 2000);
            } else {
                showStatus(result.message, 'error');
            }
        } catch (error) {
            console.error('Activation failed:', error);
            showStatus('An unexpected error occurred. Please try again later.', 'error');
        } finally {
            // Re-enable the button
            activateBtn.disabled = false;
            activateBtn.textContent = 'Activate';
        }
    });

    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = `status-message ${type}`;
    }

    function clearStatus() {
        statusMessage.textContent = '';
        statusMessage.className = 'status-message';
    }
});
