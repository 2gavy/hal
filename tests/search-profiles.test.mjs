import {test} from 'node:test';import assert from 'node:assert/strict';
import {searchVariables,configureSearchTool} from '../lib/search-profiles.mjs';
test('chat and voice use their result counts with automatic highlights',()=>{assert.deepEqual(searchVariables('chat'),{search_result_count:5});assert.deepEqual(searchVariables('voice'),{search_result_count:4});});
test('tool bindings replace constants and preserve unrelated configuration',()=>{
 const input={name:'web_search',api_schema:{request_body_schema:{required:['query','numResults','contents'],properties:{query:{type:'string'},numResults:{type:'integer',constant_value:2},contents:{properties:{highlights:{properties:{maxCharacters:{constant_value:3000}}}}}}}}};
 const result=configureSearchTool(input);assert.equal(result.name,input.name);const p=result.api_schema.request_body_schema.properties;
 assert.deepEqual(p.contents.properties.highlights,{type:'boolean',constant_value:true});assert.deepEqual(p.numResults,{type:'integer',dynamic_variable:'search_result_count'});assert.equal(p.userLocation.properties.country.dynamic_variable,'country');assert.ok(result.api_schema.request_body_schema.required.includes('userLocation'));assert.equal(input.api_schema.request_body_schema.properties.numResults.constant_value,2);
});

import {locationVariables,resolveLocation} from '../lib/location.mjs';
test('session location has no invented coordinates when GPS is unavailable or country changes',()=>{
 assert.deepEqual(JSON.parse(locationVariables(resolveLocation('SG')).search_location),{country:'SG'});
 assert.deepEqual(JSON.parse(locationVariables(resolveLocation('SG','',{latitude:1.27,longitude:103.84})).search_location),{country:'SG',latitude:1.27,longitude:103.84});
 assert.deepEqual(JSON.parse(locationVariables(resolveLocation('PH')).search_location),{country:'PH'});
});
