import { Loan, BusinessFunding } from '../types';

export type ApprovalCategory = 
  | 'loan' 
  | 'business_funding' 
  | 'member_admission' 
  | 'savings_withdrawal' 
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
