import {test} from 'node:test';
import assert from 'node:assert/strict';
import {microphoneIssue} from '../lib/voice-errors.mjs';
test('device failures provide relevant recovery, without mislabelling API errors',()=>{
 assert.equal(microphoneIssue({name:'NotAllowedError'}).title,'Allow your microphone');
 assert.equal(microphoneIssue(new Error('Permission denied')).title,'Allow your microphone');
 assert.equal(microphoneIssue({name:'NotFoundError'}).title,'No microphone found');
 assert.equal(microphoneIssue({name:'NotReadableError'}).title,'Microphone is busy');
 assert.match(microphoneIssue({name:'NotSupportedError'}).message,/typed Chat/);
 assert.equal(microphoneIssue(new Error('Enter your access code')),null);
 assert.equal(microphoneIssue(new Error('Network disconnected')),null);
});
