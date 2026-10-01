const {chromium}=require('/Users/dofy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification','revision');
fs.mkdirSync(out,{recursive:true});
let checks=0;
const check=(value,message)=>{assert.ok(value,message);checks++;};
(async()=>{
  const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1});
    const errors=[],requests=[],assetSlots=new Set(),handoffs=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
    await page.goto(pathToFileURL(path.join(root,'index.html')).href);
    await page.evaluate(()=>document.fonts.ready);
    const click=action=>page.locator(`[data-action="${action}"]`).last().click();
    const screen=async value=>check(await page.locator('#phone').getAttribute('data-screen')===value,'Screen '+value);
    async function shot(name,full=false){await page.screenshot({path:path.join(out,name+'.png'),fullPage:full});}
    async function audit(){
      const data=await page.locator('#phone img').evaluateAll(images=>images.map(i=>({id:i.dataset.asset,loaded:i.complete&&i.naturalWidth>0,w:parseFloat(getComputedStyle(i).width),h:parseFloat(getComputedStyle(i).height),ew:parseFloat(i.getAttribute('width')),eh:parseFloat(i.getAttribute('height'))})));
      for(const a of data){check(a.loaded,'Loaded '+a.id);if(a.ew)check(Math.abs(a.w-a.ew)<.03&&Math.abs(a.h-a.eh)<.03,'SVG geometry '+a.id);assetSlots.add(a.id);}
      check(await page.locator('#app').evaluate(e=>e.scrollWidth<=e.clientWidth),'No internal horizontal overflow');
    }
    async function fits(){
      const vp=page.viewportSize(),box=await page.locator('#device').boundingBox(),tools=await page.locator('#preview-chrome').boundingBox();
      check(box.y>=0&&box.y+box.height<=vp.height+.5,'Whole phone fits viewport height');
      check(box.x>=0&&box.x+box.width<=vp.width+.5,'Whole phone fits viewport width');
      check(tools.y>=0&&tools.y+tools.height<box.y,'Controls stay above frame');
      check(await page.locator('#phone').evaluate(e=>e.offsetWidth===390&&e.offsetHeight===844),'Logical viewport remains 390 × 844');
      check(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight&&document.documentElement.scrollWidth<=innerWidth),'No outer page scroll');
    }
    await fits();await audit();await shot('01-trips-desktop');
    check(await page.locator('#frame-name').innerText()==='Trips','Figma frame name on top left');
    check(await page.locator('#reset').evaluate(e=>!document.getElementById('phone').contains(e)),'Reset outside frame');
    check(await page.locator('.camera-island,.view-label,.preview-caption,.prototype-label').count()===0,'No notch, view labels, or old preview branding');
    for(const [width,height] of [[1440,900],[1280,720],[375,667],[390,844],[844,390]]){
      await page.setViewportSize({width,height});await fits();if(width===375)await shot('02-mobile-fit');
    }
    await page.setViewportSize({width:1280,height:800});
    for(const destination of ['Inbox','Account','Notifications']){
      await click('empty:'+destination);await screen('empty');
      check(await page.locator('.empty-icon').evaluate(e=>{const s=getComputedStyle(e);return s.color==='rgb(0, 0, 0)'&&s.backgroundColor==='rgba(0, 0, 0, 0)'&&s.borderTopWidth==='0px';}),'Plain black empty icon '+destination);
      if(destination==='Inbox')await shot('03-empty-state');await click('trips');
    }
    await click('people');check(await page.locator('#frame-name').innerText()==='Who’s going','Custom sheet name');await audit();await click('close');
    await click('open-trip');await screen('trip');check(await page.locator('#frame-name').innerText()==='Trip invitation','Invitation Figma frame name');
    const cards=await page.locator('.pickup-option').elementHandles();
    const before=await page.locator('.pickup-option').evaluateAll(cards=>cards.map(c=>({y:c.offsetTop,h:c.offsetHeight,w:c.offsetWidth})));
    for(const pickup of ['kushalnagar','mysuru','kushalnagar','mysuru']){
      await page.locator(`input[value="${pickup}"]`).check();
      const after=await page.locator('.pickup-option').evaluateAll(cards=>cards.map(c=>({y:c.offsetTop,h:c.offsetHeight,w:c.offsetWidth})));
      check(JSON.stringify(before)===JSON.stringify(after),'Pickup geometry stays fixed '+pickup);
      check(await cards[0].evaluate(e=>e===document.querySelector('.pickup-option')),'Pickup DOM is preserved');
      check(await page.locator('.price strong').innerText()===(pickup==='mysuru'?'₹2,140':'₹1,780'),'Selection updates estimate');
    }
    await audit();await shot('04-pickup-selection');
    await click('options');check(await page.locator('.option-row').count()===2,'Two trip options');await click('route');check(await page.locator('#frame-name').innerText()==='Pickup route / Bottom Sheet','Route Figma layer name');await audit();await page.keyboard.press('Escape');
    await click('review');check(await page.locator('[data-action="request"]').isDisabled(),'Consent still required');
    check(await page.locator('[data-action="request"]').evaluate(e=>getComputedStyle(e).color)==='rgb(255, 255, 255)','Disabled request label is white');await shot('05-request-disabled');
    await page.locator('#agree').check();await click('change-pickup');await page.locator('input[value="kushalnagar"]').check();await click('review');check(await page.locator('[data-action="request"]').isDisabled(),'Pickup change clears consent');
    await click('split');await audit();await click('close');await page.locator('#agree').check();
    await page.evaluate(()=>{
      window.handoffTimes=[];let sent=0;
      new MutationObserver(()=>{const s=document.getElementById('phone').dataset.screen;if(s==='pending')sent=performance.now();if(s==='organiser'&&sent){window.handoffTimes.push(performance.now()-sent);sent=0;}}).observe(document.getElementById('phone'),{attributes:true,attributeFilter:['data-screen']});
    });
    await click('request');await screen('pending');check(await page.locator('.handoff-countdown').innerText()==='3s · Continuing to organiser','Visible three-second countdown');
    const recovery=await page.locator('[data-action="organiser"]').elementHandle();
    await click('message-group');await screen('pending');
    await page.waitForTimeout(1100);check(await recovery.evaluate(e=>e.isConnected),'Recovery CTA survives countdown updates');check((await page.locator('.handoff-countdown').innerText()).startsWith('2s'),'Countdown advances to two seconds');await shot('06-request-countdown');
    await page.waitForFunction(()=>document.getElementById('phone').dataset.screen==='organiser',null,{timeout:3500});await screen('organiser');
    const elapsed=await page.evaluate(()=>window.handoffTimes[0]);handoffs.push(elapsed);check(elapsed>=2950&&elapsed<3500,'Automatic handoff occurs at three seconds: '+elapsed);
    check(await page.locator('.role-tip').isVisible(),'Organiser tooltip appears after countdown');check(await page.locator('#handoff').innerText()==='','No persistent organiser label');check(await page.locator('#frame-name').innerText()==='Host Request confirmation','Organiser Figma frame name');await audit();await shot('07-organiser-tooltip');
    await click('confirm');await screen('confirmed');await audit();await shot('08-confirmed');await click('message-group');await screen('confirmed');
    await click('reset');await click('open-trip');await click('review');await page.locator('#agree').check();await click('request');await click('cancel-sheet');await page.waitForTimeout(3200);await screen('pending');await click('cancel');await screen('closed');check(await page.getByText('Request cancelled',{exact:true}).isVisible(),'Traveller cancellation retained');await click('retry');
    await click('review');await page.locator('#agree').check();await click('request');await click('back');await screen('trips');check(await page.locator('[data-action="organiser"]').isVisible(),'Recovery CTA available away from request screen');await click('organiser');await screen('organiser');
    await click('decline-sheet');check(await page.getByRole('dialog').locator('input,form').count()===0,'Decline has no reason form');check(await page.getByRole('dialog').locator('.button').count()===2,'Decline confirmation has two actions');check(await page.locator('[data-action="decline"]').evaluate(e=>e.classList.contains('secondary')),'Decline uses cancellation-style secondary confirmation');await shot('09-decline-confirmation');
    await click('close');await screen('organiser');await click('decline-sheet');await click('decline');await screen('closed');
    check(await page.locator('.pickup-summary').count()===0,'No retry suggestion after organiser decline');check(await page.locator('#app-footer .button').count()===1,'One CTA after organiser decline');check(await page.locator('#app-footer .button').evaluate(e=>e.textContent==='Return to trips'&&e.classList.contains('secondary')),'Declined screen has only secondary Return to trips');await shot('10-declined');await click('trips');await screen('trips');
    await click('reset');await click('open-trip');await click('review');await page.locator('#agree').check();await click('request');await click('reset');await page.waitForTimeout(3300);await screen('trips');check(await page.locator('#handoff').innerText()==='','Reset clears countdown and recovery link');
    check(errors.length===0,'No JavaScript errors');check(requests.length===0,'No external asset requests');
    const report={checks,errors,externalRequests:requests,automaticHandoffMs:handoffs,verifiedAssetSlots:[...assetSlots],screenshots:fs.readdirSync(out).filter(x=>x.endsWith('.png'))};
    fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify({checks,errors,externalRequests:requests.length,automaticHandoffMs:handoffs,screenshots:report.screenshots.length}));
  }finally{await browser.close();}
})().catch(e=>{console.error(e.message);process.exit(1);});
