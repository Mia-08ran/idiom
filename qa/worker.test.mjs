import {test} from 'node:test';
import assert from 'node:assert/strict';
import worker from '../backend/worker.mjs';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../assets/creation.js',import.meta.url),'utf8');
const story=vm.runInNewContext(source.slice(source.indexOf('const exampleStory = '),source.indexOf('const config = '))+'exampleStory');
const input={mode:'concern',idiom:'',concern:'同学都在学AI，我找不到自己的方向。',theme:'auto',turnstileToken:'test-token'};
const origin='https://mia-08ran.github.io';
const env=()=>({DEEPSEEK_API_KEY:'unit-test-secret',TURNSTILE_SECRET_KEY:'unit-test-verification',IP_RATE_LIMITER:{limit:async()=>({success:true})},SITE_RATE_LIMITER:{limit:async()=>({success:true})}});
const req=(body=input,headers={})=>new Request('https://worker.example/api/story',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','CF-Connecting-IP':'192.0.2.10',...headers},body:typeof body==='string'?body:JSON.stringify(body)});
let calls=[], verify={success:true,hostname:'mia-08ran.github.io',action:'create-story'},upstream={choices:[{finish_reason:'stop',message:{content:JSON.stringify(story)}}]},upstreamStatus=200;
function mockFetch(){calls=[];verify={success:true,hostname:'mia-08ran.github.io',action:'create-story'};upstream={choices:[{finish_reason:'stop',message:{content:JSON.stringify(story)}}]};upstreamStatus=200;globalThis.fetch=async(url,options)=>{calls.push({url,options});return Response.json(url.includes('siteverify')?verify:upstream,{status:url.includes('siteverify')?200:upstreamStatus});};}
test('request validation and fail-closed configuration',async()=>{
 mockFetch();assert.equal((await worker.fetch(new Request('https://worker.example/health'),{})).status,200);
 assert.equal((await (await worker.fetch(new Request('https://worker.example/health'),{})).json()).ready,false);
 assert.equal((await worker.fetch(req(),{})).status,503);
 assert.equal((await worker.fetch(req(input,{Origin:'https://evil.example'}),env())).status,403);
 assert.equal((await worker.fetch(req('{oops'),env())).status,400);
 assert.equal((await worker.fetch(req({...input,concern:' '}),env())).status,400);
 assert.equal((await worker.fetch(req({...input,concern:'x'.repeat(601)}),env())).status,400);
 assert.equal((await worker.fetch(req('x'.repeat(8193)),env())).status,413);
 assert.equal(calls.length,0);
 const preflight=await worker.fetch(new Request('https://worker.example/api/story',{method:'OPTIONS',headers:{Origin:origin}}),env());
 assert.equal(preflight.status,204);assert.equal(preflight.headers.get('Access-Control-Allow-Origin'),origin);
});
test('rate limits and verification block paid calls',async()=>{
 mockFetch();const limited=env();limited.IP_RATE_LIMITER.limit=async()=>({success:false});
 assert.equal((await worker.fetch(req(),limited)).status,429);assert.equal(calls.length,0);
 verify={success:false};assert.equal((await worker.fetch(req(),env())).status,403);assert.equal(calls.length,1);
 mockFetch();verify.hostname='wrong.example';assert.equal((await worker.fetch(req(),env())).status,403);assert.equal(calls.length,1);
 mockFetch();verify.action='wrong';assert.equal((await worker.fetch(req(),env())).status,403);
 mockFetch();const site=env();site.SITE_RATE_LIMITER.limit=async()=>({success:false});assert.equal((await worker.fetch(req(),site)).status,429);assert.equal(calls.length,1);
});
test('verified request returns structured story without secrets',async()=>{
 mockFetch();const response=await worker.fetch(req(),env());assert.equal(response.status,200);
 const body=await response.text();assert(!body.includes('unit-test-secret'));assert.equal(JSON.parse(body).story.title,story.title);
 assert.equal(calls.length,2);assert.equal(calls[1].url,'https://api.deepseek.com/chat/completions');
 const sent=JSON.parse(calls[1].options.body);assert.equal(JSON.parse(sent.messages[1].content).concern,input.concern);assert.equal(sent.max_tokens,3500);assert.equal(sent.thinking.type,'disabled');assert.equal(sent.response_format.type,'json_object');
 assert.equal(response.headers.get('Cache-Control'),'no-store');
});
test('upstream failures, invalid output and truncation are explicit',async()=>{
 mockFetch();upstreamStatus=401;upstream={error:{message:'unit-test-secret private provider failure'}};let r=await worker.fetch(req(),env());assert.equal(r.status,502);assert(!(await r.text()).includes('unit-test-secret'));
 mockFetch();upstream.choices[0].message.content='not json';assert.equal((await worker.fetch(req(),env())).status,502);
 mockFetch();upstream.choices[0].finish_reason='length';assert.equal((await worker.fetch(req(),env())).status,502);
 mockFetch();upstream.choices[0].message.content=JSON.stringify({...story,sections:[]});assert.equal((await worker.fetch(req(),env())).status,502);
 mockFetch();upstream.choices[0].message.content=JSON.stringify({error:'unknown idiom'});assert.equal((await worker.fetch(req(),env())).status,422);
});
