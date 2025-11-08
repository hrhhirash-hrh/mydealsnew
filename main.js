document.addEventListener('DOMContentLoaded', () => {
    // --- STATE ---
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzvSjNOZ6P3Y5QZp0nAcaNXx4gfbfVrnye50iZaJ3iMS6apfS2DP3adnRqS5hij9dTa/exec"; // This is your last-used URL
    let adminToken = sessionStorage.getItem('adminToken');
    let currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    let currentDeals = [];
    let bookingTimerInterval = null;
    let uniqueBuyers = new Set();

    // --- NEW: State to track who is using the delivery modal ---
    let isUserMarkingDelivery = false; 

    // --- DOM SELECTORS ---
    const pages = {
        deals: document.getElementById('deals-page'),
        adminLogin: document.getElementById('admin-login'),
        adminPanel: document.getElementById('admin-panel'),
        userDashboard: document.getElementById('user-dashboard-page'),
    };
    const modals = {
        dealDetail: document.getElementById('deal-detail-modal'),
        bookingForm: document.getElementById('booking-form-modal'),
        message: document.getElementById('message-modal'),
        userLogin: document.getElementById('user-login-modal'),
        loginPrompt: document.getElementById('login-prompt-modal'),
        deliveryDate: document.getElementById('delivery-date-modal'), // --- NEW ---
        otp: document.getElementById('otp-modal')
    };
    const dealsGrid = document.getElementById('deals-grid');
    const dealsLoader = document.getElementById('deals-loader');
    const noDealsMessage = document.getElementById('no-deals-message');
    
    // Admin Login
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const logoutButton = document.getElementById('logout-button');

    // User Auth (Desktop)
    const userAuthLinks = document.getElementById('user-auth-links');
    const userLoginButton = document.getElementById('user-login-button');
    const userDashboardButton = document.getElementById('user-dashboard-button');
    const userLogoutButton = document.getElementById('user-logout-button');
    const adminLoginLink = document.getElementById('admin-login-link');
    const headerSeparator = document.getElementById('header-separator');
    const userLoginForm = document.getElementById('user-login-form');
    const userLoginSubmitBtn = document.getElementById('user-login-submit-btn');
    const userLoginError = document.getElementById('user-login-error');

    // Mobile Menu
// ✅ Mobile Menu (Fixed selectors to match HTML)
const menuTogglerButton = document.getElementById('menu-toggler-button');
const mobileMenu = document.getElementById('mobile-menu');
const mobileUserLoginButton = document.getElementById('mobileUserLoginButton');
const mobileUserDashboardLink = document.getElementById('mobileUserDashboardLink');
const mobileUserLogoutButton = document.getElementById('mobileUserLogoutButton');
const mobileAdminLoginLink = document.getElementById('mobileAdminLoginLink');
const mobileLogoutButton = document.getElementById('mobileLogoutButton');



    // --- ADD THESE NEW SELECTORS ---
    const adminAuthLinks = document.getElementById('admin-auth-links');
    const adminBackButton = document.getElementById('admin-back-button');
    const userBackButton = document.getElementById('user-back-button');
    // --- END ADD ---

    // User Dashboard
    const userWelcomeMessage = document.getElementById('user-welcome-message');
    const userOrdersLoader = document.getElementById('user-orders-loader');
    const userOrdersContainer = document.getElementById('user-orders-container');

    // Login Prompt Modal
    const loginPromptCloseBtn = document.getElementById('login-prompt-close-btn');
    const loginPromptLoginBtn = document.getElementById('login-prompt-login-btn');

    // Admin Panel Tabs
    const adminTabs = {
        addDeal: document.getElementById('tab-add-deal'),
        viewOrders: document.getElementById('tab-view-orders'),
        viewDeals: document.getElementById('tab-view-deals'),
        manageUsers: document.getElementById('tab-manage-users'),
    };
    const adminContents = {
        addDeal: document.getElementById('content-add-deal'),
        viewOrders: document.getElementById('content-view-orders'),
        viewDeals: document.getElementById('content-view-deals'),
        manageUsers: document.getElementById('content-manage-users'),
    };
    const addDealForm = document.getElementById('add-deal-form');
    const addDealMessage = document.getElementById('add-deal-message');

    // Admin Manage Users
    const addUserForm = document.getElementById('add-user-form');
    const addUserMessage = document.getElementById('add-user-message');
    const usersListLoader = document.getElementById('users-list-loader');
    const usersListContainer = document.getElementById('users-list-container');

    // Admin Orders
    const ordersLoader = document.getElementById('orders-loader');
    const ordersContainer = document.getElementById('orders-container');
    const orderFilter = document.getElementById('order-filter');
    const orderStatusFilter = document.getElementById('order-status-filter');
    const refreshOrdersBtn = document.getElementById('refresh-orders-btn');
    
    // --- NEW Selectors for Search & Delivery Date ---
    const orderSearchInput = document.getElementById('order-search-input');
    const deliveryDateModal = document.getElementById('delivery-date-modal');
    const deliveryDateForm = document.getElementById('delivery-date-form');
    const deliveryOrderIdHidden = document.getElementById('delivery-order-id-hidden');
    const deliveryDateInput = document.getElementById('delivery-date-input');
    // --- END NEW ---

    // --- ADD THESE NEW OTP SELECTORS ---
    const otpForm = document.getElementById('otp-form');
    const otpOrderIdHidden = document.getElementById('otp-order-id-hidden');
    const otpInput = document.getElementById('otp-input');
    const otpError = document.getElementById('otp-error');
    const submitOtpBtn = document.getElementById('submit-otp-btn');
    // --- END ADD ---

    // Admin Deals
    const adminDealsLoader = document.getElementById('admin-deals-loader');
    const adminDealsContainer = document.getElementById('admin-deals-container');

    // Deal Detail Modal
    const detailProductName = document.getElementById('detail-product-name');
    const detailProductLink = document.getElementById('detail-product-link');
    const detailProductVariant = document.getElementById('detail-product-variant');
    const detailBookingAmount = document.getElementById('detail-booking-amount');
    const detailCommission = document.getElementById('detail-commission');
    const detailReturnAmount = document.getElementById('detail-return-amount');
    const detailAddressCode = document.getElementById('detail-address-code');
    const detailAddressHouse = document.getElementById('detail-address-house');
    const detailAddressArea = document.getElementById('detail-address-area');
    const detailAddressLandmark = document.getElementById('detail-address-landmark');
    const detailAddressPincode = document.getElementById('detail-address-pincode');
    let confirmDealButton = document.getElementById('confirm-deal-button');

    // Booking Form Modal
    const bookingForm = document.getElementById('booking-form');
    const bookingTimer = document.getElementById('booking-timer');
    const bookingProductId = document.getElementById('booking-product-id');
    const bookingError = document.getElementById('booking-error');
    const cancelBookingBtn = document.getElementById('cancel-booking-btn');
    const submitBookingBtn = document.getElementById('submit-booking-btn');
    
    // Message Modal
    const messageTitle = document.getElementById('message-title');
    const messageBody = document.getElementById('message-body');
    const messageModalCloseBtn = document.getElementById('message-modal-close-btn');

    // --- HELPER FUNCTIONS ---

    const showPage = (pageId) => {
        Object.values(pages).forEach(page => page.classList.add('hidden'));
        if (pages[pageId]) {
            pages[pageId].classList.remove('hidden');
        }
    };

    const showModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
        }
    };

    window.closeModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
        }
    };
    
    const showMessage = (title, body) => {
        messageTitle.textContent = title;
        messageBody.textContent = body;
        showModal('message-modal');
    };

    const switchAdminTab = (tabId) => {
        Object.values(adminTabs).forEach(tab => {
            if (tab) {
                tab.classList.remove('border-indigo-500', 'text-indigo-600');
                tab.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
            }
        });
        Object.values(adminContents).forEach(content => {
            if (content) {
                content.classList.add('hidden');
            }
        });

        if(adminTabs[tabId] && adminContents[tabId]) {
            adminTabs[tabId].classList.add('border-indigo-500', 'text-indigo-600');
            adminTabs[tabId].classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
            adminContents[tabId].classList.remove('hidden');
        }
    };

    const showSubmitLoading = (btn, isLoading) => {
        const text = btn.querySelector('.submit-text');
        const spinner = btn.querySelector('.submit-spinner');
        if (isLoading) {
            btn.disabled = true;
            if (text) text.classList.add('hidden');
            if (spinner) spinner.classList.remove('hidden');
        } else {
            btn.disabled = false;
            if (text) text.classList.remove('hidden');
            if (spinner) spinner.classList.add('hidden');
        }
    };
    
const formatISODate = (dateInput) => {
        if (!dateInput) return 'N/A';
        try {
            // Create a Date object. This works even if dateInput
            // is a timestamp string or a date object from the sheet.
            const date = new Date(dateInput);

            // Get the parts of the date
            const year = date.getFullYear();
            // getMonth() is 0-indexed, so add 1. Pad with '0' if needed.
            const month = String(date.getMonth() + 1).padStart(2, '0');
            // getDate() is 1-indexed. Pad with '0' if needed.
            const day = String(date.getDate()).padStart(2, '0');

            // Return in YYYY-MM-DD format
            return `${year}-${month}-${day}`;
        } catch (e) {
            // Failsafe in case the date is invalid
            return String(dateInput).split('T')[0];
        }
    };

    // --- User Session Helpers ---
    const saveUserSession = (user) => {
        currentUser = user;
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        updateHeaderUI();
    };

    const clearUserSession = () => {
        currentUser = null;
        sessionStorage.removeItem('currentUser');
        updateHeaderUI();
    };

    // --- FIXED UPDATEHEADERUI FUNCTION ---
// ✅ Final fixed updateHeaderUI for desktop + mobile
const updateHeaderUI = () => {
  adminToken = sessionStorage.getItem('adminToken');
  currentUser = JSON.parse(sessionStorage.getItem('currentUser'));

  const show = el => el && el.classList.remove('hidden');
  const hide = el => el && el.classList.add('hidden');

  // Reset all visibility
  [
    userLoginButton, userDashboardButton, userLogoutButton,
    adminLoginLink, logoutButton, headerSeparator,
    mobileUserLoginButton, mobileUserDashboardLink,
    mobileUserLogoutButton, mobileAdminLoginLink, mobileLogoutButton
  ].forEach(hide);

  // ✅ ADMIN LOGGED IN
  if (adminToken) {
    // Desktop
    show(adminLoginLink);
    adminLoginLink.href = '#admin-panel';
    show(logoutButton);
    hide(userAuthLinks);
    hide(headerSeparator);

    // Mobile
    show(mobileAdminLoginLink);
    mobileAdminLoginLink.href = '#admin-panel';
    show(mobileLogoutButton);
  }

  // ✅ USER LOGGED IN
  else if (currentUser) {
    // Desktop
    show(userDashboardButton);
    show(userLogoutButton);
    hide(adminLoginLink);
    hide(headerSeparator);

    // Mobile
    show(mobileUserDashboardLink);
    show(mobileUserLogoutButton);
  }

  // ✅ VISITOR (Not logged in)
  else {
    // Desktop
    show(userLoginButton);
    show(adminLoginLink);
    adminLoginLink.href = '#admin-login';
    show(headerSeparator);

    // Mobile
    show(mobileUserLoginButton);
    show(mobileAdminLoginLink);
  }

  if (mobileMenu) mobileMenu.classList.add('hidden'); // Always close menu
};

    // --- API CALLS ---

    const loadDeals = async () => {
        dealsLoader.classList.remove('hidden');
        dealsGrid.innerHTML = '';
        noDealsMessage.classList.add('hidden');
        
        try {
            const response = await fetch(SCRIPT_URL + '?action=getDeals');
            const result = await response.json();
            
            if (result.status === 'success' && result.deals.length > 0) {
                currentDeals = result.deals;
                uniqueBuyers.clear();
                renderDeals(currentDeals);
                currentDeals.forEach(deal => uniqueBuyers.add(deal.ProductFor));
                populateOrderFilter();
            } else {
                noDealsMessage.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error loading deals:', error);
            noDealsMessage.textContent = 'Failed to load deals. Please refresh the page.';
            noDealsMessage.classList.remove('hidden');
        } finally {
            dealsLoader.classList.add('hidden');
        }
    };

    const handleAdminLogin = async (e) => {
        e.preventDefault();
        loginError.textContent = '';
        const username = loginForm.querySelector('#username').value;
        const password = loginForm.querySelector('#password').value;
        const loginButton = loginForm.querySelector('button[type="submit"]');

        loginButton.disabled = true;
        loginButton.textContent = 'Logging...';

        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'adminLogin', username, password }),
                headers: { 'Content-Type': 'text/plain;charset=utf-8' }
            });
            const result = await response.json();

            if (result.status === 'success') {
                adminToken = result.token;
                sessionStorage.setItem('adminToken', adminToken);
                window.location.hash = '#admin-panel';
                loginForm.reset();
                updateHeaderUI();
            } else {
                loginError.textContent = result.message || 'Login failed.';
            }
        } catch (error) {
            loginError.textContent = 'An error occurred. Please try again.';
        } finally {
            loginButton.disabled = false;
            loginButton.textContent = 'Login';
        }
    };

    const handleAddDeal = async (e) => {
        e.preventDefault();
        if (!adminToken) return;
        
        addDealMessage.textContent = 'Adding deal...';
        addDealMessage.classList.remove('text-red-500');
        addDealMessage.classList.add('text-blue-500');

        const deal = {
            productFor: document.getElementById('productFor').value,
            productName: document.getElementById('productName').value,
            productVariant: document.getElementById('productVariant').value,
            imageUrl: document.getElementById('imageUrl').value,
            productLink: document.getElementById('productLink').value,
            bookingAmount: document.getElementById('bookingAmount').value,
            commission: document.getElementById('commission').value,
            returnAmount: document.getElementById('returnAmount').value,
            quantityNeeded: document.getElementById('quantityNeeded').value,
            code: document.getElementById('code').value,
            addressHouse: document.getElementById('addressHouse').value,
            addressArea: document.getElementById('addressArea').value,
            addressLandmark: document.getElementById('addressLandmark').value,
            addressPincode: document.getElementById('addressPincode').value,
        };

        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'addDeal', token: adminToken, deal }),
                headers: { 'Content-Type': 'text/plain;charset=utf-8' }
            });
            const result = await response.json();

            if (result.status === 'success') {
                addDealMessage.textContent = 'Deal added successfully!';
                addDealMessage.classList.remove('text-blue-500');
                addDealMessage.classList.add('text-green-500');
                addDealForm.reset();
                loadDeals();
            } else {
                addDealMessage.textContent = result.message || 'Failed to add deal.';
                addDealMessage.classList.add('text-red-500');
            }
        } catch (error) {
            addDealMessage.textContent = 'An error occurred.';
            addDealMessage.classList.add('text-red-500');
        }
    };

    /**
     * --- THIS FUNCTION IS NOW UPGRADED ---
     * Fetches and displays orders, now with search.
     */
    const loadOrders = async () => {
        if (!adminToken) return;

        ordersLoader.classList.remove('hidden');
        ordersContainer.innerHTML = '';
        
        // --- NEW: Get search term ---
        const buyerFilter = orderFilter.value;
        const statusFilter = orderStatusFilter.value;
        const searchTerm = orderSearchInput.value;

        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                // --- NEW: Send search term to backend ---
                body: JSON.stringify({ 
                    action: 'getOrders', 
                    token: adminToken, 
                    buyerFilter, 
                    statusFilter, 
                    searchTerm 
                }),
                headers: { 'Content-Type': 'text/plain;charset=utf-8' }
            });
            const result = await response.json();

            if (result.status === 'success') {
                renderOrders(result.orders);
            } else {
                ordersContainer.innerHTML = `<p class="text-red-500">${result.message}</p>`;
            }
        } catch (error) {
            ordersContainer.innerHTML = `<p class="text-red-500">Failed to load orders.</p>`;
        } finally {
            ordersLoader.classList.add('hidden');
        }
    };

    const loadAdminDeals = async () => {
        adminDealsLoader.classList.remove('hidden');
        adminDealsContainer.innerHTML = '';
        
        if (currentDeals.length > 0) {
            renderAdminDeals(currentDeals);
            adminDealsLoader.classList.add('hidden');
        } else {
            try {
                const response = await fetch(SCRIPT_URL + '?action=getDeals');
                const result = await response.json();
                
                if (result.status === 'success' && result.deals.length > 0) {
                    renderAdminDeals(result.deals);
                } else {
                    adminDealsContainer.innerHTML = '<p class="text-gray-500">No deals found.</p>';
                }
            } catch (error) {
                adminDealsContainer.innerHTML = '<p class="text-red-500">Failed to load deals.</p>';
            } finally {
                adminDealsLoader.classList.add('hidden');
            }
        }
    };

    /**
     * --- NEW FUNCTION ---
     * Opens the delivery date modal and sets the hidden order ID.
     */
        const openDeliveryDateModal = (orderId, isUser = false) => {
        deliveryOrderIdHidden.value = orderId;
        deliveryDateInput.valueAsDate = new Date();
        isUserMarkingDelivery = isUser; // --- ADD THIS LINE to track who clicked
        showModal('delivery-date-modal');
    };

    /**
     * --- NEW FUNCTION ---
     * Handles the submission of the delivery date form.
     */

        const handleDeliveryDateSubmit = async (e) => {
        e.preventDefault();
 
        // Security check: Must be admin OR user
        if (!adminToken && !currentUser) return; 

        const orderId = deliveryOrderIdHidden.value;
        const deliveredDate = deliveryDateInput.value;

        const btn = e.target.querySelector('button[type="submit"]');
        const originalBtnText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = 'Saving...';

        // --- NEW: Smart Payload Logic ---
        let payload;
        if (isUserMarkingDelivery) {
        // If a USER is clicking, send the userMarkDelivered action
        payload = { 
        action: 'userMarkDelivered', 
        userId: currentUser.userId, // Send user ID for security
        orderId, 
        deliveredDate 
        };
        } else {
        // If an ADMIN is clicking, send the admin action
            payload = { 
                action: 'markDelivered', 
                token: adminToken, // Send admin token for security
                orderId, 
                deliveredDate 
            };
        }
        // --- END OF NEW LOGIC ---

        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(payload), // Send the new smart payload
                headers: { 'Content-Type': 'text/plain;charset=utf-8' }
            });
            const result = await response.json();

            if (result.status === 'success') {
                closeModal('delivery-date-modal');
                showMessage('Success', result.message || 'Order updated!');

                // --- NEW: Refresh the correct page ---
                if (isUserMarkingDelivery) {
                loadUserOrders(); // Refresh User Dashboard
                } else {
                    loadOrders(); // Refresh Admin Orders
                }
            } else {
                showMessage('Error', `Failed to update: ${result.message}`);
            }
        } catch (error) {
            showMessage('Error', 'An error occurred.');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalBtnText;
            isUserMarkingDelivery = false; // --- ADD THIS to reset the state ---
        }
    };

    // --- ADD THESE 2 NEW FUNCTIONS ---

    /**
     * --- NEW ---
     * Opens the OTP modal and sets the hidden order ID.
     */
    const openOtpModal = (orderId) => {
        otpOrderIdHidden.value = orderId;
        otpInput.value = ''; // Clear old OTP
        otpError.textContent = '';
        showModal('otp-modal');
    };

    /**
     * --- NEW ---
     * Handles the submission of the user's OTP form.
     */
    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) return; // Must be logged in

        const orderId = otpOrderIdHidden.value;
        const otp = otpInput.value;

        showSubmitLoading(submitOtpBtn, true);
        otpError.textContent = '';

        const payload = {
            action: 'userAddOTP',
            userId: currentUser.userId,
            orderId,
            otp
        };

        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: { 'Content-Type': 'text/plain;charset=utf-8' }
            });
            const result = await response.json();

            if (result.status === 'success') {
                closeModal('otp-modal');
                showMessage('Success', 'OTP added successfully!');
                loadUserOrders(); // Refresh the user's dashboard
            } else {
                otpError.textContent = result.message || 'Failed to save OTP.';
            }
        } catch (error) {
            otpError.textContent = 'An error occurred. Please try again.';
        } finally {
            showSubmitLoading(submitOtpBtn, false);
        }
    };
    // --- END ADD ---

    const handleBookingSubmit = async (e) => {
        e.preventDefault();
        bookingError.textContent = '';
        showSubmitLoading(submitBookingBtn, true);
        
        if (bookingTimerInterval) {
            clearInterval(bookingTimerInterval);
            bookingTimerInterval = null;
        }

        const bookingData = {
            productId: bookingProductId.value,
            userName: document.getElementById('userName').value,
            userMobile: document.getElementById('userMobile').value,
            userDeliveryDate: document.getElementById('userDeliveryDate').value,
            userUpiId: document.getElementById('userUpiId').value,
            userId: currentUser ? currentUser.userId : null,
        };

        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'submitOrder', ...bookingData }),
                headers: { 'Content-Type': 'text/plain;charset=utf-8' }
            });
            const result = await response.json();

            if (result.status === 'success') {
                closeModal('booking-form-modal');
                showMessage('Success!', 'Your deal has been booked successfully. You will receive your commission after the return period.');
                loadDeals();
            } else {
                bookingError.textContent = result.message || 'Booking failed. Please try again.';
                if (result.message.includes('out of stock')) {
                    setTimeout(() => {
                        closeModal('booking-form-modal');
                        loadDeals();
                    }, 2000);
                }
            }
        } catch (error) {
            bookingError.textContent = 'An error occurred. Please try again.';
        } finally {
            showSubmitLoading(submitBookingBtn, false);
        }
    };

    // --- API Calls for User and Admin-User-Management ---

    const handleUserLogin = async (e) => {
        e.preventDefault();
        userLoginError.textContent = '';
        showSubmitLoading(userLoginSubmitBtn, true);

        const userId = userLoginForm.querySelector('#loginUserId').value;
        const password = userLoginForm.querySelector('#loginPassword').value;

        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'userLogin', userId, password }),
                headers: { 'Content-Type': 'text/plain;charset=utf-8' }
            });
            const result = await response.json();

            if (result.status === 'success') {
                saveUserSession(result.user);
                closeModal('user-login-modal');
                userLoginForm.reset();
            } else {
                userLoginError.textContent = result.message || 'Login failed.';
            }
        } catch (error) {
            userLoginError.textContent = 'An error occurred. Please try again.';
        } finally {
            showSubmitLoading(userLoginSubmitBtn, false);
        }
    };

    const loadUserOrders = async () => {
        if (!currentUser) return;

        userOrdersLoader.classList.remove('hidden');
        userOrdersContainer.innerHTML = '';
        userWelcomeMessage.textContent = `Welcome, ${currentUser.userName}!`;

        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'getUserOrders', userId: currentUser.userId }),
                headers: { 'Content-Type': 'text/plain;charset=utf-8' }
            });
            const result = await response.json();

            if (result.status === 'success') {
                renderUserOrders(result.orders);
            } else {
                userOrdersContainer.innerHTML = `<p class="text-red-500">${result.message}</p>`;
            }
        } catch (error) {
            userOrdersContainer.innerHTML = `<p class="text-red-500">Failed to load your orders.</p>`;
        } finally {
            userOrdersLoader.classList.add('hidden');
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        if (!adminToken) return;

        addUserMessage.textContent = 'Adding user...';
        addUserMessage.classList.remove('text-red-500', 'text-green-500');
        addUserMessage.classList.add('text-blue-500');

        const user = {
            userId: document.getElementById('newUserId').value,
            userName: document.getElementById('newUserName').value,
            password: document.getElementById('newUserPassword').value,
        };

        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'addUser', token: adminToken, user }),
                headers: { 'Content-Type': 'text/plain;charset=utf-8' }
            });
            const result = await response.json();

            if (result.status === 'success') {
                addUserMessage.textContent = 'User added successfully!';
                addUserMessage.classList.add('text-green-500');
                addUserForm.reset();
                loadUsers();
            } else {
                addUserMessage.textContent = result.message || 'Failed to add user.';
                addUserMessage.classList.add('text-red-500');
            }
        } catch (error) {
            addUserMessage.textContent = 'An error occurred.';
            addUserMessage.classList.add('text-red-500');
        }
    };

    const loadUsers = async () => {
        if (!adminToken) return;
        
        usersListLoader.classList.remove('hidden');
        usersListContainer.innerHTML = '';

        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'getUsers', token: adminToken }),
                headers: { 'Content-Type': 'text/plain;charset=utf-8' }
            });
            const result = await response.json();

            if (result.status === 'success') {
                renderUsers(result.users);
            } else {
                usersListContainer.innerHTML = `<p class="text-red-500">${result.message}</p>`;
            }
        } catch (error) {
            usersListContainer.innerHTML = `<p class="text-red-500">Failed to load users.</p>`;
        } finally {
            usersListLoader.classList.add('hidden');
        }
    };

    // --- RENDER FUNCTIONS ---

    const renderDeals = (deals) => {
        dealsGrid.innerHTML = '';
        deals.forEach(deal => {
            const card = document.createElement('div');
            // This class makes the card a flex-column, so mt-auto in the content works
            card.innerHTML = `
  <div class="h-56 w-full overflow-hidden bg-gray-200">
      <img class="h-full w-full object-contain transition-transform duration-300 group-hover:scale-110" 
           src="${deal.ImageUrl}" 
           alt="${deal.ProductName}" 
           onerror="this.src='https://placehold.co/600x400/e2e8f0/94a3b8?text=Image+Not+Found';">
  </div>
  <div class="p-6 flex flex-col justify-between flex-grow">
      <div>
          <h3 class="text-lg sm:text-xl font-semibold mb-2 flex items-center justify-center sm:justify-start gap-1 truncate" 
     title="${deal.ProductName} ${deal.ProductVariant}">
  <span class="truncate">${deal.ProductName}</span>
  <span class="text-sm text-gray-500 font-normal flex-shrink-0">
    (${deal.ProductVariant})
  </span>
</h3>
          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center items-center mb-4 mt-auto gap-1">
    <span class="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap">
  ₹${deal.Commission} Commission
</span>
    <span class="text-sm font-semibold text-indigo-600">
        ${deal.QuantityLeft} Left
    </span>
</div>

      </div>
      <button class="show-deal-btn w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700 transition">
          Show Deal
      </button>
  </div>
`;

            card.querySelector('.show-deal-btn').addEventListener('click', () => showDealDetail(deal.ProductID));
            dealsGrid.appendChild(card);
        });
    };

    /**
     * --- THIS FUNCTION IS NOW UPGRADED ---
     * Renders orders with new Delivery Date and search message
     */
    const renderOrders = (orders) => {
        ordersContainer.innerHTML = '';
        if (orders.length === 0) {
            // --- NEW: Check if a search was active ---
            if (orderSearchInput.value) {
                ordersContainer.innerHTML = '<p class="text-gray-500 text-center">No orders found matching your search.</p>';
            } else {
                ordersContainer.innerHTML = '<p class="text-gray-500 text-center">No orders found for this filter.</p>';
            }
            return;
        }

        orders.forEach(order => {
            const isDelivered = order.Status === 'Delivered';
            const card = document.createElement('div');
            card.className = 'order-card bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200';
            
            // --- NEW: Show delivered date if it exists ---
            const deliveredDateHtml = isDelivered ? 
                `<p class="text-xs text-green-700 font-medium">Delivered: ${formatISODate(order.DeliveredDate) || 'N/A'}</p>` : 
                '';

            card.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <p class="text-sm font-semibold text-indigo-700">${order.ProductFor} - ${order.ProductName}</p>
                        <p class="text-xs text-gray-500">Order ID: ${order.OrderID}</p>
                        <p class="text-xs text-gray-500">Placed: ${order.OrderTimestamp}</p> 
                        <p class="text-xs text-gray-600 font-medium">User: ${order.UserID || 'N/A'}</p>
                    </div>
                    <span class="order-status inline-block ${isDelivered ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'} text-xs font-medium px-2.5 py-0.5 rounded-full">${order.Status}</span>
                </div>
                <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div><strong>Name:</strong> ${order.UserName}</div>
                    <div><strong>Mobile:</strong> ${order.UserMobile}</div>
                    <div><strong>Expected:</strong> ${formatISODate(order.UserDeliveryDate)}</div>
                    <div><strong>UPI:</strong> ${order.UserUpiId}</div>
                    <div><strong>OTP:</strong> ${order.OTP || 'N/A'}</div>
                </div>
                <div class="mt-4 flex items-center justify-between">
                    <button class="deliver-btn ${isDelivered ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'} text-white text-sm font-semibold py-1 px-3 rounded-md disabled:bg-gray-400" ${isDelivered ? 'disabled' : ''}>
                        ${isDelivered ? 'Delivered' : 'Mark as Delivered'}
                    </button>
                    <!-- NEW: This is where the date will appear -->
                    ${deliveredDateHtml}
                </div>
            `;
            
            if (!isDelivered) {
                // --- NEW: This button now opens the modal ---
                card.querySelector('.deliver-btn').addEventListener('click', () => openDeliveryDateModal(order.OrderID, false));
            }
            ordersContainer.appendChild(card);
        });
    };

const renderUserOrders = (orders) => {
        userOrdersContainer.innerHTML = '';
        if (orders.length === 0) {
            userOrdersContainer.innerHTML = '<p class="text-gray-500 text-center">You have no bookings yet.</p>';
            return;
        }

        orders.forEach(order => {
            const isDelivered = order.Status === 'Delivered';
            // --- NEW: Show delivered date if it exists ---
            const deliveredDateHtml = isDelivered ? 
                `<p class="text-xs text-green-700 font-medium">Delivered: ${formatISODate(order.DeliveredDate) || 'N/A'}</p>` : 
                '';

            // --- ADD THIS NEW VARIABLE ---
            const userDeliverButtonHtml = !isDelivered ?
                `<div class="mt-2">
                     <button class="user-deliver-btn bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold py-1 px-3 rounded-md">
                        Mark as Delivered
                </button>
                 </div>` :
                '';
                
            // --- ADD THIS NEW OTP VARIABLE ---
            const otpHtml = order.OTP ?
                // If OTP exists, show it
                `<div class="mt-2"><strong>OTP:</strong> ${order.OTP}</div>` :
                // If not, show the "Add OTP" button
                `<div class="mt-2">
                    <button class="add-otp-btn bg-gray-600 hover:bg-gray-700 text-white text-xs font-semibold py-1 px-2 rounded-md">
                        Add OTP
                    </button>
                </div>`;
            // --- END ADD ---

            const card = document.createElement('div');
            card.className = 'bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200';
            card.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <p class="text-sm font-semibold text-indigo-700">${order.ProductFor} - ${order.ProductName}</p>
                        <p class="text-xs text-gray-500">Order ID: ${order.OrderID}</p>
                        <p class="text-xs text-gray-500">Placed: ${order.OrderTimestamp}</p>
                    </div>
                    <span class="order-status inline-block ${isDelivered ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'} text-xs font-medium px-2.5 py-0.5 rounded-full">${order.Status}</span>
                </div>
                <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <!-- Left Column -->
                    <div class="space-y-2">
                    <div><strong>Name:</strong> ${order.UserName}</div>
                    <div><strong>Expected:</strong> ${formatISODate(order.UserDeliveryDate)}</div>
                    ${isDelivered ? deliveredDateHtml : ''} <!-- Delivered date goes here -->
                    </div>
                    <!-- Right Column -->
                    <div class="space-y-2">
                    <div><strong>Mobile:</strong> ${order.UserMobile}</div>
                    <div><strong>UPI:</strong> ${order.UserUpiId}</div>
                    ${!isDelivered ? userDeliverButtonHtml : ''} <!-- "Mark as Received" button goes here -->
                    ${otpHtml} <!-- ADD THIS LINE -->
                </div>
                </div>
                            `;
            // --- ADD THIS LISTENER ---
                if (!isDelivered) {
                card.querySelector('.user-deliver-btn').addEventListener('click', () => openDeliveryDateModal(order.OrderID, true));
                }
            // --- END ADD ---

            // --- ADD THIS NEW LISTENER ---
            if (!order.OTP) {
                const addOtpBtn = card.querySelector('.add-otp-btn');
                if (addOtpBtn) {
                    addOtpBtn.addEventListener('click', () => openOtpModal(order.OrderID));
                }
            }
            // --- END ADD ---

            userOrdersContainer.appendChild(card);
        });
    };


    const renderAdminDeals = (deals) => {
        adminDealsContainer.innerHTML = '';
        if (deals.length === 0) {
            adminDealsContainer.innerHTML = '<p class="text-gray-500 text-center">No available deals to show.</p>';
            return;
        }

        deals.forEach(deal => {
            const card = document.createElement('div');
            card.className = 'bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center';
            card.innerHTML = `
                <div>
                    <p class="text-sm font-semibold text-indigo-700">${deal.ProductFor} - ${deal.ProductName} (${deal.ProductVariant})</p>
                    <p class="text-xs text-gray-500">ID: ${deal.ProductID}</p>
                    <p class="text-xs text-gray-500">Stock: ${deal.QuantityLeft} / ${deal.QuantityNeeded}</p>
                </div>
                <button class="copy-deal-btn bg-blue-500 text-white text-sm font-semibold py-1 px-3 rounded-md hover:bg-blue-600">
                    Copy to Form
                </button>
            `;
            
            card.querySelector('.copy-deal-btn').addEventListener('click', () => populateDealForm(deal.ProductID));
            adminDealsContainer.appendChild(card);
        });
    };

    const renderUsers = (users) => {
        usersListContainer.innerHTML = '';
        if (users.length === 0) {
            usersListContainer.innerHTML = '<p class="text-gray-500 text-center">No users added yet.</p>';
            return;
        }

        users.forEach(user => {
            const card = document.createElement('div');
            card.className = 'bg-white p-3 rounded-md border border-gray-200';
            card.innerHTML = `
                <p class="font-semibold text-gray-800">${user.userName}</p>
                <p class="text-sm text-gray-600">UserID: <span class="font-medium text-indigo-600">${user.userId}</span></p>
            `;
            usersListContainer.appendChild(card);
        });
    };

    const populateOrderFilter = () => {
        const currentVal = orderFilter.value;
        orderFilter.innerHTML = '<option>All</option>';
        uniqueBuyers.forEach(buyer => {
            const option = document.createElement('option');
            option.value = buyer;
            option.textContent = buyer;
            orderFilter.appendChild(option);
        });
        orderFilter.value = currentVal;
    };

    // --- FLOW FUNCTIONS ---

    const populateDealForm = (productId) => {
        const deal = currentDeals.find(d => d.ProductID === productId);
        if (!deal) return;

        document.getElementById('productFor').value = deal.ProductFor;
        document.getElementById('productName').value = deal.ProductName;
        document.getElementById('productVariant').value = deal.ProductVariant;
        document.getElementById('imageUrl').value = deal.ImageUrl;
        document.getElementById('productLink').value = deal.ProductLink;
        document.getElementById('bookingAmount').value = deal.BookingAmount;
        document.getElementById('commission').value = deal.Commission;
        document.getElementById('returnAmount').value = deal.ReturnAmount;
        document.getElementById('quantityNeeded').value = deal.QuantityNeeded;
        document.getElementById('code').value = deal.Code;
        document.getElementById('addressHouse').value = deal.AddressHouse;
        document.getElementById('addressArea').value = deal.AddressArea;
        document.getElementById('addressLandmark').value = deal.AddressLandmark;
        document.getElementById('addressPincode').value = deal.AddressPincode;

        switchAdminTab('addDeal');
        
        addDealMessage.textContent = 'Deal data copied. Modify as needed and click "Submit Deal" to create a new entry.';
        addDealMessage.classList.remove('text-red-500', 'text-green-500');
        addDealMessage.classList.add('text-blue-500');
    };

    const showDealDetail = (productId) => {
        const deal = currentDeals.find(d => d.ProductID === productId);
        if (!deal) return;

        detailProductName.textContent = deal.ProductName;
        detailProductLink.href = deal.ProductLink;
        detailProductVariant.textContent = deal.ProductVariant;
        detailBookingAmount.textContent = `₹${deal.BookingAmount}`;
        detailCommission.textContent = `₹${deal.Commission}`;
        detailReturnAmount.textContent = `₹${deal.ReturnAmount}`;
        detailAddressCode.textContent = deal.Code;
        detailAddressHouse.textContent = deal.AddressHouse;
        detailAddressArea.textContent = deal.AddressArea;
        detailAddressLandmark.textContent = deal.AddressLandmark || 'N/A';
        detailAddressPincode.textContent = deal.AddressPincode;

        const newConfirmBtn = confirmDealButton.cloneNode(true);
        newConfirmBtn.id = 'confirm-deal-button';
        confirmDealButton.parentNode.replaceChild(newConfirmBtn, confirmDealButton);
        confirmDealButton = newConfirmBtn;
        confirmDealButton.addEventListener('click', () => showBookingForm(productId));

        showModal('deal-detail-modal');
    };

    const showBookingForm = (productId) => {
        if (!currentUser) {
            showModal('login-prompt-modal');
            return;
        }

        closeModal('deal-detail-modal');
        bookingForm.reset();
        bookingError.textContent = '';
        bookingProductId.value = productId;
        
        showModal('booking-form-modal');
        startBookingTimer();
    };

    const startBookingTimer = () => {
        if (bookingTimerInterval) {
            clearInterval(bookingTimerInterval);
        }

        let timeLeft = 600;
        
        const updateTimer = () => {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            bookingTimer.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

            if (timeLeft <= 0) {
                clearInterval(bookingTimerInterval);
                bookingTimerInterval = null;
                closeModal('booking-form-modal');
                showMessage('Time Expired', 'The 10-minute booking window has closed. Please try again.');
            }
            timeLeft--;
        };

        updateTimer();
        bookingTimerInterval = setInterval(updateTimer, 1000);
    };

    const handleHashChange = () => {
        const hash = window.location.hash;
        if (hash === '#admin-panel' && adminToken) {
            showPage('adminPanel');
            switchAdminTab('addDeal');
            loadOrders();
        } else if (hash === '#admin-login') {
            showPage('adminLogin');
        } else if (hash === '#user-dashboard' && currentUser) {
            showPage('userDashboard');
            loadUserOrders();
        } else {
            showPage('deals');
            if (hash !== '#admin-panel' && hash !== '#admin-login') {
                window.location.hash = '';
            }
        }
    };
    
    // --- EVENT LISTENERS ---
    
    window.addEventListener('hashchange', handleHashChange);
    
    // Mobile Menu Toggler
    if (menuTogglerButton) {
        menuTogglerButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Mobile Menu Link Listeners
    // ✅ Updated mobile link array + auto-close behaviour
// ✅ Close menu when any mobile link is clicked
const mobileLinks = [
  mobileUserLoginButton,
  mobileUserDashboardLink,
  mobileUserLogoutButton,
  mobileAdminLoginLink,
  mobileLogoutButton
];
mobileLinks.forEach(link => {
  if (link) {
    link.addEventListener('click', () => {
      if (mobileMenu) mobileMenu.classList.add('hidden');
    });
  }
});


    // --- ADD THESE NEW LISTENERS ---
    if (adminBackButton) {
        adminBackButton.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.hash = '#';
        });
    }
    if (userBackButton) {
        userBackButton.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.hash = '#';
        });
    }
    // --- END ADD ---

    mobileLinks.forEach(link => {
        if (link) {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
            });
        }
    });

    // User Flow
    bookingForm.addEventListener('submit', handleBookingSubmit);
    cancelBookingBtn.addEventListener('click', () => {
        if (bookingTimerInterval) {
            clearInterval(bookingTimerInterval);
            bookingTimerInterval = null;
        }
        closeModal('booking-form-modal');
    });
    
    messageModalCloseBtn.addEventListener('click', () => closeModal('message-modal')); 

    // User Auth Listeners
    userLoginButton.addEventListener('click', () => showModal('user-login-modal'));
    if (mobileUserLoginButton) {
        mobileUserLoginButton.addEventListener('click', () => showModal('user-login-modal'));
    }
    userLogoutButton.addEventListener('click', () => {
        clearUserSession();
        window.location.hash = '#';
        showPage('deals');
    });
    if (mobileUserLogoutButton) {
        mobileUserLogoutButton.addEventListener('click', () => {
            clearUserSession();
            window.location.hash = '#'; 
            showPage('deals');
        });
    }
    userLoginForm.addEventListener('submit', handleUserLogin);
    loginPromptCloseBtn.addEventListener('click', () => closeModal('login-prompt-modal'));
    loginPromptLoginBtn.addEventListener('click', () => {
        closeModal('login-prompt-modal');
        showModal('user-login-modal');
    });

    // Admin Flow
    loginForm.addEventListener('submit', handleAdminLogin);
    logoutButton.addEventListener('click', () => {
        adminToken = null;
        sessionStorage.removeItem('adminToken');
        window.location.hash = '#';
        updateHeaderUI();
    });

    // --- ADD THIS LISTENER ---
    if (mobileLogoutButton) {
        mobileLogoutButton.addEventListener('click', () => {
            adminToken = null;
            sessionStorage.removeItem('adminToken');
            window.location.hash = '#';
            updateHeaderUI();
            mobileMenu.classList.add('hidden'); // Also close menu
        });
    }

    // === NEW: Mobile Admin Logout (for separate admin link) ===
    //if (mobileAdminLogoutButton) {
    //mobileAdminLogoutButton.addEventListener('click', () => {
    //adminToken = null;
    //sessionStorage.removeItem('adminToken');
    //updateHeaderUI();
    //window.location.hash = '#';
    //if (mobileMenu) mobileMenu.classList.add('hidden'); // close menu after logout
    //});
    //}


    // --- END ADD ---
    
    // Admin Tabs
    adminTabs.addDeal.addEventListener('click', () => switchAdminTab('addDeal'));
    adminTabs.viewOrders.addEventListener('click', () => {
        switchAdminTab('viewOrders');
        loadOrders();
    });
    adminTabs.viewDeals.addEventListener('click', () => {
        switchAdminTab('viewDeals');
        loadAdminDeals();
    });
    adminTabs.manageUsers.addEventListener('click', () => {
        switchAdminTab('manageUsers');
        loadUsers();
    });
    addUserForm.addEventListener('submit', handleAddUser);
    addDealForm.addEventListener('submit', handleAddDeal);
    
    // Admin Orders
    orderFilter.addEventListener('change', loadOrders);
    if (orderStatusFilter) {
        orderStatusFilter.addEventListener('change', loadOrders);
    }
    refreshOrdersBtn.addEventListener('click', () => {
        orderFilter.value = 'All';
        orderStatusFilter.value = 'All';
        orderSearchInput.value = ''; // --- NEW: Clear search on refresh ---
        loadOrders();
    });

    // === NEW: Download Orders as Excel ===
const downloadOrdersBtn = document.getElementById('download-orders-btn');
if (downloadOrdersBtn) {
  downloadOrdersBtn.addEventListener('click', async () => {
    if (!adminToken) return alert("Unauthorized. Please log in again.");

    // Get filtered data again from backend
    const buyerFilter = orderFilter.value;
    const statusFilter = orderStatusFilter.value;
    const searchTerm = orderSearchInput.value;

    try {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'getOrders',
          token: adminToken,
          buyerFilter,
          statusFilter,
          searchTerm
        }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      const result = await response.json();
      if (result.status === 'success' && result.orders.length > 0) {
        exportToExcel(result.orders, 'Filtered_Orders');
      } else {
        alert('No data to download for current filter.');
      }
    } catch (error) {
      alert('Error fetching data.');
      console.error(error);
    }
  });
}

// === Helper Function to Export to Excel ===
function exportToExcel(data, filename) {
  // Convert array of objects to worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

// === NEW: Download as PDF (screenshot style) ===
// === UNIVERSAL DESKTOP-STYLE PDF DOWNLOAD (WORKS ON MOBILE TOO) ===
const downloadPdfBtn = document.getElementById('download-pdf-btn');
if (downloadPdfBtn) {
  downloadPdfBtn.addEventListener('click', async () => {
    const container = document.getElementById('orders-container');
    if (!container) return alert("No orders to capture.");

    const originalHtml = downloadPdfBtn.innerHTML;
    downloadPdfBtn.innerHTML = '<span class="animate-pulse">⏳ Generating...</span>';
    downloadPdfBtn.disabled = true;

    // Save original styles
    const originalWidth = container.style.width;
    const originalTransform = container.style.transform;
    const originalTransformOrigin = container.style.transformOrigin;

    try {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'pt', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;

      // 🧩 Force mobile to render as desktop
      if (window.innerWidth < 768) {
        container.style.width = '1024px';
        container.style.transform = 'scale(0.9)';
        container.style.transformOrigin = 'top left';
      }

      // Force browser to reflow
      await new Promise(resolve => setTimeout(resolve, 300));

      const canvas = await html2canvas(container, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        scrollX: 0,
        scrollY: -window.scrollY,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight
      });

      // Restore original styles
      container.style.width = originalWidth;
      container.style.transform = originalTransform;
      container.style.transformOrigin = originalTransformOrigin;

      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // ✅ Custom fix: ensure only ~5 full orders per page (no half-cuts)
      const ordersPerPage = 5;
      const orderCards = container.children.length;
      const approxCardHeight = canvas.height / orderCards;
      const chunkHeight = approxCardHeight * ordersPerPage;
      const totalPages = Math.ceil(canvas.height / chunkHeight);

      for (let i = 0; i < totalPages; i++) {
        const srcY = i * chunkHeight;
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = Math.min(chunkHeight, canvas.height - srcY);
        const ctx = pageCanvas.getContext('2d');
        ctx.drawImage(canvas, 0, -srcY);

        const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.9);

        if (i > 0) pdf.addPage();
        const imgH = (pageCanvas.height * imgWidth) / pageCanvas.width;
        pdf.addImage(pageImgData, 'JPEG', margin, 40, imgWidth, imgH);
        pdf.setFontSize(9);
        pdf.text(`Page ${i + 1} of ${totalPages}`, pageWidth - 60, pageHeight - 10);
      }

      pdf.save(`Orders_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Error generating PDF.');
    } finally {
      container.style.width = originalWidth;
      container.style.transform = originalTransform;
      container.style.transformOrigin = originalTransformOrigin;

      downloadPdfBtn.innerHTML = originalHtml;
      downloadPdfBtn.disabled = false;
    }
  });
}

    // --- NEW: Event Listeners for Search and Delivery Date ---
    // Debounced search
    let searchTimeout = null;
    orderSearchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            loadOrders();
        }, 500); // Wait 500ms after user stops typing
    });

    // Listener for the new delivery date modal form
    deliveryDateForm.addEventListener('submit', handleDeliveryDateSubmit);
    // --- END NEW ---

    // --- ADD THIS NEW LISTENER ---
    otpForm.addEventListener('submit', handleOtpSubmit);
    // --- END ADD ---

    // --- INITIALIZATION ---
    updateHeaderUI();
    loadDeals();
    handleHashChange();
});
