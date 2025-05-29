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
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <span style="display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; background: rgba(255,255,255,0.2); border-radius: 50%; font-weight: bold;">
                    ${icons[type] || icons.info}
                </span>
                <span>${message}</span>
            </div>
        `;

        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; padding: 1rem 1.5rem;
            background: ${colors[type] || colors.info}; color: white; border-radius: 12px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.15); z-index: 9999;
            animation: slideInNotification 0.3s ease; font-family: Inter, sans-serif;
            font-size: 0.9rem; font-weight: 500; max-width: 350px; cursor: pointer;
        `;

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

// Animasyonlar için CSS
if (!document.querySelector('#utils-styles')) {
    const style = document.createElement('style');
    style.id = 'utils-styles';
    style.textContent = `
        @keyframes slideInNotification {
            from { transform: translateX(100%) translateY(-50px); opacity: 0; }
            to { transform: translateX(0) translateY(0); opacity: 1; }
        }
        @keyframes slideOutNotification {
            from { transform: translateX(0) translateY(0); opacity: 1; }
            to { transform: translateX(100%) translateY(-50px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}