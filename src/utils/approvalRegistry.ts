import { Loan, BusinessFunding, BusinessProfitRecord, Member, AppUser, Transaction, MemberUpdateRequest } from '../types';
import { PendingApprovalItem } from '../types/approval';

export interface ApprovalCollectorSources {
  loans?: Loan[];
  businessFundings?: BusinessFunding[];
  businessProfitRecords?: BusinessProfitRecord[];
  members?: Member[];
  users?: AppUser[];
  transactions?: Transaction[];
  memberUpdateRequests?: MemberUpdateRequest[];
}

/**
 * Central Approval Notification Registry
 * Aggregates all pending admin approval requests across modules into a unified format.
 * Designed to be easily extensible for any future approval feature.
 */
export function getAllPendingApprovals(sources: ApprovalCollectorSources): PendingApprovalItem[] {
  const items: PendingApprovalItem[] = [];
  const memberMap = new Map<string, Member>();
  if (sources.members) {
    sources.members.forEach(m => memberMap.set(m.id, m));
  }

  // 1. Pending Loans Collector
  if (sources.loans && Array.isArray(sources.loans)) {
    sources.loans
      .filter(l => l.status === 'pending')
      .forEach(loan => {
        const member = memberMap.get(loan.memberId);
        items.push({
          id: loan.id,
          category: 'loan',
          categoryLabelBn: 'ঋণ বিতরণ আবেদন',
          categoryLabelEn: 'Loan Application',
          applicationNo: loan.loanNo || loan.applicationNo || loan.id,
          memberId: loan.memberId,
          memberNo: loan.memberNo || member?.memberNo || '',
          memberName: loan.memberName || member?.name || 'অজ্ঞাত সদস্য',
          memberPhone: loan.memberPhone || member?.phone,
          memberPhoto: member?.photoUrl,
          amount: loan.principalAmount || loan.totalAmount || 0,
          requestDate: loan.appliedDate || loan.disbursedDate || new Date().toISOString().split('T')[0],
          status: 'pending',
          statusLabelBn: 'অনুমোদন অপেক্ষমাণ',
          statusLabelEn: 'Pending Approval',
          title: loan.purpose || 'ব্যক্তিগত ঋণ আবেদন',
          subTitle: loan.totalInstallments ? `${loan.totalInstallments} কিস্তি` : undefined,
          profitOrInterestRate: loan.interestRate ? `${loan.interestRate}% মুনাফা/সুদ` : undefined,
          rawItem: loan,
        });
      });
  }

  // 2. Pending Business Fundings Collector
  if (sources.businessFundings && Array.isArray(sources.businessFundings)) {
    sources.businessFundings
      .filter(b => b.status === 'pending')
      .forEach(funding => {
        const member = memberMap.get(funding.memberId);
        items.push({
          id: funding.id,
          category: 'business_funding',
          categoryLabelBn: 'ব্যবসা বিনিয়োগ আবেদন',
          categoryLabelEn: 'Business Funding Application',
          applicationNo: funding.applicationNo || funding.id,
          memberId: funding.memberId,
          memberNo: funding.memberNo || member?.memberNo || '',
          memberName: funding.memberName || member?.name || 'অজ্ঞাত সদস্য',
          memberPhone: funding.memberPhone || member?.phone,
          memberPhoto: member?.photoUrl,
          amount: funding.amountRequested,
          requestDate: funding.applicationDate || funding.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
          status: 'pending',
          statusLabelBn: 'অনুমোদন অপেক্ষমাণ',
          statusLabelEn: 'Pending Approval',
          title: funding.businessName || 'ব্যবসা বিনিয়োগ',
          subTitle: `${funding.durationMonths} মাস মেয়াদ`,
          profitOrInterestRate: `সদস্য ${funding.memberProfitSharePercent}% • সমিতি ${funding.somitiProfitSharePercent}%`,
          rawItem: funding,
        });
      });
  }

  // 2.5. Pending Business Profit Records Collector
  if (sources.businessProfitRecords && Array.isArray(sources.businessProfitRecords)) {
    sources.businessProfitRecords
      .filter(p => p.status === 'pending')
      .forEach(profit => {
        const member = memberMap.get(profit.memberId);
        items.push({
          id: profit.id,
          category: 'business_profit',
          categoryLabelBn: 'ব্যবসায়িক লভ্যাংশ জমা',
          categoryLabelEn: 'Business Profit Record',
          applicationNo: profit.applicationNo || profit.id,
          memberId: profit.memberId,
          memberNo: profit.memberNo || member?.memberNo || '',
          memberName: profit.memberName || member?.name || 'সদস্য',
          memberPhone: member?.phone,
          memberPhoto: member?.photoUrl,
          amount: profit.somitiProfitAmount || profit.profitAmount || profit.totalBusinessProfit || 0,
          requestDate: profit.date || profit.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
          status: 'pending',
          statusLabelBn: 'অনুমোদন অপেক্ষমাণ',
          statusLabelEn: 'Pending Approval',
          title: `ব্যবসায়িক মুনাফা জমা (${profit.month})`,
          subTitle: `মোট মুনাফা: ৳${profit.totalBusinessProfit} • সমিতি লভ্যাংশ: ৳${profit.somitiProfitAmount}`,
          profitOrInterestRate: `সমিতি অংশ ${profit.somitiProfitPercent}% • সদস্য অংশ ${profit.memberProfitPercent}%`,
          rawItem: profit,
        });
      });
  }

  // 3. Pending User Registrations Collector
  if (sources.users && Array.isArray(sources.users)) {
    sources.users
      .filter(u => u.status === 'pending')
      .forEach(user => {
        items.push({
          id: user.id,
          category: 'user_registration',
          categoryLabelBn: 'নতুন সদস্য নিবন্ধন',
          categoryLabelEn: 'New Member Registration',
          applicationNo: user.userUid || user.email,
          memberId: user.memberId || '',
          memberNo: user.memberNo || '',
          memberName: user.name || user.email,
          memberPhone: user.phone || undefined,
          memberPhoto: user.avatarUrl,
          amount: 0,
          requestDate: user.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
          status: 'pending',
          statusLabelBn: 'অনুমোদন অপেক্ষমাণ',
          statusLabelEn: 'Pending Approval',
          title: 'নতুন একাউন্ট নিবন্ধন আবেদন',
          subTitle: `ইমেইল: ${user.email}`,
          profitOrInterestRate: 'সদস্য প্রোফাইল ও UID লিংক প্রয়োজন',
          rawItem: user,
        });
      });
  }

  // 3.5. Pending Member Admissions Collector
  if (sources.members && Array.isArray(sources.members)) {
    sources.members
      .filter(m => m.status === 'pending')
      .forEach(member => {
        items.push({
          id: member.id,
          category: 'member_admission',
          categoryLabelBn: 'নতুন সদস্য ভর্তি আবেদন',
          categoryLabelEn: 'New Member Admission',
          applicationNo: member.memberNo ? `#${member.memberNo}` : member.id,
          memberId: member.id,
          memberNo: member.memberNo || '',
          memberName: member.name || 'নতুন সদস্য',
          memberPhone: member.phone || undefined,
          memberPhoto: member.photoUrl,
          amount: member.admissionFee || 0,
          requestDate: member.joiningDate || new Date().toISOString().split('T')[0],
          status: 'pending',
          statusLabelBn: 'অনুমোদন অপেক্ষমাণ',
          statusLabelEn: 'Pending Approval',
          title: `নতুন সদস্য ভর্তি আবেদন (${member.name})`,
          subTitle: `মোবাইল: ${member.phone || '-'} | শেয়ার: ${member.shareCount || 0} টি`,
          profitOrInterestRate: member.admissionFee ? `ভর্তি ফি: ৳${member.admissionFee}` : undefined,
          rawItem: member,
        });
      });
  }

  // 4. Pending Member Transactions Collector (Deposit, Withdraw, Share Purchase, Share Surrender)
  if (sources.transactions && Array.isArray(sources.transactions)) {
    sources.transactions
      .filter(t => t.status === 'pending')
      .forEach(tx => {
        const member = tx.memberId ? memberMap.get(tx.memberId) : undefined;
        let category: any = 'other';
        let categoryLabelBn = 'আর্থিক লেনদেন অনুমোদন';
        let categoryLabelEn = 'Transaction Approval';

        if (tx.type === 'deposit' || tx.type === 'dps_deposit' || tx.type === 'fdr_deposit') {
          category = 'deposit';
          categoryLabelBn = 'সঞ্চয় জমা অনুমোদন';
          categoryLabelEn = 'Savings Deposit Approval';
        } else if (tx.type === 'withdraw') {
          category = 'savings_withdrawal';
          categoryLabelBn = 'সঞ্চয় উত্তোলন অনুমোদন';
          categoryLabelEn = 'Savings Withdrawal Approval';
        } else if (tx.type === 'share_purchase') {
          category = 'share_purchase';
          categoryLabelBn = 'শেয়ার ক্রয় অনুমোদন';
          categoryLabelEn = 'Share Purchase Approval';
        } else if (tx.type === 'share_surrender') {
          category = 'share_surrender';
          categoryLabelBn = 'শেয়ার সমর্পণ অনুমোদন';
          categoryLabelEn = 'Share Surrender Approval';
        }

        items.push({
          id: tx.id,
          category,
          categoryLabelBn,
          categoryLabelEn,
          applicationNo: tx.voucherNo || tx.id,
          memberId: tx.memberId || '',
          memberNo: tx.memberNo || member?.memberNo || '',
          memberName: tx.memberName || member?.name || 'অজ্ঞাত সদস্য',
          memberPhone: member?.phone,
          memberPhoto: member?.photoUrl,
          amount: tx.amount,
          requestDate: tx.date || new Date().toISOString().split('T')[0],
          status: 'pending',
          statusLabelBn: 'অনুমোদন অপেক্ষমাণ',
          statusLabelEn: 'Pending Approval',
          title: tx.notes || categoryLabelBn,
          subTitle: tx.paymentMethod ? `পদ্ধতি: ${tx.paymentMethod.toUpperCase()}` : undefined,
          profitOrInterestRate: tx.bankAccountId ? 'ব্যাংক লেনদেন' : 'ক্যাশ লেনদেন',
          rawItem: tx,
        });
      });
  }

  // 5. Member Profile Update Requests (Personal info, Nominee, Photo, Signature updates)
  if (sources.memberUpdateRequests && sources.memberUpdateRequests.length > 0) {
    sources.memberUpdateRequests
      .filter(req => req.status === 'pending')
      .forEach(req => {
        const member = memberMap.get(req.memberId);
        const changedKeys = Object.keys(req.changes || {}).join(', ');
        items.push({
          id: req.id,
          category: 'member_profile_update',
          categoryLabelBn: 'সদস্য প্রোফাইল পরিবর্তন আবেদন',
          categoryLabelEn: 'Profile Update Request',
          applicationNo: req.id,
          memberId: req.memberId,
          memberNo: req.memberNo || member?.memberNo || '',
          memberName: req.memberName || member?.name || 'সদস্য',
          memberPhone: member?.phone,
          memberPhoto: (req.changes as any)?.photoUrl || member?.photoUrl,
          amount: 0,
          requestDate: req.requestDate || new Date().toISOString().split('T')[0],
          status: 'pending',
          statusLabelBn: 'অনুমোদন অপেক্ষমাণ',
          statusLabelEn: 'Pending Approval',
          title: `তথ্য সংশোধন: ${changedKeys || 'প্রোফাইল আপডেট'}`,
          subTitle: `আবেদনকারী: ${req.requestedBy || member?.name}`,
          rawItem: req,
        });
      });
  }

  // Sort by requestDate descending (newest first)
  return items.sort((a, b) => {
    const timeA = new Date(a.requestDate).getTime() || 0;
    const timeB = new Date(b.requestDate).getTime() || 0;
    return timeB - timeA;
  });
}
