const API_BASE_URL = 'http://127.0.0.1:8000/api';
let backendAvailable = false;
const DEFAULT_ROOM_IMAGE = "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1758&q=80";
const persistHostelDataSafe = () => {
    if (typeof window.persistHostelData === 'function') {
        window.persistHostelData();
    }
};

const apiClient = {
    async request(path, options = {}) {
        const response = await fetch(`${API_BASE_URL}${path}`, {
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {}),
            },
            ...options,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `Request failed with status ${response.status}`);
        }

        if (response.status === 204) {
            return null;
        }

        return response.json();
    },
    fetchHostelData() {
        return this.request('/hostel-data/');
    },
    createHosteler(payload) {
        return this.request('/hostelers/', { method: 'POST', body: JSON.stringify(payload) });
    },
    createRoom(payload) {
        return this.request('/rooms/', { method: 'POST', body: JSON.stringify(payload) });
    },
    updateRoom(roomId, payload) {
        return this.request(`/rooms/${roomId}/`, { method: 'PUT', body: JSON.stringify(payload) });
    },
    deleteRoom(roomId) {
        return this.request(`/rooms/${roomId}/`, { method: 'DELETE' });
    },
    createOutpass(payload) {
        return this.request('/outpasses/', { method: 'POST', body: JSON.stringify(payload) });
    },
    updateOutpass(outpassId, payload) {
        return this.request(`/outpasses/${outpassId}/`, { method: 'PATCH', body: JSON.stringify(payload) });
    },
    setOutpassStatus(outpassId, payload) {
        return this.request(`/outpasses/${outpassId}/set_status/`, { method: 'POST', body: JSON.stringify(payload) });
    },
    createFeedback(payload) {
        return this.request('/feedback/', { method: 'POST', body: JSON.stringify(payload) });
    },
};

async function refreshHostelData(showFallbackAlert = false) {
    try {
        const apiPayload = await apiClient.fetchHostelData();
        hostelData = mapApiPayloadToUi(apiPayload);
        persistHostelDataSafe();
        backendAvailable = true;
        refreshAllDataViews();
        if (showFallbackAlert) {
            showAlert('Connected to Django backend. Live data loaded.', 'success');
        }
    } catch (error) {
        console.warn('Backend unreachable. Using demo data.', error);
        if (showFallbackAlert) {
            showAlert('Backend is not reachable. Running in demo mode with sample data.', 'warning');
        }
        backendAvailable = false;
        refreshAllDataViews();
    }
}

function refreshAllDataViews() {
    const loaders = [
        loadDashboardData,
        loadWardenDashboard,
        loadRoomsData,
        loadHostelerData,
        loadLivingHostelerData,
        loadOutpassData,
        loadStudentCards,
        loadRoomAllocationData,
        loadBoysRoomAllocationData,
        loadGirlsRoomAllocationData,
        loadFeedbackData,
    ];

    loaders.forEach(loader => {
        if (typeof loader === 'function') {
            try {
                loader();
            } catch (error) {
                console.warn(`Failed to refresh view via ${loader.name}`, error);
            }
        }
    });
}

function mapApiPayloadToUi(payload) {
    return {
        hostelers: (payload.hostelers || []).map(mapHostelerFromApi),
        rooms: (payload.rooms || []).map(mapRoomFromApi),
        outpasses: (payload.outpasses || []).map(mapOutpassFromApi),
        bookings: (payload.bookings || []).map(mapBookingFromApi),
        payments: (payload.payments || []).map(mapPaymentFromApi),
        maintenance: payload.maintenance || [],
        inventory: payload.inventory || [],
        feedback: (payload.feedback || []).map(mapFeedbackFromApi),
    };
}

function mapHostelerFromApi(item) {
    return {
        id: item.hosteler_id,
        recordId: item.id,
        name: item.name,
        gender: item.gender,
        age: item.age,
        mobile: item.mobile,
        email: item.email,
        occupation: item.occupation || 'student',
        registrationDate: item.registration_date,
        room: item.room_number || '',
        roomId: item.room,
        bed: item.bed || '',
        checkinDate: item.checkin_date || '',
        college: item.college || '',
        course: item.course || '',
        department: item.department || '',
        year: item.year || '',
        rollNo: item.roll_no || '',
        studentId: item.student_id || '',
        photo: item.photo || "https://i.pravatar.cc/150",
        address: item.address || '',
        city: item.city || '',
        pincode: item.pincode || '',
        fatherName: item.father_name || '',
        parentPhone: item.parent_phone || '',
        parentAddress: item.parent_address || '',
        emergencyName: item.emergency_name || '',
        emergencyPhone: item.emergency_phone || '',
    };
}

function mapRoomFromApi(item) {
    return {
        id: item.id,
        roomNumber: item.room_number,
        block: item.block,
        floor: item.floor,
        roomType: item.room_type,
        bedType: item.bed_type,
        totalBeds: item.total_beds,
        availableBeds: item.available_beds,
        roomRate: parseFloat(item.room_rate),
        isAvailable: item.is_available,
        image: item.image || DEFAULT_ROOM_IMAGE,
        students: item.students || [],
    };
}

function mapOutpassFromApi(item) {
    const displayId = `OP${String(item.id).padStart(4, '0')}`;
    return {
        id: displayId,
        backendId: item.id,
        studentId: item.student_id || '',
        studentName: item.student_name || item.hosteler_name || '',
        outDate: item.out_date,
        returnDate: item.return_date,
        reason: item.reason,
        details: item.details || '',
        status: item.status,
        submittedDate: item.issued_on,
        approvedDate: item.approved_on || item.issued_on,
        approvedBy: item.approved_by || '',
        warden_reply: item.warden_reply || '',
    };
}

function mapBookingFromApi(item) {
    return {
        id: item.booking_ref || `B${item.id}`,
        studentId: item.student_id || '',
        studentName: item.student_name || '',
        studentGender: item.student_gender || '',
        roomType: item.room_type,
        roomPrice: parseFloat(item.room_price),
        bookingDate: item.booking_date,
        status: item.status,
        paymentMethod: item.payment_method || '',
        paymentStatus: item.payment_status || '',
    };
}

function mapPaymentFromApi(item) {
    return {
        id: item.invoice_no || `P${item.id}`,
        studentId: item.hosteler_code || '',
        studentName: item.hosteler_name || '',
        amount: parseFloat(item.amount),
        paymentDate: item.paid_on || item.due_date,
        paymentMethod: item.payment_type,
        status: item.status,
    };
}

function mapFeedbackFromApi(item) {
    return {
        id: item.id,
        studentName: item.student_name,
        studentEmail: item.student_email,
        type: item.feedback_type,
        message: item.message,
        date: item.date,
        status: item.status,
        reply: item.reply || '',
    };
}

function getOutpassBackendId(outpass) {
    if (outpass.backendId) {
        return outpass.backendId;
    }
    const numericId = parseInt(String(outpass.id).replace(/\D/g, ''), 10);
    return Number.isNaN(numericId) ? null : numericId;
}

// Current user information
let currentUser = {
    type: "",
    name: ""
};

// NEW: Login module selection
function selectLoginModule(module) {
    // Update active module
    document.getElementById('student-login-module').classList.remove('active');
    document.getElementById('warden-login-module').classList.remove('active');
    document.getElementById(`${module}-login-module`).classList.add('active');

    // Set user type
    document.getElementById('user-type').value = module;
}

// Application Form Submission
function submitApplication(event) {
    event.preventDefault();

    const firstName = document.getElementById('app-firstname').value.trim();
    const lastName = document.getElementById('app-lastname').value.trim();
    const email = document.getElementById('app-email').value.trim();
    const phone = document.getElementById('app-phone').value.trim();
    const dob = document.getElementById('app-dob').value;
    const gender = document.getElementById('app-gender').value;
    const course = document.getElementById('app-course').value.trim();
    const year = document.getElementById('app-year').value;
    const address = document.getElementById('app-address').value.trim();
    const emergencyContact = document.getElementById('app-emergency-contact').value.trim();
    const emergencyPhone = document.getElementById('app-emergency-phone').value.trim();

    // Validate all fields
    if (!firstName || !lastName || !email || !phone || !dob || !gender || !course || !year || !address || !emergencyContact || !emergencyPhone) {
        showAlert('Please fill in all required fields', 'error');
        return;
    }

    // Generate username (AdminXXX format)
    const existingUsers = JSON.parse(localStorage.getItem('hostelApplications') || '[]');
    const lastAdminNumber = existingUsers.length > 0 
        ? Math.max(...existingUsers.map(u => {
            const match = u.username.match(/Admin(\d+)/);
            return match ? parseInt(match[1]) : 0;
        }))
        : 0;
    const newAdminNumber = lastAdminNumber + 1;
    const username = `Admin${newAdminNumber.toString().padStart(3, '0')}`;

    // Generate password (FirstName123 format)
    const password = `${firstName}123`;

    // Create application data
    const applicationData = {
        id: `APP${newAdminNumber.toString().padStart(3, '0')}`,
        firstName: firstName,
        lastName: lastName,
        fullName: `${firstName} ${lastName}`,
        email: email,
        phone: phone,
        dob: dob,
        gender: gender,
        course: course,
        year: year,
        address: address,
        emergencyContact: emergencyContact,
        emergencyPhone: emergencyPhone,
        username: username,
        password: password,
        applicationDate: new Date().toISOString().split('T')[0],
        status: 'pending'
    };

    // Save to localStorage
    existingUsers.push(applicationData);
    localStorage.setItem('hostelApplications', JSON.stringify(existingUsers));

    // Also save credentials separately for easy login lookup
    const credentials = JSON.parse(localStorage.getItem('hostelCredentials') || '{}');
    credentials[username] = {
        password: password,
        email: email,
        fullName: `${firstName} ${lastName}`,
        type: 'student'
    };
    localStorage.setItem('hostelCredentials', JSON.stringify(credentials));

    // Display credentials
    document.getElementById('generated-username').textContent = username;
    document.getElementById('generated-password').textContent = password;
    document.getElementById('credentials-display').classList.add('show');

    // Scroll to credentials
    document.getElementById('credentials-display').scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Show success message
    showAlert('Application submitted successfully! Please save your credentials.', 'success');

    // Reset form (optional - you might want to keep it for reference)
    // document.getElementById('application-form').reset();
}

// Page navigation function
function showPage(pageId) {
    // Handle welcome and application pages (public pages)
    if (pageId === 'welcome' || pageId === 'application' || pageId === 'login') {
        // Update body class for welcome page background
        if (pageId === 'welcome') {
            document.body.classList.add('welcome-active');
        } else {
            document.body.classList.remove('welcome-active');
        }

    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
            if (pageId === 'welcome' || pageId === 'application' || pageId === 'login') {
                // Show public pages
                if (page.id === pageId) {
                    page.style.display = 'block';
                    page.classList.add('active');
                } else if (page.id === 'welcome' || page.id === 'application' || page.id === 'login') {
                    page.style.display = 'none';
                }
            }
        });

        // Hide main application if showing public pages
        if (pageId === 'welcome' || pageId === 'application' || pageId === 'login') {
            if (document.querySelector('header')) {
                document.querySelector('header').style.display = 'none';
            }
            if (document.querySelector('main')) {
                document.querySelector('main').style.display = 'none';
            }
            if (document.querySelector('footer')) {
                document.querySelector('footer').style.display = 'none';
            }
        }

        return;
    }

    // Remove welcome-active class when showing authenticated pages
    document.body.classList.remove('welcome-active');

    // For authenticated pages, check if user is logged in
    if (!currentUser.type) {
        showAlert('Please login first', 'error');
        showPage('login');
        return;
    }

    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
    });

    // Hide public pages
    document.getElementById('welcome').style.display = 'none';
    document.getElementById('application').style.display = 'none';
    document.getElementById('login').style.display = 'none';

    // Show the selected page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    // Update active nav link
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });

    // Find and activate the corresponding nav link
    const activeLink = Array.from(navLinks).find(link => 
        link.getAttribute('onclick')?.includes(`'${pageId}'`)
    );
    if (activeLink) {
        activeLink.classList.add('active');
    }

    // Load data for specific pages
    if (pageId === 'home') {
        loadDashboardData();
    } else if (pageId === 'room-management') {
        loadRoomsData();
    } else if (pageId === 'outpass') {
        loadOutpassData();
    } else if (pageId === 'hosteler-info') {
        loadHostelerData();
        loadStudentCards();
    } else if (pageId === 'living-hosteler') {
        loadLivingHostelerData();
    } else if (pageId === 'booking') {
        initializeBookingPage();
    } else if (pageId === 'warden-dashboard') {
        loadWardenDashboard();
    } else if (pageId === 'registration') {
        initializeRegistrationForm();
    } else if (pageId === 'room-allocation') {
        loadRoomAllocationData();
    } else if (pageId === 'feedback') {
        loadFeedbackData();
    } else if (pageId === 'complaint') {
        loadComplaintData();
    } else if (pageId === 'boys-room-allocation') {
        loadBoysRoomAllocationData();
    } else if (pageId === 'girls-room-allocation') {
        loadGirlsRoomAllocationData();
    }
}

// Switch between tabs in forms
function switchTab(tabId) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => {
        tab.classList.remove('active');
    });

    // Show selected tab content
    document.getElementById(tabId).classList.add('active');

    // Update active tab
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
}

// Login function
function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const userType = document.getElementById('user-type').value;

    // Simple validation
    if (!username || !password) {
        showAlert('Please enter both username and password', 'error');
        return;
    }

    // Check for warden login
    if (userType === 'warden') {
        if (username === 'warden' && password === 'warden123') {
            // Warden login successful
            currentUser.type = 'warden';
            currentUser.name = 'Warden';
            currentUser.username = username;
            
            // Store user type in localStorage for persistence
            localStorage.setItem('currentUserType', 'warden');
            localStorage.setItem('currentUserName', 'Warden');

            // Hide login page and welcome page
        document.getElementById('login').style.display = 'none';
            document.getElementById('welcome').style.display = 'none';

        // Show main application
        document.querySelector('header').style.display = 'block';
        document.querySelector('main').style.display = 'block';
            if (document.querySelector('footer')) {
        document.querySelector('footer').style.display = 'block';
            }

        // Update user display
            document.getElementById('user-display').textContent = 'Warden';

        // Apply user-specific restrictions
        applyUserRestrictions();

        // Show success message
        showAlert('Login successful! Welcome to Hostel Admin Portal', 'success');
            return;
    } else {
            showAlert('Invalid warden credentials', 'error');
            return;
        }
    }

    // Check for student login from localStorage
    const credentials = JSON.parse(localStorage.getItem('hostelCredentials') || '{}');
    const userCreds = credentials[username];

    if (userCreds && userCreds.password === password) {
        // Student login successful
        currentUser.type = 'student';
        currentUser.name = userCreds.fullName || username;
        currentUser.username = username;
        currentUser.email = userCreds.email;
        
        // Store user type in localStorage for persistence
        localStorage.setItem('currentUserType', 'student');
        localStorage.setItem('currentUserName', userCreds.fullName || username);

        // Hide login page and welcome page
        document.getElementById('login').style.display = 'none';
        document.getElementById('welcome').style.display = 'none';

        // Show main application
        document.querySelector('header').style.display = 'block';
        document.querySelector('main').style.display = 'block';
        if (document.querySelector('footer')) {
            document.querySelector('footer').style.display = 'block';
        }

        // Update user display
        document.getElementById('user-display').textContent = userCreds.fullName || username;

        // Apply user-specific restrictions
        applyUserRestrictions();

        // Show success message
        showAlert('Login successful! Welcome to Hostel Admin Portal', 'success');
    } else {
        showAlert('Invalid username or password', 'error');
    }
}

// NEW: Apply user restrictions based on user type
function applyUserRestrictions() {
    if (currentUser.type === 'warden') {
        // Show warden-specific menus
        document.getElementById('warden-menu').style.display = 'block';
        document.getElementById('room-management-menu').style.display = 'block';
        document.getElementById('boys-allocation-menu').style.display = 'block';
        document.getElementById('girls-allocation-menu').style.display = 'block';
        document.getElementById('boys-allocation-card').style.display = 'block';
        document.getElementById('girls-allocation-card').style.display = 'block';
        document.getElementById('warden-notifications-menu').style.display = 'block';
        if (document.getElementById('warden-inbox-menu')) {
            document.getElementById('warden-inbox-menu').style.display = 'block';
        }
        if (document.getElementById('verify-menu')) {
            document.getElementById('verify-menu').style.display = 'block';
        }

        // Hide student-specific menus
        document.getElementById('registration-menu').style.display = 'none';
        document.getElementById('booking-menu').style.display = 'none';
        document.getElementById('about-menu').style.display = 'none';
        document.getElementById('features-menu').style.display = 'none';
        document.getElementById('contact-menu').style.display = 'none';
        document.getElementById('room-management-card').style.display = 'none';
        document.getElementById('student-notifications-menu').style.display = 'none';
        // Hide student-specific dashboard cards
        if (document.getElementById('complaint-card')) {
            document.getElementById('complaint-card').style.display = 'none';
        }
        if (document.getElementById('feedback-card')) {
            document.getElementById('feedback-card').style.display = 'none';
        }

        // Show warden dashboard by default
        showPage('warden-dashboard');
    } else {
        // Student view - hide warden-specific menus
        document.getElementById('warden-menu').style.display = 'none';
        document.getElementById('room-management-menu').style.display = 'none';
        document.getElementById('boys-allocation-menu').style.display = 'none';
        document.getElementById('girls-allocation-menu').style.display = 'none';
        document.getElementById('boys-allocation-card').style.display = 'none';
        document.getElementById('girls-allocation-card').style.display = 'none';
        document.getElementById('warden-notifications-menu').style.display = 'none';
        if (document.getElementById('warden-inbox-menu')) {
            document.getElementById('warden-inbox-menu').style.display = 'none';
        }
        if (document.getElementById('verify-menu')) {
            document.getElementById('verify-menu').style.display = 'none';
        }

        // Show student-specific menus
        document.getElementById('registration-menu').style.display = 'block';
        document.getElementById('booking-menu').style.display = 'block';
        document.getElementById('about-menu').style.display = 'block';
        document.getElementById('features-menu').style.display = 'block';
        document.getElementById('contact-menu').style.display = 'block';
        document.getElementById('room-management-card').style.display = 'block';
        document.getElementById('student-notifications-menu').style.display = 'block';
        // Show student-specific dashboard cards
        if (document.getElementById('complaint-card')) {
            document.getElementById('complaint-card').style.display = 'block';
        }
        if (document.getElementById('feedback-card')) {
            document.getElementById('feedback-card').style.display = 'block';
        }

        // Show home by default for students
        showPage('home');
        
        // Update notification badge for students
        if (typeof updateNotificationBadge === 'function') {
            setTimeout(updateNotificationBadge, 100);
        }
    }
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Show welcome page
        document.body.classList.add('welcome-active');
        document.getElementById('welcome').style.display = 'block';
        document.getElementById('welcome').classList.add('active');

        // Hide login page
        document.getElementById('login').style.display = 'none';
        document.getElementById('login').classList.remove('active');

        // Hide main application
        document.querySelector('header').style.display = 'none';
        document.querySelector('main').style.display = 'none';
        if (document.querySelector('footer')) {
        document.querySelector('footer').style.display = 'none';
        }

        // Reset form
        document.getElementById('login-form').reset();

        // Reset current user
        currentUser = {
            type: "",
            name: "",
            username: "",
            email: ""
        };
        
        // Clear stored user type from localStorage
        localStorage.removeItem('currentUserType');
        localStorage.removeItem('currentUserName');

        // Reset login modules
        document.getElementById('student-login-module').classList.add('active');
        document.getElementById('warden-login-module').classList.remove('active');
        document.getElementById('user-type').value = 'student';
    }
}

// Initialize multi-step registration form
function initializeRegistrationForm() {
    // Set current date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('reg-date').value = today;

    // Calculate age when date of birth changes
    document.getElementById('dob').addEventListener('change', function() {
        const dob = new Date(this.value);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            age--;
        }

        document.getElementById('age').value = age;
    });

    // Handle image upload
    document.getElementById('imageUpload').addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const imagePreview = document.getElementById('imagePreview');
                imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            };
            reader.readAsDataURL(file);
        }
    });
}

// NEW: Update room allocation options based on gender
function updateRoomAllocationOptions() {
    const gender = document.getElementById('gender').value;
    const previewRoomType = document.getElementById('preview-room-type');
    const previewHostelBlock = document.getElementById('preview-hostel-block');

    if (gender === 'male') {
        previewRoomType.textContent = 'Boys Hostel Room';
        previewHostelBlock.textContent = 'A Block';
    } else {
        previewRoomType.textContent = 'Girls Hostel Room';
        previewHostelBlock.textContent = 'B Block';
    }
}

// Multi-step form navigation
function nextStep(step) {
    // Hide current step
    document.querySelector('.step-content.active').classList.remove('active');

    // Show next step
    document.getElementById(`step${step}`).classList.add('active');

    // Update step indicators
    document.getElementById(`step${step-1}-indicator`).classList.remove('active');
    document.getElementById(`step${step-1}-indicator`).classList.add('completed');
    document.getElementById(`step${step}-indicator`).classList.add('active');

    // Update connector
    if (step > 1) {
        document.getElementById(`connector${step-1}`).classList.add('active');
    }
}

function previousStep(step) {
    // Hide current step
    document.querySelector('.step-content.active').classList.remove('active');

    // Show previous step
    document.getElementById(`step${step}`).classList.add('active');

    // Update step indicators
    document.getElementById(`step${step+1}-indicator`).classList.remove('active');
    document.getElementById(`step${step+1}-indicator`).classList.remove('completed');
    document.getElementById(`step${step}-indicator`).classList.add('active');

    // Update connector
    if (step < 3) {
        document.getElementById(`connector${step}`).classList.remove('active');
    }
}

// NEW: Automatic room allocation function
function allocateRoomAutomatically(gender) {
    // Find available rooms for the specified gender
    const block = gender === 'male' ? 'a-block' : 'b-block';
    const availableRooms = hostelData.rooms.filter(room => 
        room.block === block && room.availableBeds > 0
    );

    if (availableRooms.length > 0) {
        // Sort by available beds (prefer rooms with more available beds)
        availableRooms.sort((a, b) => b.availableBeds - a.availableBeds);

        // Return the first available room
        return availableRooms[0];
    }

    return null;
}

// Register hosteler function
function registerHosteler() {
    // Get form data
    const hostelerId = document.getElementById('h-id').value;
    const name = document.getElementById('name').value;
    const gender = document.getElementById('gender').value;
    const dob = document.getElementById('dob').value;
    const age = document.getElementById('age').value;
    const mobile = document.getElementById('mobile').value;
    const email = document.getElementById('email').value;
    const address = document.getElementById('address').value;
    const city = document.getElementById('city').value;
    const pincode = document.getElementById('pincode').value;
    const occupation = document.getElementById('occupation').value;
    const fatherName = document.getElementById('father-name').value;
    const parentPhone = document.getElementById('parent-phone').value;
    const parentAddress = document.getElementById('parent-address').value;
    const emergencyName = document.getElementById('emergency-name').value;
    const emergencyPhone = document.getElementById('emergency-phone').value;
    const collegeName = document.getElementById('college-name').value;
    const course = document.getElementById('course').value;
    const department = document.getElementById('department').value;
    const year = document.getElementById('year').value;
    const rollNo = document.getElementById('roll-no').value;
    const studentId = document.getElementById('student-id').value;

    // Get image preview
    const imagePreview = document.getElementById('imagePreview');
    let photo = "https://i.pravatar.cc/150?img=1"; // Default avatar
    if (imagePreview.querySelector('img')) {
        photo = imagePreview.querySelector('img').src;
    }

    // NEW: Automatically allocate room
    const allocatedRoom = allocateRoomAutomatically(gender);
    let room = "";
    let bed = "";
    let checkinDate = "";

    if (allocatedRoom) {
        room = allocatedRoom.roomNumber;
        bed = `B${allocatedRoom.totalBeds - allocatedRoom.availableBeds + 1}`;
        checkinDate = new Date().toISOString().split('T')[0];

        // Update room availability
        allocatedRoom.availableBeds--;
        allocatedRoom.students.push(hostelerId);
        allocatedRoom.isAvailable = allocatedRoom.availableBeds > 0;
    }

    // Create new hosteler object
    const newHosteler = {
        id: hostelerId,
        name: name,
        gender: gender,
        age: parseInt(age),
        mobile: mobile,
        email: email,
        occupation: occupation,
        registrationDate: new Date().toISOString().split('T')[0],
        room: room,
        bed: bed,
        checkinDate: checkinDate,
        college: collegeName,
        course: course,
        department: department,
        year: year,
        rollNo: rollNo,
        studentId: studentId,
        photo: photo,
        address: address,
        city: city,
        pincode: pincode,
        fatherName: fatherName,
        parentPhone: parentPhone,
        parentAddress: parentAddress,
        emergencyName: emergencyName,
        emergencyPhone: emergencyPhone
    };

    // Add to data storage
    hostelData.hostelers.push(newHosteler);
    persistHostelDataSafe();

    // Show success message with room allocation info
    if (allocatedRoom) {
        showAlert(`Hosteler ${name} registered successfully! Automatically allocated to Room ${room}, Bed ${bed}`, 'success');
    } else {
        showAlert(`Hosteler ${name} registered successfully! No rooms available for automatic allocation.`, 'warning');
    }

    // Reset form and go to home
    document.getElementById('registration-form').reset();
    document.getElementById('imagePreview').innerHTML = '<i class="fas fa-user"></i>';

    // Reset step indicators
    document.getElementById('step1-indicator').classList.add('active');
    document.getElementById('step1-indicator').classList.remove('completed');
    document.getElementById('step2-indicator').classList.remove('active', 'completed');
    document.getElementById('step3-indicator').classList.remove('active', 'completed');
    document.getElementById('connector1').classList.remove('active');
    document.getElementById('connector2').classList.remove('active');

    // Show first step
    document.querySelectorAll('.step-content').forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById('step1').classList.add('active');

    showPage('home');
}

// Load student cards
function loadStudentCards() {
    const studentCardsContainer = document.getElementById('student-cards-container');

    // Generate student cards
    studentCardsContainer.innerHTML = hostelData.hostelers.map(hosteler => `
        <div class="student-card" onclick="openStudentModal('${hosteler.id}')">
            <div class="student-card-header">
                <img src="${hosteler.photo}" alt="${hosteler.name}" class="student-card-image">
                <div class="student-card-info">
                    <h3>${hosteler.name}</h3>
                    <p>${hosteler.id}</p>
                </div>
            </div>
            <div class="student-card-details">
                <div class="student-card-detail">
                    <span class="student-card-label">Course</span>
                    <span class="student-card-value">${hosteler.course}</span>
                </div>
                <div class="student-card-detail">
                    <span class="student-card-label">Year</span>
                    <span class="student-card-value">${hosteler.year}</span>
                </div>
                <div class="student-card-detail">
                    <span class="student-card-label">Roll No</span>
                    <span class="student-card-value">${hosteler.rollNo}</span>
                </div>
                <div class="student-card-detail">
                    <span class="student-card-label">Mobile</span>
                    <span class="student-card-value">${hosteler.mobile}</span>
                </div>
                <div class="student-card-detail">
                    <span class="student-card-label">Email</span>
                    <span class="student-card-value">${hosteler.email}</span>
                </div>
            </div>
        </div>
    `).join('');

    // Add search functionality
    document.getElementById('student-search').addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const studentCards = document.querySelectorAll('.student-card');

        studentCards.forEach(card => {
            const name = card.querySelector('h3').textContent.toLowerCase();
            const id = card.querySelector('.student-card-info p').textContent.toLowerCase();

            if (name.includes(searchTerm) || id.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });
}

// Open student modal
function openStudentModal(studentId) {
    const student = hostelData.hostelers.find(h => h.id === studentId);
    if (student) {
        const modalBody = document.getElementById('student-modal-body');

        modalBody.innerHTML = `
            <div class="modal-student-profile">
                <div class="modal-student-image">
                    <img src="${student.photo}" alt="${student.name}">
                </div>
                <div class="modal-student-basic-info">
                    <h3>${student.name}</h3>
                    <p><strong>Hosteler ID:</strong> ${student.id}</p>
                    <p><strong>Student ID:</strong> ${student.studentId}</p>
                    <p><strong>Gender:</strong> ${student.gender === 'male' ? 'Male' : 'Female'}</p>
                    <p><strong>Age:</strong> ${student.age}</p>
                    <p><strong>Mobile:</strong> ${student.mobile}</p>
                    <p><strong>Email:</strong> ${student.email}</p>
                </div>
            </div>

            <div class="modal-tabs">
                <div class="modal-tab active" onclick="switchModalTab('personal-tab')">Personal Information</div>
                <div class="modal-tab" onclick="switchModalTab('academic-tab')">Academic Information</div>
                <div class="modal-tab" onclick="switchModalTab('parent-tab')">Parent/Guardian Information</div>
            </div>

            <div id="personal-tab" class="modal-tab-content active">
                <div class="modal-info-grid">
                    <div class="modal-info-item">
                        <div class="modal-info-label">Full Name</div>
                        <div class="modal-info-value">${student.name}</div>
                    </div>
                    <div class="modal-info-item">
                        <div class="modal-info-label">Hosteler ID</div>
                        <div class="modal-info-value">${student.id}</div>
                    </div>
                    <div class="modal-info-item">
                        <div class="modal-info-label">Gender</div>
                        <div class="modal-info-value">${student.gender === 'male' ? 'Male' : 'Female'}</div>
                    </div>
                    <div class="modal-info-item">
                        <div class="modal-info-label">Date of Birth</div>
                        <div class="modal-info-value">${student.dob || 'Not provided'}</div>
                    </div>
                    <div class="modal-info-item">
                        <div class="modal-info-label">Age</div>
                        <div class="modal-info-value">${student.age}</div>
                    </div>
                    <div class="modal-info-item">
                        <div class="modal-info-label">Mobile</div>
                        <div class="modal-info-value">${student.mobile}</div>
                    </div>
                    <div class="modal-info-item">
                        <div class="modal-info-label">Email</div>
                        <div class="modal-info-value">${student.email}</div>
                    </div>
                    <div class="modal-info-item">
                        <div class="modal-info-label">Address</div>
                        <div class="modal-info-value">${student.address}</div>
                    </div>
                    <div class="modal-info-item">
                        <div class="modal-info-label">City</div>
                        <div class="modal-info-value">${student.city}</div>
                    </div>
                    <div class="modal-info-item">
                        <div class="modal-info-label">Pincode</div>
                        <div class="modal-info-value">${student.pincode}</div>
                    </div>
                    <div class="modal-info-item">
                        <div class="modal-info-label">Occupation</div>
                        <div class="modal-info-value">${student.occupation === 'student' ? 'Student' : 'Worker'}</div>
                    </div>
                    <div class="modal-info-item">
                        <div class="modal-info-label">Registration Date</div>
                        <div class="modal-info-value">${student.registrationDate}</div>
                    </div>
                </div>
            </div>

            <div id="academic-tab" class="modal-tab-content">
                <div class="modal-info-grid">
                    <div class="modal-info-item">
                        <div class="modal-info-label">College Name</div>
                        <div class="modal-info-value">${student.college}</div>
                    </div>
                    <div class="modal-info-item">
                        <div class="modal-info-label">Course</div>
                        <div class="modal-info-value">${student.course}</div>
                    </div>
                    <div class="modal-info-item">
                        <div class="modal-info-label">Department</div>
                        <div class="modal-info-value">${student.department}</div>
                    </div>
                    <div class="modal-info-item">
                        <div class="modal-info-label">Year</div>
                        <div class="modal-info-value">${student.year}</div>
                    </div>
                    <div class="modal-info-item">
                        <div class="modal-info-label">Roll No</div>
                        <div class="modal-info-value">${student.rollNo}</div>
                    </div>
                    <div class="modal-info-item">
                        <div class="modal-info-label">Student ID</div>
                        <div class="modal-info-value">${student.studentId}</div>
                    </div>
                </div>
            </div>

            <div id="parent-tab" class="modal-tab-content">
                <div class="modal-info-grid">
                    <div class="modal-info-item">
                        <div class="modal-info-label">Father's Name</div>
                        <div class="modal-info-value">${student.fatherName}</div>
                    </div>
                    <div class="modal-info-item">
                        <div class="modal-info-label">Parent's Phone</div>
                        <div class="modal-info-value">${student.parentPhone}</div>
                    </div>
                    <div class="modal-info-item">
                        <div class="modal-info-label">Parent's Address</div>
                        <div class="modal-info-value">${student.parentAddress}</div>
                    </div>
                    <div class="modal-info-item">
                        <div class="modal-info-label">Emergency Contact</div>
                        <div class="modal-info-value">${student.emergencyName}</div>
                    </div>
                    <div class="modal-info-item">
                        <div class="modal-info-label">Emergency Phone</div>
                        <div class="modal-info-value">${student.emergencyPhone}</div>
                    </div>
                </div>
            </div>
        `;

        // Show modal
        document.getElementById('student-modal').style.display = 'flex';
    }
}

// Close student modal
function closeStudentModal() {
    document.getElementById('student-modal').style.display = 'none';
}

// Switch modal tabs
function switchModalTab(tabId) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.modal-tab-content');
    tabContents.forEach(tab => {
        tab.classList.remove('active');
    });

    // Show selected tab content
    document.getElementById(tabId).classList.add('active');

    // Update active tab
    const tabs = document.querySelectorAll('.modal-tab');
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
}

// Show report function
function showReport(reportType) {
    const reportContent = document.getElementById('report-content');

    // Sample report content based on report type
    let content = '';

    switch(reportType) {
        case 'hosteler-reg':
            content = `
                <h2>Hosteler Registration Report</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Hosteler ID</th>
                            <th>Name</th>
                            <th>Gender</th>
                            <th>Age</th>
                            <th>Mobile</th>
                            <th>Email</th>
                            <th>Registration Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${hostelData.hostelers.map(hosteler => `
                            <tr>
                                <td>${hosteler.id}</td>
                                <td>${hosteler.name}</td>
                                <td>${hosteler.gender === 'male' ? 'Male' : 'Female'}</td>
                                <td>${hosteler.age}</td>
                                <td>${hosteler.mobile}</td>
                                <td>${hosteler.email}</td>
                                <td>${hosteler.registrationDate}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            break;
        case 'living-hosteler':
            const livingHostelers = hostelData.hostelers.filter(h => h.room);
            content = `
                <h2>Living Hosteler List</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Hosteler ID</th>
                            <th>Name</th>
                            <th>Gender</th>
                            <th>Room No</th>
                            <th>Bed No</th>
                            <th>Checkin Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${livingHostelers.map(hosteler => `
                            <tr>
                                <td>${hosteler.id}</td>
                                <td>${hosteler.name}</td>
                                <td>${hosteler.gender === 'male' ? 'Male' : 'Female'}</td>
                                <td>${hosteler.room}</td>
                                <td>${hosteler.bed}</td>
                                <td>${hosteler.checkinDate}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            break;
        case 'room-occupancy':
            content = `
                <h2>Room Occupancy Report</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Room No</th>
                            <th>Block</th>
                            <th>Floor</th>
                            <th>Room Type</th>
                            <th>Total Beds</th>
                            <th>Occupied Beds</th>
                            <th>Available Beds</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${hostelData.rooms.map(room => `
                            <tr>
                                <td>${room.roomNumber}</td>
                                <td>${room.block === 'a-block' ? 'A Block (Boys)' : 'B Block (Girls)'}</td>
                                <td>${room.floor === 'ground' ? 'Ground Floor' : room.floor === 'first' ? '1st Floor' : '2nd Floor'}</td>
                                <td>${room.roomType === 'ac' ? 'A/C' : 'Non A/C'}</td>
                                <td>${room.totalBeds}</td>
                                <td>${room.totalBeds - room.availableBeds}</td>
                                <td>${room.availableBeds}</td>
                                <td>
                                    <span class="status-badge ${room.isAvailable ? 'status-available' : 'status-occupied'}">
                                        ${room.isAvailable ? 'Available' : 'Occupied'}
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            break;
        case 'outpass-report':
            content = `
                <h2>Outpass Report</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Outpass ID</th>
                            <th>Student Name</th>
                            <th>Out Date</th>
                            <th>Return Date</th>
                            <th>Reason</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${hostelData.outpasses.map(outpass => `
                            <tr>
                                <td>${outpass.id}</td>
                                <td>${outpass.studentName}</td>
                                <td>${outpass.outDate}</td>
                                <td>${outpass.returnDate}</td>
                                <td>${outpass.reason}</td>
                                <td>
                                    <span class="status-badge ${outpass.status === 'approved' ? 'status-available' : outpass.status === 'pending' ? 'status-pending' : 'status-occupied'}">
                                        ${outpass.status}
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            break;
        case 'room-bookings':
            content = `
                <h2>Room Bookings Report</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Booking ID</th>
                            <th>Student Name</th>
                            <th>Student ID</th>
                            <th>Gender</th>
                            <th>Room Type</th>
                            <th>Room Price</th>
                            <th>Booking Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${hostelData.bookings.map(booking => `
                            <tr>
                                <td>${booking.id}</td>
                                <td>${booking.studentName}</td>
                                <td>${booking.studentId}</td>
                                <td>${booking.studentGender === 'male' ? 'Male' : 'Female'}</td>
                                <td>${booking.roomType}</td>
                                <td>$${booking.roomPrice}</td>
                                <td>${booking.bookingDate}</td>
                                <td>
                                    <span class="status-badge status-available">
                                        ${booking.status}
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            break;
        case 'payment-report':
            content = `
                <h2>Payment Report</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Payment ID</th>
                            <th>Student Name</th>
                            <th>Student ID</th>
                            <th>Amount</th>
                            <th>Payment Date</th>
                            <th>Payment Method</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${hostelData.payments.map(payment => `
                            <tr>
                                <td>${payment.id}</td>
                                <td>${payment.studentName}</td>
                                <td>${payment.studentId}</td>
                                <td>₹${payment.amount}</td>
                                <td>${payment.paymentDate}</td>
                                <td>${payment.paymentMethod}</td>
                                <td>
                                    <span class="status-badge status-available">
                                        ${payment.status}
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            break;
        default:
            content = '<p>Select a report from the options above to view details.</p>';
    }

    reportContent.innerHTML = content;
}

// Show room form
function showRoomForm() {
    document.getElementById('room-form').style.display = 'block';
}

// Hide room form
function hideRoomForm() {
    document.getElementById('room-form').style.display = 'none';
    document.getElementById('new-room-form').reset();
}

// Add new room
function addNewRoom() {
    const roomNumber = document.getElementById('new-room-no').value;
    const block = document.getElementById('new-block').value;
    const floor = document.getElementById('new-floor').value;
    const roomType = document.getElementById('new-room-type').value;
    const bedType = document.getElementById('new-bed-type').value;
    const totalBeds = parseInt(document.getElementById('new-total-beds').value);
    const availableBeds = parseInt(document.getElementById('new-available-beds').value);
    const roomRate = parseFloat(document.getElementById('new-room-rate').value);

    // Create new room object
    const newRoom = {
        id: hostelData.rooms.length + 1,
        roomNumber: roomNumber,
        block: block,
        floor: floor,
        roomType: roomType,
        bedType: bedType,
        totalBeds: totalBeds,
        availableBeds: availableBeds,
        roomRate: roomRate,
        isAvailable: availableBeds > 0,
        image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1758&q=80",
        students: []
    };

    // Add to data storage
    hostelData.rooms.push(newRoom);
    persistHostelDataSafe();

    // Show success message
    showAlert(`Room ${roomNumber} added successfully!`, 'success');

    // Reset form and hide
    hideRoomForm();

    // Reload rooms data
    loadRoomsData();
}

// Delete room
function deleteRoom(roomId) {
    if (confirm('Are you sure you want to delete this room?')) {
        // Remove from data storage
        hostelData.rooms = hostelData.rooms.filter(room => room.id !== roomId);
        persistHostelDataSafe();

        // Show success message
        showAlert('Room deleted successfully!', 'success');

        // Reload rooms data
        loadRoomsData();
    }
}

// Load dashboard data
function loadDashboardData() {
    // Update stats
    document.getElementById('total-students').textContent = hostelData.hostelers.length;
    document.getElementById('available-rooms').textContent = hostelData.rooms.filter(r => r.isAvailable).length;
    document.getElementById('occupied-rooms').textContent = hostelData.rooms.filter(r => !r.isAvailable).length;
    document.getElementById('pending-outpass').textContent = hostelData.outpasses.filter(o => o.status === 'pending').length;

    // Load recent hostelers
    const recentHostelersList = document.getElementById('recent-hostelers');
    recentHostelersList.innerHTML = hostelData.hostelers
        .slice(-5)
        .map(hosteler => `
            <li class="activity-item">
                <div class="activity-info">
                    <div class="activity-name">${hosteler.name}</div>
                    <div class="activity-meta">${hosteler.id} • ${hosteler.registrationDate}</div>
                </div>
            </li>
        `).join('');

    // Load recent outpass requests
    const recentOutpassList = document.getElementById('recent-outpass');
    recentOutpassList.innerHTML = hostelData.outpasses
        .slice(-5)
        .map(outpass => `
            <li class="activity-item">
                <div class="activity-info">
                    <div class="activity-name">${outpass.studentName}</div>
                    <div class="activity-meta">${outpass.outDate} to ${outpass.returnDate}</div>
                </div>
                <span class="status-badge ${outpass.status === 'approved' ? 'status-available' : outpass.status === 'pending' ? 'status-pending' : 'status-occupied'}">
                    ${outpass.status}
                </span>
            </li>
        `).join('');
}

// Load warden dashboard
function loadWardenDashboard() {
    // Update stats
    document.getElementById('warden-total-students').textContent = hostelData.hostelers.length;
    document.getElementById('warden-available-rooms').textContent = hostelData.rooms.filter(r => r.isAvailable).length;
    document.getElementById('warden-occupied-rooms').textContent = hostelData.rooms.filter(r => !r.isAvailable).length;
    document.getElementById('warden-pending-outpass').textContent = hostelData.outpasses.filter(o => o.status === 'pending').length;
    document.getElementById('warden-pending-bookings').textContent = hostelData.bookings.filter(b => b.status === 'pending').length;

    // Calculate total revenue
    const totalRevenue = hostelData.payments.reduce((total, payment) => total + payment.amount, 0);
    document.getElementById('warden-total-revenue').textContent = `₹${totalRevenue.toLocaleString()}`;

    // Load pending outpass requests
    const pendingOutpassList = document.getElementById('warden-pending-outpass');
    const pendingOutpasses = hostelData.outpasses.filter(o => o.status === 'pending');
    pendingOutpassList.innerHTML = pendingOutpasses
        .slice(-5)
        .map(outpass => `
            <li class="activity-item">
                <div class="activity-info">
                    <div class="activity-name">${outpass.studentName}</div>
                    <div class="activity-meta">${outpass.outDate} to ${outpass.returnDate}</div>
                </div>
                <div style="display: flex; gap: 5px;">
                    <button class="btn btn-success btn-small" onclick="approveOutpass('${outpass.id}')" title="Accept">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-danger btn-small" onclick="rejectOutpass('${outpass.id}')" title="Reject">
                        <i class="fas fa-times"></i>
                    </button>
                    <button class="btn btn-secondary btn-small" onclick="openReplyModal('${outpass.id}')" title="Reply">
                        <i class="fas fa-reply"></i>
                    </button>
                </div>
            </li>
        `).join('');

    // Load recent bookings
    const recentBookingsList = document.getElementById('warden-recent-bookings');
    recentBookingsList.innerHTML = hostelData.bookings
        .slice(-5)
        .map(booking => `
            <li class="activity-item">
                <div class="activity-info">
                    <div class="activity-name">${booking.studentName}</div>
                    <div class="activity-meta">${booking.roomType} • $${booking.roomPrice}</div>
                </div>
                <span class="status-badge status-available">
                    ${booking.status}
                </span>
            </li>
        `).join('');
}

// Load rooms data
function loadRoomsData() {
    const roomCardsContainer = document.getElementById('room-cards-container');
    const roomsTableBody = document.getElementById('rooms-table-body');

    // Generate room cards
    roomCardsContainer.innerHTML = hostelData.rooms.map(room => `
        <div class="room-card">
            <img src="${room.image}" alt="Room ${room.roomNumber}" class="room-image">
            <h3>Room ${room.roomNumber} 
                <span class="status-badge ${room.isAvailable ? 'status-available' : 'status-occupied'}">
                    ${room.isAvailable ? 'Available' : 'Occupied'}
                </span>
            </h3>
            <p>${room.block === 'a-block' ? 'A Block (Boys)' : 'B Block (Girls)'} • ${room.floor === 'ground' ? 'Ground Floor' : room.floor === 'first' ? '1st Floor' : '2nd Floor'} • ${room.roomType === 'ac' ? 'A/C Room' : 'Non A/C'}</p>
            <div class="room-details">
                <div class="room-detail">
                    <i class="fas fa-bed"></i> ${room.totalBeds} Beds
                </div>
                <div class="room-detail">
                    <i class="fas fa-rupee-sign"></i> ${room.roomRate}/month
                </div>
            </div>
            <div class="form-actions" style="margin-top: 15px;">
                <button class="btn btn-small" onclick="editRoom(${room.id})">Edit</button>
                <button class="btn btn-small btn-danger" onclick="deleteRoom(${room.id})">Delete</button>
            </div>
        </div>
    `).join('');

    // Generate rooms table
    roomsTableBody.innerHTML = hostelData.rooms.map(room => `
        <tr>
            <td>${room.roomNumber}</td>
            <td>${room.block === 'a-block' ? 'A Block (Boys)' : 'B Block (Girls)'}</td>
            <td>${room.floor === 'ground' ? 'Ground Floor' : room.floor === 'first' ? '1st Floor' : '2nd Floor'}</td>
            <td>${room.roomType === 'ac' ? 'A/C' : 'Non A/C'}</td>
            <td>${room.totalBeds}</td>
            <td>${room.availableBeds}</td>
            <td>₹${room.roomRate}</td>
            <td>
                <span class="status-badge ${room.isAvailable ? 'status-available' : 'status-occupied'}">
                    ${room.isAvailable ? 'Available' : 'Occupied'}
                </span>
            </td>
            <td class="table-actions">
                <button class="btn btn-small" onclick="editRoom(${room.id})"><i class="fas fa-edit"></i></button>
                <button class="btn btn-small btn-danger" onclick="deleteRoom(${room.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Edit room
function editRoom(roomId) {
    const room = hostelData.rooms.find(r => r.id === roomId);
    if (room) {
        document.getElementById('new-room-no').value = room.roomNumber;
        document.getElementById('new-block').value = room.block;
        document.getElementById('new-floor').value = room.floor;
        document.getElementById('new-room-type').value = room.roomType;
        document.getElementById('new-bed-type').value = room.bedType;
        document.getElementById('new-total-beds').value = room.totalBeds;
        document.getElementById('new-available-beds').value = room.availableBeds;
        document.getElementById('new-room-rate').value = room.roomRate;

        showRoomForm();

        // Change button text
        const saveButton = document.querySelector('#room-form .btn-success');
        saveButton.innerHTML = '<i class="fas fa-save"></i> Update Room';
        saveButton.onclick = function() { updateRoom(roomId); };
    }
}

// Update room
function updateRoom(roomId) {
    const roomIndex = hostelData.rooms.findIndex(r => r.id === roomId);
    if (roomIndex !== -1) {
        const roomNumber = document.getElementById('new-room-no').value;
        const block = document.getElementById('new-block').value;
        const floor = document.getElementById('new-floor').value;
        const roomType = document.getElementById('new-room-type').value;
        const bedType = document.getElementById('new-bed-type').value;
        const totalBeds = parseInt(document.getElementById('new-total-beds').value);
        const availableBeds = parseInt(document.getElementById('new-available-beds').value);
        const roomRate = parseFloat(document.getElementById('new-room-rate').value);

        // Update room object
        hostelData.rooms[roomIndex] = {
            ...hostelData.rooms[roomIndex],
            roomNumber: roomNumber,
            block: block,
            floor: floor,
            roomType: roomType,
            bedType: bedType,
            totalBeds: totalBeds,
            availableBeds: availableBeds,
            roomRate: roomRate,
            isAvailable: availableBeds > 0
        };
        persistHostelDataSafe();

        // Show success message
        showAlert(`Room ${roomNumber} updated successfully!`, 'success');

        // Reset form and hide
        hideRoomForm();

        // Reload rooms data
        loadRoomsData();

        // Reset button text
        const saveButton = document.querySelector('#room-form .btn-success');
        saveButton.innerHTML = '<i class="fas fa-save"></i> Save Room';
        saveButton.onclick = function() { addNewRoom(); };
    }
}

// Load hosteler data
function loadHostelerData() {
    const hostelerTableBody = document.getElementById('hosteler-table-body');

    // Generate hosteler table
    hostelerTableBody.innerHTML = hostelData.hostelers.map(hosteler => `
        <tr>
            <td>${hosteler.id}</td>
            <td>${hosteler.name}</td>
            <td>${hosteler.gender === 'male' ? 'Male' : 'Female'}</td>
            <td>${hosteler.age}</td>
            <td>${hosteler.mobile}</td>
            <td>${hosteler.email}</td>
            <td>${hosteler.occupation === 'student' ? 'Student' : 'Worker'}</td>
            <td>${hosteler.registrationDate}</td>
            <td class="table-actions">
                <button class="btn btn-small" onclick="viewHosteler('${hosteler.id}')"><i class="fas fa-eye"></i></button>
                <button class="btn btn-small"><i class="fas fa-edit"></i></button>
            </td>
        </tr>
    `).join('');
}

// View hosteler details
function viewHosteler(hostelerId) {
    const hosteler = hostelData.hostelers.find(h => h.id === hostelerId);
    if (hosteler) {
        // Create a modal or page to show detailed hosteler information
        const content = `
            <div class="student-profile">
                <div class="profile-image">
                    <img src="${hosteler.photo}" alt="${hosteler.name}">
                </div>
                <div class="profile-details">
                    <div class="profile-section">
                        <h3>Personal Information</h3>
                        <div class="profile-row">
                            <div class="profile-label">Name:</div>
                            <div class="profile-value">${hosteler.name}</div>
                        </div>
                        <div class="profile-row">
                            <div class="profile-label">Hosteler ID:</div>
                            <div class="profile-value">${hosteler.id}</div>
                        </div>
                        <div class="profile-row">
                            <div class="profile-label">Gender:</div>
                            <div class="profile-value">${hosteler.gender === 'male' ? 'Male' : 'Female'}</div>
                        </div>
                        <div class="profile-row">
                            <div class="profile-label">Age:</div>
                            <div class="profile-value">${hosteler.age}</div>
                        </div>
                        <div class="profile-row">
                            <div class="profile-label">Mobile:</div>
                            <div class="profile-value">${hosteler.mobile}</div>
                        </div>
                        <div class="profile-row">
                            <div class="profile-label">Email:</div>
                            <div class="profile-value">${hosteler.email}</div>
                        </div>
                    </div>

                    <div class="profile-section">
                        <h3>Room Information</h3>
                        <div class="profile-row">
                            <div class="profile-label">Room No:</div>
                            <div class="profile-value">${hosteler.room || 'Not allocated'}</div>
                        </div>
                        <div class="profile-row">
                            <div class="profile-label">Bed No:</div>
                            <div class="profile-value">${hosteler.bed || 'Not allocated'}</div>
                        </div>
                        <div class="profile-row">
                            <div class="profile-label">Check-in Date:</div>
                            <div class="profile-value">${hosteler.checkinDate || 'Not checked in'}</div>
                        </div>
                    </div>

                    <div class="profile-section">
                        <h3>Education Information</h3>
                        <div class="profile-row">
                            <div class="profile-label">College:</div>
                            <div class="profile-value">${hosteler.college || 'Not provided'}</div>
                        </div>
                        <div class="profile-row">
                            <div class="profile-label">Course:</div>
                            <div class="profile-value">${hosteler.course || 'Not provided'}</div>
                        </div>
                        <div class="profile-row">
                            <div class="profile-label">Year:</div>
                            <div class="profile-value">${hosteler.year || 'Not provided'}</div>
                        </div>
                        <div class="profile-row">
                            <div class="profile-label">Roll No:</div>
                            <div class="profile-value">${hosteler.rollNo || 'Not provided'}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="form-actions">
                <button class="btn btn-secondary" onclick="showPage('hosteler-info')">
                    <i class="fas fa-arrow-left"></i> Back to List
                </button>
            </div>
        `;

        // Create a temporary page to show the details
        const tempPage = document.createElement('div');
        tempPage.id = 'hosteler-details';
        tempPage.className = 'page active';
        tempPage.innerHTML = `
            <h1><i class="fas fa-user"></i> Hosteler Details</h1>
            ${content}
        `;

        // Hide current page and show details
        document.querySelector('.page.active').classList.remove('active');
        document.querySelector('main').appendChild(tempPage);
    }
}

// Load living hosteler data
function loadLivingHostelerData() {
    const livingHostelerTableBody = document.getElementById('living-hosteler-table-body');
    const livingHostelers = hostelData.hostelers.filter(h => h.room);

    // Generate living hosteler table
    livingHostelerTableBody.innerHTML = livingHostelers.map(hosteler => `
        <tr>
            <td>${hosteler.id}</td>
            <td>${hosteler.name}</td>
            <td>${hosteler.gender === 'male' ? 'Male' : 'Female'}</td>
            <td>${hosteler.room}</td>
            <td>${hosteler.bed}</td>
            <td>${hosteler.checkinDate}</td>
            <td class="table-actions">
                <button class="btn btn-small"><i class="fas fa-edit"></i></button>
                <button class="btn btn-small" onclick="viewHosteler('${hosteler.id}')"><i class="fas fa-eye"></i></button>
            </td>
        </tr>
    `).join('');
}

// Load outpass data
function loadOutpassData() {
    const outpassList = document.getElementById('outpass-list');

    // Generate outpass list
    outpassList.innerHTML = hostelData.outpasses.map(outpass => {
        const studentIdDisplay = outpass.studentId ? ` (${outpass.studentId})` : '';
        return `
        <div class="outpass-card">
            <div class="outpass-status">
                <h3>Outpass #${outpass.id}</h3>
                <span class="status-badge ${outpass.status === 'approved' ? 'status-available' : outpass.status === 'pending' ? 'status-pending' : 'status-occupied'}">
                    ${outpass.status}
                </span>
            </div>
            <p><strong>Student:</strong> ${outpass.studentName}${studentIdDisplay}</p>
            <p><strong>Out Date:</strong> ${outpass.outDate}</p>
            <p><strong>Return Date:</strong> ${outpass.returnDate}</p>
            <p><strong>Reason:</strong> ${outpass.reason}</p>
            <p><strong>Details:</strong> ${outpass.details}</p>
            <p><strong>Submitted:</strong> ${outpass.submittedDate}</p>

            ${currentUser.type === 'warden' && outpass.status === 'pending' ? `
                <div class="outpass-actions">
                    <button class="btn btn-success btn-small" onclick="approveOutpass('${outpass.id}')">
                        <i class="fas fa-check"></i> Accept
                    </button>
                    <button class="btn btn-danger btn-small" onclick="rejectOutpass('${outpass.id}')">
                        <i class="fas fa-times"></i> Reject
                    </button>
                    <button class="btn btn-secondary btn-small" onclick="openReplyModal('${outpass.id}')">
                        <i class="fas fa-reply"></i> Reply
                    </button>
                </div>
            ` : ''}

            ${currentUser.type === 'student' && outpass.warden_reply ? `
                <div class="outpass-reply" style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin-top: 15px; border-left: 4px solid #4caf50;">
                    <strong><i class="fas fa-comment-dots"></i> Warden Reply:</strong>
                    <p style="margin: 10px 0 0 0; color: #2e7d32;">${outpass.warden_reply}</p>
                </div>
            ` : ''}

            ${currentUser.type === 'student' && !outpass.warden_reply && outpass.status !== 'pending' ? `
                <div class="outpass-reply" style="background: #fff3e0; padding: 15px; border-radius: 8px; margin-top: 15px; border-left: 4px solid #ff9800;">
                    <p style="margin: 0; color: #e65100;"><i class="fas fa-info-circle"></i> No reply from warden.</p>
                </div>
            ` : ''}

            ${outpass.status === 'approved' ? `
                <div class="outpass-actions">
                    <button class="btn btn-download btn-small" onclick="generateOutpassReceipt('${outpass.id}')">
                        <i class="fas fa-download"></i> Download Receipt
                    </button>
                </div>
            ` : ''}
        </div>
    `;
    }).join('');
}

// NEW: Search outpass function
function searchOutpass() {
    const studentName = document.getElementById('search-student-name').value.toLowerCase();
    const date = document.getElementById('search-date').value;
    const hostel = document.getElementById('search-hostel').value;
    const room = document.getElementById('search-room').value;
    const reason = document.getElementById('search-reason').value;

    const filteredOutpasses = hostelData.outpasses.filter(outpass => {
        // Apply filters
        if (studentName && !outpass.studentName.toLowerCase().includes(studentName)) return false;
        if (date && outpass.outDate !== date) return false;
        if (hostel && outpass.studentId) {
            const student = hostelData.hostelers.find(h => h.id === outpass.studentId);
            if (student) {
            const studentHostel = student.gender === 'male' ? 'boys' : 'girls';
            if (studentHostel !== hostel) return false;
        }
        }
        if (room && outpass.studentId) {
            const student = hostelData.hostelers.find(h => h.id === outpass.studentId);
            if (student && student.room !== room) return false;
        }
        if (reason && outpass.reason !== reason) return false;

        return true;
    });

    const outpassList = document.getElementById('outpass-list');
    outpassList.innerHTML = filteredOutpasses.map(outpass => {
        const studentIdDisplay = outpass.studentId ? ` (${outpass.studentId})` : '';
        return `
        <div class="outpass-card">
            <div class="outpass-status">
                <h3>Outpass #${outpass.id}</h3>
                <span class="status-badge ${outpass.status === 'approved' ? 'status-available' : outpass.status === 'pending' ? 'status-pending' : 'status-occupied'}">
                    ${outpass.status}
                </span>
            </div>
            <p><strong>Student:</strong> ${outpass.studentName}${studentIdDisplay}</p>
            <p><strong>Out Date:</strong> ${outpass.outDate}</p>
            <p><strong>Return Date:</strong> ${outpass.returnDate}</p>
            <p><strong>Reason:</strong> ${outpass.reason}</p>
            <p><strong>Details:</strong> ${outpass.details}</p>
            <p><strong>Submitted:</strong> ${outpass.submittedDate}</p>

            ${currentUser.type === 'warden' && outpass.status === 'pending' ? `
                <div class="outpass-actions">
                    <button class="btn btn-success btn-small" onclick="approveOutpass('${outpass.id}')">
                        <i class="fas fa-check"></i> Accept
                    </button>
                    <button class="btn btn-danger btn-small" onclick="rejectOutpass('${outpass.id}')">
                        <i class="fas fa-times"></i> Reject
                    </button>
                    <button class="btn btn-secondary btn-small" onclick="openReplyModal('${outpass.id}')">
                        <i class="fas fa-reply"></i> Reply
                    </button>
                </div>
            ` : ''}

            ${currentUser.type === 'student' && outpass.warden_reply ? `
                <div class="outpass-reply" style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin-top: 15px; border-left: 4px solid #4caf50;">
                    <strong><i class="fas fa-comment-dots"></i> Warden Reply:</strong>
                    <p style="margin: 10px 0 0 0; color: #2e7d32;">${outpass.warden_reply}</p>
                </div>
            ` : ''}

            ${currentUser.type === 'student' && !outpass.warden_reply && outpass.status !== 'pending' ? `
                <div class="outpass-reply" style="background: #fff3e0; padding: 15px; border-radius: 8px; margin-top: 15px; border-left: 4px solid #ff9800;">
                    <p style="margin: 0; color: #e65100;"><i class="fas fa-info-circle"></i> No reply from warden.</p>
                </div>
            ` : ''}

            ${outpass.status === 'approved' ? `
                <div class="outpass-actions">
                    <button class="btn btn-download btn-small" onclick="generateOutpassReceipt('${outpass.id}')">
                        <i class="fas fa-download"></i> Download Receipt
                    </button>
                </div>
            ` : ''}
        </div>
    `;
    }).join('');
}

// NEW: Clear outpass search
function clearOutpassSearch() {
    document.getElementById('search-student-name').value = '';
    document.getElementById('search-date').value = '';
    document.getElementById('search-hostel').value = '';
    document.getElementById('search-room').value = '';
    document.getElementById('search-reason').value = '';
    loadOutpassData();
}

// Show outpass form
function showOutpassForm() {
    document.getElementById('outpass-form').style.display = 'block';
}

// Hide outpass form
function hideOutpassForm() {
    document.getElementById('outpass-form').style.display = 'none';
    document.getElementById('new-outpass-form').reset();
}

// Submit outpass request
function submitOutpass() {
    const studentName = document.getElementById('outpass-student-name').value.trim();
    const outDate = document.getElementById('outpass-date').value;
    const returnDate = document.getElementById('outpass-return-date').value;
    const reason = document.getElementById('outpass-reason').value;
    const details = document.getElementById('outpass-details').value;

    if (!studentName) {
        showAlert('Please enter your name', 'error');
        return;
    }

    if (!outDate || !returnDate || !reason || !details) {
        showAlert('Please fill in all required fields', 'error');
        return;
    }

    // Generate outpass ID
    const lastId = parseInt(hostelData.outpasses[hostelData.outpasses.length - 1]?.id.substring(2) || 0);
    const newId = `OP${(lastId + 1).toString().padStart(3, '0')}`;

    // Create new outpass object
    const newOutpass = {
        id: newId,
        studentId: '', // Optional - can be empty if student is not in system
        studentName: studentName,
        outDate: outDate,
        returnDate: returnDate,
        reason: reason,
        details: details,
        status: 'pending',
        submittedDate: new Date().toISOString().split('T')[0],
        warden_reply: null // Initialize warden_reply field
    };

    // Add to data storage
    hostelData.outpasses.push(newOutpass);
    persistHostelDataSafe();

    // Show success message
    showAlert('Outpass request submitted successfully!', 'success');

    // Reset form and hide
    hideOutpassForm();

    // Reload outpass data
    loadOutpassData();
}

// Approve outpass
function approveOutpass(outpassId) {
    const outpass = hostelData.outpasses.find(o => o.id === outpassId);
    if (outpass) {
        outpass.status = 'approved';
        outpass.approvedDate = new Date().toISOString().split('T')[0];
        outpass.approvedBy = "Dr. Rajesh Kumar";
        persistHostelDataSafe();
        showAlert('Outpass request approved!', 'success');
        loadOutpassData();

        // Reload warden dashboard if on that page
        if (document.getElementById('warden-dashboard').classList.contains('active')) {
            loadWardenDashboard();
        }
    }
}

// Reject outpass
function rejectOutpass(outpassId) {
    const outpass = hostelData.outpasses.find(o => o.id === outpassId);
    if (outpass) {
        outpass.status = 'rejected';
        persistHostelDataSafe();
        showAlert('Outpass request rejected!', 'success');
        loadOutpassData();

        // Reload warden dashboard if on that page
        if (document.getElementById('warden-dashboard').classList.contains('active')) {
            loadWardenDashboard();
        }
    }
}

// Open reply modal
function openReplyModal(outpassId) {
    const outpass = hostelData.outpasses.find(o => o.id === outpassId);
    if (!outpass) return;

    // Create or get modal
    let modal = document.getElementById('outpass-reply-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'outpass-reply-modal';
        modal.className = 'modal';
        modal.onclick = function(e) {
            if (e.target === modal) {
                closeReplyModal();
            }
        };
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3><i class="fas fa-reply"></i> Reply to Student</h3>
                    <button class="modal-close" onclick="closeReplyModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <p><strong>Student:</strong> <span id="reply-student-name"></span></p>
                    <p><strong>Outpass ID:</strong> <span id="reply-outpass-id"></span></p>
                    <div class="form-group" style="margin-top: 20px;">
                        <label for="warden-reply-text">Your Reply (Optional)</label>
                        <textarea id="warden-reply-text" rows="4" placeholder="Enter your reply message to the student..." style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-family: inherit;"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeReplyModal()">Cancel</button>
                    <button class="btn btn-success" onclick="saveWardenReply('${outpassId}')">
                        <i class="fas fa-save"></i> Save Reply
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Populate modal
    document.getElementById('reply-student-name').textContent = outpass.studentName;
    document.getElementById('reply-outpass-id').textContent = outpass.id;
    document.getElementById('warden-reply-text').value = outpass.warden_reply || '';

    // Show modal
    modal.style.display = 'flex';
}

// Close reply modal
function closeReplyModal() {
    const modal = document.getElementById('outpass-reply-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Save warden reply
function saveWardenReply(outpassId) {
    const replyText = document.getElementById('warden-reply-text').value.trim();
    const outpass = hostelData.outpasses.find(o => o.id === outpassId);

    if (!outpass) {
        showAlert('Outpass not found', 'error');
        return;
    }

    // Save reply (can be empty - that's fine)
    outpass.warden_reply = replyText || null;
    persistHostelDataSafe();

    // Close modal
    closeReplyModal();

    // Show success message
    if (replyText) {
        showAlert('Reply saved successfully!', 'success');
    } else {
        showAlert('Reply cleared', 'success');
    }

    // Reload outpass data
    loadOutpassData();

    // Reload warden dashboard if on that page
    if (document.getElementById('warden-dashboard').classList.contains('active')) {
        loadWardenDashboard();
    }
}

// Generate outpass receipt
function generateOutpassReceipt(outpassId) {
    const outpass = hostelData.outpasses.find(o => o.id === outpassId);
    if (outpass) {
        const student = hostelData.hostelers.find(h => h.id === outpass.studentId);

        const receiptBody = document.getElementById('outpass-receipt-body');
        receiptBody.innerHTML = `
            <div class="outpass-receipt">
                <div class="outpass-receipt-header">
                    <h2>University Hostels</h2>
                    <h3>Outpass Receipt</h3>
                    <p>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>

                <div class="outpass-receipt-details">
                    <div>
                        <h4>Student Details</h4>
                        <div class="outpass-receipt-item">
                            <span>Name:</span>
                            <span>${student.name}</span>
                        </div>
                        <div class="outpass-receipt-item">
                            <span>Student ID:</span>
                            <span>${student.studentId}</span>
                        </div>
                        <div class="outpass-receipt-item">
                            <span>Hosteler ID:</span>
                            <span>${student.id}</span>
                        </div>
                        <div class="outpass-receipt-item">
                            <span>Room No:</span>
                            <span>${student.room}</span>
                        </div>
                    </div>

                    <div>
                        <h4>Outpass Details</h4>
                        <div class="outpass-receipt-item">
                            <span>Outpass ID:</span>
                            <span>${outpass.id}</span>
                        </div>
                        <div class="outpass-receipt-item">
                            <span>Out Date:</span>
                            <span>${outpass.outDate}</span>
                        </div>
                        <div class="outpass-receipt-item">
                            <span>Return Date:</span>
                            <span>${outpass.returnDate}</span>
                        </div>
                        <div class="outpass-receipt-item">
                            <span>Reason:</span>
                            <span>${outpass.reason}</span>
                        </div>
                    </div>
                </div>

                <div class="outpass-receipt-approval">
                    <p>APPROVED</p>
                    <p>Approved by: ${outpass.approvedBy}</p>
                    <p>Approved on: ${outpass.approvedDate}</p>
                </div>

                <div class="action-buttons">
                    <button class="btn btn-download" onclick="downloadOutpassReceipt('${outpassId}')">
                        <i class="fas fa-download"></i> Download Receipt
                    </button>
                    <button class="btn btn-secondary" onclick="closeOutpassReceiptModal()">
                        Close
                    </button>
                </div>
            </div>
        `;

        // Show modal
        document.getElementById('outpass-receipt-modal').style.display = 'flex';
    }
}

// Close outpass receipt modal
function closeOutpassReceiptModal() {
    document.getElementById('outpass-receipt-modal').style.display = 'none';
}

// Download outpass receipt
function downloadOutpassReceipt(outpassId) {
    // Use OutpassSystem if available (from pages/outpass.js)
    if (window.OutpassSystem && typeof window.OutpassSystem.downloadReceipt === 'function') {
        try {
            window.OutpassSystem.downloadReceipt(outpassId);
            closeOutpassReceiptModal();
            return;
        } catch (error) {
            console.error('Error downloading receipt via OutpassSystem:', error);
            // Fall through to manual generation
        }
    }
    
    // Fallback: Generate and download receipt manually from hostelData
    const outpass = hostelData.outpasses.find(o => o.id === outpassId);
    if (!outpass) {
        alert('Outpass not found.');
        return;
    }
    
    if (outpass.status !== 'approved') {
        alert('Receipt is only available for approved outpasses.');
        return;
    }
    
    // Generate receipt HTML
    const student = hostelData.hostelers.find(h => h.id === outpass.studentId);
    const studentName = student ? student.name : 'Unknown Student';
    const studentId = student ? (student.studentId || student.id) : 'N/A';
    const roomNo = student ? (student.room || 'N/A') : 'N/A';
    
    const receiptHTML = `<!DOCTYPE html>
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
        <p><span class="label">Student ID:</span> ${escapeHtml(studentId)}</p>
        <p><span class="label">Hosteler ID:</span> ${outpass.studentId}</p>
        <p><span class="label">Room No:</span> ${escapeHtml(roomNo)}</p>
        <p><span class="label">Out Date:</span> ${escapeHtml(outpass.outDate || 'N/A')}</p>
        <p><span class="label">Return Date:</span> ${escapeHtml(outpass.returnDate || 'N/A')}</p>
        <p><span class="label">Reason:</span> ${escapeHtml(outpass.reason || 'N/A')}</p>
        <p><span class="label">Status:</span> <strong>${outpass.status.toUpperCase()}</strong></p>
        <p><span class="label">Approved By:</span> ${escapeHtml(outpass.approvedBy || 'N/A')}</p>
        <p><span class="label">Approved Date:</span> ${escapeHtml(outpass.approvedDate || 'N/A')}</p>
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
    
    // Create blob and download
    const blob = new Blob([receiptHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const fileName = `Outpass_${outpassId}_${studentName.replace(/\s+/g, '_')}.html`;
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the blob URL after a short delay
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    closeOutpassReceiptModal();
}

// Helper function to escape HTML
function escapeHtml(text) {
    if (!text) return 'N/A';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show alert message
function showAlert(message, type) {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());

    // Create new alert
    const alert = document.createElement('div');
    alert.className = `alert alert-${type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'success'}`;
    alert.innerHTML = `
        ${message}
        <button class="close-btn" onclick="this.parentElement.remove()">&times;</button>
    `;

    // Add alert to main container
    const main = document.querySelector('main');
    main.insertBefore(alert, main.firstChild);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alert.parentElement) {
            alert.remove();
        }
    }, 5000);
}

// Submit contact form
function submitContactForm() {
    const name = document.getElementById('contact-name').value;
    const email = document.getElementById('contact-email').value;
    const subject = document.getElementById('contact-subject').value;
    const message = document.getElementById('contact-message').value;

    if (!name || !email || !subject || !message) {
        showAlert('Please fill in all fields', 'error');
        return;
    }

    // In a real application, you would send this data to a server
    showAlert('Thank you for your message! We will get back to you soon.', 'success');

    // Reset form
    document.getElementById('contact-name').value = '';
    document.getElementById('contact-email').value = '';
    document.getElementById('contact-subject').value = '';
    document.getElementById('contact-message').value = '';
}

// Filter rooms by gender
function filterRoomsByGender() {
    const gender = document.getElementById('booking-gender').value;
    const roomOptions = document.getElementById('room-options');

    // Filter rooms based on gender
    const filteredRooms = hostelData.rooms.filter(room => {
        if (gender === 'male') {
            return room.block === 'a-block';
        } else {
            return room.block === 'b-block';
        }
    });

    // Generate room options
    roomOptions.innerHTML = filteredRooms.map(room => {
        let roomType, roomPrice, roomDescription, roomFeatures;

        if (room.bedType === 'single') {
            roomType = 'Single Bed';
            roomPrice = 1200;
            roomDescription = 'Enjoy your own private space with a comfortable single bed and study area.';
            roomFeatures = `
                <li><i class="fas fa-bed"></i> Single Bed</li>
                <li><i class="fas fa-door-closed"></i> Private Room</li>
                <li><i class="fas fa-wifi"></i> Free Wi-Fi</li>
                <li><i class="fas fa-shower"></i> Shared Bathroom</li>
            `;
        } else if (room.bedType === 'double') {
            roomType = 'Double Sharing';
            roomPrice = 800;
            roomDescription = 'Share with one roommate in a spacious room with two comfortable beds.';
            roomFeatures = `
                <li><i class="fas fa-bed"></i> Two Single Beds</li>
                <li><i class="fas fa-user-friends"></i> Shared with 1 person</li>
                <li><i class="fas fa-wifi"></i> Free Wi-Fi</li>
                <li><i class="fas fa-shower"></i> Shared Bathroom</li>
            `;
        } else {
            roomType = 'Quad Sharing';
            roomPrice = 500;
            roomDescription = 'Economical option sharing with three roommates in a spacious common room.';
            roomFeatures = `
                <li><i class="fas fa-bed"></i> Four Single Beds</li>
                <li><i class="fas fa-user-friends"></i> Shared with 3 people</li>
                <li><i class="fas fa-wifi"></i> Free Wi-Fi</li>
                <li><i class="fas fa-shower"></i> Shared Bathroom</li>
                <li><i class="fas fa-utensils"></i> Common Kitchen Access</li>
            `;
        }

        return `
            <div class="room-card-booking" data-type="${room.bedType}" data-price="${roomPrice}">
                <div class="room-image-booking" style="background-image: url('${room.image}');">
                    <span class="room-type-booking">${roomType}</span>
                    <span class="room-price-booking">$${roomPrice}/semester</span>
                </div>
                <div class="room-details-booking">
                    <div class="room-title-booking">${roomType} Room</div>
                    <p>${roomDescription}</p>
                    <ul class="room-features">
                        ${roomFeatures}
                    </ul>
                </div>
            </div>
        `;
    }).join('');

    // Reinitialize room selection
    initializeRoomSelection();
}

// Initialize the page with current date
document.addEventListener('DOMContentLoaded', function() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('reg-date').value = today;
    document.getElementById('checkin-date').value = today;
    document.getElementById('outpass-date').value = today;

    // Set return date to tomorrow by default
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('outpass-return-date').value = tomorrow.toISOString().split('T')[0];

    // Calculate age when date of birth changes
    document.getElementById('dob').addEventListener('change', function() {
        const dob = new Date(this.value);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            age--;
        }

        document.getElementById('age').value = age;
    });

    // Handle image upload
    document.getElementById('imageUpload').addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const imagePreview = document.getElementById('imagePreview');
                imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            };
            reader.readAsDataURL(file);
        }
    });

    // Handle payment method change
    document.getElementById('payment-method').addEventListener('change', function() {
        const method = this.value;
        document.getElementById('card-details').style.display = method === 'card' ? 'block' : 'none';
        document.getElementById('upi-details').style.display = method === 'upi' ? 'block' : 'none';
    });
});

// Initialize booking page
function initializeBookingPage() {
    // Initialize room selection based on default gender
    filterRoomsByGender();
}

// Initialize room selection
function initializeRoomSelection() {
    const roomCards = document.querySelectorAll('.room-card-booking');
    const selectRoomBtn = document.getElementById('selectRoomBtn');
    const summaryType = document.getElementById('summary-type');
    const summaryPrice = document.getElementById('summary-price');
    const summaryTotal = document.getElementById('summary-total');

    // Section elements
    const roomsSection = document.querySelector('.rooms-section');
    const studentSection = document.getElementById('studentSection');
    const paymentSection = document.getElementById('paymentSection');
    const confirmationSection = document.getElementById('confirmationSection');

    // Buttons
    const confirmBookingBtn = document.getElementById('confirmBookingBtn');
    const payNowBtn = document.getElementById('payNowBtn');
    const backToRoomsBtns = document.querySelectorAll('.back-to-rooms');
    const backToStudentBtn = document.querySelector('.back-to-student');
    const backToHomeBtn = document.getElementById('backToHomeBtn');
    const downloadConfirmationBtn = document.getElementById('downloadConfirmationBtn');

    // Confirmation elements
    const confirmationDate = document.getElementById('confirmation-date');
    const confirmationRef = document.getElementById('confirmation-ref');
    const confirmationType = document.getElementById('confirmation-type');
    const confirmationPrice = document.getElementById('confirmation-price');
    const confirmationTotal = document.getElementById('confirmation-total');
    const confirmationStudentName = document.getElementById('confirmation-student-name');
    const confirmationStudentId = document.getElementById('confirmation-student-id');
    const confirmationStudentGender = document.getElementById('confirmation-student-gender');
    const confirmationStudentCourse = document.getElementById('confirmation-student-course');
    const confirmationStudentYear = document.getElementById('confirmation-student-year');
    const confirmationPaymentMethod = document.getElementById('confirmation-payment-method');

    // Payment elements
    const paymentRoomPrice = document.getElementById('payment-room-price');
    const paymentTotal = document.getElementById('payment-total');

    let selectedRoom = null;

    // Room selection logic
    roomCards.forEach(card => {
        card.addEventListener('click', function() {
            roomCards.forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            selectedRoom = this;

            const roomType = this.getAttribute('data-type');
            const roomPrice = parseInt(this.getAttribute('data-price'));
            const total = roomPrice + 200 + 50; // Room price + security deposit + admin fee

            // Update booking summary
            summaryType.textContent = formatRoomType(roomType);
            summaryPrice.textContent = `$${roomPrice}`;
            summaryTotal.textContent = `$${total}`;

            // Update payment details
            paymentRoomPrice.textContent = `$${roomPrice}`;
            paymentTotal.textContent = `$${total}`;
        });
    });

    // Format room type for display
    function formatRoomType(type) {
        switch(type) {
            case 'single': return 'Single Bed Room';
            case 'double': return 'Double Sharing Room';
            case 'triple': return 'Quad Sharing Room';
            default: return 'Unknown';
        }
    }

    // Continue to student details
    selectRoomBtn.addEventListener('click', function() {
        if (!selectedRoom) {
            alert('Please select a room first.');
            return;
        }

        roomsSection.style.display = 'none';
        studentSection.style.display = 'block';
    });

    // Continue to payment
    confirmBookingBtn.addEventListener('click', function() {
        // Validate student details
        const studentName = document.getElementById('studentName').value;
        const studentId = document.getElementById('studentId').value;
        const studentGender = document.getElementById('studentGender').value;
        const studentCourse = document.getElementById('studentCourse').value;
        const studentYear = document.getElementById('studentYear').value;
        const studentPhone = document.getElementById('studentPhone').value;
        const studentEmail = document.getElementById('studentEmail').value;

        if (!studentName || !studentId || !studentCourse || !studentYear || !studentPhone || !studentEmail) {
            alert('Please fill in all student details.');
            return;
        }

        studentSection.style.display = 'none';
        paymentSection.style.display = 'block';
    });

    // Process payment
    payNowBtn.addEventListener('click', function() {
        // Validate payment details
        const paymentMethod = document.getElementById('payment-method').value;
        let isValid = true;

        if (paymentMethod === 'card') {
            const cardNumber = document.getElementById('card-number').value;
            const expiryDate = document.getElementById('expiry-date').value;
            const cardName = document.getElementById('card-name').value;
            const cvv = document.getElementById('cvv').value;

            if (!cardNumber || !expiryDate || !cardName || !cvv) {
                alert('Please fill in all card details.');
                isValid = false;
            }
        } else if (paymentMethod === 'upi') {
            const upiId = document.getElementById('upi-id').value;
            if (!upiId) {
                alert('Please enter your UPI ID.');
                isValid = false;
            }
        }

        if (!isValid) return;

        // Get room details
        const roomType = selectedRoom.getAttribute('data-type');
        const roomPrice = parseInt(selectedRoom.getAttribute('data-price'));
        const total = roomPrice + 200 + 50;

        // Get student details
        const studentName = document.getElementById('studentName').value;
        const studentId = document.getElementById('studentId').value;
        const studentGender = document.getElementById('studentGender').value;
        const studentCourse = document.getElementById('studentCourse').value;
        const studentYear = document.getElementById('studentYear').value;

        // NEW: Automatically allocate room during booking
        const allocatedRoom = allocateRoomAutomatically(studentGender);
        let roomNumber = "";
        let bedNumber = "";

        if (allocatedRoom) {
            roomNumber = allocatedRoom.roomNumber;
            bedNumber = `B${allocatedRoom.totalBeds - allocatedRoom.availableBeds + 1}`;

            // Update room availability
            allocatedRoom.availableBeds--;
            allocatedRoom.students.push(studentId);
            allocatedRoom.isAvailable = allocatedRoom.availableBeds > 0;

            // Update student with room allocation
            const studentIndex = hostelData.hostelers.findIndex(h => h.id === studentId);
            if (studentIndex !== -1) {
                hostelData.hostelers[studentIndex].room = roomNumber;
                hostelData.hostelers[studentIndex].bed = bedNumber;
                hostelData.hostelers[studentIndex].checkinDate = new Date().toISOString().split('T')[0];
            }
        }

        // Create new booking
        const newBooking = {
            id: 'B' + new Date().getTime(),
            studentId: studentId,
            studentName: studentName,
            studentGender: studentGender,
            roomType: roomType,
            roomPrice: roomPrice,
            bookingDate: new Date().toISOString().split('T')[0],
            status: 'confirmed',
            paymentMethod: paymentMethod,
            paymentStatus: 'paid'
        };

        // Add to data storage
        hostelData.bookings.push(newBooking);

        // Create payment record
        const newPayment = {
            id: 'P' + new Date().getTime(),
            studentId: studentId,
            studentName: studentName,
            amount: total,
            paymentDate: new Date().toISOString().split('T')[0],
            paymentMethod: paymentMethod,
            status: 'completed'
        };

        hostelData.payments.push(newPayment);
        persistHostelDataSafe();

        // Update confirmation
        confirmationDate.textContent = new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        confirmationRef.textContent = newBooking.id;
        confirmationType.textContent = formatRoomType(roomType);
        confirmationPrice.textContent = `$${roomPrice}`;
        confirmationTotal.textContent = `$${total}`;
        confirmationStudentName.textContent = studentName;
        confirmationStudentId.textContent = studentId;
        confirmationStudentGender.textContent = studentGender === 'male' ? 'Male' : 'Female';
        confirmationStudentCourse.textContent = studentCourse;
        confirmationStudentYear.textContent = document.getElementById('studentYear').options[document.getElementById('studentYear').selectedIndex].text;
        confirmationPaymentMethod.textContent = paymentMethod;

        // Show room allocation info if applicable
        if (allocatedRoom) {
            const allocationInfo = document.createElement('div');
            allocationInfo.className = 'confirmation-row';
            allocationInfo.innerHTML = `
                <span>Allocated Room:</span>
                <span>${roomNumber}, Bed ${bedNumber}</span>
            `;
            document.querySelector('.confirmation-details').appendChild(allocationInfo);
        }

        // Show confirmation
        paymentSection.style.display = 'none';
        confirmationSection.style.display = 'block';
    });

    // Back to room selection
    backToRoomsBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            studentSection.style.display = 'none';
            paymentSection.style.display = 'none';
            confirmationSection.style.display = 'none';
            roomsSection.style.display = 'block';
        });
    });

    // Back to student details
    backToStudentBtn.addEventListener('click', function() {
        paymentSection.style.display = 'none';
        studentSection.style.display = 'block';
    });

    // Back to home
    backToHomeBtn.addEventListener('click', function() {
        confirmationSection.style.display = 'none';
        roomsSection.style.display = 'block';

        // Reset form
        roomCards.forEach(c => c.classList.remove('selected'));
        summaryType.textContent = 'Not Selected';
        summaryPrice.textContent = '$0';
        summaryTotal.textContent = '$0';
        selectedRoom = null;

        // Reset student form
        document.getElementById('studentName').value = '';
        document.getElementById('studentId').value = '';
        document.getElementById('studentGender').value = 'male';
        document.getElementById('studentCourse').value = '';
        document.getElementById('studentYear').value = '';
        document.getElementById('studentPhone').value = '';
        document.getElementById('studentEmail').value = '';

        // Reset payment form
        document.getElementById('payment-method').value = 'cash';
        document.getElementById('card-details').style.display = 'none';
        document.getElementById('upi-details').style.display = 'none';
        document.getElementById('card-number').value = '';
        document.getElementById('expiry-date').value = '';
        document.getElementById('card-name').value = '';
        document.getElementById('cvv').value = '';
        document.getElementById('upi-id').value = '';
    });

    // Download confirmation
    downloadConfirmationBtn.addEventListener('click', function() {
        alert('Booking confirmation downloaded successfully!');
        // In a real application, you would generate and download a PDF confirmation
    });
}

// NEW FUNCTIONS FOR ENHANCEMENTS

// Load room allocation data
function loadRoomAllocationData() {
    const roomAllocationContainer = document.getElementById('room-allocation-container');

    // Generate room allocation cards
    roomAllocationContainer.innerHTML = hostelData.rooms.map(room => {
        const occupiedBeds = room.totalBeds - room.availableBeds;
        const occupancyPercentage = (occupiedBeds / room.totalBeds) * 100;

        // Get student details for this room
        const roomStudents = hostelData.hostelers.filter(hosteler => 
            room.students.includes(hosteler.id)
        );

        return `
            <div class="room-allocation-card">
                <div class="room-allocation-header">
                    <h3>Room ${room.roomNumber}</h3>
                    <span class="status-badge ${room.isAvailable ? 'status-available' : 'status-occupied'}">
                        ${room.isAvailable ? 'Available' : 'Occupied'}
                    </span>
                </div>
                <p>${room.block === 'a-block' ? 'Boys Hostel' : 'Girls Hostel'} • ${room.floor === 'ground' ? 'Ground Floor' : room.floor === 'first' ? '1st Floor' : '2nd Floor'} • ${room.roomType === 'ac' ? 'A/C' : 'Non A/C'}</p>

                <div class="room-occupancy">
                    <span>${occupiedBeds}/${room.totalBeds} Beds Occupied</span>
                    <div class="occupancy-bar">
                        <div class="occupancy-fill" style="width: ${occupancyPercentage}%"></div>
                    </div>
                </div>

                <div class="room-students">
                    <h4>Students in this room:</h4>
                    ${roomStudents.length > 0 ? `
                        <ul class="student-list">
                            ${roomStudents.map(student => `
                                <li class="student-list-item">
                                    <img src="${student.photo}" alt="${student.name}" class="student-avatar">
                                    <span>${student.name} (${student.id})</span>
                                </li>
                            `).join('')}
                        </ul>
                    ` : '<p>No students allocated yet</p>'}
                </div>

                ${room.isAvailable ? `
                    <div class="form-actions" style="margin-top: 15px;">
                        <button class="btn btn-small" onclick="allocateStudentToRoom(${room.id})">
                            <i class="fas fa-user-plus"></i> Allocate Student
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// NEW: Load boys room allocation data
function loadBoysRoomAllocationData() {
    const boysRoomAllocationContainer = document.getElementById('boys-room-allocation-container');
    const boysRooms = hostelData.rooms.filter(room => room.block === 'a-block');

    // Generate boys room allocation cards
    boysRoomAllocationContainer.innerHTML = boysRooms.map(room => {
        const occupiedBeds = room.totalBeds - room.availableBeds;
        const occupancyPercentage = (occupiedBeds / room.totalBeds) * 100;

        // Get student details for this room
        const roomStudents = hostelData.hostelers.filter(hosteler => 
            room.students.includes(hosteler.id)
        );

        return `
            <div class="room-allocation-card">
                <div class="room-allocation-header">
                    <h3>Room ${room.roomNumber}</h3>
                    <span class="status-badge ${room.isAvailable ? 'status-available' : 'status-occupied'}">
                        ${room.isAvailable ? 'Available' : 'Occupied'}
                    </span>
                </div>
                <p>Boys Hostel • ${room.floor === 'ground' ? 'Ground Floor' : room.floor === 'first' ? '1st Floor' : '2nd Floor'} • ${room.roomType === 'ac' ? 'A/C' : 'Non A/C'}</p>

                <div class="room-occupancy">
                    <span>${occupiedBeds}/${room.totalBeds} Beds Occupied</span>
                    <div class="occupancy-bar">
                        <div class="occupancy-fill" style="width: ${occupancyPercentage}%"></div>
                    </div>
                </div>

                <div class="room-students">
                    <h4>Students in this room:</h4>
                    ${roomStudents.length > 0 ? `
                        <ul class="student-list">
                            ${roomStudents.map(student => `
                                <li class="student-list-item">
                                    <img src="${student.photo}" alt="${student.name}" class="student-avatar">
                                    <span>${student.name} (${student.id})</span>
                                </li>
                            `).join('')}
                        </ul>
                    ` : '<p>No students allocated yet</p>'}
                </div>

                ${room.isAvailable ? `
                    <div class="form-actions" style="margin-top: 15px;">
                        <button class="btn btn-small" onclick="allocateStudentToRoom(${room.id})">
                            <i class="fas fa-user-plus"></i> Allocate Student
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// NEW: Load girls room allocation data
function loadGirlsRoomAllocationData() {
    const girlsRoomAllocationContainer = document.getElementById('girls-room-allocation-container');
    const girlsRooms = hostelData.rooms.filter(room => room.block === 'b-block');

    // Generate girls room allocation cards
    girlsRoomAllocationContainer.innerHTML = girlsRooms.map(room => {
        const occupiedBeds = room.totalBeds - room.availableBeds;
        const occupancyPercentage = (occupiedBeds / room.totalBeds) * 100;

        // Get student details for this room
        const roomStudents = hostelData.hostelers.filter(hosteler => 
            room.students.includes(hosteler.id)
        );

        return `
            <div class="room-allocation-card">
                <div class="room-allocation-header">
                    <h3>Room ${room.roomNumber}</h3>
                    <span class="status-badge ${room.isAvailable ? 'status-available' : 'status-occupied'}">
                        ${room.isAvailable ? 'Available' : 'Occupied'}
                    </span>
                </div>
                <p>Girls Hostel • ${room.floor === 'ground' ? 'Ground Floor' : room.floor === 'first' ? '1st Floor' : '2nd Floor'} • ${room.roomType === 'ac' ? 'A/C' : 'Non A/C'}</p>

                <div class="room-occupancy">
                    <span>${occupiedBeds}/${room.totalBeds} Beds Occupied</span>
                    <div class="occupancy-bar">
                        <div class="occupancy-fill" style="width: ${occupancyPercentage}%"></div>
                    </div>
                </div>

                <div class="room-students">
                    <h4>Students in this room:</h4>
                    ${roomStudents.length > 0 ? `
                        <ul class="student-list">
                            ${roomStudents.map(student => `
                                <li class="student-list-item">
                                    <img src="${student.photo}" alt="${student.name}" class="student-avatar">
                                    <span>${student.name} (${student.id})</span>
                                </li>
                            `).join('')}
                        </ul>
                    ` : '<p>No students allocated yet</p>'}
                </div>

                ${room.isAvailable ? `
                    <div class="form-actions" style="margin-top: 15px;">
                        <button class="btn btn-small" onclick="allocateStudentToRoom(${room.id})">
                            <i class="fas fa-user-plus"></i> Allocate Student
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// Filter rooms for allocation
function filterRoomsForAllocation() {
    const hostelType = document.getElementById('allocation-hostel').value;
    const roomAllocationContainer = document.getElementById('room-allocation-container');

    let filteredRooms = hostelData.rooms;

    if (hostelType === 'boys') {
        filteredRooms = hostelData.rooms.filter(room => room.block === 'a-block');
    } else if (hostelType === 'girls') {
        filteredRooms = hostelData.rooms.filter(room => room.block === 'b-block');
    }

    // Generate room allocation cards
    roomAllocationContainer.innerHTML = filteredRooms.map(room => {
        const occupiedBeds = room.totalBeds - room.availableBeds;
        const occupancyPercentage = (occupiedBeds / room.totalBeds) * 100;

        // Get student details for this room
        const roomStudents = hostelData.hostelers.filter(hosteler => 
            room.students.includes(hosteler.id)
        );

        return `
            <div class="room-allocation-card">
                <div class="room-allocation-header">
                    <h3>Room ${room.roomNumber}</h3>
                    <span class="status-badge ${room.isAvailable ? 'status-available' : 'status-occupied'}">
                        ${room.isAvailable ? 'Available' : 'Occupied'}
                    </span>
                </div>
                <p>${room.block === 'a-block' ? 'Boys Hostel' : 'Girls Hostel'} • ${room.floor === 'ground' ? 'Ground Floor' : room.floor === 'first' ? '1st Floor' : '2nd Floor'} • ${room.roomType === 'ac' ? 'A/C' : 'Non A/C'}</p>

                <div class="room-occupancy">
                    <span>${occupiedBeds}/${room.totalBeds} Beds Occupied</span>
                    <div class="occupancy-bar">
                        <div class="occupancy-fill" style="width: ${occupancyPercentage}%"></div>
                    </div>
                </div>

                <div class="room-students">
                    <h4>Students in this room:</h4>
                    ${roomStudents.length > 0 ? `
                        <ul class="student-list">
                            ${roomStudents.map(student => `
                                <li class="student-list-item">
                                    <img src="${student.photo}" alt="${student.name}" class="student-avatar">
                                    <span>${student.name} (${student.id})</span>
                                </li>
                            `).join('')}
                        </ul>
                    ` : '<p>No students allocated yet</p>'}
                </div>

                ${room.isAvailable ? `
                    <div class="form-actions" style="margin-top: 15px;">
                        <button class="btn btn-small" onclick="allocateStudentToRoom(${room.id})">
                            <i class="fas fa-user-plus"></i> Allocate Student
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// Allocate student to room
function allocateStudentToRoom(roomId) {
    const room = hostelData.rooms.find(r => r.id === roomId);
    if (room) {
        // Get unallocated students
        const unallocatedStudents = hostelData.hostelers.filter(hosteler => 
            !hosteler.room && hosteler.gender === (room.block === 'a-block' ? 'male' : 'female')
        );

        if (unallocatedStudents.length === 0) {
            alert('No unallocated students available for this hostel type.');
            return;
        }

        // Create a simple allocation form
        const studentOptions = unallocatedStudents.map(student => 
            `<option value="${student.id}">${student.name} (${student.id})</option>`
        ).join('');

        const allocationForm = `
            <div class="form-group">
                <label for="allocate-student">Select Student</label>
                <select id="allocate-student" class="form-control">
                    ${studentOptions}
                </select>
            </div>
            <div class="form-actions">
                <button class="btn btn-success" onclick="confirmAllocation(${roomId})">Allocate</button>
                <button class="btn btn-secondary" onclick="cancelAllocation()">Cancel</button>
            </div>
        `;

        // Show allocation form in a modal or alert
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h2>Allocate Student to Room ${room.roomNumber}</h2>
                    <button class="modal-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
                </div>
                <div class="modal-body">
                    ${allocationForm}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }
}

// Confirm allocation
function confirmAllocation(roomId) {
    const studentId = document.getElementById('allocate-student').value;
    const room = hostelData.rooms.find(r => r.id === roomId);
    const student = hostelData.hostelers.find(h => h.id === studentId);

    if (room && student) {
        // Update room
        room.students.push(studentId);
        room.availableBeds--;
        room.isAvailable = room.availableBeds > 0;

        // Update student
        student.room = room.roomNumber;
        student.bed = `B${room.totalBeds - room.availableBeds}`;
        student.checkinDate = new Date().toISOString().split('T')[0];
        persistHostelDataSafe();

        // Close modal
        document.querySelector('.modal-overlay').remove();

        // Show success message
        showAlert(`Student ${student.name} allocated to Room ${room.roomNumber} successfully!`, 'success');

        // Reload room allocation data
        loadRoomAllocationData();

        // Reload specific allocation pages if they're active
        if (document.getElementById('boys-room-allocation').classList.contains('active')) {
            loadBoysRoomAllocationData();
        }
        if (document.getElementById('girls-room-allocation').classList.contains('active')) {
            loadGirlsRoomAllocationData();
        }
    }
}

// Cancel allocation
function cancelAllocation() {
    document.querySelector('.modal-overlay').remove();
}

// Load feedback data
function loadFeedbackData() {
    const feedbackList = document.getElementById('feedback-list');

    // Generate feedback list
    feedbackList.innerHTML = hostelData.feedback.map(feedback => `
        <div class="feedback-item">
            <div class="feedback-header">
                <div class="feedback-student">${feedback.studentName}</div>
                <div class="feedback-date">${feedback.date}</div>
            </div>
            <div class="feedback-message">
                <strong>${feedback.type.charAt(0).toUpperCase() + feedback.type.slice(1)}:</strong> ${feedback.message}
            </div>
            ${feedback.reply ? `
                <div class="feedback-reply">
                    <strong>Reply:</strong> ${feedback.reply}
                </div>
            ` : ''}
            ${currentUser.type === 'warden' ? `
                <div class="feedback-actions">
                    ${!feedback.reply ? `
                        <button class="btn btn-small" onclick="replyToFeedback('${feedback.id}')">
                            <i class="fas fa-reply"></i> Reply
                        </button>
                    ` : ''}
                    <button class="btn btn-small btn-danger" onclick="deleteFeedback('${feedback.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Submit feedback
function submitFeedback() {
    const studentName = document.getElementById('feedback-student').value;
    const studentEmail = document.getElementById('feedback-email').value;
    const feedbackType = document.getElementById('feedback-type').value;
    const feedbackMessage = document.getElementById('feedback-message').value;

    if (!studentName || !studentEmail || !feedbackMessage) {
        showAlert('Please fill in all required fields', 'error');
        return;
    }

    // Generate feedback ID
    const lastId = parseInt(hostelData.feedback[hostelData.feedback.length - 1]?.id.substring(2) || 0);
    const newId = `FB${(lastId + 1).toString().padStart(3, '0')}`;

    // Create new feedback object
    const newFeedback = {
        id: newId,
        studentName: studentName,
        studentEmail: studentEmail,
        type: feedbackType,
        message: feedbackMessage,
        date: new Date().toISOString().split('T')[0],
        status: 'pending',
        reply: ''
    };

    // Add to data storage
    hostelData.feedback.push(newFeedback);
    persistHostelDataSafe();

    // Show success message
    showAlert('Feedback submitted successfully!', 'success');

    // Reset form
    document.getElementById('feedback-form').reset();

    // Reload feedback data
    loadFeedbackData();
}

// Reply to feedback
function replyToFeedback(feedbackId) {
    const feedback = hostelData.feedback.find(f => f.id === feedbackId);
    if (feedback) {
        const reply = prompt(`Enter your reply to ${feedback.studentName}:`);
        if (reply) {
            feedback.reply = reply;
            feedback.status = 'replied';
            persistHostelDataSafe();

            // Show success message
            showAlert('Reply sent successfully!', 'success');

            // Reload feedback data
            loadFeedbackData();
        }
    }
}

// Delete feedback
function deleteFeedback(feedbackId) {
    if (confirm('Are you sure you want to delete this feedback?')) {
        // Remove from data storage
        hostelData.feedback = hostelData.feedback.filter(f => f.id !== feedbackId);
        persistHostelDataSafe();

        // Show success message
        showAlert('Feedback deleted successfully!', 'success');

        // Reload feedback data
        loadFeedbackData();
    }
}

// Load complaint data
function loadComplaintData() {
    const complaintList = document.getElementById('complaint-list');
    if (!complaintList) return;

    // Use ComplaintSystem if available, otherwise use StorageUtils
    let complaints = [];
    if (window.ComplaintSystem && window.StorageUtils) {
        // Get all complaints for current student (if logged in)
        const studentId = currentUser?.id || 'S001'; // Fallback for demo
        complaints = window.ComplaintSystem.getAll(true); // Get all including closed
    } else if (window.StorageUtils) {
        complaints = window.StorageUtils.getArray('hostelComplaints');
    }

    if (complaints.length === 0) {
        complaintList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #999;">
                <i class="fas fa-inbox" style="font-size: 48px; opacity: 0.5; margin-bottom: 15px;"></i>
                <p>No complaints submitted yet.</p>
            </div>
        `;
        return;
    }

    // Sort by date (latest first)
    complaints.sort((a, b) => new Date(b.submittedAtISO) - new Date(a.submittedAtISO));

    complaintList.innerHTML = complaints.map(complaint => {
        const date = new Date(complaint.submittedAtISO);
        const dateStr = date.toLocaleDateString('en-IN', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const statusBadge = complaint.status === 'open' 
            ? '<span class="status-badge status-pending">Open</span>'
            : '<span class="status-badge status-available">Closed</span>';

        let repliesHtml = '';
        if (complaint.replies && complaint.replies.length > 0) {
            repliesHtml = complaint.replies.map(reply => `
                <div class="feedback-reply" style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin-top: 10px; border-left: 4px solid #4caf50;">
                    <strong><i class="fas fa-user-shield"></i> ${reply.by === 'warden' ? 'Warden' : 'System'} Reply:</strong>
                    <p style="margin: 10px 0 0 0; color: #2e7d32;">${reply.message}</p>
                    <small style="color: #666;">${new Date(reply.atISO).toLocaleString('en-IN')}</small>
                </div>
            `).join('');
        }

        return `
            <div class="feedback-item" style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div class="feedback-header">
                    <div>
                        <strong>Complaint ID: ${complaint.id}</strong>
                        ${statusBadge}
                    </div>
                    <div class="feedback-date">${dateStr}</div>
                </div>
                <div class="feedback-message" style="margin-top: 15px;">
                    ${complaint.message}
                </div>
                ${repliesHtml}
            </div>
        `;
    }).join('');
}

// Submit complaint
function submitComplaint() {
    const complaintMessage = document.getElementById('complaint-message').value.trim();

    if (!complaintMessage) {
        showAlert('Please enter your complaint message', 'error');
        return;
    }

    // Get current student ID (if logged in)
    const studentId = currentUser?.id || 'S001'; // Fallback for demo

    // Use ComplaintSystem if available
    if (window.ComplaintSystem) {
        const complaint = window.ComplaintSystem.submit(studentId, complaintMessage);
        if (complaint) {
            showAlert('Complaint submitted successfully! Your identity is anonymous.', 'success');
            document.getElementById('complaint-form').reset();
            loadComplaintData();
        } else {
            showAlert('Failed to submit complaint. Please try again.', 'error');
        }
    } else {
        // Fallback: use StorageUtils directly
        if (window.StorageUtils) {
            const complaints = window.StorageUtils.getArray('hostelComplaints');
            const newComplaint = {
                id: `C${String(complaints.length + 1).padStart(3, '0')}`,
                message: complaintMessage,
                submittedAtISO: new Date().toISOString(),
                studentIdHidden: `H${Date.now().toString().slice(-6)}`,
                replies: [],
                status: 'open'
            };
            window.StorageUtils.addToArray('hostelComplaints', newComplaint);
            showAlert('Complaint submitted successfully! Your identity is anonymous.', 'success');
            document.getElementById('complaint-form').reset();
            loadComplaintData();
        } else {
            showAlert('Complaint system not available. Please refresh the page.', 'error');
        }
    }
}
