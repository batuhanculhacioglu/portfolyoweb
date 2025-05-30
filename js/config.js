// js/config.js - Merkezi konfigürasyon ve utility fonksiyonları
const API_CONFIG = {
    BASE_URL: window.location.origin.includes('localhost')
        ? 'http://localhost:3001'
        : window.location.origin,

    getAuthHeaders: () => {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }
};

const UTILS = {
    escapeHtml: (text) => {
        if (!text) return '';
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return text.replace(/[&<>"']/g, m => map[m]);
    },

    showNotification: (message, type = 'info', duration = 3000) => {
        document.querySelectorAll('.notification').forEach(notif => notif.remove());

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;

        const icons = { success: '✓', error: '✗', warning: '⚠', info: 'ⓘ' };
        const colors = { success: '#48BB78', error: '#F56565', warning: '#ED8936', info: '#4299E1' };

        notification.innerHTML = `
    <div class="notification-content">
        <span class="notification-icon">
            ${icons[type] || icons.info}
        </span>
        <span>${message}</span>
    </div>
`;

        notification.className = `notification notification-${type}`;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutNotification 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }, duration);

        notification.addEventListener('click', () => {
            notification.style.animation = 'slideOutNotification 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        });
    }
};

const API_UTILS = {
    async request(endpoint, options = {}) {
        try {
            const response = await fetch(API_CONFIG.BASE_URL + endpoint, {
                ...options,
                headers: { ...API_CONFIG.getAuthHeaders(), ...options.headers }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API Request failed: ${endpoint}`, error);
            throw error;
        }
    }
};