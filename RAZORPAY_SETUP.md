# Razorpay Payment Integration Setup

This application uses Razorpay for payment processing. Follow these steps to set up Razorpay:

## 1. Get Razorpay Credentials

1. Sign up for a Razorpay account at https://razorpay.com
2. Go to Settings → API Keys
3. Generate API keys (Key ID and Key Secret)
4. For testing, use Test Mode keys

## 2. Configure Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Razorpay API Keys
RAZORPAY_KEY_ID=your_key_id_here
RAZORPAY_KEY_SECRET=your_key_secret_here

# Public key for client-side (same as Key ID)
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_key_id_here
```

## 3. Features

- **Pay Now Button**: Added to each invoice row in the billing table
- **Order Creation**: Server-side API route creates Razorpay orders
- **Payment Verification**: Server-side signature verification for security
- **Error Handling**: Comprehensive error handling and user feedback

## 4. Payment Flow

1. User clicks "Pay Now" button on an invoice
2. System creates a Razorpay order via `/api/payments/create-order`
3. Razorpay checkout modal opens
4. User completes payment
5. Payment is verified via `/api/payments/verify`
6. Success/failure message is displayed

## 5. Testing

For testing, use Razorpay's test cards:
- **Success**: 4111 1111 1111 1111
- **Failure**: 4000 0000 0000 0002
- Use any future expiry date and any CVV

## 6. Production Considerations

- Update invoice status in database after successful payment
- Store payment records
- Send confirmation emails
- Implement webhook handlers for payment status updates
- Use production API keys in production environment

