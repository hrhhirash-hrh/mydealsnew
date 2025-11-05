document.addEventListener('DOMContentLoaded', () => {
    // --- STATE ---
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzT0e7GIJBLRLobQJdknhuItgF90KEwBd1OaAD8OKVZC29eIYeQfRiWfxVR-32X_noT/exec"; // --- Make sure this is your LATEST deployed URL ---
    let adminToken = sessionStorage.getItem('adminToken');
    let currentUser = JSON.parse(sessionStorage.getItem('currentUser')); // --- NEW ---
    let currentDeals = [];
    let bookingTimerInterval = null;
    let uniqueBuyers = new Set();

    // --- DOM SELECTORS ---
    const pages = {
        deals: document.getElementById('deals-page'),
        adminLogin: document.getElementById('admin-login'),
        adminPanel: document.getElementById('admin-panel'),
        userDashboard: document.getElementById('user-dashboard-page'), // --- NEW ---
    };
    const modals = {
        dealDetail: document.getElementById('deal-detail-modal'),
        bookingForm: document.getElementById('booking-form-modal'),
        message: document.getElementById('message-modal'),
        userLogin: document.getElementById('user-login-modal'), // --- NEW ---
        loginPrompt: document.getElementById('login-prompt-modal'), // --- NEW ---
    };
    const dealsGrid = document.getElementById('deals-grid');
    const dealsLoader = document.getElementById('deals-loader');
    const noDealsMessage = document.getElementById('no-deals-message');
    
    // Admin Login
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const logoutButton = document.getElementById('logout-button');

    // --- NEW: User Auth ---
    const userLoginButton = document.getElementById('user-login-button');
    const userDashboardButton = document.getElementById('user-dashboard-button');
    const userLogoutButton = document.getElementById('user-logout-button');
    const userLoginForm = document.getElementById('user-login-form');
    const userLoginSubmitBtn = document.getElementById('user-login-submit-btn');
    const userLoginError = document.getElementById('user-login-error');

    // --- NEW: User Dashboard ---
    const userWelcomeMessage = document.getElementById('user-welcome-message');
    const userOrdersLoader = document.getElementById('user-orders-loader');
    const userOrdersContainer = document.getElementById('user-orders-container');

    // --- NEW: Login Prompt Modal ---
    const loginPromptCloseBtn = document.getElementById('login-prompt-close-btn');
    const loginPromptLoginBtn = document.getElementById('login-prompt-login-btn');

    // Admin Panel
    const adminTabs = {
        addDeal: document.getElementById('tab-add-deal'),
        viewOrders: document.getElementById('tab-view-orders'),
        viewDeals: document.getElementById('tab-view-deals'),
        manageUsers: document.getElementById('tab-manage-users'), // --- NEW ---
    };
    const adminContents = {
        addDeal: document.getElementById('content-add-deal'),
        viewOrders: document.getElementById('content-view-orders'),
        viewDeals: document.getElementById('content-view-deals'),
        manageUsers: document.getElementById('content-manage-users'), // --- NEW ---
    };
    const addDealForm = document.getElementById('add-deal-form');
    const addDealMessage = document.getElementById('add-deal-message');

    // --- NEW: Admin Manage Users ---
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

    // Admin Deals
    const adminDealsLoader = document.getElementById('admin-deals-loader');
    const adminDealsContainer = document.getElementById('admin-deals-container');

    // Deal Detail Modal (no changes)
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

    // Booking Form Modal (no changes)
    const bookingForm = document.getElementById('booking-form');
    const bookingTimer = document.getElementById('booking-timer');
    const bookingProductId = document.getElementById('booking-product-id');
    const bookingError = document.getElementById('booking-error');
    const cancelBookingBtn = document.getElementById('cancel-booking-btn');
    const submitBookingBtn = document.getElementById('submit-booking-btn');
    
    // Message Modal (no changes)
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
        // --- MODIFIED --- Added new modals
        const modal = document.getElementById(modalId); // Use ID directly
        if (modal) {
            modal.classList.remove('hidden');
        }
    };

    // Make closeModal global so inline HTML can access it
    window.closeModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
        }
    };
    
    const showMessage = (title, body) => {
        messageTitle.textContent = title;
        messageBody.textContent = body;
        showModal('message-modal'); // Use ID
    };

    const switchAdminTab = (tabId) => {
        // --- MODIFIED --- Added 'manageUsers'
        Object.values(adminTabs).forEach(tab => {
            if (tab) { // Add check in case a tab is missing
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
    
    const formatISODate = (isoString) => {
        if (!isoString) return 'N/A';
        try {
            return isoString.split('T')[0];
        } catch (e) {
            return isoString;
        }
    };

    // --- NEW: User Session Helpers ---
    const saveUserSession = (user) => {
        currentUser = user;
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        updateUserUI();
    };

    const clearUserSession = () => {
        currentUser = null;
        sessionStorage.removeItem('currentUser');
        updateUserUI();
    };

const updateUserUI = () => {
        if (currentUser) {
            // User is logged in: Show dashboard, hide login
            userLoginButton.classList.add('hidden');
            userDashboardButton.classList.remove('hidden');
        } else {
            // User is logged out: Show login, hide dashboard
            userLoginButton.classList.remove('hidden');
            userDashboardButton.classList.add('hidden');
        }
    };
    // --- END NEW ---

    // --- API CALLS ---

    const loadDeals = async () => {
        // ... (This function is unchanged)
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
        // ... (This function is unchanged)
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
        // ... (This function is unchanged)
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

    const loadOrders = async () => {
        // ... (This function is unchanged)
        if (!adminToken) return;

        ordersLoader.classList.remove('hidden');
        ordersContainer.innerHTML = '';
        const buyerFilter = orderFilter.value;
        const statusFilter = orderStatusFilter.value;

        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'getOrders', token: adminToken, buyerFilter, statusFilter }),
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
        // ... (This function is unchanged)
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

    const handleMarkDelivered = async (orderId, btn) => {
        // ... (This function is unchanged)
        if (!adminToken) return;
        
        btn.disabled = true;
        btn.textContent = 'Marking...';

        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'markDelivered', token: adminToken, orderId }),
                headers: { 'Content-Type': 'text/plain;charset=utf-8' }
            });
            const result = await response.json();

            if (result.status === 'success') {
                btn.textContent = 'Delivered';
                btn.classList.replace('bg-green-500', 'bg-gray-400');
                btn.classList.replace('hover:bg-green-600', 'disabled:bg-gray-400');
                const statusBadge = btn.closest('.order-card').querySelector('.order-status');
                if (statusBadge) {
                    statusBadge.textContent = 'Delivered';
                    statusBadge.classList.replace('bg-yellow-100', 'bg-green-100');
                    statusBadge.classList.replace('text-yellow-800', 'text-green-800');
                }
            } else {
                showMessage('Error', `Failed to mark as delivered: ${result.message}`); // Use showMessage
                btn.disabled = false;
                btn.textContent = 'Mark Delivered';
            }
        } catch (error) {
            showMessage('Error', 'An error occurred.'); // Use showMessage
            btn.disabled = false;
            btn.textContent = 'Mark Delivered';
        }
    };

    const handleBookingSubmit = async (e) => {
        // --- MODIFIED --- Added UserID
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
            userId: currentUser ? currentUser.userId : null, // --- NEW ---
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

    // --- NEW: API Calls for User and Admin-User-Management ---

    /**
     * --- NEW ---
     * Handles user login request.
     */
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
                // If they were trying to book, they can now continue.
                // Otherwise, they are just logged in.
            } else {
                userLoginError.textContent = result.message || 'Login failed.';
            }
        } catch (error) {
            userLoginError.textContent = 'An error occurred. Please try again.';
        } finally {
            showSubmitLoading(userLoginSubmitBtn, false);
        }
    };

    /**
     * --- NEW ---
     * Fetches orders for the currently logged-in user.
     */
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
                renderUserOrders(result.orders); // Use a new render function
            } else {
                userOrdersContainer.innerHTML = `<p class="text-red-500">${result.message}</p>`;
            }
        } catch (error) {
            userOrdersContainer.innerHTML = `<p class="text-red-500">Failed to load your orders.</p>`;
        } finally {
            userOrdersLoader.classList.add('hidden');
        }
    };

    /**
     * --- NEW ---
     * (Admin) Handles adding a new user.
     */
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
                loadUsers(); // Refresh the list
            } else {
                addUserMessage.textContent = result.message || 'Failed to add user.';
                addUserMessage.classList.add('text-red-500');
            }
        } catch (error) {
            addUserMessage.textContent = 'An error occurred.';
            addUserMessage.classList.add('text-red-500');
        }
    };

    /**
     * --- NEW ---
     * (Admin) Fetches and displays the list of users.
     */
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
        // ... (This function is unchanged)
        dealsGrid.innerHTML = '';
        deals.forEach(deal => {
            const card = document.createElement('div');
            card.className = 'group bg-white shadow-xl rounded-xl overflow-hidden transition-all duration-300';
            card.innerHTML = `
                <div class="h-56 w-full overflow-hidden bg-gray-200">
                    <img class="h-full w-full object-contain transition-transform duration-300 group-hover:scale-110" src="${deal.ImageUrl}" alt="${deal.ProductName}" onerror="this.src='https://placehold.co/600x400/e2e8f0/94a3b8?text=Image+Not+Found';">
                </div>
<div class="p-6 flex flex-col flex-grow">
    <h3 class="text-xl font-semibold mb-2 truncate" title="${deal.ProductName}">${deal.ProductName}</h3>
    <div class="flex justify-between items-baseline mb-4 mt-auto"> <!-- mt-auto pushes it to bottom --><span class="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full whitespace-nowrap mr-2">
            Commission: ₹${deal.Commission}
        </span>
        <span class="text-lg font-bold text-indigo-600 whitespace-nowrap flex-shrink-0">
            ${deal.QuantityLeft} Left
        </span>
    </div>
    <button class="show-deal-btn w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
        Show Deal
    </button>
</div>
            `;
            card.querySelector('.show-deal-btn').addEventListener('click', () => showDealDetail(deal.ProductID));
            dealsGrid.appendChild(card);
        });
    };

    const renderOrders = (orders) => {
        // ... (This function is unchanged, but we add UserID)
        ordersContainer.innerHTML = '';
        if (orders.length === 0) {
            ordersContainer.innerHTML = '<p class="text-gray-500 text-center">No orders found for this filter.</p>';
            return;
        }

        orders.forEach(order => {
            const isDelivered = order.Status === 'Delivered';
            const card = document.createElement('div');
            card.className = 'order-card bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200';
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
                    <div><strong>Delivery:</strong> ${formatISODate(order.UserDeliveryDate)}</div>
                    <div><strong>UPI:</strong> ${order.UserUpiId}</div>
                </div>
                <button class="deliver-btn mt-4 ${isDelivered ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'} text-white text-sm font-semibold py-1 px-3 rounded-md disabled:bg-gray-400" ${isDelivered ? 'disabled' : ''}>
                    ${isDelivered ? 'Delivered' : 'Mark as Delivered'}
                </button>
            `;
            
            if (!isDelivered) {
                card.querySelector('.deliver-btn').addEventListener('click', (e) => handleMarkDelivered(order.OrderID, e.target));
            }
            ordersContainer.appendChild(card);
        });
    };

    /**
     * --- NEW ---
     * Renders the orders list for the user dashboard.
     */
    const renderUserOrders = (orders) => {
        userOrdersContainer.innerHTML = '';
        if (orders.length === 0) {
            userOrdersContainer.innerHTML = '<p class="text-gray-500 text-center">You have no bookings yet.</p>';
            return;
        }

        orders.forEach(order => {
            const isDelivered = order.Status === 'Delivered';
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
                    <div><strong>Name:</strong> ${order.UserName}</div>
                    <div><strong>Mobile:</strong> ${order.UserMobile}</div>
                    <div><strong>Delivery:</strong> ${formatISODate(order.UserDeliveryDate)}</div>
                    <div><strong>UPI:</strong> ${order.UserUpiId}</div>
                </div>
            `;
            userOrdersContainer.appendChild(card);
        });
    };

    const renderAdminDeals = (deals) => {
        // ... (This function is unchanged)
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

    /**
     * --- NEW ---
     * (Admin) Renders the list of users.
     */
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
        // ... (This function is unchanged)
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
        // ... (This function is unchanged)
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
        // ... (This function is unchanged)
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

        showModal('deal-detail-modal'); // Use ID
    };

    const showBookingForm = (productId) => {
        // --- MODIFIED --- Added login check
        if (!currentUser) {
            showModal('login-prompt-modal'); // Use ID
            return;
        }
        // --- End modification ---

        closeModal('deal-detail-modal'); // Use ID
        bookingForm.reset();
        bookingError.textContent = '';
        bookingProductId.value = productId;
        
        showModal('booking-form-modal'); // Use ID
        startBookingTimer();
    };

    const startBookingTimer = () => {
        // ... (This function is unchanged)
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
        // --- MODIFIED --- Added user dashboard
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
            // Only clear hash if it's not an admin hash
            if (hash !== '#admin-panel' && hash !== '#admin-login') {
                window.location.hash = '';
            }
        }
    };
    
    // --- EVENT LISTENERS ---
    
    window.addEventListener('hashchange', handleHashChange);
    
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

    // --- NEW: User Auth Listeners ---
    userLoginButton.addEventListener('click', () => showModal('user-login-modal'));
    userLogoutButton.addEventListener('click', () => {
        clearUserSession();
        window.location.hash = '#'; // Go to home page
        showPage('deals'); // Ensure deals page is shown
    });
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
    });
    
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
    // --- NEW ---
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
        loadOrders();
    });


    // --- INITIALIZATION ---
    updateUserUI(); // --- NEW --- Set initial UI state for user
    loadDeals();
    handleHashChange();
});
