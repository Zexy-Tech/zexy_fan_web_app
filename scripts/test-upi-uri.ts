/**
 * Test script for UPI URI Generation & NPCI Compliance
 * Validates requirements 2, 3, 4, 5, 6, 7, 8, 14
 */

import assert from 'node:assert';
import {
  buildAndroidUpiIntentUrl,
  buildUpiPayQueryString,
  buildUpiUrl,
  inspectUpiUrl,
  UPI_CONFIG,
} from '../constants/payment';

console.log('--- Testing UPI Deep-Link Generation for Zexy ---');

// Test 1: ₹1 Payment formatting
const uriPhonePe1 = buildUpiUrl({
  amount: 1,
  transactionRef: 'order_upi_1234567890abcdef',
  scheme: 'phonepe',
});

console.log('Generated PhonePe URI (₹1):', uriPhonePe1);
assert.ok(uriPhonePe1.startsWith('phonepe://pay?'), 'Scheme must be phonepe://pay');
assert.ok(uriPhonePe1.includes('am=1.00'), 'Amount for ₹1 must be exactly am=1.00');
assert.ok(!uriPhonePe1.includes('am=100.00'), 'Amount must NOT be am=100.00 (paise error)');
assert.ok(!uriPhonePe1.includes('am=1&'), 'Amount must have 2 decimal places');
assert.ok(uriPhonePe1.includes('cu=INR'), 'Currency must be INR');
assert.ok(uriPhonePe1.includes('pa=lalitspatil03@okhdfcbank'), 'Payee VPA must be lalitspatil03@okhdfcbank');
assert.ok(!uriPhonePe1.includes('mc='), 'mc parameter must NOT be included for personal VPA');
assert.ok(!uriPhonePe1.includes('mode=02'), 'mode=02 must NOT be included for personal VPA');

// Test 2: Google Pay (tez) URI formatting
const uriGPay1 = buildUpiUrl({
  amount: '1.00',
  transactionRef: 'order_upi_1234567890abcdef',
  scheme: 'tez',
  transactionNote: 'Zexy: VIP Subscription',
});

console.log('Generated Google Pay URI (₹1):', uriGPay1);
assert.ok(uriGPay1.startsWith('tez://upi/pay?'), 'Scheme must be tez://upi/pay');
assert.ok(uriGPay1.includes('am=1.00'), 'Amount must be 1.00');
assert.ok(!uriGPay1.includes('mc='), 'mc parameter must NOT be present in Google Pay URI');
assert.ok(!uriGPay1.includes('mode=02'), 'mode=02 must NOT be present in Google Pay URI');
assert.ok(uriGPay1.includes('tn=Zexy%3A%20VIP%20Subscription'), 'Transaction note must be properly URL-encoded');

// Test 3: Generic UPI (upi://pay)
const uriGeneric = buildUpiUrl({
  amount: 1,
  transactionRef: 'order_upi_1234567890abcdef',
  scheme: 'upi',
});

console.log('Generated Generic UPI URI (₹1):', uriGeneric);
assert.ok(uriGeneric.startsWith('upi://pay?'), 'Scheme must be upi://pay');
assert.ok(!uriGeneric.includes('mc='), 'mc must NOT be present in Generic UPI');
assert.ok(!uriGeneric.includes('mode=02'), 'mode=02 must NOT be present in Generic UPI');

// Test 4: Unique transaction references across payment attempts (Req 5)
const baseOrderId = 'order_upi_b678c187df3b55a1';
const attempt1Ref = baseOrderId.slice(0, 35);
const attempt2Ref = `${baseOrderId.slice(0, 30)}_A2`.slice(0, 35);
const attempt3Ref = `${baseOrderId.slice(0, 30)}_A3`.slice(0, 35);

assert.notStrictEqual(attempt1Ref, attempt2Ref, 'Attempt 2 must differ from Attempt 1');
assert.notStrictEqual(attempt2Ref, attempt3Ref, 'Attempt 3 must differ from Attempt 2');
assert.ok(attempt1Ref.length <= 35, 'tr length must be <= 35');
assert.ok(attempt2Ref.length <= 35, 'tr length must be <= 35');
assert.ok(attempt3Ref.length <= 35, 'tr length must be <= 35');

const uriAttempt1 = buildUpiUrl({ amount: 1, transactionRef: attempt1Ref, scheme: 'phonepe' });
const uriAttempt2 = buildUpiUrl({ amount: 1, transactionRef: attempt2Ref, scheme: 'phonepe' });
assert.ok(uriAttempt1.includes(`tr=${attempt1Ref}`));
assert.ok(uriAttempt2.includes(`tr=${attempt2Ref}`));

// Test 5: inspectUpiUrl validation
const inspection = inspectUpiUrl(uriPhonePe1);
assert.strictEqual(inspection.isCompliant, true, 'Clean URI must be compliant');
assert.strictEqual(inspection.warnings.length, 0, 'Clean URI should have no warnings');

// Test 6: Verify merchant parameter guard
const merchantUri = buildUpiUrl({
  amount: 50,
  transactionRef: 'order_upi_merchant',
  scheme: 'upi',
  isMerchant: true,
  merchantCode: '5815',
});
assert.ok(merchantUri.includes('mc=5815'), 'mc must be included when isMerchant is true');
assert.ok(merchantUri.includes('mode=02'), 'mode=02 must be included when isMerchant is true');

// Test 7: Android NPCI intent URL (mobile web launch)
const query = buildUpiPayQueryString({
  amount: 1,
  transactionRef: 'order_upi_1234567890abcdef',
  transactionNote: 'Zexy: Subscription: Gold',
});
const gpayIntent = buildAndroidUpiIntentUrl(query, 'com.google.android.apps.nbu.paisa.user');
assert.ok(gpayIntent.startsWith('intent://pay?'), 'Android intent must use intent://pay');
assert.ok(gpayIntent.includes('scheme=upi'), 'Android intent must declare scheme=upi');
assert.ok(
  gpayIntent.includes('package=com.google.android.apps.nbu.paisa.user'),
  'Google Pay intent must target GPay package'
);
assert.ok(gpayIntent.includes('am=1.00'), 'Intent query must include formatted amount');
assert.ok(!gpayIntent.includes('mc='), 'Intent must not include mc for personal VPA');

console.log('✅ ALL UPI URI TESTS PASSED SUCCESSFULLY!');
