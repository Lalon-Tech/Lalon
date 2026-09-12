import { AppUser } from '../types';

export const MAX_ACTIVE_ADMINS = 2;
export const MIN_ACTIVE_ADMINS = 1;

/**
 * Generates the next sequential unique User UID in BS-#### format.
 * (e.g. BS-1001, BS-1002, etc.)
 */
export function generateNextUserUid(existingUsers: { userUid?: string }[]): string {
  let maxNum = 1000;
  
  if (existingUsers && Array.isArray(existingUsers)) {
    for (const u of existingUsers) {
      if (u.userUid) {
        const match = u.userUid.match(/^BS-(\d+)$/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    }
  }

  const nextNum = maxNum + 1;
  return `BS-${nextNum}`;
}

/**
 * Checks if a search/login identifier looks like a BS-#### User UID.
 */
export function isUserUidIdentifier(input: string): boolean {
  if (!input) return false;
  const clean = input.trim().toUpperCase();
  return /^BS-\d+$/i.test(clean) || (!clean.includes('@') && clean.startsWith('BS'));
}

/**
 * Counts active admin accounts.
 */
export function getActiveAdminCount(users: AppUser[]): number {
  if (!users || !Array.isArray(users)) return 0;
  return users.filter(u => u.role === 'admin' && u.status === 'active').length;
}

/**
 * Validates whether another account can be promoted to Admin.
 * Rule: Maximum 2 active Admin accounts.
 */
export function canPromoteToAdmin(users: AppUser[], targetUserId?: string): { allowed: boolean; reasonBn?: string; reasonEn?: string } {
  // Exclude target user if they are already an active admin
  const otherActiveAdmins = users.filter(u => u.role === 'admin' && u.status === 'active' && u.id !== targetUserId);
  if (otherActiveAdmins.length >= MAX_ACTIVE_ADMINS) {
    return {
      allowed: false,
      reasonBn: `সর্বোচ্চ ${MAX_ACTIVE_ADMINS}টি সক্রিয় অ্যাডমিন অ্যাকাউন্ট অনুমোদিত। বর্তমানে ${otherActiveAdmins.length}/${MAX_ACTIVE_ADMINS}টি সক্রিয় অ্যাডমিন অ্যাকাউন্ট রয়েছে।`,
      reasonEn: `Maximum ${MAX_ACTIVE_ADMINS} active Admin accounts allowed. Currently ${otherActiveAdmins.length}/${MAX_ACTIVE_ADMINS} active Admin accounts exist.`
    };
  }
  return { allowed: true };
}

/**
 * Validates whether an admin can be demoted or deactivated.
 * Rule: There must always be at least one active Admin account.
 */
export function canDemoteOrDeactivateAdmin(users: AppUser[], targetUserId: string): { allowed: boolean; reasonBn?: string; reasonEn?: string } {
  const target = users.find(u => u.id === targetUserId);
  if (!target || target.role !== 'admin' || target.status !== 'active') {
    return { allowed: true };
  }

  const remainingActiveAdmins = users.filter(u => u.role === 'admin' && u.status === 'active' && u.id !== targetUserId);
  if (remainingActiveAdmins.length < MIN_ACTIVE_ADMINS) {
    return {
      allowed: false,
      reasonBn: `কমপক্ষে ${MIN_ACTIVE_ADMINS}টি সক্রিয় অ্যাডমিন অ্যাকাউন্ট থাকা আবশ্যক। এটি সিস্টেমের একমাত্র সক্রিয় অ্যাডমিন অ্যাকাউন্ট।`,
      reasonEn: `At least ${MIN_ACTIVE_ADMINS} active Admin account must always exist. This is the only active Admin account.`
    };
  }
  return { allowed: true };
}

/**
 * Validates whether an admin can be deleted.
 * Rule: There must always be at least one active Admin account.
 */
export function canDeleteUser(users: AppUser[], targetUserId: string, currentUserId?: string): { allowed: boolean; reasonBn?: string; reasonEn?: string } {
  if (currentUserId && targetUserId === currentUserId) {
    return {
      allowed: false,
      reasonBn: 'আপনি নিজের অ্যাকাউন্ট ডিলিট করতে পারবেন না।',
      reasonEn: 'You cannot delete your own account.'
    };
  }

  const target = users.find(u => u.id === targetUserId);
  if (target?.role === 'admin' && target?.status === 'active') {
    const remainingActiveAdmins = users.filter(u => u.role === 'admin' && u.status === 'active' && u.id !== targetUserId);
    if (remainingActiveAdmins.length < MIN_ACTIVE_ADMINS) {
      return {
        allowed: false,
        reasonBn: `কমপক্ষে ১টি সক্রিয় অ্যাডমিন অ্যাকাউন্ট থাকা আবশ্যক। এটি সিস্টেমের শেষ সক্রিয় অ্যাডমিন।`,
        reasonEn: `At least 1 active Admin account must exist. This is the last active Admin.`
      };
    }
  }

  return { allowed: true };
}
