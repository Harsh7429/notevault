const Razorpay = require("razorpay");

let razorpayClient;

function getRazorpayClient() {
  if (!razorpayClient) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay credentials are not configured.");
    }

    razorpayClient = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }

  return razorpayClient;
}

function getRazorpayKeyId() {
  return process.env.RAZORPAY_KEY_ID || "";
}

module.exports = {
  getRazorpayClient,
  getRazorpayKeyId
};
