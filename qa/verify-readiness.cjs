const {chromium}=require('C:/Users/lenovo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../assets/creation.js'),'utf8');
const example=vm.runInNewContext(source.slice(source.indexOf('const exampleStory = '),source.indexOf('const config = '))+'exampleStory');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const base=process.argv[2]||'http://127.0.0.1:8137/idiom/';
 await page.route('**/assets/creation-config.js',route=>route.fulfill({contentType:'application/javascript',body:'window.CREATION_CONFIG={endpoint:"",turnstileSiteKey:""};'}));
 await page.goto(base+'#about');
 const headerBefore=await page.locator('header').innerHTML(),titleBefore=await page.locator('#about>.view-title').innerText();
 assert(await page.locator('#creation-overview').isVisible());assert(await page.locator('#creation-editor').isHidden());
 await page.getByRole('button',{name:'打开共读助手，共创故事 →',exact:true}).click();
 assert(page.url().endsWith('#about'));assert(await page.locator('#creation-overview').isHidden());assert(await page.locator('#creation-editor').isVisible());
 assert.equal(await page.locator('header').innerHTML(),headerBefore);assert.equal(await page.locator('#about>.view-title').innerText(),titleBefore);
 assert((await page.locator('#studio-form').boundingBox()).y < (await page.locator('#output').boundingBox()).y);
 await page.locator('#result-title').waitFor();assert(await page.locator('#generate-story').isDisabled());
 assert((await page.locator('#service-note').innerText()).includes('尚未接通'));
 for(const width of [320,390,799,1440]){await page.setViewportSize({width,height:1000});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow '+width);if(width===390||width===1440)await page.screenshot({path:path.join(__dirname,'card-'+width+'.png'),fullPage:true});}
 await page.getByText('说说困惑',{exact:true}).click();assert.equal(await page.locator('#creation-idiom').getAttribute('required'),null);assert.notEqual(await page.locator('#creation-concern').getAttribute('required'),null);
 await page.locator('.related-card button').first().click();assert.equal(await page.locator('#creation-idiom').inputValue(),'独辟蹊径');assert(await page.locator('[name=mode][value=idiom]').isChecked());
 await page.locator('#toggle-optional').click();await page.locator('#creation-concern').fill('保留我的输入');await page.locator('#load-example').click();assert.equal(await page.locator('#creation-concern').inputValue(),'保留我的输入');
 const downloadPromise=page.waitForEvent('download');await page.locator('#download-story').click();const download=await downloadPromise;const text=fs.readFileSync(await download.path(),'utf8');assert(text.includes(example.title));assert(!text.includes('保留我的输入'));
 await page.locator('#close-creation').click();assert(await page.locator('#creation-overview').isVisible());assert(await page.locator('#creation-editor').isHidden());
 await page.getByRole('button',{name:'打开共读助手，共创故事 →',exact:true}).click();assert.equal(await page.locator('#creation-concern').inputValue(),'保留我的输入');
 await page.goto(base+'create.html');await page.waitForURL('**/#about');assert(await page.locator('#creation-overview').isVisible());
 await page.getByRole('button',{name:'打开共读助手，共创故事 →',exact:true}).click();
 assert.equal(await page.evaluate(()=>localStorage.length),0);assert.deepEqual(errors,[]);
 if(process.argv[2]){console.log('Live card: in-place switching, original header/title, input preservation, responsive layout and examples passed');return;}
 // Only this isolated test page uses a mock verification widget and mock API.
 await page.route('**/assets/creation-config.js',route=>route.fulfill({contentType:'application/javascript',body:'window.CREATION_CONFIG={endpoint:"https://api.example/api/story",turnstileSiteKey:"test-public-sitekey"};'}));
 await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js?*',route=>route.fulfill({contentType:'application/javascript',body:'window.turnstile={render:(s,o)=>{window.testVerified=o.callback;setTimeout(()=>o.callback("test-token"),0);return 1;},reset:()=>window.testVerified("test-token")};window.studioVerificationReady();'}));
 let requests=[],failure=false,malformed=false,healthReady=true,healthFailure=false;
 await page.route('https://api.example/health',route=>route.fulfill({contentType:'application/json',status:healthFailure?503:200,body:JSON.stringify({ready:healthReady})}));
 await page.route('https://api.example/api/story',async route=>{requests.push(route.request().postDataJSON());await new Promise(r=>setTimeout(r,100));await route.fulfill({contentType:'application/json',status:failure?503:200,body:JSON.stringify(failure?{error:'测试服务暂时不可用'}:{story:malformed?{title:'incomplete'}:{...example,title:'测试生成故事',subtitle:'<img src=x onerror=window.injected=true>'}})});});
 await page.reload();await page.getByRole('button',{name:'打开共读助手，共创故事 →',exact:true}).click();await page.locator('#generate-story').waitFor({state:'visible'});
 await page.getByText('说说困惑',{exact:true}).click();await page.locator('#creation-concern').fill('总看别人成功，我不知道自己的方向');
 await page.locator('#generate-story').click();await page.locator('#result-title').filter({hasText:'测试生成故事'}).waitFor();assert.equal(requests.length,1);assert.equal(requests[0].mode,'concern');assert.equal(requests[0].idiom,'');assert.equal(requests[0].theme,'auto');
 assert.equal(await page.locator('#result-badge').innerText(),'AI创作草稿');assert.equal(await page.locator('#result-body img').count(),0);assert.equal(await page.evaluate(()=>window.injected),undefined);
 failure=true;await page.locator('#generate-story').click();await page.locator('#form-message').filter({hasText:'测试服务暂时不可用'}).waitFor();assert.equal(await page.locator('#result-title').innerText(),'测试生成故事');assert.equal(await page.locator('#creation-concern').inputValue(),'总看别人成功，我不知道自己的方向');
 failure=false;malformed=true;await page.locator('#generate-story').click();await page.locator('#form-message').filter({hasText:'故事内容不完整'}).waitFor();assert.equal(await page.locator('#result-title').innerText(),'测试生成故事');
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async(text)=>{window.copiedText=text}},configurable:true}));
 await page.locator('#copy-story').click();assert((await page.evaluate(()=>window.copiedText)).includes('测试生成故事'));assert.deepEqual(errors,[]);
 healthReady=false;await page.reload();await page.locator('#creation-overview [data-create]').click();await page.locator('#service-note').filter({hasText:'后台配置暂未就绪'}).waitFor();assert(await page.locator('#generate-story').isDisabled());
 healthFailure=true;await page.reload();await page.locator('#creation-overview [data-create]').click();await page.locator('#service-note').filter({hasText:'暂时无法连接创作后台'}).waitFor();assert(await page.locator('#generate-story').isDisabled());
 console.log(JSON.stringify({backendReadiness:'ready/unconfigured/unavailable passed',entry:'in-place card switch',responsive:'320/390/799/1440',examples:'passed',download:'passed',mockGeneration:'passed',failurePreservesDraft:'passed',outputEscaping:'passed',pageErrors:errors}));
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
