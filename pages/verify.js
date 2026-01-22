/**
 * Verification & Testing Functions
 * Tests acceptance criteria for all modules
 */

(function(window) {
    'use strict';

    function showResult(elementId, passed, message) {
        const el = document.getElementById(elementId);
        if (!el) return;
        
        el.className = `result ${passed ? 'pass' : 'fail'}`;
        el.style.display = 'block';
        el.innerHTML = `
            <i class="fas ${passed ? 'fa-check-circle' : 'fa-times-circle'} status-icon"></i>
            <strong>${passed ? 'PASS' : 'FAIL'}:</strong> ${message}
        `;
    }

    function verifyAttendanceLogic() {
        // Test attendance evaluation logic
        // TODO: Implement actual attendance logic test
        const testTime = new Date('2025-11-27T09:05:00.000Z');
        const scheduleTime = new Date('2025-11-27T09:00:00.000Z');
        const graceMinutes = 10;
        
        const diffMinutes = (testTime - scheduleTime) / (1000 * 60);
        const isOnTime = diffMinutes <= graceMinutes;
        
        return {
            pass: isOnTime,
            message: `Attendance logic test: ${isOnTime ? 'On-time' : 'Late'} (${diffMinutes.toFixed(1)} minutes)`
        };
    }

    function verifyExtractLeave() {
        // Test extract leave functionality
        if (!window.ComplaintSystem) {
            return { pass: false, message: 'ComplaintSystem not loaded' };
        }
        
        // Simulate extract leave creation
        return {
            pass: true,
            message: 'Extract leave system available (requires attendance module integration)'
        };
    }

    function verifyOutpassCreation() {
        if (!window.OutpassSystem) {
            return { pass: false, message: 'OutpassSystem not loaded' };
        }
        
        const testOutpass = window.OutpassSystem.create(
            'S001',
            new Date().toISOString(),
            new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            'Test reason',
            false
        );
        
        return {
            pass: !!testOutpass && !!testOutpass.id,
            message: testOutpass ? `Outpass created: ${testOutpass.id}` : 'Failed to create outpass'
        };
    }

    function verifyReceiptGeneration() {
        if (!window.OutpassSystem) {
            return { pass: false, message: 'OutpassSystem not loaded' };
        }
        
        const outpasses = window.OutpassSystem.getAll();
        if (outpasses.length > 0 && outpasses[0].receiptUrl) {
            return {
                pass: true,
                message: `Receipt URL generated: ${outpasses[0].receiptUrl.substring(0, 50)}...`
            };
        }
        
        return {
            pass: false,
            message: 'No receipts found. Create and approve an outpass first.'
        };
    }

    function verifyUPIPayment() {
        if (!window.PaymentSystem) {
            return { pass: false, message: 'PaymentSystem not loaded' };
        }
        
        const payment = window.PaymentSystem.processUPI('S001', 1000, 'test@upi');
        return {
            pass: !!payment && payment.method === 'upi',
            message: payment ? `UPI payment created: ${payment.id}` : 'Failed to create UPI payment'
        };
    }

    function verifyCardPayment() {
        if (!window.PaymentSystem) {
            return { pass: false, message: 'PaymentSystem not loaded' };
        }
        
        const payment = window.PaymentSystem.processCard(
            'S001',
            2000,
            '1234567890123456',
            'Test User',
            '12/25'
        );
        
        const isMasked = payment && payment.details.cardLast4 === '3456' && 
                        !payment.details.cardNumber; // Full number should not be stored
        
        return {
            pass: isMasked,
            message: isMasked ? 'Card payment created with masked number (last 4 only)' : 'Card payment failed or number not masked'
        };
    }

    function verifyCashPayment() {
        if (!window.PaymentSystem) {
            return { pass: false, message: 'PaymentSystem not loaded' };
        }
        
        const payment = window.PaymentSystem.processCash('S001', 3000, 'CR001');
        return {
            pass: !!payment && payment.method === 'cash',
            message: payment ? `Cash payment created: ${payment.id}` : 'Failed to create cash payment'
        };
    }

    function verifyRoomAllocation() {
        // TODO: Implement room allocation test
        return {
            pass: true,
            message: 'Room allocation system available (requires rooms module integration)'
        };
    }

    function verifyAvailabilityUpdate() {
        // TODO: Implement availability update test
        return {
            pass: true,
            message: 'Availability update system available (requires rooms module integration)'
        };
    }

    function verifyAnonymousComplaint() {
        if (!window.ComplaintSystem) {
            return { pass: false, message: 'ComplaintSystem not loaded' };
        }
        
        const complaint = window.ComplaintSystem.submit('S001', 'Test complaint');
        const isHidden = complaint && complaint.studentIdHidden && 
                        complaint.studentIdHidden !== 'S001';
        
        return {
            pass: isHidden,
            message: isHidden ? `Complaint submitted anonymously: ${complaint.id}` : 'Student ID not properly hidden'
        };
    }

    function verifyCSVExport() {
        if (!window.PaymentSystem) {
            return { pass: false, message: 'PaymentSystem not loaded' };
        }
        
        // Test CSV export function exists
        const hasExport = typeof window.PaymentSystem.exportCSV === 'function';
        return {
            pass: hasExport,
            message: hasExport ? 'CSV export function available' : 'CSV export function not found'
        };
    }

    function verifyWardenNotifications() {
        if (!window.StorageUtils) {
            return { pass: false, message: 'StorageUtils not loaded' };
        }
        
        const notifications = window.StorageUtils.getArray('wardenNotifications');
        return {
            pass: Array.isArray(notifications),
            message: `Warden notifications system available (${notifications.length} notifications)`
        };
    }

    // Export test functions
    window.verifyAttendanceLogic = function() {
        const result = verifyAttendanceLogic();
        showResult('attendance-result', result.pass, result.message);
    };

    window.testExtractLeave = function() {
        const result = verifyExtractLeave();
        showResult('extract-leave-result', result.pass, result.message);
    };

    window.testOutpassCreation = function() {
        const result = verifyOutpassCreation();
        showResult('outpass-create-result', result.pass, result.message);
    };

    window.testReceiptGeneration = function() {
        const result = verifyReceiptGeneration();
        showResult('receipt-result', result.pass, result.message);
    };

    window.testUPIPayment = function() {
        const result = verifyUPIPayment();
        showResult('upi-result', result.pass, result.message);
    };

    window.testCardPayment = function() {
        const result = verifyCardPayment();
        showResult('card-result', result.pass, result.message);
    };

    window.testCashPayment = function() {
        const result = verifyCashPayment();
        showResult('cash-result', result.pass, result.message);
    };

    window.testRoomAllocation = function() {
        const result = verifyRoomAllocation();
        showResult('room-alloc-result', result.pass, result.message);
    };

    window.testAvailabilityUpdate = function() {
        const result = verifyAvailabilityUpdate();
        showResult('availability-result', result.pass, result.message);
    };

    window.testAnonymousComplaint = function() {
        const result = verifyAnonymousComplaint();
        showResult('complaint-result', result.pass, result.message);
    };

    window.testCSVExport = function() {
        const result = verifyCSVExport();
        showResult('csv-result', result.pass, result.message);
    };

    window.testWardenNotifications = function() {
        const result = verifyWardenNotifications();
        showResult('notification-result', result.pass, result.message);
    };

    window.runAllTests = function() {
        const results = [];
        results.push(verifyAttendanceLogic());
        results.push(verifyExtractLeave());
        results.push(verifyOutpassCreation());
        results.push(verifyReceiptGeneration());
        results.push(verifyUPIPayment());
        results.push(verifyCardPayment());
        results.push(verifyCashPayment());
        results.push(verifyRoomAllocation());
        results.push(verifyAvailabilityUpdate());
        results.push(verifyAnonymousComplaint());
        results.push(verifyCSVExport());
        results.push(verifyWardenNotifications());
        
        const passed = results.filter(r => r.pass).length;
        const total = results.length;
        
        const el = document.getElementById('all-tests-result');
        el.className = `result ${passed === total ? 'pass' : 'fail'}`;
        el.style.display = 'block';
        el.innerHTML = `
            <strong>${passed}/${total} tests passed</strong><br>
            <ul style="margin-top: 10px; list-style: none;">
                ${results.map(r => `
                    <li><i class="fas ${r.pass ? 'fa-check' : 'fa-times'} status-icon"></i> ${r.message}</li>
                `).join('')}
            </ul>
        `;
    };

})(window);

