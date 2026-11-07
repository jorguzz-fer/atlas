import fs from 'node:fs';
import {tourReducer, type Tour, type TourState} from './tour';
import {checkAnswer, quizReducer, type QuizItem} from './quiz';
import type {Atlas} from '../anatomy';

const read = (rel: string) => JSON.parse(fs.readFileSync(new URL(rel, import.meta.url), 'utf8'));
const atlas: Atlas = read('../../public/models/atlas.json');
const tours: Tour[] = read('../../public/data/tours.json');
const quiz: QuizItem[] = read('../../public/data/quiz.json');
const names = new Set(atlas.concepts.map(c => c.name));
const concept = (n: string) => atlas.concepts.find(c => c.name === n)!;

test('every tour step names a concept that exists in the atlas', () => {
  expect(tours.map(t => t.id)).toEqual(['coracao', 'digestorio', 'esqueleto-axial']);
  for (const t of tours) for (const s of t.steps) {
    expect(names.has(s.concept), s.concept).toBe(true);
    expect(s.text.length).toBeGreaterThan(20);
  }
});

test('every quiz item names a concept that exists in the atlas', () => {
  expect(quiz).toHaveLength(20);
  for (const q of quiz) expect(names.has(q.concept), q.concept).toBe(true);
});

test('checkAnswer accepts a piece of the asked structure and rejects its mirror', () => {
  const item: QuizItem = {concept: 'right femur', region: 'legs'};
  expect(checkAnswer(item, concept('right femur').elements[0], atlas)).toBe('correct');
  expect(checkAnswer(item, concept('left femur').elements[0], atlas)).toBe('incorrect');
});

test('tourReducer stays within the steps', () => {
  const tour = tours[0];
  let s: TourState = {tour, step: 0};
  s = tourReducer(s, 'prev')!;
  expect(s.step).toBe(0);
  for (let i = 0; i < 20; i++) s = tourReducer(s, 'next')!;
  expect(s.step).toBe(tour.steps.length - 1);
  expect(tourReducer(s, 'exit')).toBeNull();
});

test('quizReducer: wrong answer keeps the item, reveal shows it, next advances and counts the score', () => {
  const items = quiz.slice(0, 3);
  let s = quizReducer(null, {type: 'start', items});
  expect(s).toMatchObject({index: 0, outcome: null, score: 0});
  s = quizReducer(s, {type: 'answer', result: 'incorrect'});
  expect(s).toMatchObject({index: 0, outcome: 'incorrect', score: 0});
  s = quizReducer(s, {type: 'answer', result: 'correct'});
  expect(s).toMatchObject({outcome: 'correct', score: 1});
  s = quizReducer(s, {type: 'next'});
  expect(s).toMatchObject({index: 1, outcome: null});
  s = quizReducer(s, {type: 'reveal'});
  expect(s).toMatchObject({outcome: 'revealed', score: 1});
  s = quizReducer(s, {type: 'answer', result: 'correct'});
  expect(s!.score).toBe(1);
});

test('quizReducer finishes after the last item', () => {
  let s = quizReducer(null, {type: 'start', items: quiz.slice(0, 1)});
  s = quizReducer(s, {type: 'answer', result: 'correct'});
  s = quizReducer(s, {type: 'next'});
  expect(s).toMatchObject({finished: true, score: 1});
});
