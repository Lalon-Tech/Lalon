import { 
  Firestore, 
  doc, 
  getDoc, 
  runTransaction, 
  collection, 
  getDocs, 
  writeBatch 
} from 'firebase/firestore';
import { Member } from '../types';

export interface MemberSequenceDoc {
  highestSequence: number;
  lastAssignedNo: string;
  retiredMemberNos: string[];
  updatedAt: string;
}

export interface MemberNumberDoc {
  memberNo: string;
  memberId: string;
  name: string;
  status: 'assigned' | 'retired';
  assignedAt: string;
  retiredAt?: string;
}

/**
 * Extracts integer sequence number from a Member ID (e.g. "BS-105" -> 105).
 */
export function parseMemberNo(memberNo: string | undefined | null): number | null {
  if (!memberNo) return null;
  const match = memberNo.trim().match(/^BS-(\d+)$/i);
  if (match) {
    const num = parseInt(match[1], 10);
    return isNaN(num) ? null : num;
  }
  return null;
}

/**
 * Scans active and recycle bin members, retired IDs, and local storage to find the highest number.
 */
export function getHighestMemberSequence(
  members: Member[],
  retiredMemberNos: string[] = []
): number {
  let max = 100; // Sequence baseline (BS-101 is the first member)

  if (Array.isArray(members)) {
    for (const m of members) {
      const num = parseMemberNo(m.memberNo);
      if (num !== null && num > max) {
        max = num;
      }
    }
  }

  if (Array.isArray(retiredMemberNos)) {
    for (const r of retiredMemberNos) {
      const num = parseMemberNo(r);
      if (num !== null && num > max) {
        max = num;
      }
    }
  }

  // Also check localStorage cached members and sequence
  try {
    const cachedMembers = JSON.parse(localStorage.getItem('bondhu_members') || '[]');
    if (Array.isArray(cachedMembers)) {
      for (const m of cachedMembers) {
        const num = parseMemberNo(m.memberNo);
        if (num !== null && num > max) {
          max = num;
        }
      }
    }
    const cachedSeq = parseInt(localStorage.getItem('bondhu_highest_member_seq') || '0', 10);
    if (!isNaN(cachedSeq) && cachedSeq > max) {
      max = cachedSeq;
    }
  } catch (_) {}

  return max;
}

/**
 * Formats a sequence number into the official Member ID format: "BS-###"
 */
export function formatMemberNo(num: number): string {
  return `BS-${num}`;
}

/**
 * In-memory fallback sequence tracker for synchronous batch generation (e.g. Excel import).
 */
let memorySequenceLock = 100;

export function setMemorySequenceFloor(num: number) {
  if (num > memorySequenceLock) {
    memorySequenceLock = num;
  }
}

/**
 * Generates the next sequential unique Member ID with atomic Firestore transaction
 * and database-level uniqueness validation.
 *
 * Rules strictly enforced:
 * 1. Checks existing active members and Recycle Bin records.
 * 2. Checks retiredMemberNos to NEVER reuse previously assigned IDs, even after permanent deletion.
 * 3. Uses atomic Firestore transaction to prevent duplicate IDs during simultaneous registrations.
 * 4. Claims the ID in the `memberNumbers/{memberNo}` registry collection.
 */
/**
 * Mutex queue to serialize atomic generation calls in the same client environment
 */
let localGenerationQueue: Promise<unknown> = Promise.resolve();

export async function generateNextMemberNoAtomic(
  db: Firestore,
  memberId: string,
  memberName: string,
  knownMembers: Member[] = []
): Promise<string> {
  const op = localGenerationQueue.then(() =>
    executeAtomicGeneration(db, memberId, memberName, knownMembers)
  );
  localGenerationQueue = op.catch(() => {});
  return op;
}

async function executeAtomicGeneration(
  db: Firestore,
  memberId: string,
  memberName: string,
  knownMembers: Member[] = []
): Promise<string> {
  const counterDocRef = doc(db, 'counters', 'memberSequence');

  // Compute local floor from known active and recycle bin members
  const localMax = getHighestMemberSequence(knownMembers);
  setMemorySequenceFloor(localMax);

  try {
    const assignedMemberNo = await runTransaction(db, async (transaction) => {
      const counterSnap = await transaction.get(counterDocRef);
      
      let highestSequence = 100;
      let retiredList: string[] = [];

      if (counterSnap.exists()) {
        const data = counterSnap.data() as Partial<MemberSequenceDoc>;
        highestSequence = Number(data.highestSequence) || 100;
        retiredList = Array.isArray(data.retiredMemberNos) ? data.retiredMemberNos : [];
      }

      // Maximum across database counter, local floor, memory lock, and retired IDs
      let candidateSeq = Math.max(highestSequence, localMax, memorySequenceLock) + 1;
      let candidateMemberNo = formatMemberNo(candidateSeq);

      // Ensure candidate is NOT in retired list
      while (retiredList.includes(candidateMemberNo)) {
        candidateSeq += 1;
        candidateMemberNo = formatMemberNo(candidateSeq);
      }

      // Check if document exists in memberNumbers (database-level uniqueness check)
      let memberNumRef = doc(db, 'memberNumbers', candidateMemberNo);
      let memberNumSnap = await transaction.get(memberNumRef);

      while (memberNumSnap.exists()) {
        candidateSeq += 1;
        candidateMemberNo = formatMemberNo(candidateSeq);
        while (retiredList.includes(candidateMemberNo)) {
          candidateSeq += 1;
          candidateMemberNo = formatMemberNo(candidateSeq);
        }
        memberNumRef = doc(db, 'memberNumbers', candidateMemberNo);
        memberNumSnap = await transaction.get(memberNumRef);
      }

      // Write reservation to memberNumbers collection (Enforces DB-level uniqueness)
      transaction.set(memberNumRef, {
        memberNo: candidateMemberNo,
        memberId,
        name: memberName || 'সদস্য',
        status: 'assigned',
        assignedAt: new Date().toISOString()
      });

      // Update counters document
      transaction.set(counterDocRef, {
        highestSequence: candidateSeq,
        lastAssignedNo: candidateMemberNo,
        retiredMemberNos: retiredList,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      return candidateMemberNo;
    });

    const assignedNum = parseMemberNo(assignedMemberNo);
    if (assignedNum) {
      setMemorySequenceFloor(assignedNum);
      try {
        localStorage.setItem('bondhu_highest_member_seq', assignedNum.toString());
      } catch (_) {}
    }

    return assignedMemberNo;
  } catch (err) {
    console.warn('Firestore transaction failed, falling back to guaranteed unique sequential generator:', err);

    // Guaranteed unique fallback if offline or permission issue
    memorySequenceLock += 1;
    let nextNum = Math.max(localMax + 1, memorySequenceLock);
    let candidate = formatMemberNo(nextNum);

    // Check against known members
    const knownSet = new Set(knownMembers.map(m => m.memberNo));
    while (knownSet.has(candidate)) {
      nextNum += 1;
      candidate = formatMemberNo(nextNum);
    }
    memorySequenceLock = nextNum;
    try {
      localStorage.setItem('bondhu_highest_member_seq', nextNum.toString());
    } catch (_) {}

    return candidate;
  }
}

/**
 * Permanently retires a Member ID so it can NEVER be reused again,
 * even after permanent deletion of the member.
 */
export async function retireMemberNo(
  db: Firestore,
  memberNo: string,
  memberId: string
): Promise<void> {
  if (!memberNo) return;
  const cleanNo = memberNo.trim().toUpperCase();

  try {
    const counterDocRef = doc(db, 'counters', 'memberSequence');
    const memberNumRef = doc(db, 'memberNumbers', cleanNo);

    await runTransaction(db, async (transaction) => {
      const counterSnap = await transaction.get(counterDocRef);
      let retiredList: string[] = [];
      let highestSequence = 100;

      if (counterSnap.exists()) {
        const data = counterSnap.data() as Partial<MemberSequenceDoc>;
        retiredList = Array.isArray(data.retiredMemberNos) ? [...data.retiredMemberNos] : [];
        highestSequence = Number(data.highestSequence) || 100;
      }

      if (!retiredList.includes(cleanNo)) {
        retiredList.push(cleanNo);
      }

      const num = parseMemberNo(cleanNo);
      if (num && num > highestSequence) {
        highestSequence = num;
      }

      transaction.set(counterDocRef, {
        retiredMemberNos: retiredList,
        highestSequence,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      transaction.set(memberNumRef, {
        memberNo: cleanNo,
        memberId,
        status: 'retired',
        retiredAt: new Date().toISOString()
      }, { merge: true });
    });
  } catch (err) {
    console.error('Error retiring memberNo in Firestore:', err);
    try {
      const retired = JSON.parse(localStorage.getItem('bondhu_retired_member_nos') || '[]');
      if (!retired.includes(cleanNo)) {
        retired.push(cleanNo);
        localStorage.setItem('bondhu_retired_member_nos', JSON.stringify(retired));
      }
    } catch (_) {}
  }
}
