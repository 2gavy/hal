import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseElevenEvidence,elevenLanguage} from '../lib/eleven-evidence.mjs';
test('provider search events expose only safe sources and measured latency',()=>{
 const result=parseElevenEvidence({tool_name:'web_search',full_tool_result:JSON.stringify({searchTime:123.6,results:[{url:'https://example.com',title:'Source'},{url:'javascript:alert(1)'}]})});
 assert.equal(result.searchMs,123.6);assert.equal(result.sources.length,1);
});
test('missing or truncated provider output never invents timing',()=>{
 assert.equal(parseElevenEvidence({tool_name:'web_search',full_tool_result:'{'}),null);
 assert.equal(parseElevenEvidence({tool_name:'web_search',is_error:true,full_tool_result:'{}'}),null);
 assert.equal(parseElevenEvidence({tool_name:'web_search',full_tool_result:'{"results":[]}'}).searchMs,undefined);
 assert.equal(elevenLanguage('PH'),'tl');
});

test('search tokens estimate only the returned highlight text',()=>{
 const parse=results=>parseElevenEvidence({tool_name:'web_search',full_tool_result:JSON.stringify({results})});
 assert.equal(parse([{url:'https://example.com',highlights:['12345','6789']}]).estimatedHighlightTokens,3);
 assert.equal(parse([{url:'https://example.com'}]).estimatedHighlightTokens,undefined);
});
