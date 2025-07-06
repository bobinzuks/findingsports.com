// Field Status Monitor - Inspired by Rust scraper approach
class FieldStatusMonitor {
    constructor() {
        this.statusContainer = null;
        this.refreshInterval = 5 * 60 * 1000; // 5 minutes
        this.fields = new Map();
    }

    async initialize() {
        // Check for field status updates periodically
        this.fetchFieldStatus();
        setInterval(() => this.fetchFieldStatus(), this.refreshInterval);
    }

    async fetchFieldStatus() {
        try {
            const response = await window.api.getFieldStatus();
            if (response.success && response.fields) {
                this.updateFieldStatus(response.fields);
            }
        } catch (error) {
            console.error('Error fetching field status:', error);
        }
    }

    updateFieldStatus(fields) {
        fields.forEach(field => {
            this.fields.set(field.name, {
                ...field,
                lastUpdated: new Date()
            });
        });

        if (this.statusContainer) {
            this.renderFieldStatus();
        }
    }

    renderFieldStatus() {
        if (!this.statusContainer) { return; }

        const fieldsArray = Array.from(this.fields.values());

        this.statusContainer.innerHTML = `
            <div class="field-status-header">
                <h3>Field Availability</h3>
                <span class="last-updated">Updated: ${new Date().toLocaleTimeString()}</span>
            </div>
            <div class="field-status-grid">
                ${fieldsArray.map(field => this.renderFieldCard(field)).join('')}
            </div>
        `;
    }

    renderFieldCard(field) {
        const statusClass = this.getStatusClass(field.status);
        const statusIcon = this.getStatusIcon(field.status);

        return `
            <div class="field-card ${statusClass}">
                <div class="field-header">
                    <span class="field-name">${field.name}</span>
                    <span class="field-status-icon">${statusIcon}</span>
                </div>
                <div class="field-status">${field.status}</div>
                ${field.nextAvailable ? `
                    <div class="next-available">Next available: ${field.nextAvailable}</div>
                ` : ''}
                <div class="field-type">${field.type || 'Field'}</div>
            </div>
        `;
    }

    getStatusClass(status) {
        const statusLower = status.toLowerCase();
        if (statusLower.includes('open') || statusLower.includes('available')) {
            return 'status-available';
        } else if (statusLower.includes('closed') || statusLower.includes('unavailable')) {
            return 'status-closed';
        } else if (statusLower.includes('maintenance')) {
            return 'status-maintenance';
        }
        return 'status-unknown';
    }

    getStatusIcon(status) {
        const statusLower = status.toLowerCase();
        if (statusLower.includes('open') || statusLower.includes('available')) {
            return '✅';
        } else if (statusLower.includes('closed') || statusLower.includes('unavailable')) {
            return '❌';
        } else if (statusLower.includes('maintenance')) {
            return '🔧';
        }
        return '❓';
    }

    // Export field data to CSV (similar to Rust script)
    exportToCSV() {
        const headers = ['Field Name', 'Status', 'Type', 'Next Available', 'Last Updated'];
        const rows = Array.from(this.fields.values()).map(field => [
            field.name,
            field.status,
            field.type || 'Unknown',
            field.nextAvailable || 'N/A',
            new Date(field.lastUpdated).toLocaleString()
        ]);

        let csvContent = `${headers.join(',')}\n`;
        rows.forEach(row => {
            csvContent += `${row.map(cell => `"${cell}"`).join(',')}\n`;
        });

        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `field-status-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // Attach to a container in the UI
    attachTo(containerId) {
        this.statusContainer = document.getElementById(containerId);
        if (this.statusContainer) {
            this.renderFieldStatus();
        }
    }
}

// Create global instance
window.fieldStatusMonitor = new FieldStatusMonitor();
