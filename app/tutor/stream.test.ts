import {parseSse} from './stream';

test('an event split across two chunks comes out whole', () => {
  const first = parseSse('data: {"type":"text","del', '');
  expect(first.events).toEqual([]);
  const second = parseSse('ta":"Olá"}\n\n', first.rest);
  expect(second.events).toEqual([{type: 'text', delta: 'Olá'}]);
  expect(second.rest).toBe('');
});

test('two events in one chunk come out as two', () => {
  const out = parseSse('data: {"type":"highlight","ids":["FJ1"]}\n\ndata: {"type":"done"}\n\n', '');
  expect(out.events).toEqual([{type: 'highlight', ids: ['FJ1']}, {type: 'done'}]);
});

test('ignores comments, other fields and broken JSON', () => {
  const out = parseSse(': ping\n\nevent: x\ndata: nao-json\n\ndata: {"type":"done"}\n\n', '');
  expect(out.events).toEqual([{type: 'done'}]);
});
