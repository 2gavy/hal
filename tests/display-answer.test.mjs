import {test} from 'node:test';
import assert from 'node:assert/strict';
import {displayAnswer} from '../lib/display-answer.mjs';
test('speech cues disappear without removing citations or Markdown links',()=>{
 assert.equal(displayAnswer('[helpful] Here are the steps. [happy] See [1] and [official guidance](https://example.com).'),'Here are the steps.  See [1] and [official guidance](https://example.com).');
 assert.equal(displayAnswer('[helpful](https://example.com) [unknown]'),'[helpful](https://example.com) [unknown]');
});
