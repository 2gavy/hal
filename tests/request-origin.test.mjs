import test from 'node:test';
import assert from 'node:assert/strict';
import { allowedOrigin, localDevelopment } from '../lib/request-origin.mjs';
test('development accepts loopback aliases on the same port',()=>{
 assert.equal(allowedOrigin('http://127.0.0.1:3000','http://localhost:3000',true),true);
 assert.equal(allowedOrigin('http://localhost:3000','http://127.0.0.1:3000',true),true);
});
test('origin checks reject production aliases, other hosts and ports',()=>{
 assert.equal(allowedOrigin('http://127.0.0.1:3000','http://localhost:3000'),false);
 assert.equal(allowedOrigin('https://evil.example','http://localhost:3000',true),false);
 assert.equal(allowedOrigin('http://localhost:4000','http://localhost:3000',true),false);
 assert.equal(allowedOrigin('https://hal-pink-nu.vercel.app','https://hal-pink-nu.vercel.app'),true);
});

test('access-code exemption is limited to local development',()=>{
 for(const host of ['localhost:3000','127.0.0.1:3000','[::1]:3000']) {
  assert.equal(localDevelopment(host,'development',undefined),true);
  assert.equal(localDevelopment(host,'production',undefined),false);
  assert.equal(localDevelopment(host,'development','1'),false);
 }
 for(const host of ['hal-pink-nu.vercel.app','192.168.1.2:3000','localhost.evil.example',null]) assert.equal(localDevelopment(host,'development',undefined),false);
});
