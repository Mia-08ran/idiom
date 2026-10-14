'use strict';
const exampleStory = {"idiom":"邯郸学步","theme":"AI时代的信息焦虑","title":"如果邯郸学步发生在2026年","subtitle":"他收藏了一百种成功的方法，却把自己的作品藏了起来。","meaning":"盲目模仿别人，没有学到本领，反而丢掉自己原有的能力或特色。","modernMeaning":"学习别人的方法可以打开视野；如果把别人的目标也一起复制，就容易在不停追赶中失去自己的方向。","connection":"这个故事把“模仿失当、反失故步”的内核，放进大学生面对成功模板和信息焦虑的处境。","protagonist":"小邯 · 21岁大学生，喜欢画校园漫画，最近却很久没有完成一张自己的作品。","sections":[{"heading":"别人的生活，都在加速","text":"凌晨一点，小邯还在刷手机。有人用AI接到了第一笔设计订单，有人晒出编程作品，有人刚拿到创业比赛的奖。他低头看了看桌上画到一半的校园漫画，忽然觉得它太慢、太小，也太普通。那个晚上，他建了一个文件夹，名字叫“成功模板”。","quote":"他们都已经跑起来了，我怎么还在这里？"},{"heading":"他的方向，每天换一次","text":"周一，他照着博主的提示词生成海报；周三，看见短视频涨粉，又把没学完的绘画课程关掉；周末，他开始复制创业账号的选题。笔记越来越厚，页面越来越多，目标却随着下一条推荐不断改变。同学问他究竟想表达什么，他发过去另一个教程的链接。","quote":"先照着做，等成功了，再想自己的风格。"},{"heading":"学来的步子，走不动自己的路","text":"两个月后，社团请他画一张食堂海报。他熟练地找模板、换配色，却不知道该画哪一个真实的校园瞬间。老搭档提起他曾经画过的“打饭阿姨多舀半勺菜”，他才发现，自己很久没有认真看过身边的人。工具学了一点，原本敏锐的观察却被搁置了。","quote":"你以前总能发现人的故事，现在怎么每一张都像别人？"},{"heading":"重新走路，从一个小问题开始","text":"小邯没有立刻卸载所有工具。他拿着速写本回到食堂，先问自己：我想让同学看见什么？这一次，他用AI整理构图思路，自己观察、修改、画完。作品没有突然走红，他仍然需要练习，也仍然会羡慕别人。只是那天，他终于完成了一张属于自己的画。","quote":"我可以学习别人的方法，但方向得自己选。"}],"ending":"真正的邯郸学步，不是在学习别人，而是在失去自己的方向。","takeaway":"AI时代，我们更需要学习，而不是复制。选一个真实问题，把学到的方法变成自己能够完成的作品。","actions":["把收藏夹缩减为一个本周真正需要学习的方法。","给自己定一个小作品目标，用学到的方法完成它。","一周后回看：我学会了什么，哪些方向并不适合我？"],"related":[{"idiom":"独辟蹊径","meaning":"独自开辟新的道路，比喻另创一种方法。","angle":"当你想离开大家都在复制的模板，寻找适合自己的做法。"},{"idiom":"自成一家","meaning":"在学问或技艺上形成自己的风格与体系。","angle":"提醒自己：个人风格来自持续积累和独立判断。"},{"idiom":"生搬硬套","meaning":"不顾实际情况，机械地照搬别人的经验或方法。","angle":"检查借来的方法是否真的适合眼前的问题。"}]};
const config = window.CREATION_CONFIG || {};
const form = document.getElementById('studio-form');
const idiomInput = document.getElementById('creation-idiom');
const concernInput = document.getElementById('creation-concern');
const generateButton = document.getElementById('generate-story');
const formMessage = document.getElementById('form-message');
const outputMessage = document.getElementById('output-message');
const manuscript = document.getElementById('manuscript');
let theme = 'auto', token = '', widgetId, busy = false, currentStory;
const configured = Boolean(config.endpoint && config.turnstileSiteKey);
function element(tag, text, className) {
 const node = document.createElement(tag);
 if (text !== undefined) node.textContent = text;
 if (className) node.className = className;
 return node;
}
function renderStory(story, example) {
 currentStory = story;
 const body = document.getElementById('result-body');
 const title = element('h2', story.title); title.id = 'result-title';
 const insight = element('div', undefined, 'insight');
 for (const [label, text] of [['成语内核', story.meaning], ['当代意义', story.modernMeaning], ['与你的联系', story.connection]]) {
  const row = element('p'); row.append(element('strong', label), element('span', text)); insight.append(row);
 }
 const sections = story.sections.map((part, index) => {
  const section = element('section', undefined, 'story-part');
  const heading = element('h3', part.heading);
  section.append(element('span', String(index + 1).padStart(2, '0'), 'part-number'), heading, element('p', part.text));
  if (part.quote) section.append(element('blockquote', part.quote));
  return section;
 });
 const ending = element('div', undefined, 'ending');
 ending.append(element('small', '故事里的提醒'), element('p', story.ending));
 const takeaway = element('section', undefined, 'takeaway');
 takeaway.append(element('h3', '写给此刻的你'), element('p', story.takeaway));
 const actions = element('section', undefined, 'actions'), list = element('ol');
 story.actions.forEach(text => list.append(element('li', text)));
 actions.append(element('h3', '可以从一件小事开始'), list);
 body.replaceChildren(element('p', story.idiom + ' / ' + story.theme, 'article-meta'), title, element('p', story.subtitle, 'subtitle'), insight, element('p', story.protagonist, 'protagonist'), ...sections, ending, takeaway, actions, element('p', example ? '编辑示例 · 原意参考教育部《成语典》“邯郸学步”。本文为现代创意改编，不是根据当前表单实时生成的内容。' : 'AI辅助创作草稿 · 释义由AI整理，请结合权威词典核对。人物、情节及当代联系均为创意改编，不是历史原典。', 'editor-note'));
 document.getElementById('result-badge').textContent = example ? '编辑示例' : 'AI创作草稿';
 const cards = story.related.map(item => {
  const card = element('div', undefined, 'related-card');
  const button = element('button', '用这个成语创作 ↗'); button.type = 'button';
  button.addEventListener('click', () => { chooseIdiom(item.idiom); form.scrollIntoView({block:'start',behavior:'smooth'}); idiomInput.focus(); });
  card.append(element('h3', item.idiom), element('p', item.meaning), element('p', item.angle), button);
  return card;
 });
 document.getElementById('related-list').replaceChildren(...cards);
}
function updateMode() {
 const fromIdiom = form.elements.mode.value === 'idiom';
 idiomInput.required = fromIdiom; concernInput.required = !fromIdiom;
 document.getElementById('idiom-optional').textContent = fromIdiom ? '必填' : '选填';
 document.getElementById('concern-optional').textContent = fromIdiom ? '选填' : '必填';
 document.getElementById('idiom-hint').textContent = fromIdiom ? '保留成语的内核，看看它在今天的意义。' : '不填也可以，让 AI 根据你的困惑推荐合适的成语。';
}
function chooseIdiom(idiom) {
 idiomInput.value = idiom;
 form.elements.mode.value = 'idiom'; updateMode();
}
form.querySelectorAll('[name="mode"]').forEach(radio => radio.addEventListener('change', updateMode));
document.querySelectorAll('[data-idiom]').forEach(button => button.addEventListener('click', () => {chooseIdiom(button.dataset.idiom);idiomInput.focus();}));
document.querySelectorAll('[data-theme]').forEach(button => button.addEventListener('click', () => {
 theme = button.dataset.theme;
 document.querySelectorAll('[data-theme]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
}));
function updateReady() { generateButton.disabled = busy || !configured || !token; }
if (configured) {
 document.getElementById('service-note').textContent = 'AI共创已配置 · 完成验证后可生成，通常需要几十秒。';
 document.getElementById('privacy-note').textContent = '点击生成后，成语、困惑和主题将通过后台发送给 DeepSeek。请勿填写姓名、联系方式等敏感信息。内容用于启发思考。';
 document.getElementById('verification').hidden = false;
 window.studioVerificationReady = () => {
  widgetId = window.turnstile.render('#verification', {
   sitekey:config.turnstileSiteKey, action:'create-story', theme:'dark', size:'flexible',
   callback:value => {token=value;updateReady();},
   'expired-callback':() => {token='';updateReady();},
   'error-callback':() => {token='';formMessage.textContent='验证暂时无法完成，请刷新后重试。';updateReady();}
  });
 };
 const script = document.createElement('script');
 script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=studioVerificationReady&render=explicit';
 script.async = true;
 script.onerror = () => {formMessage.textContent='验证服务未能加载，请检查网络后刷新。';};
 document.head.append(script);
} else {
 document.getElementById('service-note').textContent = 'AI创作尚未接通。你可以先填写想法、切换主题，或阅读右侧编辑示例；当前不会发送你的输入。';
}
updateReady();
function validStory(story) {
 const text = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 10000;
 return story && ['idiom','theme','title','subtitle','meaning','modernMeaning','connection','protagonist','ending','takeaway'].every(key => text(story[key])) &&
 Array.isArray(story.sections) && story.sections.length === 4 && story.sections.every(part => part && text(part.heading) && text(part.text) && typeof part.quote === 'string') &&
 Array.isArray(story.actions) && story.actions.length === 3 && story.actions.every(text) &&
 Array.isArray(story.related) && story.related.length === 3 && story.related.every(item => item && ['idiom','meaning','angle'].every(key => text(item[key])));
}
form.addEventListener('submit', async event => {
 event.preventDefault();
 if (busy || !configured || !token || !form.reportValidity()) return;
 const request = {mode:form.elements.mode.value,idiom:idiomInput.value.trim(),concern:concernInput.value.trim(),theme,turnstileToken:token};
 if ((request.mode === 'idiom' && !request.idiom) || (request.mode === 'concern' && !request.concern)) {formMessage.textContent='请先写下一个成语或你的困惑。';return;}
 busy = true; updateReady(); manuscript.setAttribute('aria-busy','true');
 generateButton.firstElementChild.textContent = '正在写你的故事…';
 formMessage.textContent = '正在理解成语与处境，再写成一个当代故事。请稍等，已有作品会保留。';
 outputMessage.textContent = '';
 try {
  const response = await fetch(config.endpoint, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(request),signal:AbortSignal.timeout(75000)});
  const data = await response.json();
  if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : '生成暂时不可用，请稍后重试。');
  if (!validStory(data.story)) throw new Error('故事内容不完整，请重新生成。');
  renderStory(data.story, false); formMessage.textContent = '故事已完成。你可以阅读、复制，或尝试一个相关成语。';
  document.getElementById('output').scrollIntoView({block:'start',behavior:'smooth'});
 } catch (error) {
  formMessage.textContent = error.name === 'TimeoutError' || error.name === 'AbortError' ? '生成等待超时，请稍后重试。你的输入和已有作品都还在。' : error instanceof TypeError ? '连接创作服务失败，请检查网络后重试。你的输入和已有作品都还在。' : error.message;
 } finally {
  busy = false;token='';manuscript.setAttribute('aria-busy','false');
  generateButton.firstElementChild.textContent = '生成我的成语故事';
  if (window.turnstile && widgetId !== undefined) window.turnstile.reset(widgetId);
  updateReady();
 }
});
document.getElementById('load-example').addEventListener('click', () => {
 renderStory(exampleStory, true);outputMessage.textContent='已打开编辑示例；不会覆盖你填写的想法。';
 document.getElementById('output').scrollIntoView({block:'start',behavior:'smooth'});
});
function storyText() {
 const s=currentStory;
 return [s.title,s.idiom+' / '+s.theme,s.subtitle,'成语内核：'+s.meaning,'当代意义：'+s.modernMeaning,'与你的联系：'+s.connection,s.protagonist,...s.sections.map((p,i)=>(i+1)+'. '+p.heading+'\n'+p.text+(p.quote?'\n“'+p.quote+'”':'')),'故事里的提醒：'+s.ending,'写给此刻的你：'+s.takeaway,'可以从一件小事开始：\n'+s.actions.map((a,i)=>(i+1)+'. '+a).join('\n'),'相关成语：\n'+s.related.map(r=>r.idiom+'：'+r.meaning+'\n'+r.angle).join('\n\n'),document.getElementById('result-badge').textContent+' · 现代故事为虚构改编，成语释义请结合权威词典核对。'].join('\n\n');
}
document.getElementById('copy-story').addEventListener('click',async()=>{
 try {await navigator.clipboard.writeText(storyText());outputMessage.textContent='故事已复制。';}
 catch {outputMessage.textContent='浏览器未允许复制，请使用“下载文本”保存。';}
});
document.getElementById('download-story').addEventListener('click',()=>{
 const url=URL.createObjectURL(new Blob(['\uFEFF'+storyText()],{type:'text/plain;charset=utf-8'}));
 const link=document.createElement('a');link.href=url;link.download='成语智灵-'+currentStory.idiom.replace(/[\\/:*?"<>|]/g,'')+'.txt';link.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);outputMessage.textContent='已下载故事文本。';
});
updateMode();renderStory(exampleStory,true);
