import {test} from 'node:test';
import assert from 'node:assert/strict';
import {searchObjective} from '../lib/search-objective.mjs';
import {configureSearchTool} from '../lib/search-profiles.mjs';
test('objectives preserve constraints without inferring nationality',()=>{
 assert.match(searchObjective('Japan visa'),/do not infer nationality from location/);
 assert.match(searchObjective('Japan visa'),/embassy/);
 assert.match(searchObjective('HDB housing grants'),/grant combinations/);
 assert.match(searchObjective('compare mobile plans'),/recurring versus promotional prices/);
 assert.match(searchObjective('brunch nearby'),/explicit destination over device location/);
 assert.doesNotMatch(searchObjective('How do I make kaya?'),/housing authority|embassy/);
});
test('agent tool requests a generated objective without overriding profile budgets',()=>{
 const tool=configureSearchTool({api_schema:{request_body_schema:{required:['query'],properties:{contents:{properties:{highlights:{properties:{}}}}}}}});
 const schema=tool.api_schema.request_body_schema;
 assert.ok(schema.required.includes('objective'));
 assert.equal(schema.properties.objective.type,'string');
 assert.match(schema.properties.objective.description,/specific user request/);
 assert.equal(schema.properties.numResults.dynamic_variable,'search_result_count');
});
