const Order = require("../models/order");

// ==================== Place New Order ====================
const placeorder = async (req, res) => {
  try {
    const { userId, products, totalPrice } = req.body;

    if (!userId || !products || products.length === 0) {
      return res.status(400).json({ message: "UserId and products required" });
    }

    const order = new Order({
      user: userId,
      products: products.map(p => ({
        product: p.product,
        quantity: p.qty || 1,
      })),
      totalPrice,
    });

    await order.save();
    res.status(201).json(order);
  } catch (error) {
    console.error("❌ Error placing order:", error);
    res.status(500).json({ message: "Error placing order", error });
  }
};

// ==================== Get Orders by User ====================
const getuserorders = async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ user: userId })
      .populate("products.product", "name price");
    res.json(orders);
  } catch (error) {
    console.error("❌ Error fetching user orders:", error);
    res.status(500).json({ message: "Error fetching orders", error });
  }
};

// ==================== Get All Orders (Admin) ====================
const getallorders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("products.product", "name price");
    res.json(orders);
  } catch (error) {
    console.error("❌ Error fetching all orders:", error);
    res.status(500).json({ message: "Error fetching all orders", error });
  }
};

// ==================== Update Order Status ====================
const updateorderstatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error("❌ Error updating order:", error);
    res.status(500).json({ message: "Error updating order", error });
  }
};

module.exports = {
  placeorder,
  getuserorders,
  getallorders,
  updateorderstatus,
};
