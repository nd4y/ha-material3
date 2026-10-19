import test from 'node:test';import assert from 'node:assert/strict';
import {assetUrl} from '../src/asset-url.js';

test('font assets follow the module path and invalidate stale HACS browser caches',()=>{
  const base='https://example.test/hacsfiles/custom-module/ha-material3.js?hacstag=123';
  const first=assetUrl('material-symbols-rounded.woff2',base,'1.0.0'),second=assetUrl('material-symbols-rounded.woff2',base,'1.0.1');
  assert.equal(new URL(first).pathname,'/hacsfiles/custom-module/material-symbols-rounded.woff2');
  assert.equal(new URL(second).searchParams.get('v'),'1.0.1');
  assert.notEqual(first,second);
  assert.equal(assetUrl('roboto-latin.woff2','http://localhost:8769/ha-material3.js','dev'),'http://localhost:8769/roboto-latin.woff2?v=dev');
});
