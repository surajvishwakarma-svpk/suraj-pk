/* ===== Global Cart Handling ===== */
let cart = JSON.parse(localStorage.getItem("cart")) || [];

/* ===== Toggle Customer/Admin Login ===== */
function showCustomerLogin() {
  document.getElementById("customerLoginForm").style.display = "block";
  document.getElementById("adminLoginForm").style.display = "none";
  document.getElementById("register-link").style.display = "block";
}

function showAdminLogin() {
  document.getElementById("customerLoginForm").style.display = "none";
  document.getElementById("adminLoginForm").style.display = "block";
  document.getElementById("register-link").style.display = "none";
}

/* ===== Customer Registration ===== */
async function registerUser(event) {
  event.preventDefault();
  const name = document.getElementById("reg-name").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value.trim();

  if (!name || !email || !password) return alert("All fields are required");

  try {
    const res = await fetch("http://localhost:5000/api/users/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();

    if (res.ok) {
      alert("Registration successful! Please login.");
      window.location.href = "login.html";
    } else {
      alert(data.message || data.error || "Registration failed");
    }
  } catch (err) {
    console.error(err);
    alert("Error registering user");
  }
}

/* ===== Customer Login ===== */
async function loginUser(event) {
  event.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) return alert("Please enter email and password");

  try {
    const res = await fetch("http://localhost:5000/api/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (res.ok && data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("userRole", "customer");
      alert("Customer login successful!");
      window.location.href = "index.html";
    } else {
      alert(data.message || "Login failed");
    }
  } catch (err) {
    console.error(err);
    alert("Error logging in");
  }
}

/* ===== Admin Login ===== */
function loginAdmin(event) {
  event.preventDefault();
  const username = document.getElementById("admin-username").value.trim();
  const password = document.getElementById("admin-password").value.trim();

  // Admin credentials can be hardcoded for now
  if (username === "admin" && password === "admin123") {
    localStorage.setItem("userRole", "admin");
    window.location.href = "admin.html";
  } else {
    alert("Invalid admin credentials");
  }
}

/* ===== Logout ===== */
function logout() {
  localStorage.removeItem("userRole");
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

/* ===== Load Products (Customer) ===== */
async function loadProducts() {
  try {
    const res = await fetch("http://localhost:5000/api/products");
    const products = await res.json();
    const container = document.getElementById("product-list");
    if (!container) return;
    container.innerHTML = "";

    products.forEach(p => {
      const div = document.createElement("div");
      div.classList.add("product-card");
      div.innerHTML = `
        <img src="${p.image}" alt="${p.name}">
        <h3>${p.name}</h3>
        <p>₹${p.price}</p>
        <button onclick="addToCart('${p._id}','${p.name}',${p.price})">Add to Cart</button>
      `;
      container.appendChild(div);
    });
  } catch (err) {
    console.error(err);
  }
}

/* ===== Cart Functions ===== */
function addToCart(id, name, price) {
  const existing = cart.find(item => item.id === id);
  if (existing) existing.qty += 1;
  else cart.push({ id, name, price, qty: 1 });
  localStorage.setItem("cart", JSON.stringify(cart));
  alert(`${name} added to cart!`);
}

function loadCart() {
  const container = document.getElementById("cart-items");
  if (!container) return;
  container.innerHTML = "";
  let total = 0;
  cart.forEach(item => {
    total += item.price * item.qty;
    const li = document.createElement("li");
    li.innerHTML = `
      ${item.name} (x${item.qty}) - ₹${item.price * item.qty}
      <button onclick="removeFromCart('${item.id}')">Remove</button>
    `;
    container.appendChild(li);
  });
  const totalEl = document.getElementById("cart-total");
  if (totalEl) totalEl.innerText = `Total: ₹${total}`;
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  localStorage.setItem("cart", JSON.stringify(cart));
  loadCart();
}

/* ===== Place Order ===== */
async function placeOrder() {
  if (!cart.length) return alert("Your cart is empty!");
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Please login first!");
    window.location.href = "login.html";
    return;
  }

  const products = cart.map(item => ({ productId: item.id, qty: item.qty }));
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  try {
    const res = await fetch("http://localhost:5000/api/orders", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ products, total })
    });
    const data = await res.json();
    if (res.ok) {
      alert("Order placed successfully!");
      cart = [];
      localStorage.removeItem("cart");
      loadCart();
    } else {
      alert(data.message || "Failed to place order");
    }
  } catch (err) {
    console.error(err);
    alert("Error placing order");
  }
}

/* ===== Admin Product Management ===== */
async function loadAdminProducts() {
  try {
    const res = await fetch("http://localhost:5000/api/products");
    const products = await res.json();
    const container = document.getElementById("admin-product-list");
    if (!container) return;
    container.innerHTML = "";

    products.forEach(p => {
      const li = document.createElement("li");
      li.innerHTML = `
        ${p.name} - ₹${p.price} 
        <button onclick="deleteProduct('${p._id}')">Delete</button>
      `;
      container.appendChild(li);
    });
  } catch (err) {
    console.error(err);
  }
}

async function addProduct(event) {
  event.preventDefault();
  const name = document.getElementById("product-name").value.trim();
  const price = document.getElementById("product-price").value.trim();
  const image = document.getElementById("product-image").value.trim();
  if (!name || !price || !image) return alert("All fields are required");

  try {
    const res = await fetch("http://localhost:5000/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, price, image })
    });
    if (res.ok) {
      alert("Product added!");
      document.getElementById("add-product-form").reset();
      loadAdminProducts();
      if (document.getElementById("product-list")) loadProducts();
    } else {
      const data = await res.json();
      alert(data.message || "Failed to add product");
    }
  } catch (err) {
    console.error(err);
    alert("Error adding product");
  }
}

async function deleteProduct(id) {
  try {
    const res = await fetch(`http://localhost:5000/api/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      alert("Product deleted!");
      loadAdminProducts();
      if (document.getElementById("product-list")) loadProducts();
    } else {
      const data = await res.json();
      alert(data.message || "Failed to delete product");
    }
  } catch (err) {
    console.error(err);
    alert("Error deleting product");
  }
}

/* ===== Auto Load Products/Cart/Admin ===== */
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("product-list")) loadProducts();
  if (document.getElementById("cart-items")) loadCart();
  if (document.getElementById("admin-product-list")) loadAdminProducts();
});
/* ===== Admin Orders ===== */
async function loadAdminOrders() {
  try {
    const res = await fetch("http://localhost:5000/api/orders");
    const orders = await res.json();
    const container = document.getElementById("admin-order-list");
    const notify = document.getElementById("order-notification");

    if (!container) return;

    container.innerHTML = "";

    if (orders.length === 0) {
      container.innerHTML = "<li>No orders yet.</li>";
      notify.innerText = "";
      return;
    }

    // Show "new order" message for recent one
    notify.innerText = "New Orders Available!";

    orders.forEach(order => {
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${order.customerName}</strong> (${order.customerEmail})<br>
        Total: ₹${order.total}<br>
        Products: ${order.items
          .map(i => `${i.name} (x${i.quantity})`)
          .join(", ")}<br>
        <small>Placed: ${new Date(order.createdAt).toLocaleString()}</small>
      `;
      container.appendChild(li);
    });
  } catch (err) {
    console.error("Error loading orders", err);
  }
}

// Make sure admin loads orders automatically
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("admin-order-list")) {
    loadAdminOrders();
  }
});
