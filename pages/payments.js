/**
 * Payments System
 * 
 * Data Model:
 * Payment: {
 *   id: "P001",
 *   studentId: "S001",
 *   amount: 5000,
 *   method: "upi|card|cash",
 *   details: {
 *     upiId?: "warden@bank",
 *     cardLast4?: "1234",
 *     cashReceiptNo?: "CR001"
 *   },
 *   status: "success|failed",
 *   timestampISO: "2025-11-27T12:00:00.000Z",
 *   receiptUrl: "/receipts/P001.html"
 * }
 * 
 * TODO: To swap to Firestore:
 * - Replace StorageUtils with Firestore collections
 * - Use Firebase Storage for receipts
 * - Implement real payment gateway integration (Stripe, Razorpay, etc.)
 */

(function(window) {
    'use strict';

    const STORAGE_KEY = 'hostelPayments';
    const WARDEN_NOTIFICATIONS_KEY = 'wardenNotifications';
    const STUDENTS_KEY = 'hostelStudents';

    /**
     * Initialize payments data
     */
    function initializePaymentsData() {
        if (!window.StorageUtils || !window.StorageUtils.get(STORAGE_KEY)) {
            window.StorageUtils = window.StorageUtils || {};
            if (!window.StorageUtils.set) {
                console.error('StorageUtils not available');
                return;
            }
            window.StorageUtils.set(STORAGE_KEY, []);
        }
    }

    /**
     * Generate next payment ID
     */
    function generatePaymentId() {
        const payments = window.StorageUtils.getArray(STORAGE_KEY);
        if (payments.length === 0) return 'P001';
        const maxId = payments.reduce((max, p) => {
            const num = parseInt(p.id.replace('P', '')) || 0;
            return num > max ? num : max;
        }, 0);
        return `P${String(maxId + 1).padStart(3, '0')}`;
    }

    /**
     * Create a payment
     * @param {string} studentId - Student ID
     * @param {number} amount - Payment amount
     * @param {string} method - Payment method (upi|card|cash)
     * @param {Object} details - Payment details (varies by method)
     * @param {boolean} sendNotification - Send notification to warden
     * @returns {Object|null} Created payment or null
     */
    function createPayment(studentId, amount, method, details, sendNotification = true) {
        if (!studentId || !amount || !method) {
            console.error('Missing required payment fields');
            return null;
        }

        // Validate payment method
        if (!['upi', 'card', 'cash'].includes(method)) {
            console.error('Invalid payment method');
            return null;
        }

        const payment = {
            id: generatePaymentId(),
            studentId: studentId,
            amount: parseFloat(amount),
            method: method,
            details: details || {},
            status: 'success', // Simulated success
            timestampISO: new Date().toISOString(),
            receiptUrl: null
        };

        // Generate receipt
        payment.receiptUrl = generatePaymentReceipt(payment);
        
        // Save payment
        window.StorageUtils.addToArray(STORAGE_KEY, payment);

        // Send notification to warden
        if (sendNotification) {
            sendWardenNotification('payment', payment.id, `New payment received: ₹${amount} via ${method}`, payment);
        }

        return payment;
    }

    /**
     * Process UPI payment
     * @param {string} studentId - Student ID
     * @param {number} amount - Amount
     * @param {string} upiId - UPI ID
     * @returns {Object|null} Payment object
     */
    function processUPIPayment(studentId, amount, upiId) {
        const details = { upiId: upiId };
        return createPayment(studentId, amount, 'upi', details);
    }

    /**
     * Process Card payment (masked, no CVV storage)
     * @param {string} studentId - Student ID
     * @param {number} amount - Amount
     * @param {string} cardNumber - Card number (will be masked)
     * @param {string} cardHolder - Card holder name
     * @param {string} expiry - Expiry date (MM/YY)
     * @returns {Object|null} Payment object
     */
    function processCardPayment(studentId, amount, cardNumber, cardHolder, expiry) {
        // Mask card number - only store last 4 digits
        const last4 = cardNumber.slice(-4);
        const masked = '*'.repeat(cardNumber.length - 4) + last4;
        
        const details = {
            cardLast4: last4,
            cardMasked: masked,
            cardHolder: cardHolder,
            expiry: expiry
        };
        
        return createPayment(studentId, amount, 'card', details);
    }

    /**
     * Process Cash payment
     * @param {string} studentId - Student ID
     * @param {number} amount - Amount
     * @param {string} receiptNo - Cash receipt number
     * @returns {Object|null} Payment object
     */
    function processCashPayment(studentId, amount, receiptNo) {
        const details = { cashReceiptNo: receiptNo || generateCashReceiptNo() };
        return createPayment(studentId, amount, 'cash', details);
    }

    /**
     * Generate cash receipt number
     */
    function generateCashReceiptNo() {
        return `CR${Date.now().toString().slice(-6)}`;
    }

    /**
     * Get all payments, optionally filtered
     */
    function getAllPayments(studentId = null, status = null) {
        let payments = window.StorageUtils.getArray(STORAGE_KEY);
        
        payments.sort((a, b) => new Date(b.timestampISO) - new Date(a.timestampISO));
        
        if (studentId) {
            payments = payments.filter(p => p.studentId === studentId);
        }
        
        if (status) {
            payments = payments.filter(p => p.status === status);
        }
        
        return payments;
    }

    /**
     * Get payment by ID
     */
    function getPaymentById(id) {
        return window.StorageUtils.findArrayItem(STORAGE_KEY, id);
    }

    /**
     * Generate payment receipt HTML
     */
    function generatePaymentReceipt(payment) {
        const student = window.StorageUtils.findArrayItem(STUDENTS_KEY, payment.studentId);
        const studentName = student ? student.name : 'Unknown Student';
        
        const receiptHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Receipt - ${payment.id}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; border: 2px solid #333; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .receipt-details { margin: 20px 0; }
        .receipt-details p { margin: 10px 0; font-size: 14px; }
        .label { font-weight: bold; display: inline-block; width: 180px; }
        .footer { margin-top: 40px; border-top: 2px solid #333; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>PAYMENT RECEIPT</h1>
        <p>Receipt No: <strong>${payment.id}</strong></p>
    </div>
    
    <div class="receipt-details">
        <p><span class="label">Student Name:</span> ${escapeHtml(studentName)}</p>
        <p><span class="label">Student ID:</span> ${payment.studentId}</p>
        <p><span class="label">Amount:</span> ₹${payment.amount.toFixed(2)}</p>
        <p><span class="label">Payment Method:</span> ${payment.method.toUpperCase()}</p>
        ${payment.details.cardLast4 ? `<p><span class="label">Card Last 4:</span> ****${payment.details.cardLast4}</p>` : ''}
        ${payment.details.upiId ? `<p><span class="label">UPI ID:</span> ${escapeHtml(payment.details.upiId)}</p>` : ''}
        ${payment.details.cashReceiptNo ? `<p><span class="label">Cash Receipt No:</span> ${payment.details.cashReceiptNo}</p>` : ''}
        <p><span class="label">Status:</span> <strong>${payment.status.toUpperCase()}</strong></p>
        <p><span class="label">Date & Time:</span> ${formatDate(new Date(payment.timestampISO))}</p>
    </div>
    
    <div class="footer">
        <p><strong>Note:</strong> This is an official payment receipt. Please keep this for your records.</p>
    </div>
</body>
</html>`;

        const blob = new Blob([receiptHTML], { type: 'text/html' });
        return URL.createObjectURL(blob);
    }

    /**
     * Download payment receipt
     */
    function downloadPaymentReceipt(paymentId) {
        const payment = getPaymentById(paymentId);
        if (!payment || !payment.receiptUrl) {
            alert('Receipt not available.');
            return;
        }

        const student = window.StorageUtils.findArrayItem(STUDENTS_KEY, payment.studentId);
        const studentName = student ? student.name : 'Unknown';
        const fileName = `Payment_${paymentId}_${studentName.replace(/\s+/g, '_')}.html`;
        
        const link = document.createElement('a');
        link.href = payment.receiptUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Send warden notification
     */
    function sendWardenNotification(type, payloadId, message, payload = {}) {
        if (!window.StorageUtils) return;
        
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
     * Export payments to CSV
     */
    function exportPaymentsCSV() {
        const payments = getAllPayments();
        const students = window.StorageUtils.getArray(STUDENTS_KEY);
        
        // Create CSV header
        let csv = 'Name,Class,Place,Email,Phone,Amount,Payment Method,Payment Status,Date\n';
        
        payments.forEach(payment => {
            const student = students.find(s => s.id === payment.studentId) || {};
            csv += `"${student.name || 'N/A'}",`;
            csv += `"${student.class || 'N/A'}",`;
            csv += `"${student.place || 'N/A'}",`;
            csv += `"${student.email || 'N/A'}",`;
            csv += `"${student.phone || 'N/A'}",`;
            csv += `${payment.amount},`;
            csv += `${payment.method},`;
            csv += `${payment.status},`;
            csv += `${new Date(payment.timestampISO).toLocaleDateString()}\n`;
        });
        
        // Download CSV
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        link.href = url;
        link.download = `fees_${dateStr}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Helper functions
    function formatDate(date) {
        return new Intl.DateTimeFormat('en-IN', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }).format(date);
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Export
    window.PaymentSystem = {
        initialize: initializePaymentsData,
        create: createPayment,
        processUPI: processUPIPayment,
        processCard: processCardPayment,
        processCash: processCashPayment,
        getAll: getAllPayments,
        getById: getPaymentById,
        downloadReceipt: downloadPaymentReceipt,
        exportCSV: exportPaymentsCSV
    };

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializePaymentsData);
    } else {
        initializePaymentsData();
    }

})(window);

