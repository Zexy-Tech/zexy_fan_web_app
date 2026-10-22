const getApiBaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.zexy.live';
  return url.replace(/\/+$/, '');
};

const getSocketUrl = () => {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }
  
  return 'wss://api.zexy.live';
};

export const ENV = {
  API_BASE_URL: getApiBaseUrl(),
  SOCKET_URL: getSocketUrl(),
  RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_xxxxx',
  IS_MOCK: process.env.NEXT_PUBLIC_USE_MOCK === 'true' || false,
  TRUECALLER_PARTNER_KEY: process.env.NEXT_PUBLIC_TRUECALLER_PARTNER_KEY || '',
  TRUECALLER_APP_NAME: process.env.NEXT_PUBLIC_TRUECALLER_APP_NAME || 'Zexy',
} as const;
