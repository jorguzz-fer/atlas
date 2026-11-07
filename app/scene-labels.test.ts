import {placeLabels, labelsMoved} from './scene-labels';

const viewport = {width: 800, height: 600};

test('two labels anchored at the same point end up at least 22 px apart', () => {
  const out = placeLabels([
    {id: 'a', x: 400, y: 300, size: 80},
    {id: 'b', x: 400, y: 300, size: 80},
  ], viewport);
  expect(out).toHaveLength(2);
  expect(Math.abs(out[0].y - out[1].y)).toBeGreaterThanOrEqual(22);
});

test('labels keep their anchor point for the leader line', () => {
  const [label] = placeLabels([{id: 'a', x: 300, y: 200, size: 80}], viewport);
  expect(label).toMatchObject({id: 'a', anchorX: 300, anchorY: 200});
  expect(label.x).toBeGreaterThan(300);
});

test('anchors outside the viewport are dropped', () => {
  expect(placeLabels([{id: 'a', x: -10, y: 300, size: 80}, {id: 'b', x: 400, y: 700, size: 80}], viewport)).toEqual([]);
});

test('structures smaller than 24 px on screen get no label', () => {
  expect(placeLabels([{id: 'a', x: 400, y: 300, size: 10}], viewport)).toEqual([]);
});

test('labelsMoved ignores sub-4px jitter but reports real moves and set changes', () => {
  const a = [{id: 'a', x: 100, y: 100, anchorX: 30, anchorY: 100}];
  expect(labelsMoved(a, [{...a[0], x: 103, y: 98}])).toBe(false);
  expect(labelsMoved(a, [{...a[0], x: 105}])).toBe(true);
  expect(labelsMoved(a, [])).toBe(true);
  expect(labelsMoved(a, [{...a[0], id: 'b'}])).toBe(true);
});

test('labels near the right edge flip to the left side of the anchor', () => {
  const [label] = placeLabels([{id: 'a', x: 780, y: 300, size: 80}], viewport);
  expect(label.x).toBeLessThan(780);
});
