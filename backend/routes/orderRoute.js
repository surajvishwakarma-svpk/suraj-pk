const express = require("express");
const {
  placeorder,
  getuserorders,
  getallorders,
  updateorderstatus,
} = require("../controllers/ordercontroller");

const router = express.Router();

// Place new order
router.post("/", placeorder);

// Get orders of a specific user
router.get("/user/:userId", getuserorders);

// Get all orders (for admin)
router.get("/", getallorders);

// Update order status
router.put("/:id/status", updateorderstatus);

module.exports = router;
