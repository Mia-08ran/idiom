const {chromium}=require('C:/Users/lenovo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'assets/creation.js'),'utf8');
const example=vm.runInNewContext(source.slice(source.indexOf('const exampleStory = '),source.indexOf('const config = '))+'exampleStory');
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
  const page=await browser.newPage({viewport:{width:1119,height:850}}),errors=[],requests=[];
  page.on('pageerror',error=>errors.push(error.message));
  // External traffic is blocked; these isolated mocks never call a paid AI service.
  await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
  await page.route('**/assets/creation-config.js',route=>route.fulfill({contentType:'application/javascript',body:'window.CREATION_CONFIG={endpoint:"https://api.example/api/story",turnstileSiteKey:"local-test-only"};'}));
  await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js?*',route=>route.fulfill({contentType:'application/javascript',body:'window.turnstile={render:(s,o)=>{window.localVerified=o.callback;setTimeout(()=>o.callback("local-test-token"),0);return 1;},reset:()=>window.localVerified("local-test-token")};window.studioVerificationReady();'}));
  await page.route('https://api.example/health',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({ready:true})}));
  await page.route('https://api.example/api/story',async route=>{
   if(route.request().method()==='OPTIONS'){await route.fulfill({status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'POST'}});return;}
   requests.push(route.request().postDataJSON());
   await route.fulfill({contentType:'application/json',body:JSON.stringify({story:{...example,title:'本地测试故事 '+requests.length}})});
  });
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html#about');
  await page.locator('#creation-overview [data-create]').click();
  await page.locator('#generate-story:not([disabled])').waitFor();
  const idiom=page.locator('#creation-idiom'),concern=page.locator('#creation-concern'),toggle=page.locator('#toggle-optional');
  async function mode(expected){
   const fromIdiom=expected==='idiom';
   assert(await page.locator('[name=mode][value='+expected+']').isChecked());
   assert(await page.locator(fromIdiom?'#idiom-card':'#concern-card').isVisible());
   assert(await page.locator(fromIdiom?'#concern-card':'#idiom-card').isHidden());
   assert.equal(await idiom.evaluate(el=>el.required),fromIdiom);assert.equal(await concern.evaluate(el=>el.required),!fromIdiom);
   assert.equal(await toggle.getAttribute('aria-expanded'),'false');
   assert.equal(await toggle.getAttribute('aria-controls'),fromIdiom?'concern-card':'idiom-card');
   assert.equal(await page.locator('#idiom-optional').getAttribute('data-required'),String(fromIdiom));
   assert.equal(await page.locator('#concern-optional').getAttribute('data-required'),String(!fromIdiom));
   const required=await page.locator('.optional[data-required="true"]').evaluate(el=>({bg:getComputedStyle(el).backgroundColor,color:getComputedStyle(el).color,font:getComputedStyle(el).fontWeight}));
   const optional=await page.locator('.optional[data-required="false"]').evaluate(el=>({bg:getComputedStyle(el).backgroundColor,color:getComputedStyle(el).color}));
   assert.notEqual(required.bg,optional.bg);assert.notEqual(required.color,optional.color);assert(Number(required.font)>=600);
  }
  async function generate(){const n=requests.length+1;await page.locator('#generate-story').click();await page.locator('#result-title').filter({hasText:'本地测试故事 '+n}).waitFor();assert.equal(requests.length,n);return requests[n-1];}
  await mode('idiom');
  await page.locator('#generate-story').click();assert.equal(requests.length,0);assert.equal(await idiom.evaluate(el=>el.validity.valueMissing),true);
  await idiom.fill('邯郸学步');await toggle.click();
  assert.equal(await toggle.getAttribute('aria-expanded'),'true');assert(await concern.isVisible());assert.equal(await concern.evaluate(el=>el.required),false);
  const savedConcern='总看别人成功，我不知道自己的方向';await concern.fill(savedConcern);
  // Native radio arrow keys must select the panel; Tab enters its primary input.
  await page.locator('[name=mode][value=idiom]').focus();await page.keyboard.press('ArrowRight');await mode('concern');
  await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'creation-concern');
  assert.equal(await idiom.inputValue(),'邯郸学步');assert.equal(await concern.inputValue(),savedConcern);
  let sent=await generate();assert.equal(sent.mode,'concern');assert.equal(sent.idiom,'');assert.equal(sent.concern,savedConcern);
  await page.locator('[name=mode][value=concern]').focus();await page.keyboard.press('ArrowLeft');await mode('idiom');
  await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'creation-idiom');
  sent=await generate();assert.equal(sent.mode,'idiom');assert.equal(sent.idiom,'邯郸学步');assert.equal(sent.concern,'');
  await toggle.click();sent=await generate();assert.equal(sent.idiom,'邯郸学步');assert.equal(sent.concern,savedConcern);
  await page.locator('.mode-options label').nth(1).click();await mode('concern');await toggle.click();
  assert.deepEqual(await page.locator('#mode-card').evaluate(el=>Array.from(el.children).map(child=>child.id)),['concern-card','toggle-optional','idiom-card']);
  await concern.focus();await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'toggle-optional');
  await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'creation-idiom');
  await toggle.focus();await page.keyboard.press('Space');assert.equal(await toggle.getAttribute('aria-expanded'),'false');assert.equal(await page.evaluate(()=>document.activeElement.id),'toggle-optional');
  await page.keyboard.press('Space');assert.equal(await toggle.getAttribute('aria-expanded'),'true');assert.equal(await page.evaluate(()=>document.activeElement.id),'toggle-optional');
  await page.locator('[data-idiom="守株待兔"]').click();assert(await page.locator('[name=mode][value=concern]').isChecked());assert.equal(await idiom.inputValue(),'守株待兔');
  sent=await generate();assert.equal(sent.mode,'concern');assert.equal(sent.idiom,'守株待兔');assert.equal(sent.concern,savedConcern);
  await concern.fill('');await page.locator('#generate-story').click();assert.equal(requests.length,4);assert.equal(await concern.evaluate(el=>el.validity.valueMissing),true);
  await concern.fill(savedConcern);await page.locator('.related-card button').first().click();await mode('idiom');assert.equal(await idiom.inputValue(),'独辟蹊径');assert.equal(await concern.inputValue(),savedConcern);
  await page.locator('#close-creation').click();await page.locator('#creation-overview [data-create]').click();await mode('idiom');assert.equal(await idiom.inputValue(),'独辟蹊径');
  for(const width of [320,390,799,1119,1440]){
   await page.setViewportSize({width,height:1000});
   for(const selected of ['idiom','concern']){
    await page.locator('.mode-options label').nth(selected==='idiom'?0:1).click();await mode(selected);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'overflow '+width+' '+selected);
    const tab=await page.locator('.mode-options input:checked+span').boundingBox(),card=await page.locator('#mode-card').boundingBox();
    assert(Math.abs(tab.y+tab.height-card.y)<=2,'selected label touches its card');
    if((width===390&&selected==='concern')||(width===1119&&selected==='idiom'))await page.locator('.mode-switch').screenshot({path:path.join(__dirname,width===390?'mode-tabs-mobile.png':'mode-tabs-desktop.png')});
    await toggle.click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'expanded overflow '+width+' '+selected);
   }
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: connected mode cards; required/optional badges; native keyboard switching; optional expansion; preserved input; collapsed values excluded from requests; chips and related idioms; 320/390/799/1119/1440 responsive.');
 } finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1});
