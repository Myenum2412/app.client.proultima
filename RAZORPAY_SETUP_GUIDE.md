# 🔐 Razorpay Setup Guide - 5 Minute Fix

## ⚡ Quick Summary

**Problem:** Payment button shows JSON error
**Cause:** Missing Razorpay credentials
**Fix Time:** 5 minutes
**Difficulty:** Easy (copy-paste)

---

## 🚀 Step-by-Step Setup

### Step 1: Sign Up / Login to Razorpay (2 minutes)

1. **Open Browser:**
   ```
   https://dashboard.razorpay.com/
   ```

2. **Create Account or Login:**
   - Use your email
   - Verify phone number if required
   - Complete business profile (can use test data)

3. **Enable Test Mode:**
   - Look for toggle in top-right corner
   - Make sure it says "Test Mode" (usually orange/yellow badge)
   - **Important:** Always use Test Mode for development!

---

### Step 2: Get Your API Keys (1 minute)

1. **Navigate to API Keys:**
   - Click Settings (gear icon) → API Keys
   - Or go directly to: https://dashboard.razorpay.com/app/keys

2. **Generate Test Keys (if not already generated):**
   - Click "Generate Test Keys" button
   - You'll see two keys appear:

   **Key ID (Public):**
   ```
   rzp_test_xxxxxxxxxxxx
   ```
   *This is safe to expose in frontend code*

   **Key Secret (Private):**
   ```
   xxxxxxxxxxxxxxxxxxxx
   ```
   *Keep this secret! Never commit to git!*

3. **Copy Both Keys:**
   - Click "Copy" button next to each key
   - Or select text and Ctrl+C

---

### Step 3: Add Keys to Your Project (1 minute)

1. **Open `.env.local` File:**
   ```
   C:\Users\najas\OneDrive\Desktop\client-dash\.env.local
   ```

2. **Add These Lines (at the end of file):**
   ```env
   # Razorpay Payment Gateway Configuration
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
   ```

3. **Replace `xxxxxxxxxxxx` with your actual keys!**

   **Example:**
   ```env
   # Razorpay Payment Gateway Configuration
   RAZORPAY_KEY_ID=rzp_test_1234567890AB
   RAZORPAY_KEY_SECRET=abcdefghijklmnopqrstuvwxyz123456
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_1234567890AB
   ```

4. **Save the file** (Ctrl+S)

---

### Step 4: Restart Development Server (30 seconds)

1. **Stop Current Server:**
   - Go to terminal where `npm run dev` is running
   - Press `Ctrl+C`
   - Wait for it to stop

2. **Start Server Again:**
   ```bash
   npm run dev
   ```

3. **Wait for:**
   ```
   ✓ Ready in X seconds
   ○ Local: http://localhost:3000
   ```

---

### Step 5: Test Payment (1 minute)

1. **Open Billing Page:**
   ```
   http://localhost:3000/billing
   ```

2. **Click "View Details" on any invoice**

3. **Click "Pay Now" button**
   - Razorpay checkout modal should open (no error!)
   - You'll see test payment interface

4. **Use Test Card Details:**
   ```
   Card Number:  4111 1111 1111 1111
   CVV:          123
   Expiry:       12/25 (any future date)
   Cardholder:   Test User
   ```

5. **Click "Pay"**
   - Payment should succeed
   - Modal closes
   - Success message appears

---

## ✅ Verification

### Payment Should Work If You See:

✅ Razorpay checkout modal opens (no JSON error)
✅ Test card form is visible
✅ Payment completes successfully
✅ Success message appears

### Still Getting Error?

❌ Check `.env.local` file:
   - Keys are correctly pasted (no extra spaces)
   - Three lines are present (KEY_ID, KEY_SECRET, NEXT_PUBLIC)
   - File is saved

❌ Check terminal:
   - Server restarted after adding keys
   - No error messages about Razorpay

❌ Check browser console (F12):
   - Look for any red error messages
   - Copy them and check against common issues below

---

## 🔧 Common Issues & Solutions

### Issue 1: "Payment gateway not configured"

**Cause:** Environment variables not loaded

**Fix:**
1. Check `.env.local` has all three keys
2. Restart server (Ctrl+C, then `npm run dev`)
3. Hard refresh browser (Ctrl+Shift+R)

---

### Issue 2: "Invalid key" error from Razorpay

**Cause:** Using wrong mode (Live vs Test)

**Fix:**
1. Make sure keys start with `rzp_test_` (not `rzp_live_`)
2. Make sure Razorpay dashboard shows "Test Mode"
3. Regenerate test keys if needed

---

### Issue 3: Test payment fails

**Cause:** Test mode not enabled

**Fix:**
1. Go to Razorpay Dashboard
2. Check top-right corner for "Test Mode" toggle
3. Enable it (usually orange/yellow)
4. Use test card: 4111 1111 1111 1111

---

### Issue 4: Still getting JSON error

**Cause:** Keys not in correct format or file

**Fix:**

1. **Verify `.env.local` looks exactly like this:**
   ```env
   # Your existing Supabase keys...
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
   
   # Add these Razorpay keys:
   RAZORPAY_KEY_ID=rzp_test_xxxxx
   RAZORPAY_KEY_SECRET=xxxxx
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx
   ```

2. **No quotes around values!**
   ❌ Bad: `RAZORPAY_KEY_ID="rzp_test_xxxxx"`
   ✅ Good: `RAZORPAY_KEY_ID=rzp_test_xxxxx`

3. **No spaces around =**
   ❌ Bad: `RAZORPAY_KEY_ID = rzp_test_xxxxx`
   ✅ Good: `RAZORPAY_KEY_ID=rzp_test_xxxxx`

---

## 📋 Test Card Numbers

Razorpay provides these test cards:

### Successful Payment
```
Card: 4111 1111 1111 1111
CVV: Any 3 digits
Expiry: Any future date
Result: Payment succeeds
```

### Payment Fails (for testing error handling)
```
Card: 4000 0000 0000 0002
CVV: Any 3 digits
Expiry: Any future date
Result: Payment fails
```

### Card Requires Authentication (3D Secure)
```
Card: 5104 0600 0000 0008
CVV: Any 3 digits
Expiry: Any future date
Result: Shows OTP screen, use any 6 digits
```

---

## 🎯 Quick Checklist

Before testing, make sure:

- [ ] Razorpay account created
- [ ] Test Mode enabled
- [ ] API Keys generated
- [ ] All 3 keys added to `.env.local`:
  - [ ] `RAZORPAY_KEY_ID`
  - [ ] `RAZORPAY_KEY_SECRET`
  - [ ] `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- [ ] `.env.local` file saved
- [ ] Dev server restarted
- [ ] Browser hard refreshed (Ctrl+Shift+R)

---

## 🔒 Security Notes

### Never Commit These to Git!

❌ **DO NOT** commit `.env.local` to version control
❌ **DO NOT** share your Key Secret publicly
❌ **DO NOT** use test keys in production

### Production Setup

When deploying to production:

1. **Generate Live Keys:**
   - Switch Razorpay to "Live Mode"
   - Complete KYC verification
   - Generate live keys (starts with `rzp_live_`)

2. **Use Environment Variables:**
   - Add keys to Vercel/Netlify environment variables
   - Never hardcode keys in source code

3. **Enable Webhooks:**
   - Set up webhook URL in Razorpay dashboard
   - Verify webhook signatures

---

## 📞 Need Help?

### Razorpay Support
- Documentation: https://razorpay.com/docs/
- Support: https://razorpay.com/support/

### Check Logs

**Browser Console (F12):**
```javascript
// Should see:
console.log("Razorpay loaded successfully")

// Should NOT see:
Error: Razorpay is not configured
```

**Server Terminal:**
```bash
# Should NOT see:
Error: RAZORPAY_KEY_ID is not defined
Error: RAZORPAY_KEY_SECRET is not defined
```

---

## 🎊 Success Indicators

When everything is working correctly:

✅ No JSON parsing errors
✅ Razorpay modal opens smoothly
✅ Test payment completes
✅ Success message appears
✅ Browser console has no errors
✅ Server terminal has no errors

---

## 📝 Your `.env.local` Should Look Like This:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Razorpay Payment Gateway (Test Mode)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx

# Optional: Other configs
# NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

**🎯 That's It! You're Done! 🎉**

Total time: **5 minutes**
Difficulty: **Easy**
Result: **Payments working!**

Now go test that payment! 💰

