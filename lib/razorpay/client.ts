import Razorpay from "razorpay";

// Validate Razorpay credentials
const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  console.warn(
    "⚠️  Razorpay credentials not configured. Payment functionality will not work.\n" +
    "Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables."
  );
}

// Initialize Razorpay client (server-side only)
export const razorpayClient = new Razorpay({
  key_id: keyId || "",
  key_secret: keySecret || "",
});

// Helper to check if Razorpay is configured
export function isRazorpayConfigured(): boolean {
  return !!(keyId && keySecret);
}

