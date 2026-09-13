import { Loan, BusinessFunding } from '../types';

export type ApprovalCategory = 
  | 'loan' 
  | 'business_funding' 
  | 'user_registration'
  | 'member_admission' 
  | 'savings_withdrawal' 
  | 'deposit'
  | 'share_purchase'
  | 'share_surrender'
  | 'member_profile_update'
  | 'other';

export interface PendingApprovalItem {
  id: string;
  category: ApprovalCategory;
  categoryLabelBn: string;
  categoryLabelEn: string;
  applicationNo: string;
  memberId: string;
  memberNo: string;
  memberName: string;
  memberPhone?: string;
  memberPhoto?: string;
  amount: number;
  requestDate: string;
  status: 'pending';
  statusLabelBn: string;
  statusLabelEn: string;
  title: string;
  subTitle?: string;
  profitOrInterestRate?: string;
  rawItem: Loan | BusinessFunding | any;
}
