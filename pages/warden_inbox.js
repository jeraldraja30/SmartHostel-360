/**
 * Warden Inbox System
 * Displays and manages warden notifications
 */

(function(window) {
    'use strict';

    const STORAGE_KEY = 'wardenNotifications';
    const PAYMENTS_KEY = 'hostelPayments';
    const OUTPASSES_KEY = 'hostelOutpasses';

    function getAllNotifications() {
        if (!window.StorageUtils) return [];
        return window.StorageUtils.getArray(STORAGE_KEY).sort((a, b) => 
            new Date(b.timestampISO) - new Date(a.timestampISO)
        );
    }

    function getUnreadCount() {
        const notifications = getAllNotifications();
        return notifications.filter(n => !n.read).length;
    }

    function markAsRead(id) {
        if (!window.StorageUtils) return;
        window.StorageUtils.updateArrayItem(STORAGE_KEY, id, { read: true });
    }

    function renderNotifications() {
        const container = document.getElementById('notifications-list');
        const unreadCountEl = document.getElementById('unread-count');
        if (!container) return;

        const notifications = getAllNotifications();
        const unreadCount = getUnreadCount();
        
        if (unreadCountEl) {
            unreadCountEl.textContent = unreadCount;
        }

        if (notifications.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px; color: #999;">
                    <i class="fas fa-inbox" style="font-size: 64px; opacity: 0.5; margin-bottom: 20px;"></i>
                    <p>No notifications yet.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = notifications.map(notif => {
            const date = new Date(notif.timestampISO);
            const dateStr = date.toLocaleString('en-IN');
            const typeClass = `type-${notif.type}`;
            
            return `
                <div class="notification-item ${!notif.read ? 'unread' : ''}" onclick="handleNotificationClick('${notif.id}', '${notif.type}', '${notif.payloadId}')">
                    <div class="notification-header">
                        <div>
                            <span class="notification-type ${typeClass}">${notif.type.toUpperCase()}</span>
                            <h3>${escapeHtml(notif.message)}</h3>
                            <p style="color: #666; margin-top: 10px;">${dateStr}</p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function handleNotificationClick(id, type, payloadId) {
        markAsRead(id);
        
        if (type === 'payment') {
            // Navigate to payment receipt
            alert(`Viewing payment receipt for ${payloadId}`);
            // TODO: Open payment receipt modal or page
        } else if (type === 'outpass') {
            // Navigate to outpass receipt
            alert(`Viewing outpass receipt for ${payloadId}`);
            // TODO: Open outpass receipt modal or page
        }
        
        renderNotifications();
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    window.WardenInbox = {
        getAll: getAllNotifications,
        getUnreadCount: getUnreadCount,
        markAsRead: markAsRead,
        renderNotifications: renderNotifications,
        handleClick: handleNotificationClick
    };

    // Global handler for onclick
    window.handleNotificationClick = handleNotificationClick;

})(window);

