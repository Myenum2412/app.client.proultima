"use client";

// For client-side Razorpay checkout
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    // Check if script is already loaded
    if (typeof window !== "undefined" && (window as any).Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

