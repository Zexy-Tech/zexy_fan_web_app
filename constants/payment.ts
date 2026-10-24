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
   * 5815 = Digital Goods / Media
   */
  merchantCategoryCode: (process.env.NEXT_PUBLIC_UPI_MCC || '5815') as string,
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
  transactionRef: string; // gateway_order_id
  transactionNote?: string;
  currency?: string;
  merchantCode?: string;
  scheme?: string; // 'upi' | 'phonepe' | 'tez' | 'paytmmp'
}

/**
 * Builds an NPCI-compliant UPI deep link string.
 * Supports specific schemes for PhonePe, Google Pay (Tez), Paytm, and Generic UPI intent.
 */
export function buildUpiUrl(params: BuildUpiUrlParams): string {
  const scheme = params.scheme || 'upi';
  const payeeVpa = params.payeeVpa || UPI_CONFIG.upiId;
  const payeeName = params.payeeName || UPI_CONFIG.merchantName;
  const currency = params.currency || 'INR';

  const numericAmount =
    typeof params.amount === 'number' ? params.amount : parseFloat(params.amount);
  const formattedAmount = isNaN(numericAmount) ? '0.00' : numericAmount.toFixed(2);

  const queryParams: Record<string, string> = {
    pa: payeeVpa,
    pn: payeeName,
    am: formattedAmount,
    cu: currency,
    tr: params.transactionRef,
    tn: params.transactionNote || `Payment for ${payeeName}`,
    mc: params.merchantCode || UPI_CONFIG.merchantCategoryCode,
    mode: '02',
  };

  const encodedQuery = Object.entries(queryParams)
    .map(([key, val]) => `${encodeURIComponent(key)}=${encodeURIComponent(val)}`)
    .join('&');

  if (scheme === 'tez') {
    return `tez://upi/pay?${encodedQuery}`;
  }

  return `${scheme}://pay?${encodedQuery}`;
}
