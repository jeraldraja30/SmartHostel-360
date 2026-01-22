/**
 * Enhanced Outpass System
 * 
 * Data Model:
 * Outpass: {
 *   id: "O001",
 *   studentId: "S001",
 *   startISO: "2025-11-27T09:00:00.000Z",
 *   expectedReturnISO: "2025-11-29T18:00:00.000Z",
 *   status: "pending|approved|rejected|completed",
 *   reason: "Home visit",
 *   approvedBy: "Warden1",
 *   approvedAtISO: "2025-11-26T10:00:00.000Z",
 *   receiptUrl: "/receipts/O001.html",
 *   isExtractLeave: false
 * }
 * 
 * TODO: To swap to Firestore:
 * - Replace StorageUtils calls with Firestore document operations
 * - Add real-time listeners for status updates
 * - Upload receipts to Firebase Storage instead of generating HTML files
 */

(function(window) {
    'use strict';

    const STORAGE_KEY = 'hostelOutpasses';
    const STUDENTS_KEY = 'hostelStudents';
    const WARDEN_NOTIFICATIONS_KEY = 'wardenNotifications';

    /**
     * Initialize outpass data structure if it doesn't exist
     */
    function initializeOutpassData() {
        if (!window.StorageUtils.get(STORAGE_KEY)) {
            window.StorageUtils.set(STORAGE_KEY, []);
        }
        if (!window.StorageUtils.get(WARDEN_NOTIFICATIONS_KEY)) {
            window.StorageUtils.set(WARDEN_NOTIFICATIONS_KEY, []);
        }
    }

    /**
     * Generate next outpass ID
     * @returns {string} Next outpass ID (O001, O002, etc.)
     */
    function generateOutpassId() {
        const outpasses = window.StorageUtils.getArray(STORAGE_KEY);
        if (outpasses.length === 0) {
            return 'O001';
        }
        const maxId = outpasses.reduce((max, op) => {
            const num = parseInt(op.id.replace('O', '')) || 0;
            return num > max ? num : max;
        }, 0);
        const nextNum = maxId + 1;
        return `O${String(nextNum).padStart(3, '0')}`;
    }

    /**
     * Create a new outpass
     * @param {string} studentId - Student ID
     * @param {string} startISO - Start date/time in ISO format
     * @param {string} expectedReturnISO - Expected return date/time in ISO format
     * @param {string} reason - Reason for outpass
     * @param {boolean} isExtractLeave - Whether this is an extract leave
     * @returns {Object|null} Created outpass or null on error
     */
    function createOutpass(studentId, startISO, expectedReturnISO, reason, isExtractLeave = false) {
        if (!studentId || !startISO || !expectedReturnISO || !reason) {
            console.error('Missing required fields for outpass');
            return null;
        }

        const outpass = {
            id: generateOutpassId(),
            studentId: studentId,
            startISO: startISO,
            expectedReturnISO: expectedReturnISO,
            status: 'pending',
            reason: reason.trim(),
            approvedBy: null,
            approvedAtISO: null,
            receiptUrl: null,
            isExtractLeave: isExtractLeave || false
        };

        window.StorageUtils.addToArray(STORAGE_KEY, outpass);
        
        return outpass;
    }

    /**
     * Get all outpasses, optionally filtered by student or status
     * @param {string} studentId - Optional student ID filter
     * @param {string} status - Optional status filter
     * @returns {Array} Array of outpasses
     */
    function getAllOutpasses(studentId = null, status = null) {
        let outpasses = window.StorageUtils.getArray(STORAGE_KEY);
        
        // Sort by start date (latest first)
        outpasses.sort((a, b) => new Date(b.startISO) - new Date(a.startISO));
        
        if (studentId) {
            outpasses = outpasses.filter(op => op.studentId === studentId);
        }
        
        if (status) {
            outpasses = outpasses.filter(op => op.status === status);
        }
        
        return outpasses;
    }

    /**
     * Get outpass by ID
     * @param {string} id - Outpass ID
     * @returns {Object|null} Outpass or null
     */
    function getOutpassById(id) {
        return window.StorageUtils.findArrayItem(STORAGE_KEY, id);
    }

    /**
     * Approve an outpass
     * @param {string} id - Outpass ID
     * @param {string} approvedBy - Name of approver
     * @param {boolean} sendNotification - Whether to send notification to warden
     * @returns {boolean} Success status
     */
    function approveOutpass(id, approvedBy = 'Warden', sendNotification = true) {
        const outpass = getOutpassById(id);
        if (!outpass) {
            return false;
        }

        // Update outpass status
        const receiptUrl = generateOutpassReceipt(outpass, approvedBy);
        window.StorageUtils.updateArrayItem(STORAGE_KEY, id, {
            status: 'approved',
            approvedBy: approvedBy,
            approvedAtISO: new Date().toISOString(),
            receiptUrl: receiptUrl
        });

        // Send notification to warden
        if (sendNotification) {
            sendWardenNotification('outpass', id, `New outpass approved: ${id}`, outpass);
        }

        return true;
    }

    /**
     * Reject an outpass
     * @param {string} id - Outpass ID
     * @param {string} rejectedBy - Name of rejector
     * @returns {boolean} Success status
     */
    function rejectOutpass(id, rejectedBy = 'Warden') {
        const outpass = getOutpassById(id);
        if (!outpass) {
            return false;
        }

        window.StorageUtils.updateArrayItem(STORAGE_KEY, id, {
            status: 'rejected',
            approvedBy: rejectedBy,
            approvedAtISO: new Date().toISOString()
        });

        return true;
    }

    /**
     * Generate outpass receipt HTML
     * @param {Object} outpass - Outpass object
     * @param {string} approvedBy - Approver name
     * @returns {string} Receipt URL or blob URL
     */
    function generateOutpassReceipt(outpass, approvedBy) {
        const student = window.StorageUtils.findArrayItem(STUDENTS_KEY, outpass.studentId);
        const studentName = student ? student.name : 'Unknown Student';
        
        const startDate = new Date(outpass.startISO);
        const returnDate = new Date(outpass.expectedReturnISO);
        
        const receiptHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Outpass Receipt - ${outpass.id}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            border: 2px solid #333;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .receipt-details {
            margin: 20px 0;
        }
        .receipt-details p {
            margin: 10px 0;
            font-size: 14px;
        }
        .label {
            font-weight: bold;
            display: inline-block;
            width: 180px;
        }
        .footer {
            margin-top: 40px;
            border-top: 2px solid #333;
            padding-top: 20px;
        }
        .signature {
            margin-top: 60px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>HOSTEL OUTPASS RECEIPT</h1>
        <p>Outpass ID: <strong>${outpass.id}</strong></p>
    </div>
    
    <div class="receipt-details">
        <p><span class="label">Student Name:</span> ${escapeHtml(studentName)}</p>
        <p><span class="label">Student ID:</span> ${outpass.studentId}</p>
        <p><span class="label">Out Date & Time:</span> ${formatDate(startDate)}</p>
        <p><span class="label">Expected Return:</span> ${formatDate(returnDate)}</p>
        <p><span class="label">Reason:</span> ${escapeHtml(outpass.reason)}</p>
        <p><span class="label">Status:</span> <strong>${outpass.status.toUpperCase()}</strong></p>
        <p><span class="label">Approved By:</span> ${escapeHtml(approvedBy)}</p>
        <p><span class="label">Approved Date:</span> ${formatDate(new Date(outpass.approvedAtISO || Date.now()))}</p>
        ${outpass.isExtractLeave ? '<p><span class="label">Type:</span> Extract Leave</p>' : ''}
    </div>
    
    <div class="footer">
        <p><strong>Note:</strong> This is an official outpass document. Please present this at the hostel gate during check-out and check-in.</p>
        <div class="signature">
            <p>_________________________</p>
            <p>Warden Signature</p>
        </div>
    </div>
</body>
</html>`;

        // Create blob and return URL
        const blob = new Blob([receiptHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        // Store receipt URL in outpass data
        return url;
    }

    /**
     * Download outpass receipt
     * @param {string} outpassId - Outpass ID
     */
    function downloadOutpassReceipt(outpassId) {
        const outpass = getOutpassById(outpassId);
        if (!outpass || !outpass.receiptUrl) {
            alert('Receipt not available. Please approve the outpass first.');
            return;
        }

        const student = window.StorageUtils.findArrayItem(STUDENTS_KEY, outpass.studentId);
        const studentName = student ? student.name : 'Unknown';
        const fileName = `Outpass_${outpassId}_${studentName.replace(/\s+/g, '_')}.html`;
        
        // Create a link and trigger download
        const link = document.createElement('a');
        link.href = outpass.receiptUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Send notification to warden
     * @param {string} type - Notification type (outpass, payment, etc.)
     * @param {string} payloadId - Related ID
     * @param {string} message - Notification message
     * @param {Object} payload - Additional payload data
     */
    function sendWardenNotification(type, payloadId, message, payload = {}) {
        const notifications = window.StorageUtils.getArray(WARDEN_NOTIFICATIONS_KEY);
        const notification = {
            id: `WN${String(notifications.length + 1).padStart(4, '0')}`,
            type: type,
            payloadId: payloadId,
            message: message,
            read: false,
            timestampISO: new Date().toISOString(),
            payload: payload
        };
        
        window.StorageUtils.addToArray(WARDEN_NOTIFICATIONS_KEY, notification);
    }

    /**
     * Format date for display
     * @param {Date} date - Date object
     * @returns {string} Formatted date string
     */
    function formatDate(date) {
        return new Intl.DateTimeFormat('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Get registered students for selection
     * @returns {Array} Array of student objects
     */
    function getRegisteredStudents() {
        // Try to get from existing hostelData first
        if (window.hostelData && window.hostelData.hostelers) {
            return window.hostelData.hostelers.map(h => ({
                id: h.id,
                name: h.name,
                email: h.email || '',
                phone: h.mobile || ''
            }));
        }
        
        // Fallback to StorageUtils
        return window.StorageUtils.getArray(STUDENTS_KEY);
    }

    // Export functions
    window.OutpassSystem = {
        initialize: initializeOutpassData,
        create: createOutpass,
        getAll: getAllOutpasses,
        getById: getOutpassById,
        approve: approveOutpass,
        reject: rejectOutpass,
        downloadReceipt: downloadOutpassReceipt,
        sendNotification: sendWardenNotification,
        getRegisteredStudents: getRegisteredStudents
    };

    // Initialize on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeOutpassData);
    } else {
        initializeOutpassData();
    }

})(window);

