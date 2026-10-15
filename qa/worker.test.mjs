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
let calls=[], verify={success:true,hostname:'mia-08ran.github.io',action:'create-story'},upstream={choices:[{finish_reason:'stop',message:{content:JSON.stringify(story)}}]},upstreamStatus=200,verificationStatus=200;
function mockFetch(){calls=[];verify={success:true,hostname:'mia-08ran.github.io',action:'create-story'};upstream={choices:[{finish_reason:'stop',message:{content:JSON.stringify(story)}}]};upstreamStatus=200;verificationStatus=200;globalThis.fetch=async(url,options)=>{calls.push({url,options});return Response.json(url.includes('siteverify')?verify:upstream,{status:url.includes('siteverify')?verificationStatus:upstreamStatus});};}
test('request validation and fail-closed configuration',async()=>{
 mockFetch();assert.equal((await worker.fetch(new Request('https://worker.example/health'),{})).status,200);
 const health=await (await worker.fetch(new Request('https://worker.example/health'),{})).json();
 assert.equal(health.ready,false);assert.equal(health.revision,'connection-20261015');
 const readyHealth=await (await worker.fetch(new Request('https://worker.example/health'),env())).json();
 assert.equal(readyHealth.ready,true);assert.equal(readyHealth.revision,'connection-20261015');assert.deepEqual(readyHealth.missing,[]);
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

test('verification failures distinguish invalid secrets, expired tokens and unavailable service',async()=>{
 for(const status of [200,400]){
  mockFetch();verificationStatus=status;verify={success:false,'error-codes':['invalid-input-secret'],private:'unit-test-verification'};
  let r=await worker.fetch(req(),env());assert.equal(r.status,503);let body=await r.text();assert(body.includes('验证密钥配置无效'));assert(!body.includes('unit-test-verification'));assert.equal(calls.length,1);
  mockFetch();verificationStatus=status;verify={success:false,'error-codes':['timeout-or-duplicate']};
  r=await worker.fetch(req(),env());assert.equal(r.status,403);assert((await r.text()).includes('验证已失效'));assert.equal(calls.length,1);
 }
 mockFetch();verificationStatus=503;verify={success:false,'error-codes':['internal-error']};let r=await worker.fetch(req(),env());assert.equal(r.status,503);assert((await r.text()).includes('V503'));assert.equal(calls.length,1);
 mockFetch();globalThis.fetch=async()=>new Response('<html>private upstream response unit-test-verification</html>',{status:403});r=await worker.fetch(req(),env());const text=await r.text();assert.equal(r.status,503);assert(text.includes('V403'));assert(!text.includes('private upstream response'));assert(!text.includes('unit-test-verification'));
});

test('provider status errors are actionable and never retried or leaked',async()=>{
 for(const [status,code,message] of [[401,'AI_AUTH_ERROR','密钥无效'],[402,'AI_BALANCE_EMPTY','余额不足'],[400,'AI_REQUEST_ERROR','模型或请求参数'],[422,'AI_REQUEST_ERROR','模型或请求参数'],[429,'AI_RATE_LIMITED','繁忙'],[500,'AI_UNAVAILABLE','暂时不可用'],[503,'AI_UNAVAILABLE','暂时不可用'],[504,'AI_UNAVAILABLE','暂时不可用'],[418,'AI_UPSTREAM_ERROR','暂时不可用']]){
  mockFetch();upstreamStatus=status;upstream={error:{message:'unit-test-secret private provider failure'}};
  const response=await worker.fetch(req(),env());const body=await response.text();const data=JSON.parse(body);
  assert.equal(response.status,502);assert.equal(data.code,code);assert(data.error.includes(message));
  assert(!body.includes('unit-test-secret'));assert(!body.includes('private provider failure'));
  assert.equal(calls.length,2);assert.equal(calls.filter(call=>call.url.includes('chat/completions')).length,1);
 }
});

test('verification and generation timeouts identify the stage without retrying',async()=>{
 const originalTimeout=AbortSignal.timeout;
 try{
  for(const stage of ['verification','generation'])for(const name of ['TimeoutError','AbortError']){
   mockFetch();const timeouts=[];
   AbortSignal.timeout=milliseconds=>{timeouts.push(milliseconds);return originalTimeout(milliseconds);};
   globalThis.fetch=async(url,options)=>{
    calls.push({url,options});
    if(stage==='generation'&&url.includes('siteverify'))return Response.json(verify);
    throw new DOMException('unit-test-secret private timeout',name);
   };
   const response=await worker.fetch(req(),env());const body=await response.text();const data=JSON.parse(body);
   assert.equal(response.status,503);assert.equal(data.code,stage==='verification'?'VERIFICATION_TIMEOUT':'AI_TIMEOUT');
   assert(data.error.includes(stage==='verification'?'验证服务等待超时':'AI生成等待超时'));
   assert(!body.includes('unit-test-secret'));assert(!body.includes('private timeout'));
   assert.deepEqual(timeouts,stage==='verification'?[10000]:[10000,120000]);
   assert.equal(calls.length,stage==='verification'?1:2);
   assert.equal(calls.filter(call=>call.url.includes('chat/completions')).length,stage==='verification'?0:1);
  }
 }finally{AbortSignal.timeout=originalTimeout;}
});

test('response body timeouts retain the verification or generation stage',async()=>{
 for(const stage of ['verification','generation'])for(const name of ['TimeoutError','AbortError']){
  mockFetch();
  globalThis.fetch=async(url,options)=>{
   calls.push({url,options});
   if(stage==='generation'&&url.includes('siteverify'))return Response.json(verify);
   return {ok:true,status:200,json:async()=>{throw new DOMException('unit-test-secret private body timeout',name);}};
  };
  const response=await worker.fetch(req(),env());const body=await response.text();const data=JSON.parse(body);
  assert.equal(response.status,503);assert.equal(data.code,stage==='verification'?'VERIFICATION_TIMEOUT':'AI_TIMEOUT');
  assert(!body.includes('unit-test-secret'));assert(!body.includes('private body timeout'));
  assert.equal(calls.length,stage==='verification'?1:2);
  assert.equal(calls.filter(call=>call.url.includes('chat/completions')).length,stage==='verification'?0:1);
 }
});
