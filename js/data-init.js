/**
 * Data Initialization
 * Preloads sample data for demo/testing
 * 
 * This initializes:
 * - 8 sample students
 * - 4 sample rooms
 * - Default data structures
 */

(function(window) {
    'use strict';

    const STORAGE_KEYS = {
        STUDENTS: 'hostelStudents',
        ROOMS: 'hostelRooms',
        OUTPASSES: 'hostelOutpasses',
        PAYMENTS: 'hostelPayments',
        ATTENDANCE: 'hostelAttendance',
        COMPLAINTS: 'hostelComplaints',
        ROOM_ALLOCATIONS: 'hostelRoomAllocations',
        WARDEN_NOTIFICATIONS: 'wardenNotifications',
        EXTRACT_LEAVES: 'hostelExtractLeaves'
    };

    /**
     * Sample students data (8 students)
     */
    const SAMPLE_STUDENTS = [
        {
            id: "S001",
            name: "Alice Kumar",
            class: "FY BSc",
            gender: "female",
            place: "Chennai",
            email: "alice@example.com",
            phone: "9876543210",
            roomAllocated: null
        },
        {
            id: "S002",
            name: "Bob Singh",
            class: "SY BCom",
            gender: "male",
            place: "Mumbai",
            email: "bob@example.com",
            phone: "9876543211",
            roomAllocated: null
        },
        {
            id: "S003",
            name: "Charlie Patel",
            class: "TY BA",
            gender: "male",
            place: "Delhi",
            email: "charlie@example.com",
            phone: "9876543212",
            roomAllocated: null
        },
        {
            id: "S004",
            name: "Diana Sharma",
            class: "FY BSc",
            gender: "female",
            place: "Bangalore",
            email: "diana@example.com",
            phone: "9876543213",
            roomAllocated: null
        },
        {
            id: "S005",
            name: "Eve Reddy",
            class: "SY BCom",
            gender: "female",
            place: "Hyderabad",
            email: "eve@example.com",
            phone: "9876543214",
            roomAllocated: null
        },
        {
            id: "S006",
            name: "Frank Mehta",
            class: "TY BCA",
            gender: "male",
            place: "Pune",
            email: "frank@example.com",
            phone: "9876543215",
            roomAllocated: null
        },
        {
            id: "S007",
            name: "Grace Iyer",
            class: "FY BSc",
            gender: "female",
            place: "Kolkata",
            email: "grace@example.com",
            phone: "9876543216",
            roomAllocated: null
        },
        {
            id: "S008",
            name: "Henry Nair",
            class: "SY BA",
            gender: "male",
            place: "Kochi",
            email: "henry@example.com",
            phone: "9876543217",
            roomAllocated: null
        }
    ];

    /**
     * Sample rooms data (4 rooms - 2 male, 2 female)
     */
    const SAMPLE_ROOMS = [
        {
            id: "R101",
            type: "single",
            gender: "male",
            totalBeds: 1,
            availableBeds: 1,
            pricePerBed: 3000,
            image: "assets/rooms/single_male_ac.jpg",
            isAC: true,
            block: "A",
            floor: "1"
        },
        {
            id: "R102",
            type: "double",
            gender: "male",
            totalBeds: 2,
            availableBeds: 2,
            pricePerBed: 2500,
            image: "assets/rooms/double_male_ac.jpg",
            isAC: true,
            block: "A",
            floor: "1"
        },
        {
            id: "R201",
            type: "single",
            gender: "female",
            totalBeds: 1,
            availableBeds: 1,
            pricePerBed: 3000,
            image: "assets/rooms/single_female_ac.jpg",
            isAC: true,
            block: "B",
            floor: "2"
        },
        {
            id: "R202",
            type: "triple",
            gender: "female",
            totalBeds: 3,
            availableBeds: 3,
            pricePerBed: 2000,
            image: "assets/rooms/triple_female_ac.jpg",
            isAC: true,
            block: "B",
            floor: "2"
        }
    ];

    /**
     * Initialize all data structures with empty arrays if they don't exist
     */
    function initializeDataStructures() {
        Object.values(STORAGE_KEYS).forEach(key => {
            if (!window.StorageUtils || !window.StorageUtils.get(key)) {
                if (!window.StorageUtils) {
                    console.warn('StorageUtils not loaded. Loading storage.js...');
                    // Try to load storage.js if it exists
                    const script = document.createElement('script');
                    script.src = 'utils/storage.js';
                    document.head.appendChild(script);
                }
                // Will be initialized after StorageUtils loads
                setTimeout(() => {
                    if (window.StorageUtils && !window.StorageUtils.get(key)) {
                        window.StorageUtils.set(key, []);
                    }
                }, 100);
            } else {
                if (!Array.isArray(window.StorageUtils.get(key))) {
                    window.StorageUtils.set(key, []);
                }
            }
        });
    }

    /**
     * Preload sample students if storage is empty
     */
    function preloadSampleStudents() {
        if (!window.StorageUtils) {
            console.warn('StorageUtils not available');
            return;
        }

        const existing = window.StorageUtils.getArray(STORAGE_KEYS.STUDENTS);
        if (existing.length === 0) {
            window.StorageUtils.set(STORAGE_KEYS.STUDENTS, SAMPLE_STUDENTS);
            console.log('Sample students preloaded');
        }
    }

    /**
     * Preload sample rooms if storage is empty
     */
    function preloadSampleRooms() {
        if (!window.StorageUtils) {
            console.warn('StorageUtils not available');
            return;
        }

        const existing = window.StorageUtils.getArray(STORAGE_KEYS.ROOMS);
        if (existing.length === 0) {
            window.StorageUtils.set(STORAGE_KEYS.ROOMS, SAMPLE_ROOMS);
            console.log('Sample rooms preloaded');
        }
    }

    /**
     * Initialize all sample data
     */
    function initializeSampleData() {
        // Wait for StorageUtils to be available
        if (!window.StorageUtils) {
            setTimeout(initializeSampleData, 100);
            return;
        }

        initializeDataStructures();
        preloadSampleStudents();
        preloadSampleRooms();
        
        console.log('Sample data initialization complete');
    }

    // Export
    window.DataInit = {
        initialize: initializeSampleData,
        STORAGE_KEYS: STORAGE_KEYS,
        SAMPLE_STUDENTS: SAMPLE_STUDENTS,
        SAMPLE_ROOMS: SAMPLE_ROOMS
    };

    // Auto-initialize on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeSampleData);
    } else {
        setTimeout(initializeSampleData, 100);
    }

})(window);

