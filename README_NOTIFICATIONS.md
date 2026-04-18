# Hostel Management System - Enhanced Features

## Overview

This document describes the enhanced features added to the Hostel Management System, including:

- Enhanced Outpass System with receipts and notifications
- Payments System (UPI/Card/Cash) with receipts
- Warden Inbox for notifications
- Complaint Box (anonymous)
- Attendance System with extract leave
- Enhanced Rooms & Booking
- Fee Card Generation & CSV Export

## File Structure

```
/
├── utils/
│   └── storage.js              # LocalStorage utility functions
├── js/
│   ├── data-init.js            # Sample data initialization
│   └── notifications.js        # Notification system
├── pages/
│   ├── outpass.js              # Enhanced outpass system
│   ├── payments.js             # Payments system
│   ├── payments.html           # Payments UI
│   ├── warden_inbox.js         # Warden inbox functionality
│   ├── warden_inbox.html       # Warden inbox UI
│   └── complaint.js            # Complaint system
├── data/
│   └── sample_students.json    # Sample student data
└── css/
    └── notifications.css       # Notification styles
```

## LocalStorage to Firestore Migration Guide

### Current Implementation

The system currently uses LocalStorage via `StorageUtils` helpers in `utils/storage.js`. All data is stored as JSON in browser LocalStorage.

### Migration Steps

#### 1. Install Firebase

```bash
npm install firebase
```

#### 2. Initialize Firebase

Create `js/firebase-config.js`:

```javascript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  // Your Firebase config
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

#### 3. Replace StorageUtils Functions

Update `utils/storage.js` to use Firestore instead of LocalStorage:

**Before (LocalStorage):**
```javascript
function getStorageData(key, defaultValue = null) {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    return JSON.parse(item);
}
```

**After (Firestore):**
```javascript
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase-config.js';

async function getStorageData(key, defaultValue = null) {
    try {
        const docRef = doc(db, 'hostelData', key);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        }
        return defaultValue;
    } catch (error) {
        console.error('Error reading from Firestore:', error);
        return defaultValue;
    }
}
```

#### 4. Update All Storage Calls

Replace all synchronous `StorageUtils` calls with async/await:

**Before:**
```javascript
const students = StorageUtils.getArray('hostelStudents');
StorageUtils.addToArray('hostelPayments', payment);
```

**After:**
```javascript
const students = await StorageUtils.getArray('hostelStudents');
await StorageUtils.addToArray('hostelPayments', payment);
```

#### 5. Collection Structure in Firestore

Create these collections:
- `hostelStudents` - Student records
- `hostelRooms` - Room data
- `hostelOutpasses` - Outpass records
- `hostelPayments` - Payment records
- `hostelAttendance` - Attendance records
- `hostelComplaints` - Complaints
- `hostelRoomAllocations` - Room allocations
- `wardenNotifications` - Warden notifications

#### 6. Real-time Listeners (Optional)

For live updates, replace periodic refreshes with Firestore listeners:

```javascript
import { onSnapshot, collection } from 'firebase/firestore';

// Listen to payments in real-time
onSnapshot(collection(db, 'hostelPayments'), (snapshot) => {
    const payments = snapshot.docs.map(doc => doc.data());
    renderPayments(payments);
});
```

#### 7. File Storage for Receipts

Move receipt generation to Firebase Storage:

```javascript
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase-config.js';

async function uploadReceipt(receiptHTML, fileName) {
    const storageRef = ref(storage, `receipts/${fileName}`);
    const blob = new Blob([receiptHTML], { type: 'text/html' });
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
}
```

### Migration Checklist

- [ ] Install Firebase SDK
- [ ] Create Firebase config file
- [ ] Replace `utils/storage.js` with Firestore version
- [ ] Update all module files to use async/await
- [ ] Update UI to handle async operations
- [ ] Set up Firestore security rules
- [ ] Configure Firebase Storage for receipts
- [ ] Test data migration
- [ ] Update authentication (if needed)

## Data Models

### Student
```javascript
{
  id: "S001",
  name: "Alice Kumar",
  class: "FY BSc",
  gender: "female",
  place: "Chennai",
  email: "alice@example.com",
  phone: "9876543210",
  roomAllocated: null
}
```

### Outpass
```javascript
{
  id: "O001",
  studentId: "S001",
  startISO: "2025-11-27T09:00:00.000Z",
  expectedReturnISO: "2025-11-29T18:00:00.000Z",
  status: "approved",
  reason: "Home visit",
  approvedBy: "Warden1",
  approvedAtISO: "2025-11-26T10:00:00.000Z",
  receiptUrl: "/receipts/O001.html",
  isExtractLeave: false
}
```

### Payment
```javascript
{
  id: "P001",
  studentId: "S001",
  amount: 5000,
  method: "upi",
  details: { upiId: "warden@bank" },
  status: "success",
  timestampISO: "2025-11-27T12:00:00.000Z",
  receiptUrl: "/receipts/P001.html"
}
```

### Complaint
```javascript
{
  id: "C001",
  message: "Food quality is bad",
  submittedAtISO: "2025-11-27T09:12:00.000Z",
  studentIdHidden: "HXYZ123",
  replies: [],
  status: "open"
}
```

## Usage

### Initializing Sample Data

The system automatically preloads sample data on first load. To reset:

```javascript
window.DataInit.initialize();
```

### Sending Notifications

```javascript
// From outpass system
window.OutpassSystem.sendNotification('outpass', outpassId, 'New outpass approved');

// From payment system
window.PaymentSystem.sendNotification('payment', paymentId, 'New payment received');
```

### Generating Receipts

```javascript
// Download outpass receipt
window.OutpassSystem.downloadReceipt(outpassId);

// Download payment receipt
window.PaymentSystem.downloadReceipt(paymentId);
```

## Testing

See `pages/verify.html` for acceptance criteria tests.

## Image Assets

Room images should be placed in:
- `assets/rooms/single_male_ac.jpg`
- `assets/rooms/double_male_ac.jpg`
- `assets/rooms/triple_female_ac.jpg`
- etc.

Update image paths in `js/data-init.js` SAMPLE_ROOMS array.

## Security Notes

- Card numbers are masked (only last 4 digits stored)
- CVV is never stored
- Student IDs are masked in complaint system
- All HTML is escaped to prevent XSS

## TODO for Production

- [ ] Implement actual payment gateway integration
- [ ] Add authentication/authorization
- [ ] Set up email notifications
- [ ] Add receipt PDF generation
- [ ] Implement biometric device integration
- [ ] Add data backup/export functionality
- [ ] Set up monitoring and logging

