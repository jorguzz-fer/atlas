import type {Atlas} from '../anatomy';
import type {RegionId} from '../catalog';

export type QuizItem = {concept: string; region: RegionId};
export type Outcome = 'correct' | 'incorrect' | 'revealed';
export type QuizState = {items: QuizItem[]; index: number; outcome: Outcome | null; score: number; finished: boolean};
export type QuizAction =
  | {type: 'start'; items: QuizItem[]}
  | {type: 'answer'; result: 'correct' | 'incorrect'}
  | {type: 'reveal'}
  | {type: 'next'};

/** A click is right when the clicked piece belongs to the asked concept. */
export function checkAnswer(item: QuizItem, clickedPartId: string, atlas: Atlas): 'correct' | 'incorrect' {
  const concept = atlas.concepts.find(c => c.name === item.concept);
  return concept?.elements.includes(clickedPartId) ? 'correct' : 'incorrect';
}

export function quizReducer(state: QuizState | null, action: QuizAction): QuizState | null {
  if (action.type === 'start') return {items: action.items, index: 0, outcome: null, score: 0, finished: false};
  if (!state || state.finished) return state;
  switch (action.type) {
    case 'answer':
      // Once solved or revealed, further clicks do not change the score.
      if (state.outcome === 'correct' || state.outcome === 'revealed') return state;
      return {...state, outcome: action.result, score: state.score + (action.result === 'correct' ? 1 : 0)};
    case 'reveal':
      return state.outcome === 'correct' ? state : {...state, outcome: 'revealed'};
    case 'next':
      return state.index + 1 >= state.items.length
        ? {...state, finished: true}
        : {...state, index: state.index + 1, outcome: null};
  }
}

/** Shuffled copy, so each round asks in a different order. */
export function shuffled<T>(items: T[], random = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
