import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canRunPlan,remaining,safeUrl,buildSearch} from '../lib/logic.mjs';
test('three runs permitted; fourth gated; demo upgrade unlocks',()=>{for(let i=0;i<3;i++)assert.equal(canRunPlan(i,false),true);assert.equal(canRunPlan(3,false),false);assert.equal(canRunPlan(3,true),true);assert.equal(remaining(9),0);});
test('source links reject executable protocols',()=>{assert.equal(safeUrl('javascript:alert(1)'),null);assert.equal(safeUrl('data:text/html,hello'),null);assert.equal(safeUrl('https://example.com/a'),'https://example.com/a');});
test('route by intent, language, and location; dynamic highlights without full text',()=>{const chat=buildSearch('food nearby','chat','SG');const plan=buildSearch('Cebu','plan','PH');assert.equal(chat.type,'auto');assert.equal(plan.type,'deep');assert.match(chat.query,/Singapore/);assert.match(plan.systemPrompt,/Tagalog/);assert.deepEqual(plan.contents,{highlights:{dynamic:true}});assert.ok(plan.outputSchema);});
