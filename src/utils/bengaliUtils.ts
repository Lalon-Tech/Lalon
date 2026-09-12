// Bengali digit mapping
const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBengaliNumber(num: number | string | undefined | null): string {
  if (num === undefined || num === null || num === '') return '০';
  const str = num.toString();
  return str.replace(/\d/g, (d) => bengaliDigits[parseInt(d, 10)]);
}

export function formatCurrency(amount: number | undefined | null, useBengali = true): string {
  if (amount === undefined || amount === null) amount = 0;
  
  // Format with commas (South Asian formatting: lakh, crore)
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const formatted = absAmount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const displayStr = `${isNegative ? '-' : ''}৳ ${formatted}`;
  return useBengali ? toBengaliNumber(displayStr) : displayStr;
}

export function formatInteger(amount: number | undefined | null, useBengali = true): string {
  if (amount === undefined || amount === null) amount = 0;
  const formatted = Math.round(amount).toLocaleString('en-IN');
  return useBengali ? toBengaliNumber(formatted) : formatted;
}

// Convert numbers into Bengali words (টাকা কথায়)
const units = ['', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়', 'দশ', 
  'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোলো', 'সতেরো', 'আঠারো', 'উনিশ', 'বিশ',
  'একুশ', 'বাইশ', 'তেইশ', 'চব্বিশ', 'পঁচিশ', 'ছাব্বিশ', 'সাতাশ', 'আঠাশ', 'ঊনত্রিশ', 'ত্রিশ',
  'একত্রিশ', 'বত্রিশ', 'তেত্রিশ', 'চৌত্রিশ', 'পঁয়ত্রিশ', 'ছত্রিশ', 'সাঁইত্রিশ', 'আটত্রিশ', 'ঊনচল্লিশ', 'চল্লিশ',
  'একচল্লিশ', 'বিয়াল্লিশ', 'তেতাল্লিশ', 'চুয়াল্লিশ', 'পঁয়তাল্লিশ', 'ছেচল্লিশ', 'সাতচল্লিশ', 'আটচল্লিশ', 'ঊনপঞ্চাশ', 'পঞ্চাশ',
  'একান্ন', 'বায়ান্ন', 'তিপ্পান্ন', 'চুয়ান্ন', 'পঞ্চান্ন', 'ছাপ্পান্ন', 'সাতান্ন', 'আটান্ন', 'ঊনষাট', 'ষাট',
  'একষট্টি', 'বাষট্টি', 'তেষট্টি', 'চৌষট্টি', 'পঁয়ষট্টি', 'ছেষট্টি', 'সাতষট্টি', 'আটষট্টি', 'ঊনসত্তর', 'সত্তর',
  'একাত্তর', 'বাহাত্তর', 'তিয়াত্তর', 'চুয়াত্তর', 'পঁচাত্তর', 'ছিয়াত্তর', 'সাতাত্তর', 'আটাত্তর', 'ঊনআশি', 'আশি',
  'একাশি', 'বিরাশি', 'তিরাশি', 'চুরাশি', 'পঁচাশি', 'ছিয়াশি', 'সাতাশি', 'অষ্টআশি', 'ঊননব্বই', 'নব্বই',
  'একানব্বই', 'বানব্বই', 'তিরানব্বই', 'চুরানব্বই', 'পঁচানব্বই', 'ছিয়ানব্বই', 'সাতানব্বই', 'আটানব্বই', 'নিরানব্বই'];

export function numberToBengaliWords(n: number): string {
  if (n === 0) return 'শূন্য টাকা মাত্র';
  if (!n || isNaN(n)) return '';

  let num = Math.floor(Math.abs(n));
  let str = '';

  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  if (crore > 0) {
    str += `${numberToBengaliWordsSimple(crore)} কোটি `;
  }

  const lakh = Math.floor(num / 100000);
  num %= 100000;
  if (lakh > 0) {
    str += `${numberToBengaliWordsSimple(lakh)} লাখ `;
  }

  const thousand = Math.floor(num / 1000);
  num %= 1000;
  if (thousand > 0) {
    str += `${numberToBengaliWordsSimple(thousand)} হাজার `;
  }

  const hundred = Math.floor(num / 100);
  num %= 100;
  if (hundred > 0) {
    str += `${units[hundred]} শত `;
  }

  if (num > 0) {
    str += `${units[num]} `;
  }

  return `${str.trim()} টাকা মাত্র`;
}

function numberToBengaliWordsSimple(n: number): string {
  if (n <= 99) return units[n];
  const h = Math.floor(n / 100);
  const rem = n % 100;
  let res = '';
  if (h > 0) res += `${units[h]} শত `;
  if (rem > 0) res += units[rem];
  return res.trim();
}

const bengaliMonths = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

const englishMonths = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function formatBengaliDate(dateStr: string | Date | undefined, includeTime = false, useBengali = true): string {
  if (!dateStr) return '';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(d.getTime())) return String(dateStr);

  const day = d.getDate();
  const year = d.getFullYear();

  // If dateStr is a date-only string (e.g. YYYY-MM-DD or doesn't have time components), never show time
  const isDateOnlyString = typeof dateStr === 'string' && (
    !dateStr.includes(':') || 
    dateStr.includes('T00:00:00') || 
    /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())
  );
  const showTime = includeTime && !isDateOnlyString;

  if (!useBengali) {
    const month = englishMonths[d.getMonth()];
    let formatted = `${day} ${month}, ${year}`;
    if (showTime) {
      let hours = d.getHours();
      const minutes = d.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      formatted += ` (${hours}:${minutes} ${ampm})`;
    }
    return formatted;
  }

  const month = bengaliMonths[d.getMonth()];
  let formatted = `${toBengaliNumber(day)} ${month}, ${toBengaliNumber(year)}`;

  if (showTime) {
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'বিকাল/রাত' : 'সকাল';
    hours = hours % 12 || 12;
    formatted += ` (${ampm} ${toBengaliNumber(hours)}:${toBengaliNumber(minutes)})`;
  }

  return formatted;
}

/**
 * Formats a member date (e.g., Joining Date, Date of Birth) strictly as DATE ONLY.
 * Guaranteed never to show timestamps or hours/minutes.
 * Example: "12 September 2026" or "১২ সেপ্টেম্বর, ২০২৩"
 */
export function formatMemberDate(dateStr: string | Date | undefined, useBengali = true): string {
  if (!dateStr) return '';
  // Strip any timestamp component
  const cleanStr = typeof dateStr === 'string' ? dateStr.split('T')[0].split(' ')[0] : dateStr;
  return formatBengaliDate(cleanStr, false, useBengali);
}

export function formatDateOnly(dateStr: string | Date | undefined, useBengali = true): string {
  return formatMemberDate(dateStr, useBengali);
}

export function getTransactionTypeName(type: string, isBengali = true): { label: string; color: string; badge: string; isCredit: boolean } {
  switch (type) {
    case 'deposit':
    case 'dps_deposit':
      return { 
        label: isBengali ? 'সঞ্চয় (জমা)' : 'Savings (Deposit)', 
        color: 'text-emerald-600', 
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
        isCredit: true 
      };
    case 'withdraw':
      return { 
        label: isBengali ? 'সঞ্চয় (উত্তোলন)' : 'Savings (Withdraw)', 
        color: 'text-rose-600', 
        badge: 'bg-rose-50 text-rose-700 border-rose-200', 
        isCredit: false 
      };
    case 'loan_disbursed':
      return { 
        label: isBengali ? 'ঋণ প্রদান' : 'Loan Disbursed', 
        color: 'text-blue-600', 
        badge: 'bg-blue-50 text-blue-700 border-blue-200', 
        isCredit: false 
      };
    case 'loan_installment':
      return { 
        label: isBengali ? 'ঋণ (কিস্তি আদায়)' : 'Loan (Installment)', 
        color: 'text-teal-600', 
        badge: 'bg-teal-50 text-teal-700 border-teal-200', 
        isCredit: true 
      };
    case 'fdr_deposit':
      return { 
        label: isBengali ? 'স্থায়ী আমানত (FDR)' : 'Fixed Deposit (FDR)', 
        color: 'text-purple-600', 
        badge: 'bg-purple-50 text-purple-700 border-purple-200', 
        isCredit: true 
      };
    case 'admission_fee':
      return { 
        label: isBengali ? 'ভর্তি ফি' : 'Admission Fee', 
        color: 'text-indigo-600', 
        badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', 
        isCredit: true 
      };
    case 'share_purchase':
      return { 
        label: isBengali ? 'শেয়ার ক্রয়' : 'Share Purchase', 
        color: 'text-amber-600', 
        badge: 'bg-amber-50 text-amber-700 border-amber-200', 
        isCredit: true 
      };
    case 'share_surrender':
      return { 
        label: isBengali ? 'শেয়ার সমর্পণ/ক্লোজ' : 'Share Surrender/Close', 
        color: 'text-rose-600', 
        badge: 'bg-rose-50 text-rose-700 border-rose-200', 
        isCredit: false 
      };
    case 'profit_share':
      return { 
        label: isBengali ? 'লভ্যাংশ জমা' : 'Profit / Dividend Share', 
        color: 'text-teal-600', 
        badge: 'bg-teal-50 text-teal-700 border-teal-200', 
        isCredit: true 
      };
    case 'fine':
      return { 
        label: isBengali ? 'জরিমানা' : 'Fine / Late Fee', 
        color: 'text-orange-600', 
        badge: 'bg-orange-50 text-orange-700 border-orange-200', 
        isCredit: true 
      };
    case 'business_funding_disbursed':
      return { 
        label: isBengali ? 'ব্যবসা বিনিয়োগ বিতরণ' : 'Business Funding Disbursed', 
        color: 'text-indigo-600', 
        badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', 
        isCredit: false 
      };
    case 'business_funding_return':
      return { 
        label: isBengali ? 'ব্যবসা মূলধন ফেরত' : 'Business Capital Return', 
        color: 'text-blue-600', 
        badge: 'bg-blue-50 text-blue-700 border-blue-200', 
        isCredit: true 
      };
    case 'business_funding_profit':
      return { 
        label: isBengali ? 'ব্যবসা হতে অর্জিত মুনাফা' : 'Business Profit Received', 
        color: 'text-emerald-600', 
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
        isCredit: true 
      };
    case 'income':
      return { 
        label: isBengali ? 'বিবিধ আয়' : 'Misc Income', 
        color: 'text-emerald-600', 
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
        isCredit: true 
      };
    case 'expense':
      return { 
        label: isBengali ? 'অফিস খরচ/ব্যয়' : 'Office Expense', 
        color: 'text-red-600', 
        badge: 'bg-red-50 text-red-700 border-red-200', 
        isCredit: false 
      };
    default:
      return { 
        label: type, 
        color: 'text-slate-600', 
        badge: 'bg-slate-50 text-slate-700 border-slate-200', 
        isCredit: true 
      };
  }
}

export function formatBengaliNumber(n: number | string | undefined | null, useBengali = true): string {
  if (n === undefined || n === null || n === '') return useBengali ? '০' : '0';
  return useBengali ? toBengaliNumber(n) : String(n);
}

export function getTodayDateStr(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Robustly parses a transaction's creation time or date/time into milliseconds since epoch
 * to ensure correct descending serial order (newest first).
 */
export function parseTransactionTimestamp(tx: { 
  id?: string; 
  date?: string; 
  time?: string; 
  createdAt?: string; 
}): number {
  if (!tx) return 0;
  
  // 1. Explicit createdAt ISO timestamp (highest precision)
  if (tx.createdAt) {
    const parsed = new Date(tx.createdAt).getTime();
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }

  // 2. Parse date + time
  if (tx.date) {
    let hours = 12;
    let minutes = 0;
    let seconds = 0;
    
    if (tx.time) {
      const cleanTime = tx.time.trim();
      const match = cleanTime.match(/(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?\s*(AM|PM|am|pm)?/i);
      if (match) {
        hours = parseInt(match[1], 10);
        minutes = parseInt(match[2], 10);
        seconds = match[3] ? parseInt(match[3], 10) : 0;
        const meridian = match[4] ? match[4].toUpperCase() : null;
        if (meridian === 'PM' && hours < 12) hours += 12;
        if (meridian === 'AM' && hours === 12) hours = 0;
      }
    }

    const parts = tx.date.split('-').map(p => parseInt(p, 10));
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      const dateObj = new Date(parts[0], parts[1] - 1, parts[2], hours, minutes, seconds);
      const t = dateObj.getTime();
      if (!isNaN(t) && t > 0) {
        // If ID has timestamp milliseconds like tx-1725839200123, use it if on the same day
        if (tx.id) {
          const idDigitsMatch = tx.id.match(/tx-(\d{10,})/);
          if (idDigitsMatch) {
            const idTime = parseInt(idDigitsMatch[1], 10);
            if (!isNaN(idTime) && idTime > 0) {
              return idTime;
            }
          }
        }
        return t;
      }
    }
  }

  // 3. Fallback check for ID timestamp (tx-1725839200000)
  if (tx.id) {
    const idDigitsMatch = tx.id.match(/\d{10,}/);
    if (idDigitsMatch) {
      const idTime = parseInt(idDigitsMatch[0], 10);
      if (!isNaN(idTime) && idTime > 0) return idTime;
    }
  }

  return 0;
}

/**
 * Sorts transactions in strict descending order (newest/latest at the top).
 * Prioritizes unique Ledger serial number (highest serial at top), then date/timestamp.
 */
export function compareTransactionsDesc<T extends { id: string; serialNo?: number; date?: string; time?: string; createdAt?: string }>(a: T, b: T): number {
  // 1. Monotonic unique serial number comparison (highest serial first)
  if (typeof a.serialNo === 'number' && typeof b.serialNo === 'number' && a.serialNo !== b.serialNo) {
    return b.serialNo - a.serialNo;
  }

  // 2. Date string check (e.g., "2026-09-08" vs "2026-09-07")
  if (a.date && b.date && a.date !== b.date) {
    return b.date.localeCompare(a.date);
  }

  // 3. Comprehensive timestamp check (Time + Date + Milliseconds)
  const timeA = parseTransactionTimestamp(a);
  const timeB = parseTransactionTimestamp(b);
  if (timeA !== timeB) {
    return timeB - timeA;
  }

  // 4. Fallback to ID string reverse
  return (b.id || '').localeCompare(a.id || '');
}

/**
 * Formats a transaction ledger serial number consistently for display
 */
export function formatLedgerSerial(serialNo?: number, isBn: boolean = true, useBengaliDigits: boolean = true): string {
  if (serialNo === undefined || serialNo === null || serialNo <= 0) return '-';
  const numStr = (isBn && useBengaliDigits) ? toBengaliNumber(serialNo) : String(serialNo);
  return `#${numStr}`;
}


