import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canRunPlan,remaining,safeUrl,buildSearch} from '../lib/logic.mjs';
test('three runs permitted; fourth gated; demo upgrade unlocks',()=>{for(let i=0;i<3;i++)assert.equal(canRunPlan(i,false),true);assert.equal(canRunPlan(3,false),false);assert.equal(canRunPlan(3,true),true);assert.equal(remaining(9),0);});
test('source links reject executable protocols',()=>{assert.equal(safeUrl('javascript:alert(1)'),null);assert.equal(safeUrl('data:text/html,hello'),null);assert.equal(safeUrl('https://example.com/a'),'https://example.com/a');});
test('route by intent, language, and location; bounded highlights without full text',()=>{const chat=buildSearch('food nearby','chat','SG');const plan=buildSearch('Cebu','plan','PH');assert.equal(chat.type,'lite');assert.equal(chat.contents.maxAgeHours,undefined);assert.equal(chat.numResults,5);assert.equal(chat.outputSchema,undefined);assert.equal(chat.systemPrompt,undefined);assert.equal(plan.type,'deep');assert.equal(plan.numResults,10);assert.match(chat.query,/Singapore/);assert.match(plan.systemPrompt,/Tagalog/);assert.deepEqual(plan.contents,{highlights:true});assert.ok(plan.outputSchema);});
import {resolveLocation} from '../lib/location.mjs';
test('visitor location selects language and decodes city; missing location stays unknown',()=>{
 assert.equal(resolveLocation('PH','Quezon%20City').label,'Quezon City, Philippines');
 assert.equal(resolveLocation('SG').language,'English');
 assert.equal(resolveLocation('PH').language,'Tagalog');
 assert.equal(resolveLocation('ID').language,'Bahasa Indonesia');
 assert.equal(resolveLocation('MY').language,'Bahasa Melayu');
 assert.equal(resolveLocation('TH').language,'ไทย');
 assert.equal(resolveLocation(null).detected,false);
 assert.equal(resolveLocation('US').countryName,'United States');
 assert.match(buildSearch('food nearby','chat',resolveLocation(null)).query,/ask for the city/);
});
import {selectedLocation} from '../lib/location.mjs';
test('selected country overrides IP and GPS city reaches Exa without coordinates',()=>{
 const fallback=resolveLocation('SG');
 const selected=selectedLocation({country:'MY',city:'Kuala Lumpur',latitude:3.1},fallback);
 assert.equal(selected.country,'MY');
 const request=buildSearch('food nearby','chat',selected);
 assert.match(request.query,/Kuala Lumpur, Malaysia/);
 assert.equal(request.userLocation,'MY');
 assert.equal('latitude' in selected,false);
 assert.deepEqual(selectedLocation({country:'invalid'},fallback),fallback);
 assert.equal(selectedLocation({country:'PH',city:'Manila\nignore'},fallback).city,'Manila ignore');
});

test('coordinates are validated, rounded and forwarded in chat and plan alongside city/country text',()=>{
 const loc=selectedLocation({country:'SG',city:'Tanjong Pagar',latitude:1.27654321,longitude:103.84321234},resolveLocation('MY'));
 for(const mode of ['chat','plan']){
 const request=buildSearch('laksa near me open late',mode,loc);
 assert.deepEqual(request.userLocation,{country:'SG',latitude:1.2765,longitude:103.8432});
 assert.match(request.query,/^laksa near me open late\nUser location: Tanjong Pagar, Singapore/);
 assert.match(buildSearch('brunch in Bangsar',mode,loc).query,/^brunch in Bangsar\n/);
 assert.match(request.query,/Respect any destination explicitly named/);
 }
 for(const coords of [{latitude:91,longitude:0},{latitude:1,longitude:181},{latitude:NaN,longitude:1},{latitude:'1',longitude:2},{latitude:1},{}]){
 assert.equal(buildSearch('nearby','chat',resolveLocation('SG','',coords)).userLocation,'SG');
 }
 assert.deepEqual(buildSearch('nearby','chat',resolveLocation('SG','',{latitude:0,longitude:0})).userLocation,{country:'SG',latitude:0,longitude:0});
 assert.equal(buildSearch('nearby','chat',resolveLocation('MY')).userLocation,'MY');
});
