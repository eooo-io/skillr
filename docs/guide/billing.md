# Billing & Subscriptions

Skillr offers tiered pricing plans with Stripe-powered billing.

## Plans

| Feature | Free | Pro | Teams |
|---|---|---|---|
| Projects | 5 | Unlimited | Unlimited |
| Skills per project | 25 | Unlimited | Unlimited |
| Provider sync | All 6 providers | All 6 providers | All 6 providers |
| Test runs | Limited | Unlimited | Unlimited |
| Version history | 10 versions | Unlimited | Unlimited |
| Marketplace publish | -- | Yes | Yes |
| Shared library | -- | -- | Yes |
| Role-based access | -- | -- | Yes |
| SSO/SAML | -- | -- | Yes |
| Audit log | -- | -- | Yes |

### Viewing Plans

Plans are listed on the billing page and are also available publicly:

```
GET /api/billing/plans
```

## Subscribing

Navigate to **Settings > Billing** and select a plan. Skillr uses Stripe Checkout for payment processing.

### Changing Plans

Upgrade or downgrade at any time. Changes take effect immediately -- Stripe prorates the charge.

### Canceling

Cancel your subscription from the billing page. You retain access to paid features until the end of the current billing period. You can resume a canceled subscription before it expires.

## Usage Tracking

The billing page shows your current usage:

- **Token usage** -- Tokens consumed by test runner and playground
- **Sync operations** -- Number of provider syncs performed
- **API calls** -- Total API requests

Usage resets monthly. Pro and Teams plans include higher or unlimited quotas.

## Payment Methods

Add or update your payment method from the billing page. Skillr supports credit cards via Stripe.

## Invoices

View and download past invoices from the billing page.

## Marketplace Earnings (Stripe Connect)

If you publish skills to the marketplace, you can connect a Stripe account to receive earnings from paid skill installations.

1. Click **Connect Stripe** on the billing page
2. Complete the Stripe Connect onboarding
3. View earnings and payout status

## API

```
GET  /api/billing/status            # Current subscription
GET  /api/billing/plans             # Available plans (public)
POST /api/billing/subscribe         # Subscribe to plan
POST /api/billing/change-plan       # Switch plans
POST /api/billing/cancel            # Cancel subscription
POST /api/billing/resume            # Resume canceled subscription
POST /api/billing/setup-intent      # Create Stripe setup intent
PUT  /api/billing/payment-method    # Update payment method
GET  /api/billing/invoices          # Invoice history
GET  /api/billing/usage             # Usage breakdown

# Marketplace sellers
POST /api/billing/connect           # Setup Stripe Connect
GET  /api/billing/connect/status    # Connect account status
GET  /api/billing/earnings          # Earnings & payouts
```
