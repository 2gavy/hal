import {test} from 'node:test';
import assert from 'node:assert/strict';
import {exaSearchMs} from '../lib/search-timing.mjs';
test('server search metric preserves precision and never falls back to round-trip timing',()=>{
 assert.equal(exaSearchMs({searchTime:7.2,elapsedMs:532}),7.2);
 assert.equal(exaSearchMs({searchTime:0}),0);
 for(const searchTime of [undefined,null,'300',-1,NaN,Infinity])assert.equal(exaSearchMs({searchTime,elapsedMs:532}),undefined);
});
