import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mapShortcuts,mapsUrl} from '../lib/map-shortcuts.mjs';
import {parseElevenEvidence} from '../lib/eleven-evidence.mjs';
test('only places actually recommended in the answer receive named shortcuts',()=>{
 const places=[{name:'Kafe Utu',address:'Singapore'},{name:'Other Cafe'},{name:'Kafe Utu'}];
 assert.deepEqual(mapShortcuts('Try Kafe Utu.',places),[{name:'Kafe Utu',query:'Kafe Utu, Singapore'}]);
 assert.deepEqual(mapShortcuts('Here is a recipe.',places,'How do I make kaya?'),[]);
});
test('Maps uses a fixed safe origin and encoded query, with a fallback for old local replies',()=>{
 const query='Cafe A & B #1, Singapore';const url=new URL(mapsUrl(query));
 assert.equal(url.origin,'https://www.google.com');assert.equal(url.searchParams.get('api'),'1');assert.equal(url.searchParams.get('query'),query);
 assert.equal(mapShortcuts('Try a local café.',[],'brunch in Singapore')[0].name,'Find on Google Maps');
});
test('structured Exa places survive evidence parsing',()=>{
 const evidence=parseElevenEvidence({tool_name:'web_search',full_tool_result:JSON.stringify({results:[{url:'https://example.com',entities:[{type:'place',properties:{name:'Kafe Utu',address:'Singapore'}},{type:'person',properties:{name:'Someone'}}]}]})});
 assert.deepEqual(evidence.places,[{name:'Kafe Utu',address:'Singapore'}]);
});

test('article-style café recommendations get named searches without inventing place IDs',()=>{
 const links=mapShortcuts('Lean & Rich Bakery at UE Square and Kafe Utu in Chinatown are good options.',[],'Find brunch in Singapore');
 assert.deepEqual(links,[{name:'Lean & Rich Bakery',query:'Lean & Rich Bakery, Singapore'},{name:'Kafe Utu',query:'Kafe Utu, Singapore'}]);
});
