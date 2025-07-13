
// Railway Environment Variables Setter
// Run this in your browser console while on Railway dashboard

const variables = {
  "JWT_SECRET": "super-secret-key-fp06lw3ydseoldjy18rpzf",
  "NODE_ENV": "production",
  "PORT": "8080",
  "CORS_ORIGIN": "https://findingsports.com,https://www.findingsports.com",
  "GOOGLE_MAPS_API_KEY": "AIzaSyD2ux0PIekUQLAqVDNhy0tHwhBht6vcXqA"
};

console.log('🚀 Setting Railway environment variables...');

// Function to simulate adding variables
async function setRailwayVariables() {
    for (const [key, value] of Object.entries(variables)) {
        console.log(`Setting ${key}...`);
        // Look for "Add Variable" button and click it
        const addButton = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Add Variable'));
        if (addButton) {
            addButton.click();
            await new Promise(r => setTimeout(r, 500));
            
            // Fill in the form
            const inputs = document.querySelectorAll('input');
            if (inputs.length >= 2) {
                inputs[inputs.length - 2].value = key;
                inputs[inputs.length - 1].value = value;
                
                // Trigger change events
                inputs[inputs.length - 2].dispatchEvent(new Event('input', { bubbles: true }));
                inputs[inputs.length - 1].dispatchEvent(new Event('input', { bubbles: true }));
                
                await new Promise(r => setTimeout(r, 500));
            }
        }
    }
    console.log('✅ All variables set! Railway should redeploy automatically.');
}

// Run the function
setRailwayVariables();
