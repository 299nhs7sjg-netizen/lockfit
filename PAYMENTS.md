# LockFit payments ($2.99 lifetime)

## Goal

Sell a **lifetime unlock** for LockFit. After payment, deliver a license key (`IB-LOCK-XXXX-XXXX`). The app unlocks **only** when a valid key is redeemed — there is no “I paid” honor-system button.

## Checkout URL

1. Create a $2.99 product on Gumroad, Lemon Squeezy, Stripe Payment Link, or similar.
2. Set `checkoutUrl` in `config.js` to that product’s checkout / payment link.
3. Redeploy / push so Pages picks up the change.

While `checkoutUrl` is empty, the Unlock modal shows a placeholder and still accepts keys.

## Key delivery

1. Keep the full list in **`KEYS.PRIVATE.md`** (gitignored). Never commit or publish it.
2. After each successful payment, pick an unused key and email / message it to the buyer.
3. Optionally mark the key as used in your private copy of `KEYS.PRIVATE.md`.
4. Keys that should work in the live app must appear in `config.js` → `VALID_KEYS` (or a future server-side check).

### Expanding VALID_KEYS

- For early sales: copy sold keys into `VALID_KEYS` and push.
- For scale: replace client-side `VALID_KEYS` with a tiny redeem API that checks keys server-side (not in this MVP).

## Suggested product copy

- **Name:** LockFit — Lifetime Unlock  
- **Price:** $2.99  
- **Description:** Unlock all device presets and watermark-free PNG exports for LockFit. You’ll receive a license key by email after purchase.

## Fulfillment checklist

- [ ] Payment received  
- [ ] Key sent to customer  
- [ ] Key present in live `VALID_KEYS` (or API)  
- [ ] Key marked used in private list  

## Support

If a key fails: verify spelling (`IB-LOCK-XXXX-XXXX`), confirm it was added to `VALID_KEYS`, and that the customer cleared cache / hard-refreshed.
