export type TourStep = {concept: string; text: string};
export type Tour = {id: string; title: string; steps: TourStep[]};
export type TourState = {tour: Tour; step: number};

export function tourReducer(state: TourState, action: 'next' | 'prev' | 'exit'): TourState | null {
  if (action === 'exit') return null;
  const last = state.tour.steps.length - 1;
  const step = action === 'next' ? Math.min(state.step + 1, last) : Math.max(state.step - 1, 0);
  return {...state, step};
}
