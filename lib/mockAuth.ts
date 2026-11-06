import { User } from '@/store/slices/authSlice';

export interface MockRegisteredUser extends User {
  pin: string;
  email?: string | null;
  city: string | null;
  date_of_birth: string | null;
  gender: string | null;
}

const DEFAULT_MOCK_USERS: MockRegisteredUser[] = [
  {
    id: 1,
    mobile: '9876543210',
    name: 'Vikram Malhotra',
    username: 'vikram_m',
    avatar: null,
    role: 'fan',
    has_completed_onboarding: true,
    pin: '1234',
    city: 'Mumbai',
    date_of_birth: '1995-08-20',
    gender: 'male',
  },
  {
    id: 2,
    mobile: '9999999999',
    name: 'Priya Sharma',
    username: 'priya_s',
    email: 'priya.sharma@gmail.com',
    avatar: null,
    role: 'fan',
    has_completed_onboarding: true,
    pin: '1234',
    city: 'Delhi',
    date_of_birth: '1998-11-15',
    gender: 'female',
  },
  {
    id: 3,
    mobile: '9123456780',
    name: 'Incomplete Demo Fan',
    username: 'incomplete_demo',
    avatar: null,
    role: 'fan',
    has_completed_onboarding: false,
    pin: '1234',
    city: null,
    date_of_birth: null,
    gender: null,
  },
];

const STORAGE_KEY = 'zexy_mock_registered_users';

export function getMockRegisteredUsers(): MockRegisteredUser[] {
  if (typeof window === 'undefined') return DEFAULT_MOCK_USERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MOCK_USERS));
      return DEFAULT_MOCK_USERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // fallback
  }
  return DEFAULT_MOCK_USERS;
}

export function saveMockUser(user: MockRegisteredUser): void {
  if (typeof window === 'undefined') return;
  const users = getMockRegisteredUsers();
  const existingIndex = users.findIndex(
    (u) =>
      u.mobile === user.mobile || (user.email && u.email && u.email.toLowerCase() === user.email.toLowerCase())
  );
  if (existingIndex >= 0) {
    users[existingIndex] = { ...users[existingIndex], ...user };
  } else {
    users.push(user);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

export function findMockUserByMobile(mobile: string): MockRegisteredUser | undefined {
  const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
  const users = getMockRegisteredUsers();
  return users.find((u) => (u.mobile ? u.mobile.replace(/\D/g, '').slice(-10) === cleanMobile : false));
}

export function findMockUserByEmail(email: string): MockRegisteredUser | undefined {
  const cleanEmail = email.trim().toLowerCase();
  const users = getMockRegisteredUsers();
  return users.find((u) => u.email?.trim().toLowerCase() === cleanEmail);
}

/**
 * Checks if a mobile number is already registered (Step 1 -> Step 2 check).
 * Returns true if registered, false otherwise.
 */
export async function checkMobileRegistered(mobile: string): Promise<boolean> {
  // Simulate network delay for realistic UI
  await new Promise((resolve) => setTimeout(resolve, 350));
  const user = findMockUserByMobile(mobile);
  return Boolean(user);
}

/**
 * Validates PIN for a mobile number.
 * Accepts the user's stored PIN or '1234' as universal demo PIN.
 */
export function validateMockPin(mobile: string, enteredPin: string): boolean {
  if (enteredPin === '1234') return true;
  const user = findMockUserByMobile(mobile);
  if (user && user.pin) {
    return user.pin === enteredPin;
  }
  return enteredPin.length === 4;
}

/**
 * Mandatory 5 Details Check:
 * - Name
 * - Mobile Number
 * - City
 * - Date of Birth (DOB)
 * - Gender
 */
export function hasAllMandatoryDetails(
  user: {
    name?: string | null;
    mobile?: string | null;
    city?: string | null;
    date_of_birth?: string | null;
    gender?: string | null;
  } | null | undefined
): boolean {
  if (!user) return false;
  const cleanName = user.name?.trim();
  const cleanMobile = user.mobile?.replace(/\D/g, '').slice(-10);
  const cleanCity = user.city?.trim();
  const cleanDob = user.date_of_birth?.trim();
  const cleanGender = user.gender?.trim();

  return Boolean(
    cleanName &&
    cleanMobile &&
    cleanMobile.length === 10 &&
    cleanCity &&
    cleanDob &&
    cleanGender
  );
}

export function getMissingMandatoryDetails(
  user: {
    name?: string | null;
    mobile?: string | null;
    city?: string | null;
    date_of_birth?: string | null;
    gender?: string | null;
  } | null | undefined
): string[] {
  if (!user) return ['name', 'mobile', 'city', 'date_of_birth', 'gender'];
  const missing: string[] = [];
  if (!user.name?.trim()) missing.push('name');
  const cleanMobile = user.mobile?.replace(/\D/g, '').slice(-10);
  if (!cleanMobile || cleanMobile.length !== 10) missing.push('mobile');
  if (!user.city?.trim()) missing.push('city');
  if (!user.date_of_birth?.trim()) missing.push('date_of_birth');
  if (!user.gender?.trim()) missing.push('gender');
  return missing;
}
