(function (window) {
  const STORAGE_KEY = 'hostelPortalData';
  const defaultHostelData = {
    hostelers: [
        {
            id: "H2024001",
            name: "Rahul Sharma",
            gender: "male",
            age: 20,
            mobile: "9876543210",
            email: "rahul@example.com",
            occupation: "student",
            registrationDate: "2024-03-15",
            room: "A101",
            bed: "B1",
            checkinDate: "2024-03-15",
            college: "University of Technology",
            course: "Computer Science",
            department: "Computer Science",
            year: "2",
            rollNo: "CS2023001",
            studentId: "STU2023001",
            photo: "https://i.pravatar.cc/150?img=1",
            address: "123 Main Street, Bangalore",
            city: "Bangalore",
            pincode: "560001",
            fatherName: "Rajesh Sharma",
            parentPhone: "9876543219",
            parentAddress: "123 Main Street, Bangalore",
            emergencyName: "Priya Sharma",
            emergencyPhone: "9876543218"
        },
        {
            id: "H2024002",
            name: "Priya Patel",
            gender: "female",
            age: 19,
            mobile: "9876543211",
            email: "priya@example.com",
            occupation: "student",
            registrationDate: "2024-03-10",
            room: "B205",
            bed: "B2",
            checkinDate: "2024-03-10",
            college: "University of Technology",
            course: "Electrical Engineering",
            department: "Electrical Engineering",
            year: "1",
            rollNo: "EE2023001",
            studentId: "STU2023002",
            photo: "https://i.pravatar.cc/150?img=2",
            address: "456 Park Avenue, Bangalore",
            city: "Bangalore",
            pincode: "560002",
            fatherName: "Ramesh Patel",
            parentPhone: "9876543217",
            parentAddress: "456 Park Avenue, Bangalore",
            emergencyName: "Rahul Patel",
            emergencyPhone: "9876543216"
        }
    ],
    rooms: [
        {
            id: 1,
            roomNumber: "A101",
            block: "a-block",
            floor: "ground",
            roomType: "ac",
            bedType: "triple",
            totalBeds: 3,
            availableBeds: 2,
            roomRate: 5000,
            isAvailable: true,
            image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1758&q=80",
            students: ["H2024001"]
        },
        {
            id: 2,
            roomNumber: "B205",
            block: "b-block",
            floor: "second",
            roomType: "non-ac",
            bedType: "double",
            totalBeds: 2,
            availableBeds: 0,
            roomRate: 3500,
            isAvailable: false,
            image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1738&q=80",
            students: ["H2024002"]
        },
        {
            id: 3,
            roomNumber: "A201",
            block: "a-block",
            floor: "second",
            roomType: "ac",
            bedType: "double",
            totalBeds: 2,
            availableBeds: 2,
            roomRate: 4500,
            isAvailable: true,
            image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80",
            students: []
        },
        {
            id: 4,
            roomNumber: "A102",
            block: "a-block",
            floor: "ground",
            roomType: "non-ac",
            bedType: "triple",
            totalBeds: 3,
            availableBeds: 1,
            roomRate: 4000,
            isAvailable: true,
            image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1758&q=80",
            students: ["H2024003", "H2024004"]
        },
        {
            id: 5,
            roomNumber: "B206",
            block: "b-block",
            floor: "second",
            roomType: "ac",
            bedType: "single",
            totalBeds: 1,
            availableBeds: 0,
            roomRate: 6000,
            isAvailable: false,
            image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1738&q=80",
            students: ["H2024005"]
        }
    ],
    outpasses: [
        {
            id: "OP001",
            studentId: "H2024001",
            studentName: "Rahul Sharma",
            outDate: "2024-03-20",
            returnDate: "2024-03-22",
            reason: "home",
            details: "Going home for family function",
            status: "approved",
            submittedDate: "2024-03-18",
            approvedDate: "2024-03-19",
            approvedBy: "Dr. Rajesh Kumar",
            warden_reply: null
        },
        {
            id: "OP002",
            studentId: "H2024002",
            studentName: "Priya Patel",
            outDate: "2024-03-25",
            returnDate: "2024-03-26",
            reason: "medical",
            details: "Dental appointment",
            status: "pending",
            submittedDate: "2024-03-19",
            warden_reply: null
        },
        {
            id: "OP003",
            studentId: "H2024003",
            studentName: "Amit Kumar",
            outDate: "2024-03-15",
            returnDate: "2024-03-17",
            reason: "personal",
            details: "Family emergency",
            status: "approved",
            submittedDate: "2024-03-14",
            approvedDate: "2024-03-14",
            approvedBy: "Dr. Rajesh Kumar",
            warden_reply: "Please ensure you return on time. Safe travels!"
        }
    ],
    bookings: [
        {
            id: "B2024001",
            studentId: "H2024001",
            studentName: "Rahul Sharma",
            studentGender: "male",
            roomType: "single",
            roomPrice: 1200,
            bookingDate: "2024-03-15",
            status: "confirmed",
            paymentMethod: "cash",
            paymentStatus: "paid"
        },
        {
            id: "B2024002",
            studentId: "H2024002",
            studentName: "Priya Patel",
            studentGender: "female",
            roomType: "double",
            roomPrice: 800,
            bookingDate: "2024-03-10",
            status: "confirmed",
            paymentMethod: "card",
            paymentStatus: "paid"
        }
    ],
    payments: [
        {
            id: "P2024001",
            studentId: "H2024001",
            studentName: "Rahul Sharma",
            amount: 1450,
            paymentDate: "2024-03-15",
            paymentMethod: "cash",
            status: "completed"
        },
        {
            id: "P2024002",
            studentId: "H2024002",
            studentName: "Priya Patel",
            amount: 1050,
            paymentDate: "2024-03-10",
            paymentMethod: "card",
            status: "completed"
        }
    ],
    feedback: [
        {
            id: "FB001",
            studentName: "Rahul Sharma",
            studentEmail: "rahul@example.com",
            type: "suggestion",
            message: "Can we have more vegetarian options in the mess?",
            date: "2024-03-18",
            status: "pending",
            reply: ""
        },
        {
            id: "FB002",
            studentName: "Priya Patel",
            studentEmail: "priya@example.com",
            type: "complaint",
            message: "The Wi-Fi in the common area is very slow during peak hours.",
            date: "2024-03-17",
            status: "replied",
            reply: "We are working on upgrading the network infrastructure. Expected completion by next week."
        }
    ]
};

  function cloneDefaultData() {
    return JSON.parse(JSON.stringify(defaultHostelData));
  }

  function normalizeData(dataInput) {
    const fallback = cloneDefaultData();
    const source = dataInput && typeof dataInput === 'object' ? dataInput : {};
    return {
      ...fallback,
      ...source,
      hostelers: Array.isArray(source.hostelers) ? source.hostelers : fallback.hostelers,
      rooms: Array.isArray(source.rooms) ? source.rooms : fallback.rooms,
      outpasses: Array.isArray(source.outpasses) ? source.outpasses : fallback.outpasses,
      bookings: Array.isArray(source.bookings) ? source.bookings : fallback.bookings,
      payments: Array.isArray(source.payments) ? source.payments : fallback.payments,
      feedback: Array.isArray(source.feedback) ? source.feedback : fallback.feedback,
    };
  }

  function loadHostelData() {
    try {
      if (window.localStorage) {
        const cached = window.localStorage.getItem(STORAGE_KEY);
        if (cached) {
          return normalizeData(JSON.parse(cached));
        }
      }
    } catch (error) {
      console.warn('Failed to load hostel data from storage', error);
    }

    return cloneDefaultData();
  }

  function persistHostelData() {
    try {
      if (window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(window.hostelData));
      }
    } catch (error) {
      console.warn('Failed to persist hostel data', error);
    }
  }

  function resetHostelData() {
    window.hostelData = cloneDefaultData();
    persistHostelData();
  }

  window.hostelData = loadHostelData();
  window.persistHostelData = persistHostelData;
  window.resetHostelData = resetHostelData;
})(window);
