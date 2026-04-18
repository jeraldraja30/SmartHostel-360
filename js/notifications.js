/**
 * Notification System for Hostel Management
 * Handles all notification operations using LocalStorage
 */

// LocalStorage key for notifications
const NOTIFICATIONS_STORAGE_KEY = 'notifications';
const NOTIFICATIONS_VIEWED_KEY = 'notifications_viewed';

/**
 * Initialize demo notifications if LocalStorage is empty
 */
function initializeDemoNotifications() {
    const existing = getAllNotifications();
    if (existing.length === 0) {
        const demoNotifications = [
            {
                id: "N001",
                message: "Hostel gate will close at 9:00 PM today. Please make sure to return before then.",
                sentBy: "warden",
                sentAtISO: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
                visibleTo: "all"
            },
            {
                id: "N002",
                message: "Your hostel fee due tomorrow. Please submit your payment at the office.",
                sentBy: "warden",
                sentAtISO: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
                visibleTo: "all"
            },
            {
                id: "N003",
                message: "Monthly mess menu has been updated. Check the notice board for details.",
                sentBy: "warden",
                sentAtISO: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
                visibleTo: "all"
            }
        ];
        
        try {
            localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(demoNotifications));
        } catch (error) {
            console.error('Failed to initialize demo notifications:', error);
        }
    }
}

/**
 * Generate next notification ID
 * Format: N001, N002, N003, etc.
 */
function generateNotificationId() {
    const notifications = getAllNotifications();
    if (notifications.length === 0) {
        return 'N001';
    }
    
    // Find the highest ID number
    const maxId = notifications.reduce((max, notif) => {
        const num = parseInt(notif.id.replace('N', '')) || 0;
        return num > max ? num : max;
    }, 0);
    
    const nextNum = maxId + 1;
    return `N${String(nextNum).padStart(3, '0')}`;
}

/**
 * Add a new notification
 * @param {string} message - The notification message
 * @returns {boolean} - Success status
 */
function addNotification(message) {
    if (!message || message.trim() === '') {
        alert('Please enter a notification message.');
        return false;
    }
    
    try {
        const notifications = getAllNotifications();
        const newNotification = {
            id: generateNotificationId(),
            message: message.trim(),
            sentBy: "warden",
            sentAtISO: new Date().toISOString(),
            visibleTo: "all"
        };
        
        notifications.push(newNotification);
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
        
        return true;
    } catch (error) {
        console.error('Failed to add notification:', error);
        alert('Failed to save notification. Please try again.');
        return false;
    }
}

/**
 * Get all notifications sorted by date (latest first)
 * @returns {Array} - Array of notification objects
 */
function getAllNotifications() {
    try {
        const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
        if (!stored) {
            return [];
        }
        
        const notifications = JSON.parse(stored);
        if (!Array.isArray(notifications)) {
            return [];
        }
        
        // Sort by sentAtISO descending (latest first)
        return notifications.sort((a, b) => {
            const dateA = new Date(a.sentAtISO || 0);
            const dateB = new Date(b.sentAtISO || 0);
            return dateB - dateA;
        });
    } catch (error) {
        console.error('Failed to get notifications:', error);
        return [];
    }
}

/**
 * Delete a notification by ID
 * @param {string} id - Notification ID to delete
 * @returns {boolean} - Success status
 */
function deleteNotification(id) {
    if (!id) {
        return false;
    }
    
    try {
        const notifications = getAllNotifications();
        const filtered = notifications.filter(notif => notif.id !== id);
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(filtered));
        return true;
    } catch (error) {
        console.error('Failed to delete notification:', error);
        return false;
    }
}

/**
 * Format date for display
 * @param {string} isoDate - ISO date string
 * @returns {string} - Formatted date string
 */
function formatNotificationDate(isoDate) {
    try {
        const date = new Date(isoDate);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        // Format: "27 Nov 2025 - 10:30 AM"
        const day = String(date.getDate()).padStart(2, '0');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        
        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        
        return `${day} ${month} ${year} - ${hours}:${minutes} ${ampm}`;
    } catch (error) {
        return 'Invalid Date';
    }
}

/**
 * Render notifications for Warden view
 * Includes delete buttons
 */
function renderWardenView() {
    const container = document.getElementById('warden-notifications-container');
    if (!container) {
        return;
    }
    
    const notifications = getAllNotifications();
    
    if (notifications.length === 0) {
        container.innerHTML = `
            <div class="notification-empty">
                <i class="fas fa-bell-slash"></i>
                <p>No notifications yet. Send your first notification to all students.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = notifications.map(notif => `
        <div class="notification-card warden-card fade-in" data-id="${notif.id}">
            <div class="notification-header">
                <h3><i class="fas fa-bell"></i> Notification</h3>
                <button class="btn-delete" onclick="handleDeleteNotification('${notif.id}')" title="Delete notification">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="notification-message">${escapeHtml(notif.message)}</div>
            <div class="notification-footer">
                <span class="notification-date"><i class="fas fa-clock"></i> ${formatNotificationDate(notif.sentAtISO)}</span>
            </div>
        </div>
    `).join('');
}

/**
 * Render notifications for Student view
 * Read-only, no delete buttons or sentBy info
 */
function renderStudentView() {
    const container = document.getElementById('student-notifications-container');
    if (!container) {
        return;
    }
    
    const notifications = getAllNotifications();
    
    if (notifications.length === 0) {
        container.innerHTML = `
            <div class="notification-empty">
                <i class="fas fa-bell-slash"></i>
                <p>No notifications available at this time.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = notifications.map(notif => `
        <div class="notification-card student-card fade-in" data-id="${notif.id}">
            <div class="notification-header">
                <h3><i class="fas fa-bell"></i> Notification</h3>
            </div>
            <div class="notification-message">${escapeHtml(notif.message)}</div>
            <div class="notification-footer">
                <span class="notification-date"><i class="fas fa-clock"></i> ${formatNotificationDate(notif.sentAtISO)}</span>
            </div>
        </div>
    `).join('');
    
    // Mark notifications as viewed (hide badge)
    markNotificationsAsViewed();
}

/**
 * Handle delete notification action
 * @param {string} id - Notification ID to delete
 */
function handleDeleteNotification(id) {
    if (!confirm('Are you sure you want to delete this notification?')) {
        return;
    }
    
    if (deleteNotification(id)) {
        // Re-render the view
        if (document.getElementById('warden-notifications-container')) {
            renderWardenView();
        }
        // Update badge count if student view exists
        updateNotificationBadge();
        alert('Notification deleted successfully.');
    } else {
        alert('Failed to delete notification. Please try again.');
    }
}

/**
 * Handle send notification action (Warden)
 */
function handleSendNotification() {
    const textarea = document.getElementById('notification-message-input');
    if (!textarea) {
        return;
    }
    
    const message = textarea.value;
    if (addNotification(message)) {
        textarea.value = '';
        renderWardenView();
        updateNotificationBadge();
        alert('Notification sent successfully!');
    }
}

/**
 * Get notification count for badge
 * @returns {number} - Total number of notifications
 */
function getNotificationCount() {
    return getAllNotifications().length;
}

/**
 * Update notification badge in navbar
 */
function updateNotificationBadge() {
    // Update in student navbar
    const studentNavLink = document.querySelector('#student-notifications-menu a');
    if (studentNavLink) {
        const count = getNotificationCount();
        const badge = studentNavLink.querySelector('.notification-badge');
        
        if (count > 0 && !isNotificationsViewed()) {
            if (!badge) {
                const badgeEl = document.createElement('span');
                badgeEl.className = 'notification-badge';
                badgeEl.textContent = count;
                studentNavLink.appendChild(badgeEl);
            } else {
                badge.textContent = count;
            }
        } else {
            if (badge) {
                badge.remove();
            }
        }
    }
}

/**
 * Check if notifications have been viewed in this session
 * @returns {boolean}
 */
function isNotificationsViewed() {
    try {
        return sessionStorage.getItem(NOTIFICATIONS_VIEWED_KEY) === 'true';
    } catch (error) {
        return false;
    }
}

/**
 * Mark notifications as viewed (hide badge for this session)
 */
function markNotificationsAsViewed() {
    try {
        sessionStorage.setItem(NOTIFICATIONS_VIEWED_KEY, 'true');
        updateNotificationBadge();
    } catch (error) {
        console.error('Failed to mark notifications as viewed:', error);
    }
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} - Escaped HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize demo notifications when script loads
if (typeof window !== 'undefined') {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeDemoNotifications);
    } else {
        initializeDemoNotifications();
    }
}

