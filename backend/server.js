// ==================== IMPORTS ====================
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ==================== APP & PORT ====================
const app = express();
const PORT = 5000;

// ==================== MIDDLEWARES ====================
app.use(cors());
app.use(bodyParser.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, "../frontend")));

// ==================== MONGODB CONNECTION ====================
const MONGO_URI = "mongodb+srv://sv894871_db_user:l2kGcVJFMRsp6vEJ@cluster0.cd4fsai.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI);
    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    process.exit(1);
  }
};
connectDB();

// ==================== USER MODEL ====================
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
const User = mongoose.model("User", userSchema);

// ==================== PRODUCT MODEL ====================
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
});
const Product = mongoose.model("Product", productSchema);

// ==================== ORDER MODEL ====================
const orderSchema = new mongoose.Schema({
  customerName: String,
  customerEmail: String,
  items: [{ name: String, quantity: Number, price: Number }],
  total: Number,
  createdAt: { type: Date, default: Date.now },
});
const Order = mongoose.model("Order", orderSchema);

// ==================== USER ROUTES ====================
// Register
app.post("/api/users/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("❌ Registration Error:", err);
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
});

// Login
app.post("/api/users/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email and password are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, "SECRET_KEY", { expiresIn: "1d" });
    res.json({ message: "Login successful", token });
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({ message: "Login failed", error: err.message });
  }
});

// ==================== PRODUCT ROUTES ====================
// Get all products
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

// Add product (admin)
app.post("/api/products", async (req, res) => {
  try {
    const { name, price, image } = req.body;
    if (!name || !price || !image)
      return res.status(400).json({ message: "All fields are required" });

    const product = new Product({ name, price, image });
    await product.save();
    res.status(201).json({ message: "Product added" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add product" });
  }
});

// Delete product
app.delete("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Product.findByIdAndDelete(id);
    res.json({ message: "Product deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete product" });
  }
});

// ==================== ORDER ROUTES ====================
// Place order (customer)
app.post("/api/orders", async (req, res) => {
  try {
    const { products, total } = req.body;
    if (!products || products.length === 0)
      return res.status(400).json({ message: "No products in order" });

    // Decode user from token (simplified for now)
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, "SECRET_KEY");
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const items = [];
    for (let p of products) {
      const product = await Product.findById(p.productId);
      if (product) {
        items.push({
          name: product.name,
          price: product.price,
          quantity: p.qty,
        });
      }
    }

    const order = new Order({
      customerName: user.name,
      customerEmail: user.email,
      items,
      total,
    });
    await order.save();

    res.status(201).json({ message: "Order placed successfully" });
  } catch (err) {
    console.error("❌ Order Error:", err);
    res.status(500).json({ message: "Failed to place order", error: err.message });
  }
});

// Get all orders (admin)
app.get("/api/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("❌ Orders Fetch Error:", err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

// ==================== DEFAULT ROUTE ====================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
