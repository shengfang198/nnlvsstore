const API = "https://nnlvsstore.onrender.com";

// Cart functionality
let cart = [];

// Load cart from localStorage if available
if (localStorage.getItem('cart')) {
    cart = JSON.parse(localStorage.getItem('cart'));
    updateCartCount();
}

// ===== Elements =====
const loginBtn = document.getElementById('login-btn');
const loginModal = document.getElementById('login-modal');
const closeLogin = document.getElementById('close-login');
const loginSubmit = document.getElementById('login-submit');

const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const showSignupLink = document.getElementById('show-signup');
const showLoginLink = document.getElementById('show-login');
const signupSubmit = document.getElementById('signup-submit');

const logoutBtn = document.getElementById('logout-btn');



// ===== OAuth Buttons =====
// ===== Google OAuth Login (completed) =====
const googleLoginBtn = document.getElementById('google-login');

googleLoginBtn.addEventListener('click', () => {
    google.accounts.id.initialize({
        client_id: '942613118245-ber24g6vpbqtj0lkturq0mo12hqinf59.apps.googleusercontent.com',
        callback: handleGoogleCredentialResponse
    });

    google.accounts.id.prompt(); // show Google Sign-In popup
});

async function handleGoogleCredentialResponse(response) {
    try {
        // Extract the Google ID token
        const googleIdToken = response.credential;
        if (!googleIdToken) {
            showNotification('Google token missing', 'error');
            return;
        }

        // Send the token to your server
        const res = await fetch('https://nnlvsstore.onrender.com/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: googleIdToken })
        });

        const data = await res.json();
        console.log('Server Response:', data);

        if (res.ok && data.token) {
            // Save the JWT locally
            localStorage.setItem('token', data.token);

            // Update UI
            showNotification(`Logged in as ${data.user.name}`, 'success');
            loginBtn.innerHTML = `<i class="far fa-user-circle"></i><span>${data.user.name.split(' ')[0]}</span>`;
            loginModal.classList.add('hidden');
            document.body.style.overflow = '';

            // Redirect to ecommerce page
            window.location.href = 'myecommerce.html';
        } else {
            showNotification(data.error || 'Google login failed', 'error');
        }
    } catch (err) {
        console.error('Google login error:', err);
        showNotification('Server error', 'error');
    }
}

// ===== Modal Open/Close =====
loginBtn.addEventListener('click', () => {
    loginModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
});

closeLogin.addEventListener('click', () => {
    // Clear input fields
    document.getElementById("login-email").value = "";
    document.getElementById("login-password").value = "";
    document.getElementById("signup-email").value = "";
    document.getElementById("signup-password").value = "";
    document.getElementById("signup-confirm-password").value = "";
    loginModal.classList.add('hidden');
    document.body.style.overflow = '';
});

// ===== Login =====
loginSubmit.addEventListener('click', async () => {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        showNotification('Please fill all fields', 'error');
        return;
    }

    try {
        const res = await fetch('https://nnlvsstore.onrender.com/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        console.log('Login Response:', data); // Debug log

        if (res.ok) {
            showNotification('Logged in successfully!', 'success');
            loginModal.classList.add('hidden');
            document.body.style.overflow = '';
            loginBtn.innerHTML = `<i class="far fa-user-circle"></i><span>${email.split('@')[0]}</span>`;
            localStorage.setItem('token', data.token);


            // Redirect to your page
            window.location.href = 'myecommerce.html';
        } else {
            showNotification(data.error || 'Login failed', 'error');
        }
    } catch (err) {
        console.error(err);
        showNotification('Server error', 'error');
    }
});

// ===== Signup =====
showSignupLink.addEventListener('click', e => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
});

showLoginLink.addEventListener('click', e => {
    e.preventDefault();
    signupForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
});

signupSubmit.addEventListener('click', async () => {
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;

    if (!email || !password || !confirmPassword) {
        showNotification('Please fill all fields', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }

    try {
        const res = await fetch('https://nnlvsstore.onrender.com/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (res.ok) {
            showNotification('Account created successfully! Please login.', 'success');
            signupForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
        } else {
            showNotification(data.error || 'Signup failed', 'error');
        }
    } catch (err) {
        console.error(err);
        showNotification('Server error', 'error');
    }
});

// ===== Logout =====
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    loginBtn.innerHTML = '<i class="far fa-user-circle"></i> Login';
    showNotification('Logged out successfully!', 'success');
    resetCartCount();
    // Redirect to entry page
    window.location.href = 'index.html';
});

// Cart functionality
const cartButton = document.getElementById('cart-button');
const cartSidebar = document.getElementById('cart-sidebar');
const cartBackdrop = document.getElementById('cart-backdrop');
const closeCart = document.getElementById('close-cart');
const addToCartButtons = document.querySelectorAll('.add-to-cart');
const sizeButtons = document.querySelectorAll('.size');
document.getElementById('checkout-btn').addEventListener('click',

    function () {
        window.open('https://shopee.ph/');
    });

cartButton.addEventListener('click', (e) => {
    e.preventDefault();
    cartSidebar.classList.remove('hidden');
    setTimeout(() => {
        cartSidebar.querySelector('div.cart-sidebar').style.transform = 'translateX(0)';
        document.body.style.overflow = 'hidden';
    }, 10);
    updateCartSidebar();
});

const closeCartSidebar = () => {
    cartSidebar.querySelector('div.cart-sidebar').style.transform = 'translateX(100%)';
    setTimeout(() => {
        cartSidebar.classList.add('hidden');
        document.body.style.overflow = '';
    }, 300);
};

closeCart.addEventListener('click', closeCartSidebar);
cartBackdrop.addEventListener('click', closeCartSidebar);

// Track the currently selected size for each product
let selectedSizes = {};

// When a size button is clicked, save it for that product
sizeButtons.forEach(btn => {
    btn.addEventListener('click', function () {
        const productId = this.closest('.product-card').querySelector('.add-to-cart').getAttribute('data-id');
        sizeButtons.forEach(b => b.classList.remove('bg-blue-500', 'text-white'));
        this.classList.add('bg-blue-500', 'text-white');
        selectedSizes[productId] = this.getAttribute('data-size');
        // Remove highlight after 5 seconds (5000 milliseconds)
        setTimeout(() => {
            this.classList.remove('bg-blue-500', 'text-white');
        }, 5000);
    });
});
addToCartButtons.forEach(button => {
    button.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        const name = this.getAttribute('data-name');
        const price = parseFloat(this.getAttribute('data-price'));
        const size = selectedSizes[id] || null;


        // 🚫 If no size, alert and stop
        if (!size) {
            showSizeModal();
            return;
        }


        addToCart(id, name, size, price);
    });
});
let cartSidebarOpened = false;

function addToCart(id, name, size, price) {
    const existingItem = cart.find(item => item.id === id && item.size === size);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id,
            name,
            size,
            price,
            quantity: 1
        });
    }

    // Save to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));

    // Update UI
    updateCartCount();
    updateCartSidebar();

    // Show notification
    showNotification(`${name} added to cart!`, 'success');

    // Open cart sidebar if it's not empty
    if (!cartSidebarOpened && cart.length > 0) {
        cartSidebar.classList.remove('hidden');
        setTimeout(() => {
            cartSidebar.querySelector('div.cart-sidebar').style.transform = 'translateX(0)';
            document.body.style.overflow = 'hidden';
        }, 10);
        cartSidebarOpened = true; // mark as opened
    }
}

function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cart-count').textContent = totalItems;
    // resetCartCount();
}

function resetCartCount() {
    cart = []; // empty the cart
    localStorage.removeItem('cart'); // clear saved cart in storage
    updateCartCount(); // update the displayed count (will show 0)
}

function updateCartSidebar() {
    const cartItemsContainer = document.getElementById('cart-items');
    const sidebarItemCount = document.getElementById('sidebar-item-count');
    const cartSubtotal = document.getElementById('cart-subtotal');

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    sidebarItemCount.textContent = totalItems;
    cartSubtotal.textContent = `₱${subtotal.toLocaleString('en-IN')}`;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
                    <div class="flex flex-col items-center justify-center h-full">
                        <div class="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                            <i class="fas fa-shopping-cart text-gray-400 text-3xl"></i>
                        </div>
                        <h3 class="text-xl font-semibold mb-2">Your cart is empty</h3>
                        <p class="text-gray-500 text-center mb-6">Looks like you haven't added anything to your cart yet</p>
                       
                    </div>
                `;
        return;
    }

    let cartItemsHTML = '<div class="space-y-4">';

    cart.forEach(item => {
        const productImg = document.querySelector(`.add-to-cart[data-id="${item.id}"]`).closest('.product-card').querySelector('.product-img').src;

        cartItemsHTML += `
                    <div class="flex items-start p-3 rounded-lg bg-gray-50">
                        <div class="w-20 h-20 rounded-md bg-white border border-gray-200 overflow-hidden mr-4 flex-shrink-0">
                            <img src="${productImg}" alt="${item.name}" class="w-full h-full object-contain">
                        </div>
                        <div class="flex-1">
                            <h3 class="text-sm font-semibold text-gray-800">${item.name}</h3>
                            <p class="text-xs text-gray-500">Size: ${item.size || 'N/A'}</p>
                            <div class="flex items-center justify-between mt-1">
                                <span class="text-sm font-bold text-gray-700">₱${item.price.toLocaleString('en-IN')}</span>
                                <div class="flex items-center">
                                    <button class="quantity-btn w-6 h-6 flex items-center justify-center bg-gray-200 rounded-l-md" data-id="${item.id}" data-size="${item.size}" data-action="decrease">
                                        <i class="fas fa-minus text-xs"></i>
                                    </button>
                                    <span class="w-8 text-center">${item.quantity}</span>
                                    <button class="quantity-btn w-6 h-6 flex items-center justify-center bg-gray-200 rounded-r-md" data-id="${item.id}" data-size="${item.size}" data-action="increase">
                                        <i class="fas fa-plus text-xs"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <button class="remove-item ml-2 text-gray-400 hover:text-red-500 transition" data-id="${item.id}" data-size="${item.size}">
                            <i class="fas fa-trash-alt text-sm"></i>
                        </button>
                    </div>
                `;
    });

    cartItemsHTML += '</div>';
    cartItemsContainer.innerHTML = cartItemsHTML;

    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', function () {
            const id = this.getAttribute('data-id');
            const size = this.getAttribute('data-size'); // get size from button
            removeFromCart(id, size);
        });
    });

    // Add event listeners to quantity buttons
    document.querySelectorAll('.quantity-btn').forEach(button => {
        button.addEventListener('click', function () {
            const id = this.getAttribute('data-id');
            const action = this.getAttribute('data-action');
            const size = this.getAttribute('data-size'); // Get size
            updateQuantity(id, size, action);
        });
    });
}

function updateQuantity(id, size, action) {
    const item = cart.find(item => item.id === id && item.size === size);

    if (!item) return; // Item not found for that size

    if (action === 'increase') {
        item.quantity += 1;
    } else if (action === 'decrease' && item.quantity > 1) {
        item.quantity -= 1;
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    updateCartSidebar();
}

function removeFromCart(id, size) {
    cart = cart.filter(item => !(item.id === id && item.size === size));
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    updateCartSidebar();
    showNotification('Item removed from cart', 'success');
}

// Checkout button
document.getElementById('checkout-btn').addEventListener('click', () => {
    if (cart.length === 0) {
        showNotification('Your cart is empty!', 'error');
        return;
    }

    showNotification('Proceeding to checkout!', 'success');
    closeCartSidebar();
    // Here you would typically redirect to a checkout page
});

// Notification system
function showNotification(message, type) {
    const notificationArea = document.getElementById('notification-area');
    const notification = document.createElement('div');

    notification.className = `notification px-4 py-3 rounded-lg shadow-md flex items-center ${type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`;
    notification.innerHTML = `
                <i class="${type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'} mr-2"></i>
                <span class="flex-1 text-sm">${message}</span>
                <button class="ml-4 -mr-1">
                    <i class="fas fa-times"></i>
                </button>
            `;

    notificationArea.appendChild(notification);

    // Auto remove notification after 3 seconds
    const timeout = setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);

    // Add click to dismiss
    notification.querySelector('button').addEventListener('click', () => {
        clearTimeout(timeout);
        notification.remove();
    });
}

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === loginModal) {
        loginModal.classList.add('hidden');
        document.body.style.overflow = '';
    }
});

// Product search functionality (simplified)
document.querySelectorAll('.search-bar button').forEach(button => {
    button.addEventListener('click', () => {
        const input = button.closest('.search-bar').querySelector('input');
        const query = input.value.trim();
        if (query) {
            showNotification(`Searching for: ${query}`, 'success');
            input.value = '';
        }
    });
});

// Allow search on Enter key
document.querySelectorAll('.search-bar input').forEach(input => {
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = input.value.trim();
            if (query) {
                showNotification(`Searching for: ${query}`, 'success');
                input.value = '';
            }
        }
    });
});

for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    console.log(key, value);
}

function showSizeModal() {
    document.getElementById("sizeModal").classList.remove("hidden");
    document.getElementById("sizeModal").classList.add("flex");
}

document.getElementById("closeSizeModal").addEventListener("click", () => {
    document.getElementById("sizeModal").classList.add("hidden");
    document.getElementById("sizeModal").classList.remove("flex");
});

// product details modal functionality

const products = [
    {
        id: "shirt01",
        name: "Astro Shirt",
        images: ["white.png", "red.png", "blue.png"]
    },
    {
        id: "shirt02",
        name: "Tokyo",
        images: ["white.png", "white.png", "white.png"]
    },
    {
        id: "shirt03",
        name: "Cool Shirt",
        images: ["white.png", "white.png", "white.png"]
    },
    {
        id: "shirt04",
        name: "Cool Shirt",
        images: ["white.png", "white.png", "white.png"]
    },
    {
        id: "shirt05",
        name: "Cool Shirt",
        images: ["white.png", "white.png", "white.png"]
    },
    {
        id: "shirt06",
        name: "Cool Shirt",
        images: ["white.png", "white.png", "white.png"]
    },
    {
        id: "shirt07",
        name: "Cool Shirt",
        images: ["white.png", "white.png", "white.png"]
    },
    {
        id: "shirt08",
        name: "Cool Shirt",
        images: ["white.png", "white.png", "white.png"]
    },
    {
        id: "shirt09",
        name: "Cool Shirt",
        images: ["white.png", "white.png", "white.png"]
    },
    {
        id: "shirt10",
        name: "Cool Shirt",
        images: ["white.png", "white.png", "white.png"]
    }

];

function openDetailsModal(product) {
    // Set modal content
    document.getElementById('modal-title').textContent = product.name;
    document.getElementById('modal-image').src = product.images[0];

    // Show additional images
    const imagesContainer = document.getElementById('modal-images');
    imagesContainer.innerHTML = "";
    product.images.forEach(img => {
        const imgElement = document.createElement('img');
        imgElement.src = img;
        imgElement.className = "w-16 h-16 object-cover rounded cursor-pointer";
        imgElement.onclick = () => {
            document.getElementById('modal-image').src = img;
        };
        imagesContainer.appendChild(imgElement);
    });

    // Show modal
    document.getElementById('details-modal').classList.remove('hidden');
    document.getElementById('details-modal').classList.add('flex');
}

// Event listeners for all buttons
document.querySelectorAll('.view-details-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const productId = btn.getAttribute('data-id');
        const product = products.find(p => p.id === productId);
        if (product) {
            openDetailsModal(product);
        }
    });
});

// Close modal
document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('details-modal').classList.add('hidden');
    document.getElementById('details-modal').classList.remove('flex');
});

// Close modal when clicking outside the modal content
document.getElementById('details-modal').addEventListener('click', function (event) {
    // Check if the click target is the modal background (overlay)
    if (event.target === this) {
        this.classList.add('hidden');
        this.classList.remove('flex');
    }
});


document.querySelectorAll('.tiltBox').forEach(tiltBox => {
    tiltBox.addEventListener('mousemove', (e) => {
        const rect = tiltBox.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const angleX = (y - centerY) / 20;
        const angleY = (centerX - x) / 20;

        tiltBox.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg)`;
    });

    tiltBox.addEventListener('mouseout', () => {
        tiltBox.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
    });
});
// // Cursor trail applied to whole page
// const dot = document.querySelector('.cursor-dot');
// const circle = document.querySelector('.cursor-circle');

// let mouseX = 0, mouseY = 0;
// let dotX = 0, dotY = 0;
// let circleX = 0, circleY = 0;
// let dotSpeed = 0.2;
// let circleSpeed = 0.1;

// window.addEventListener('mousemove', (e) => {
//     mouseX = e.clientX;
//     mouseY = e.clientY;
// });

// function animateCursor() {
//     // Dot animation
//     let distX = mouseX - dotX;
//     let distY = mouseY - dotY;

//     dotX += distX * dotSpeed;
//     dotY += distY * dotSpeed;

//     dot.style.left = dotX + 'px';
//     dot.style.top = dotY + 'px';

//     // Circle animation
//     distX = mouseX - circleX;
//     distY = mouseY - circleY;

//     circleX += distX * circleSpeed;
//     circleY += distY * circleSpeed;

//     circle.style.left = circleX + 'px';
//     circle.style.top = circleY + 'px';

//     requestAnimationFrame(animateCursor);
// }

// animateCursor();

const searchInput = document.querySelector('.search-bar input');
const searchBtn = document.querySelector('.search-bar button');
const productContainer = document.querySelector('#product-container'); // container where products are rendered

function renderProducts(filteredProducts) {
    productContainer.innerHTML = ''; // clear previous products
    filteredProducts.forEach(product => {
        const card = document.createElement('div');
        card.classList.add('product-card');
        card.setAttribute('data-id', product.id);
        card.setAttribute('data-name', product.name);

        card.innerHTML = `
            <img src="${product.images[0]}" alt="${product.name}" class="product-img">
            <h3 class="mt-2 font-semibold">${product.name}</h3>
        `;

        productContainer.appendChild(card);
    });
}

function searchProducts() {
    const query = searchInput.value.toLowerCase().trim();
    const filtered = products.filter(p => p.name.toLowerCase().includes(query));
    renderProducts(filtered);
}

// Initial render (optional)
renderProducts(products);

// Event listeners
searchInput.addEventListener('input', searchProducts);
searchBtn.addEventListener('click', searchProducts);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchProducts();
});








