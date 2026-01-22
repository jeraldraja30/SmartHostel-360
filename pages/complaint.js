/**
 * Complaint Box System
 * Anonymous complaints with warden replies
 * 
 * Data Model:
 * Complaint: {
 *   id: "C001",
 *   message: "Food quality is bad",
 *   submittedAtISO: "2025-11-27T09:12:00.000Z",
 *   studentIdHidden: "HXYZ123",
 *   replies: [{ by: "warden|system", message: "...", atISO: "..." }],
 *   status: "open|closed"
 * }
 */

(function(window) {
    'use strict';

    const STORAGE_KEY = 'hostelComplaints';

    function generateComplaintId() {
        const complaints = window.StorageUtils.getArray(STORAGE_KEY);
        if (complaints.length === 0) return 'C001';
        const maxId = complaints.reduce((max, c) => {
            const num = parseInt(c.id.replace('C', '')) || 0;
            return num > max ? num : max;
        }, 0);
        return `C${String(maxId + 1).padStart(3, '0')}`;
    }

    function maskStudentId(studentId) {
        // Create a masked ID for privacy
        if (!studentId) return `H${Date.now().toString().slice(-6)}`;
        return `H${studentId.slice(0, 3)}XXX${Date.now().toString().slice(-3)}`;
    }

    function submitComplaint(studentId, message) {
        if (!message || message.trim() === '') {
            return null;
        }

        const complaint = {
            id: generateComplaintId(),
            message: message.trim(),
            submittedAtISO: new Date().toISOString(),
            studentIdHidden: maskStudentId(studentId),
            replies: [],
            status: 'open'
        };

        window.StorageUtils.addToArray(STORAGE_KEY, complaint);
        return complaint;
    }

    function getAllComplaints(includeClosed = false) {
        let complaints = window.StorageUtils.getArray(STORAGE_KEY);
        complaints.sort((a, b) => new Date(b.submittedAtISO) - new Date(a.submittedAtISO));
        
        if (!includeClosed) {
            complaints = complaints.filter(c => c.status === 'open');
        }
        
        return complaints;
    }

    function addReply(complaintId, replyMessage, repliedBy = 'warden') {
        const complaint = window.StorageUtils.findArrayItem(STORAGE_KEY, complaintId);
        if (!complaint) return false;

        const reply = {
            by: repliedBy,
            message: replyMessage.trim(),
            atISO: new Date().toISOString()
        };

        if (!complaint.replies) complaint.replies = [];
        complaint.replies.push(reply);
        
        window.StorageUtils.updateArrayItem(STORAGE_KEY, complaintId, {
            replies: complaint.replies,
            status: 'open'
        });

        return true;
    }

    function closeComplaint(complaintId) {
        return window.StorageUtils.updateArrayItem(STORAGE_KEY, complaintId, {
            status: 'closed'
        });
    }

    window.ComplaintSystem = {
        submit: submitComplaint,
        getAll: getAllComplaints,
        addReply: addReply,
        close: closeComplaint
    };

})(window);

