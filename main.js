document.addEventListener('DOMContentLoaded', () => {
    // --- STATE ---
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby2P51t3GVR3kH40HIHlkSG1dbA6wo_7vm7ObBxQUeveJXgH6FHuAptDJ9ZXQJx2mjU/exec";
    let adminToken = sessionStorage.getItem('adminToken');
    let currentDeals = [];
    let bookingTimerInterval = null;
    let uniqueBuyers = new Set();

    // --- DOM SELECTORS ---
    const pages = {
        deals: document.getElementById('deals-page'),
        adminLogin: document.getElementById('admin-login'),
        adminPanel: document.getElementById('admin-panel'),
    };
    const modals = {
        dealDetail: document.getElementById('deal-detail-modal'),
        bookingForm: document.getElementById('booking-form-modal'),
        message: document.getElementById('message-modal'),
    };
    const dealsGrid = document.getElementById('deals-grid');
    const dealsLoader = document.getElementById('deals-loader');
    const noDealsMessage = document.getElementById('no-deals-message');
    
    // Admin Login
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const logoutButton = document.getElementById('logout-button');

    // Admin Panel
    const adminTabs = {
        addDeal: document.getElementById('tab-add-deal'),
        viewOrders: document.getElementById('tab-view-orders'),
        viewDeals: document.getElementById('tab-view-deals'), // Add this
    };
    const adminContents = {
        addDeal: document.getElementById('content-add-deal'),
        viewOrders: document.getElementById('content-view-orders'),
        viewDeals: document.getElementById('content-view-deals'), // Add this
    };
    const addDealForm = document.getElementById('add-deal-form');
    const addDealMessage = document.getElementById('add-deal-message');

    // Admin Orders
    const ordersLoader = document.getElementById('orders-loader');
    const ordersContainer = document.getElementById('orders-container');
    const orderFilter = document.getElementById('order-filter');
    const refreshOrdersBtn = document.getElementById('refresh-orders-btn');

    // Admin Deals
    const adminDealsLoader = document.getElementById('admin-deals-loader'); // Add this
    const adminDealsContainer = document.getElementById('admin-deals-container'); // Add this

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
    let confirmDealButton = document.getElementById('confirm-deal-button'); // Use let

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
    const messageModalCloseBtn = document.getElementById('message-modal-close-btn'); // Add this

    // --- HELPER FUNCTIONS ---

    const showPage = (pageId) => {
        Object.values(pages).forEach(page => page.classList.add('hidden'));
        if (pages[pageId]) {
            pages[pageId].classList.remove('hidden');
        }
    };

    const showModal = (modalId) => {
        if (modals[modalId]) {
            modals[modalId].classList.remove('hidden');
        }
    };

    // Make closeModal global so inline HTML can access it
    window.closeModal = (modalId) => {
        if (modals[modalId]) {
            modals[modalId].classList.add('hidden');
        }
    };
    
    const showMessage = (title, body) => {
        messageTitle.textContent = title;
        messageBody.textContent = body;
        showModal('message');
    };

    const switchAdminTab = (tabId) => {
        Object.values(adminTabs).forEach(tab => {
            tab.classList.remove('border-indigo-500', 'text-indigo-600');
            tab.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
        });
        Object.values(adminContents).forEach(content => content.classList.add('hidden'));

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
            text.classList.add('hidden');
            spinner.classList.remove('hidden');
        } else {
            btn.disabled = false;
            text.classList.remove('hidden');
            spinner.classList.add('hidden');
        }
    };
    
    // --- API CALLS ---

    /**
     * Fetches all available deals from the backend.
     */
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

    /**
     * Handles admin login request.
     */
    const handleAdminLogin = async (e) => {
        e.preventDefault();
        loginError.textContent = '';
        const username = loginForm.querySelector('#username').value;
        const password = loginForm.querySelector('#password').value;
        const loginButton = loginForm.querySelector('button[type="submit"]');

        // Add this: Set loading state for login button
        loginButton.disabled = true;
        loginButton.textContent = 'Logging...';

        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'adminLogin', username, password }),
                headers: { 'Content-Type': 'text/plain;charset=utf-8' } // This line was changed
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
            // Add this: Reset login button state
            loginButton.disabled = false;
            loginButton.textContent = 'Login';
        }
    };

    /**
     * Handles adding a new deal from the admin panel.
     */
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
                headers: { 'Content-Type': 'text/plain;charset=utf-8' } // This line was changed
            });
            const result = await response.json();

            if (result.status === 'success') {
                addDealMessage.textContent = 'Deal added successfully!';
                addDealMessage.classList.remove('text-blue-500');
                addDealMessage.classList.add('text-green-500');
                addDealForm.reset();
                loadDeals(); // Refresh deals list
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
     * Fetches and displays orders in the admin panel.
     */
    const loadOrders = async () => {
        if (!adminToken) return;

        ordersLoader.classList.remove('hidden');
        ordersContainer.innerHTML = '';
        const filterBy = orderFilter.value;

        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'getOrders', token: adminToken, filterBy }),
                headers: { 'Content-Type': 'text/plain;charset=utf-8' } // This line was changed
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

    /**
     * Fetches and displays *deals* in the admin panel.
     */
    const loadAdminDeals = async () => {
        adminDealsLoader.classList.remove('hidden');
        adminDealsContainer.innerHTML = '';
        
        // We can reuse the public currentDeals if they are loaded
        if (currentDeals.length > 0) {
            renderAdminDeals(currentDeals);
            adminDealsLoader.classList.add('hidden');
        } else {
            // If not, fetch them
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
     * Marks an order as "Delivered".
     */
    const handleMarkDelivered = async (orderId, btn) => {
        if (!adminToken) return;
        
        btn.disabled = true;
        btn.textContent = 'Marking...';

        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'markDelivered', token: adminToken, orderId }),
                headers: { 'Content-Type': 'text/plain;charset=utf-8' } // This line was changed
            });
            const result = await response.json();

            if (result.status === 'success') {
                // Optimistic update
                btn.textContent = 'Delivered';
                btn.classList.replace('bg-green-500', 'bg-gray-400');
                btn.classList.replace('hover:bg-green-600', 'disabled:bg-gray-400');
                // Find and update status badge
                const statusBadge = btn.closest('.order-card').querySelector('.order-status');
                if (statusBadge) {
                    statusBadge.textContent = 'Delivered';
                    statusBadge.classList.replace('bg-yellow-100', 'bg-green-100');
                    statusBadge.classList.replace('text-yellow-800', 'text-green-800');
                }
            } else {
                alert(`Failed to mark as delivered: ${result.message}`);
                btn.disabled = false;
                btn.textContent = 'Mark Delivered';
            }
        } catch (error) {
            alert('An error occurred.');
            btn.disabled = false;
            btn.textContent = 'Mark Delivered';
        }
    };

    /**
     * Submits the user's booking form.
     */
    const handleBookingSubmit = async (e) => {
        e.preventDefault();
        bookingError.textContent = '';
        showSubmitLoading(submitBookingBtn, true);
        
        // Stop the timer
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
        };

        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'submitOrder', ...bookingData }),
                headers: { 'Content-Type': 'text/plain;charset=utf-8' } // This line was changed
            });
            const result = await response.json();

            if (result.status === 'success') {
                closeModal('bookingForm');
                showMessage('Success!', 'Your deal has been booked successfully. You will receive your commission after the return period.');
                loadDeals(); // Refresh deals to show updated quantity
            } else {
                bookingError.textContent = result.message || 'Booking failed. Please try again.';
                if (result.message.includes('out of stock')) {
                    // If it's out of stock, close the form and refresh deals
                    setTimeout(() => {
                        closeModal('bookingForm');
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

    // --- RENDER FUNCTIONS ---

    /**
     * Renders the deal cards on the main page.
     */
    const renderDeals = (deals) => {
        dealsGrid.innerHTML = '';
        deals.forEach(deal => {
            const card = document.createElement('div');
            card.className = 'group bg-white shadow-xl rounded-xl overflow-hidden transition-all duration-300';
            card.innerHTML = `
                <div class="h-56 w-full overflow-hidden bg-gray-200">
                    <img class="h-full w-full object-contain transition-transform duration-300 group-hover:scale-110" src="${deal.ImageUrl}" alt="${deal.ProductName}" onerror="this.src='https://placehold.co/600x400/e2e8f0/94a3b8?text=Image+Not+Found';">
                </div>
                <div class="p-6">
                    <h3 class="text-xl font-semibold mb-2 truncate" title="${deal.ProductName}">${deal.ProductName}</h3>
                    <div class="flex justify-between items-center mb-4">
                        <span class="inline-block bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                            Commission: ₹${deal.Commission}
                        </span>
                        <span class="text-lg font-bold text-indigo-600">
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

    /**
     * Renders the orders list in the admin panel.
     */
    const renderOrders = (orders) => {
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
                    </div>
                    <span class="order-status inline-block ${isDelivered ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'} text-xs font-medium px-2.5 py-0.5 rounded-full">${order.Status}</span>
                </div>
                <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div><strong>Name:</strong> ${order.UserName}</div>
                    <div><strong>Mobile:</strong> ${order.UserMobile}</div>
                    <div><strong>Delivery:</strong> ${order.UserDeliveryDate}</div>
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
     * Renders the deals list in the admin panel.
     */
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

    /**
     * Populates the filter dropdown with unique buyer names.
     */
    const populateOrderFilter = () => {
        const currentVal = orderFilter.value;
        orderFilter.innerHTML = '<option>All</option>'; // Reset
        uniqueBuyers.forEach(buyer => {
            const option = document.createElement('option');
            option.value = buyer;
            option.textContent = buyer;
            orderFilter.appendChild(option);
        });
        orderFilter.value = currentVal; // Preserve filter
    };

    // --- FLOW FUNCTIONS ---

    /**
     * Populates the Add Deal form with data from an existing deal.
     */
    const populateDealForm = (productId) => {
        const deal = currentDeals.find(d => d.ProductID === productId);
        if (!deal) return;

        // Populate all fields
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

        // Switch to the Add Deal tab
        switchAdminTab('addDeal');
        
        // Show a message
        addDealMessage.textContent = 'Deal data copied. Modify as needed and click "Submit Deal" to create a new entry.';
        addDealMessage.classList.remove('text-red-500', 'text-green-500');
        addDealMessage.classList.add('text-blue-500');
    };

    /**
     * Shows the deal detail modal for a specific product.
     */
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

        // Remove old listener and add new one
        const newConfirmBtn = confirmDealButton.cloneNode(true);
        newConfirmBtn.id = 'confirm-deal-button'; // Ensure it has the same ID if needed
        confirmDealButton.parentNode.replaceChild(newConfirmBtn, confirmDealButton);
        confirmDealButton = newConfirmBtn; // Re-assign the variable
        confirmDealButton.addEventListener('click', () => showBookingForm(productId));

        showModal('dealDetail');
    };

    /**
     * Shows the booking form and starts the 10-minute timer.
     */
    const showBookingForm = (productId) => {
        closeModal('dealDetail');
        bookingForm.reset();
        bookingError.textContent = '';
        bookingProductId.value = productId;
        
        showModal('bookingForm');
        startBookingTimer();
    };

    /**
     * Starts and manages the 10-minute booking timer.
     */
    const startBookingTimer = () => {
        if (bookingTimerInterval) {
            clearInterval(bookingTimerInterval);
        }

        let timeLeft = 600; // 10 minutes in seconds
        
        const updateTimer = () => {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            bookingTimer.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

            if (timeLeft <= 0) {
                clearInterval(bookingTimerInterval);
                bookingTimerInterval = null;
                closeModal('bookingForm');
                showMessage('Time Expired', 'The 10-minute booking window has closed. Please try again.');
            }
            timeLeft--;
        };

        updateTimer(); // Call immediately
        bookingTimerInterval = setInterval(updateTimer, 1000);
    };

    /**
     * Handles page navigation based on the URL hash.
     */
    const handleHashChange = () => {
        const hash = window.location.hash;
        if (hash === '#admin-panel' && adminToken) {
            showPage('adminPanel');
            switchAdminTab('addDeal'); // Default to add deal
            loadOrders(); // Load orders in background
        } else if (hash === '#admin-login') {
            showPage('adminLogin');
        } else {
            showPage('deals');
            window.location.hash = '';
        }
    };
    
    // --- EVENT LISTENERS ---
    
    // Navigation
    window.addEventListener('hashchange', handleHashChange);
    
    // User Flow
    bookingForm.addEventListener('submit', handleBookingSubmit);
    cancelBookingBtn.addEventListener('click', () => {
        if (bookingTimerInterval) {
            clearInterval(bookingTimerInterval);
            bookingTimerInterval = null;
        }
        closeModal('bookingForm');
    });
    messageModalCloseBtn.addEventListener('click', () => closeModal('message')); // Add this

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
        loadOrders(); // Refresh on tab click
    });
    adminTabs.viewDeals.addEventListener('click', () => { // Add this block
        switchAdminTab('viewDeals');
        loadAdminDeals();
    });

    addDealForm.addEventListener('submit', handleAddDeal);
    
    // Admin Orders
    orderFilter.addEventListener('change', loadOrders);
    refreshOrdersBtn.addEventListener('click', loadOrders);


    // --- INITIALIZATION ---
    loadDeals(); // Load deals on page load
    handleHashChange(); // Check hash on load
});