const fs = require('fs');

let code = fs.readFileSync('src/App.jsx', 'utf8');

const firstPartyBookingIndex = code.indexOf('function PartyBookingModal');
const secondPartyBookingIndex = code.indexOf('function PartyBookingModal', firstPartyBookingIndex + 1);
const couponVerifierIndex = code.indexOf('function CouponVerifier');

if (secondPartyBookingIndex !== -1 && couponVerifierIndex !== -1) {
  console.log('Found second PartyBookingModal at index:', secondPartyBookingIndex, 'and CouponVerifier at:', couponVerifierIndex);
  code = code.slice(0, secondPartyBookingIndex) + code.slice(couponVerifierIndex);
  fs.writeFileSync('src/App.jsx', code, 'utf8');
  console.log('Removed duplicate PartyBookingModal #2!');
} else {
  console.log('No duplicate PartyBookingModal found or CouponVerifier marker missing.');
}
