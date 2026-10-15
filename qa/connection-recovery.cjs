// Isolated browser regression tests. Verification and AI are mocked only on this local page.
const {chromium}=require('C:/Users/lenovo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 const target=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;
 if(!fs.existsSync(target)){res.writeHead(404);res.end();return;}
 const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.woff2':'font/woff2'};
 res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream'});fs.createReadStream(target).pipe(res);
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try {
  const page=await browser.newPage({viewport:{width:390,height:900}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{
   AbortSignal.timeout=undefined; // Old WebViews must still work.
   const nativeTimeout=window.setTimeout;
   window.setTimeout=(fn,ms,...args)=>nativeTimeout(fn,ms===150000?30:ms,...args);
  });
  await page.route('**/assets/creation-config.js',route=>route.fulfill({contentType:'application/javascript',body:'window.CREATION_CONFIG={endpoint:"https://api.example/api/story",turnstileSiteKey:"local-test-only"};'}));
  await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js?*',route=>route.fulfill({contentType:'application/javascript',body:'window.testWidgetCount=0;window.turnstile={render:(s,o)=>{window.testWidgetCount++;window.localVerified=o.callback;setTimeout(()=>o.callback("local-test-token"),0);return 1;},reset:()=>window.localVerified("local-test-token")};window.studioVerificationReady();'}));
  let healthCalls=0,healthState='offline',postCalls=0,postState='error';
  await page.route('https://api.example/health',async route=>{
   healthCalls++;
   if(healthState==='offline'){await route.abort('failed');return;}
   await route.fulfill({contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify({ready:healthState==='ready',missing:healthState==='ready'?[]:['DEEPSEEK_API_KEY']})});
  });
  await page.route('https://api.example/api/story',async route=>{
   if(route.request().method()==='OPTIONS'){await route.fulfill({status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'POST'}});return;}
   postCalls++;
   if(postState==='slow')await new Promise(resolve=>setTimeout(resolve,200));
   try{await route.fulfill({status:503,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify({error:'AI故事生成等待超时，请稍后重新验证后再试。',code:'AI_TIMEOUT'})});}catch{}
  });
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html#about');
  await page.locator('#creation-overview [data-create]').click();
  await page.locator('#creation-idiom').fill('邯郸学步');
  await page.locator('#creation-concern').fill('保留我写的困惑');
  await page.locator('#service-note').filter({hasText:'暂时无法连接'}).waitFor();
  assert.equal(healthCalls,2);assert(await page.locator('#generate-story').isDisabled());
  assert(await page.locator('#retry-connection').isVisible());
  healthState='ready';await page.locator('#retry-connection').click();
  await page.locator('#generate-story:not([disabled])').waitFor();
  assert.equal(await page.locator('#creation-concern').inputValue(),'保留我写的困惑');
  assert.equal(await page.evaluate(()=>window.testWidgetCount),1);
  const before=await page.locator('#result-title').innerText();
  await page.locator('#generate-story').click();
  await page.locator('#form-message').filter({hasText:'AI故事生成等待超时'}).waitFor();
  assert.equal(postCalls,1);assert.equal(await page.locator('#result-title').innerText(),before);
  assert.equal(await page.locator('#manuscript').getAttribute('aria-busy'),'false');
  postState='slow';await page.locator('#generate-story').click();
  await page.locator('#form-message').filter({hasText:'这次等待时间过长'}).waitFor();
  assert.equal(postCalls,2);assert.equal(await page.locator('#creation-concern').inputValue(),'保留我写的困惑');
  assert.equal(await page.locator('#result-title').innerText(),before);
  healthState='unconfigured';await page.reload();await page.locator('#creation-overview [data-create]').click();
  await page.locator('#service-note').filter({hasText:'后台配置暂未就绪'}).waitFor();
  assert(await page.locator('#generate-story').isDisabled());assert(await page.locator('#retry-connection').isVisible());
  healthState='ready';await page.locator('#close-creation').click();await page.locator('#creation-overview [data-create]').click();
  await page.locator('#generate-story:not([disabled])').waitFor();
  assert.equal(await page.evaluate(()=>window.testWidgetCount),1);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:path.join(__dirname,'connection-recovered-mobile.png'),fullPage:false});
  assert.deepEqual(errors,[]);
  console.log('PASS: failed health recovers; no repeated widget; legacy timeout compatibility; unconfigured stays disabled; generation not retried; timeouts preserve inputs and story; mobile fits.');
 } finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1});
