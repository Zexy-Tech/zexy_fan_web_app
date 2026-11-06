/** Self-check for lib/validation/fields.ts — run: npx tsx scripts/check-validation.ts */
import assert from 'node:assert/strict';
import { check, clean, url, dobBounds } from '../lib/validation/fields';

const today = new Date(2026, 10, 6); // 6 Nov 2026

// clean.* — keystroke filters
assert.equal(clean.mobile('+91 98765 43210'), '9876543210');
assert.equal(clean.mobile('098765-43210'), '9876543210');
assert.equal(clean.mobile('98a76b54321099'), '9876543210');
assert.equal(clean.name('Rahul2 Sh@rma  K'), 'Rahul Shrma K'); // digits and symbols dropped, spaces collapsed
assert.equal(clean.name('  Priya'), 'Priya');
assert.equal(clean.username('@Riya.Kapoor!!..x'), 'riya.kapoor.x');
assert.equal(clean.username('Zexy--Creator.01'), 'zexy-creator.01');
assert.equal(clean.place('Navi Mumbai 400703'), 'Navi Mumbai ');
assert.equal(clean.search('<script>alert(1)</script> riya'), 'scriptalert1script riya');
assert.equal(clean.amount('00150.50'), '15050');
assert.equal(clean.code('7a'), '7');

// check.* — submit rules
assert.equal(check.name('Rahul Sharma'), null);
assert.match(check.name('R') ?? '', /at least 2/);
assert.match(check.name('Rahul123') ?? '', /only letters/);
assert.match(check.name('   ') ?? '', /required/);
assert.equal(check.username('ananya.yogaflow'), null);
assert.equal(check.username('@arjun_mehta'), null);
assert.equal(check.username('alex.rivera-99'), null); // dashes allowed, as in the creator app
for (const bad of ['ab', '.riya', 'riya_', 'ri..ya', 'ri_-ya', 'Riya', 'riya kapoor', 'x'.repeat(31)]) assert.notEqual(check.username(bad), null, bad);
assert.equal(check.mobile('9876543210'), null);
assert.match(check.mobile('5876543210') ?? '', /start with 6, 7, 8 or 9/);
assert.match(check.mobile('987654321') ?? '', /exactly 10/);
assert.match(check.mobile('98765abc10') ?? '', /only digits/);
assert.equal(check.place('New Delhi'), null);
assert.equal(check.place('St. Thomas Mount'), null);
assert.equal(check.place('Navi-Mumbai'), null);
assert.match(check.place('Pune 411001') ?? '', /only letters/);
assert.equal(check.place('', 'State', false), null);
assert.equal(check.dob('1998-06-10', today), null);
assert.match(check.dob('2010-01-01', today) ?? '', /at least 18/);
assert.match(check.dob('2027-01-01', today) ?? '', /future/);
assert.match(check.dob('2001-02-30', today) ?? '', /valid/);
assert.match(check.dob('1900-01-01', today) ?? '', /valid/);
assert.equal(check.dob('2008-11-06', today), null); // turns 18 today
assert.match(check.dob('2008-11-07', today) ?? '', /at least 18/); // turns 18 tomorrow
assert.deepEqual(dobBounds(today), { min: '1926-11-06', max: '2008-11-06' });
assert.equal(check.tip(51), null);
assert.match(check.tip(0) ?? '', /Minimum/);
assert.match(check.tip(100001) ?? '', /Maximum/);
assert.match(check.tip(10.5) ?? '', /whole/);
assert.equal(check.message('hi'), null);
assert.match(check.message('   ') ?? '', /empty/);
assert.match(check.message('x'.repeat(1001)) ?? '', /at most 1000/);
assert.equal(check.utr('402812345678'), null);
assert.notEqual(check.utr('4028'), null);

// url.* — route/query params
assert.equal(url.id('42'), 42);
for (const bad of ['0', '-1', '42abc', '1e3', '', undefined, '00042', '99999999999']) assert.equal(url.id(bad), null, String(bad));
assert.equal(url.userRef('ZX-CR-8898'), 'ZX-CR-8898');
assert.equal(url.userRef('8898'), '8898');
assert.equal(url.userRef('8898; drop'), null);
assert.equal(url.username('Priyas.Kitchen'), 'priyas.kitchen');
assert.equal(url.username('../etc/passwd'), null);
assert.equal(url.username('%E0%A4'), null); // malformed escape must not throw
assert.equal(url.userRef('%E0%A4'), null);
assert.equal(url.username('zexy-creator.01'), 'zexy-creator.01');
assert.equal(url.slug('food'), 'food');
assert.equal(url.slug('food/../admin'), null);
assert.equal(url.roomId('livecheck-sid'), 'livecheck-sid');
assert.equal(url.roomId('<x>'), null);
assert.equal(url.internalPath('/creators?x=1'), '/creators?x=1');
for (const bad of ['//evil.com', 'https://evil.com', '/\\evil.com', 'javascript:alert(1)', 'creators', '/\t/evil.com']) assert.equal(url.internalPath(bad), null, bad);
assert.equal(url.paise('49900'), 49900);
for (const bad of ['-5', '0', 'abc', '99999999999']) assert.equal(url.paise(bad), null, bad);
assert.equal(url.mobile('+919876543210'), '9876543210');
assert.equal(url.mobile('1234'), '');
console.log('validation self-check: all assertions passed');
