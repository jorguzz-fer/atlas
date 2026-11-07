import fs from 'node:fs';
import path from 'node:path';
import {ORGANS_3D} from '../catalog';
import {organIconUrl} from './OrganIcon';

test('every organ in the 3D strip has a rendered icon in public/', () => {
  for (const o of ORGANS_3D) {
    const file = path.resolve(__dirname, '../../public', organIconUrl(o.key).split('?')[0].slice(1));
    expect([o.key, fs.existsSync(file)]).toEqual([o.key, true]);
  }
});
