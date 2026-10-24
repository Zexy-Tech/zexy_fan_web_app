/**
 * Central Payment & UPI Configuration for Zexy Fan Web App
 */

export const UPI_CONFIG = {
  /**
   * Default fallback UPI ID if not returned dynamically from server order.
   */
  upiId: (process.env.NEXT_PUBLIC_UPI_ID || 'lalitspatil03@okhdfcbank') as string,

  /**
   * Merchant display name shown in UPI apps
   */
  merchantName: (process.env.NEXT_PUBLIC_UPI_MERCHANT_NAME || 'Zexy') as string,

  /**
   * Merchant Category Code (MCC)
   * Only applicable when the receiving UPI ID is a verified business merchant account.
   * Personal/P2P accounts MUST NOT send an MCC (doing so triggers bank limit errors).
   */
  merchantCategoryCode: (process.env.NEXT_PUBLIC_UPI_MCC || '') as string,

  /**
   * Flag indicating whether the fallback VPA is an authorized business merchant account.
   * Default false for personal/direct P2P accounts.
   */
  isMerchant: process.env.NEXT_PUBLIC_UPI_IS_MERCHANT === 'true',
} as const;

export interface UpiAppOption {
  id: string;
  name: string;
  scheme: string;
  primaryColor: string;
  badge?: string;
}

/**
 * List of major UPI apps supported on mobile devices
 */
export const SUPPORTED_UPI_APPS: UpiAppOption[] = [
  {
    id: 'phonepe',
    name: 'PhonePe',
    scheme: 'phonepe',
    primaryColor: '#5f259f',
    badge: 'Popular',
  },
  {
    id: 'gpay',
    name: 'Google Pay',
    scheme: 'tez',
    primaryColor: '#1a73e8',
  },
  {
    id: 'paytm',
    name: 'Paytm',
    scheme: 'paytmmp',
    primaryColor: '#00b9f5',
  },
  {
    id: 'generic',
    name: 'Any UPI App',
    scheme: 'upi',
    primaryColor: '#8b5cf6',
  },
];

export interface BuildUpiUrlParams {
  payeeVpa?: string;
  payeeName?: string;
  amount: number | string;
  transactionRef: string; // gateway_order_id or unique attempt reference
  transactionNote?: string;
  currency?: string;
  merchantCode?: string;
  scheme?: string; // 'upi' | 'phonepe' | 'tez' | 'paytmmp'
  isMerchant?: boolean;
  mode?: string;
}

/**
 * Builds an NPCI-compliant UPI deep link string.
 * Supports specific schemes for PhonePe (phonepe://pay), Google Pay (tez://upi/pay),
 * Paytm (paytmmp://pay), and Generic UPI intent (upi://pay).
 */
export function buildUpiUrl(params: BuildUpiUrlParams): string {
  const scheme = params.scheme || 'upi';
  const payeeVpa = params.payeeVpa || UPI_CONFIG.upiId;
  const payeeName = params.payeeName || UPI_CONFIG.merchantName;
  const currency = params.currency || 'INR';

  // Strict INR formatting: ₹1 must ALWAYS be formatted as '1.00', never '100.00' (paise) or '1'
  const numericAmount =
    typeof params.amount === 'number' ? params.amount : parseFloat(params.amount);
  const formattedAmount = isNaN(numericAmount) ? '0.00' : numericAmount.toFixed(2);

  // Validate and sanitize transaction reference (NPCI limit: max 35 chars, alphanumeric + underscore + hyphen)
  const safeTr = (params.transactionRef || `tx_${Date.now()}`)
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 35);

  // Clean note (NPCI recommended max 50 chars)
  const rawNote = params.transactionNote || `Payment for ${payeeName}`;
  const truncatedNote = rawNote.slice(0, 50);

  const queryParams: Record<string, string> = {
    pa: payeeVpa,
    pn: payeeName,
    am: formattedAmount,
    cu: currency,
    tr: safeTr,
    tn: truncatedNote,
  };

  // CRITICAL FIX FOR BANK LIMIT EXCEEDED ERROR:
  // Only include merchant category code (mc) and merchant mode (mode=02)
  // if explicitly confirmed as an authorized merchant account.
  // Passing 'mc=5815' or 'mode=02' to an individual/personal UPI ID (e.g. lalitspatil03@okhdfcbank)
  // causes PhonePe, Google Pay, and issuing banks to treat the intent as an unauthorized P2M
  // merchant transaction, setting the allowed limit to 0 and failing with:
  // "You have exceeded the bank limit for this payment, retry with smaller amount."
  const isMerchant = params.isMerchant ?? UPI_CONFIG.isMerchant;
  const merchantCode = params.merchantCode || (isMerchant ? UPI_CONFIG.merchantCategoryCode : undefined);

  if (isMerchant && merchantCode) {
    queryParams.mc = merchantCode;
    queryParams.mode = params.mode || '02';
  } else if (params.mode && params.mode !== '02') {
    queryParams.mode = params.mode;
  }

  // Construct query string: preserve '@' in payee VPA to avoid regex mismatch in some UPI intent handlers
  const encodedQuery = Object.entries(queryParams)
    .map(([key, val]) => {
      if (key === 'pa') {
        return `pa=${val}`;
      }
      return `${encodeURIComponent(key)}=${encodeURIComponent(val)}`;
    })
    .join('&');

  let uri: string;
  if (scheme === 'tez') {
    uri = `tez://upi/pay?${encodedQuery}`;
  } else {
    uri = `${scheme}://pay?${encodedQuery}`;
  }

  // Safe diagnostic logging (no sensitive credentials or PII)
  if (typeof window !== 'undefined') {
    console.info('[UPI Diagnostic] Built UPI Intent URI:', {
      scheme,
      payeeVpa,
      amount: formattedAmount,
      currency,
      transactionRef: safeTr,
      hasMerchantCode: Boolean(queryParams.mc),
      mode: queryParams.mode || 'omitted (p2p/direct)',
      uriPreview: `${scheme}://...&am=${formattedAmount}&tr=${safeTr}`,
    });
  }

  return uri;
}

/**
 * Diagnostic helper to safely parse and inspect a UPI URI without sensitive data.
 */
export function inspectUpiUrl(uri: string): {
  scheme: string;
  params: Record<string, string>;
  isCompliant: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  const [schemePart, queryPart] = uri.split('?');
  const scheme = schemePart ? schemePart.split(':')[0] : '';
  const searchParams = new URLSearchParams(queryPart || '');

  const params: Record<string, string> = {};
  searchParams.forEach((val, key) => {
    params[key] = val;
  });

  if (!params.pa) warnings.push('Missing payee VPA (pa)');
  if (!params.pn) warnings.push('Missing payee name (pn)');
  if (!params.am) warnings.push('Missing amount (am)');
  if (params.cu !== 'INR') warnings.push('Currency (cu) should be INR');
  if (params.tr && params.tr.length > 35) warnings.push('Transaction reference (tr) exceeds 35 characters');
  if (params.mc && !UPI_CONFIG.isMerchant) {
    warnings.push('Merchant category code (mc) included on a non-merchant/personal UPI account');
  }
  if (params.mode === '02' && !UPI_CONFIG.isMerchant) {
    warnings.push('Dynamic merchant mode (mode=02) included on a non-merchant/personal UPI account');
  }

  return {
    scheme,
    params,
    isCompliant: warnings.length === 0,
    warnings,
  };
}
