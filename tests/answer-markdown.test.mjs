import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {normalizeAnswerMarkdown} from '../lib/answer-markdown.mjs';
const render=text=>renderToStaticMarkup(React.createElement(Markdown,{remarkPlugins:[remarkGfm]},normalizeAnswerMarkdown(text)));
test('repairs prose attached to a real table header and final row',()=>{
 const raw='Compare these plans. | Provider | Price |\n|---|---:|\n| SIMBA | $10 |\n| giga | $15.90 | Key differences:\n- Check current prices.';
 const html=render(raw);
 assert.match(html,/<p>Compare these plans\.<\/p>/);
 assert.match(html,/<table>/);assert.match(html,/<th>Provider<\/th>/);
 assert.match(html,/<p>Key differences:<\/p>/);
 assert.match(html,/<li>Check current prices\.<\/li>/);
});
test('preserves valid tables, Unicode and linked sources',()=>{
 const raw='| Day | Place |\n| --- | --- |\n| 1 | [京都](https://example.com) |';
 assert.equal(normalizeAnswerMarkdown(raw),raw);
 assert.match(render(raw),/<a href="https:\/\/example.com">京都<\/a>/);
});
test('does not invent tables from pipes or modify code blocks',()=>{
 for(const raw of ['Price | data | roaming','```\nProse | A | B |\n|---|---|\n| 1 | 2 | End\n```','A paragraph.']) assert.equal(normalizeAnswerMarkdown(raw),raw);
});
