import { Loan, BusinessFunding, Member } from '../types';
import { PendingApprovalItem } from '../types/approval';

export interface ApprovalCollectorSources {
  loans?: Loan[];
  businessFundings?: BusinessFunding[];
  members?: Member[];
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

  // 3. Extensible: Future collectors can be plugged in here seamlessly
  // (e.g. member admission approval, savings withdrawal approval, etc.)

  // Sort by requestDate descending (newest first)
  return items.sort((a, b) => {
    const timeA = new Date(a.requestDate).getTime() || 0;
    const timeB = new Date(b.requestDate).getTime() || 0;
    return timeB - timeA;
  });
}
