import {test} from 'node:test';
import assert from 'node:assert/strict';
import {formatDuration} from '../lib/format-duration.mjs';
test('latency uses readable units across thresholds',()=>{
 for(const [ms,label] of [[0,'0 ms'],[345,'345 ms'],[999,'999 ms'],[1000,'1 s'],[16135,'16.14 s'],[59990,'59.99 s'],[60000,'1 min'],[90000,'1.5 min']])assert.equal(formatDuration(ms),label);
 assert.equal(formatDuration(NaN),'—');
});
