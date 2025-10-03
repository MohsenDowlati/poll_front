import { PollRecord } from '@/services/poll/poll';
import {number} from "motion-dom";

export type PollType = 'single_choice' | 'multi_choice' | 'slide' | 'opinion';

export interface SingleChoiceSelection {
  type: 'single_choice';
  selectedIndex: number; // index in options
}

export interface MultiChoiceSelection {
  type: 'multi_choice';
  selectedIndices: number[]; // indices in options
}

export interface SlideSelection {
  type: 'slide';
}

export interface OpinionSelection {
  type: 'opinion';
  value: string; // free text or any single value
}

export type VoteSelection =
  | SingleChoiceSelection
  | MultiChoiceSelection
  | SlideSelection
  | OpinionSelection;

const createZeroArray = (length: number): number[] => {
  const safeLength = Number.isFinite(length) && length > 0 ? Math.floor(length) : 0;
  return Array.from({ length: safeLength }, () => 0);
};

export function buildSingleChoiceVotes(selectedIndex: number, optionsLength: number): number[] {
  const votes = createZeroArray(optionsLength);
  if (votes.length === 0) return votes;

  const index = Math.max(0, Math.min(votes.length - 1, Math.floor(selectedIndex)));
  votes[index] = 1;
  return votes;
}

export function buildMultiChoiceVotes(selectedIndices: number[], optionsLength: number): number[] {
  const votes = createZeroArray(optionsLength);
  if (votes.length === 0) return votes;

  const uniqueSorted = Array.from(new Set((selectedIndices || []).map((i) => Math.floor(i)))).sort(
    (a, b) => a - b,
  );

  for (const idx of uniqueSorted) {
    if (idx >= 0 && idx < votes.length) {
      votes[idx] = 1;
    }
  }

  return votes;
}

export function buildSlideVotes(optionsLength: number, orderIndices?: number[]): number[] {
  const votes = createZeroArray(optionsLength);
  if (votes.length === 0) return votes;

  const order = Array.isArray(orderIndices) && orderIndices.length > 0
    ? orderIndices
    : votes.map((_, idx) => idx);
  const maxScore = votes.length;

  for (let rank = 0; rank < order.length; rank++) {
    const originalIndex = order[rank];
    if (typeof originalIndex !== 'number' || !Number.isFinite(originalIndex)) {
      continue;
    }

    const clampedIndex = Math.max(0, Math.min(votes.length - 1, Math.floor(originalIndex)));
    const score = Math.max(maxScore - rank, 1);
    votes[clampedIndex] = score;
  }

  for (let idx = 0; idx < votes.length; idx++) {
    if (votes[idx] === 0) {
      votes[idx] = 1;
    }
  }

  return votes;
}

export function buildOpinionVotes(value: string): string[] | number[] {
  return [1];
}

export function buildVotesByType(
  selection: VoteSelection,
  optionsLength: number,
): number[] | string[] {
  switch (selection.type) {
    case 'single_choice':
      return buildSingleChoiceVotes(selection.selectedIndex, optionsLength);
    case 'multi_choice':
      return buildMultiChoiceVotes(selection.selectedIndices, optionsLength);
    case 'slide':
      return buildSlideVotes(optionsLength);
    case 'opinion':
      return buildOpinionVotes(selection.value);
    default:
      return createZeroArray(optionsLength);
  }
}

export function inferPollType(poll: PollRecord): PollType | undefined {
  const t = (poll?.poll_type || '').toString().trim();
  if (!t) return undefined;
  if (t === 'single_choice' || t === 'multi_choice' || t === 'slide' || t === 'opinion') {
    return t;
  }
  return undefined;
}


