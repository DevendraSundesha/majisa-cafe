# Majisa Cafe and Restaurant — Balotra

Immersive Marwari restaurant website built with React + Vite.

## Run locally

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Included

- Responsive Marwari/Rajasthani visual system
- Menu filters, item photos, cart and quantity controls
- Simulated UPI/card checkout
- Real mouse/touch scratch-card interaction
- Weighted rewards: 40% discount pool, 60% free-item pool
- Reward code persistence in `localStorage`
- Autoplay photo/video gallery, testimonials and visit section

## Before going live

The checkout is intentionally marked as a demo. Connect the payment action to a
server-side Razorpay/PhonePe/Cashfree integration, and generate/validate reward
codes in a database so probabilities and one-time redemption cannot be changed
from the customer's browser.

Update the restaurant phone number, exact Google Maps link, address, menu and
prices in `src/App.jsx`.
