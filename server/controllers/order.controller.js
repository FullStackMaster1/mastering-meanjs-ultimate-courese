const Order = require("../models/order.model");

async function submitOrder(order) {
  // make a mogoose db call to save order in db
  console.log(`saving order to db`, order);

  return await new Order(order).save();
}

async function getOrderById(orderId) {
  console.log(`Searching order for order`, orderId);

  return await Order.findById(orderId);
}

async function getOrderByUserId(userId) {
  console.log(`Searching order for user`, userId);

  return await Order.find({
    userId,
  });
}

async function getAllOrders() {
  console.log(`Fetching all orders`);

  return await Order.find({});
}

module.exports = {
  submitOrder,
  getOrderById,
  getAllOrders,
  getOrderByUserId,
};