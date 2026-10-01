(() => {
'use strict';
const bundled = __ASSETS__;
const $ = id => document.getElementById(id);
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = value => '₹' + value.toLocaleString('en-IN');
const node = {closed:'58120-1063',cancelledStatus:'58119-433',declinedStatus:'58119-443',options:'58121-1881',trips:'58036-6466',trip:'58062-3463',route:'58062-3561',review:'58081-4186',split:'58088-1754',pending:'58090-4616',organiser:'58090-4861',confirmed:'58111-5213',group:'58036-6501',status:'58095-1784'};
function asset(screen, name, cls = '', alt = '') {
  const id = (node[screen] || screen) + '/' + name;
  if (!bundled.assets[id]) throw new Error('Missing Figma asset: ' + id);
  const size = bundled.dimensions[id];
  return `<img src="${bundled.blobs[bundled.assets[id]]}" class="${cls}" alt="${escape(alt)}" data-asset="${id}"${size ? ` width="${size[0]}" height="${size[1]}"` : ''} draggable="false">`;
}
// Supplemental icons reuse the existing Moving-Tech-App icon vocabulary.
const paths = {people:'M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM6 21v-3a6 6 0 0 1 12 0v3M18 5a3 3 0 0 1 0 6M21 20v-3a5 5 0 0 0-2-4',route:'M6 4h12v5H6v6h12v5M4 4h.01M20 20h.01',chat:'M21 11a8 8 0 0 1-8 8H7l-4 3V11a9 9 0 0 1 18 0ZM8 11h.01M12 11h.01M16 11h.01',user:'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2',bell:'M6 8a6 6 0 0 1 12 0v7l2 3H4l2-3ZM10 21h4',trip:'M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M5 7h14v14H5ZM9 7v14M15 7v14',close:'m6 6 12 12M6 18 18 6'};
const icon = name => `<svg class="local-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name]}"/></svg>`;
const stops = {
  mysuru:{name:'Mysuru',place:'Mysuru Junction',time:'10:30 AM',travel:640,fuel:480,tolls:160,prior:560,saving:160,map:'Mysuru Junction Railway Station, Mysuru, Karnataka'},
  kushalnagar:{name:'Kushalnagar',place:'KSRTC bus stand',time:'12:30 PM',travel:280,fuel:180,tolls:100,prior:1010,saving:70,map:'KSRTC Bus Stand, Kushalnagar, Karnataka'}
};
const initial = () => ({status:'invited',stop:'mysuru',screen:'trips',consent:false,tab:'upcoming',empty:'Inbox',remaining:8000,handoffDone:false});
let state = initial(), sheet = null, sheetFocus = null, returnScreen = 'trips', toastTimer, roleTimer, lastTick = performance.now();
const selected = () => stops[state.stop];
const total = () => selected().travel + 1500;
const locked = () => ['pending','confirmed'].includes(state.status);
const button = (label, action, type = '', disabled = false) => `<button class="button ${type}" data-action="${action}"${disabled ? ' disabled' : ''}>${label}</button>`;
const link = (label, action) => `<button class="text-link" data-action="${action}">${label}</button>`;
const navButton = (label, action, name, screen = 'trip') => `<button class="icon-button" aria-label="${label}" data-action="${action}">${asset(screen,name)}</button>`;
const note = (text, screen = 'trip') => `<div class="note">${asset(screen,'imgInfo')}<p>${text}</p></div>`;
const tripContext = route => `<div class="trip-context"><div class="row between"><h2>Coorg, with the gang.</h2>${route ? link('View route','route') : ''}</div><p class="small muted">Sat, 3 Oct – Mon, 5 Oct · 2 nights</p></div>`;
const mapURL = key => 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(stops[key].map);
function groupRow(onTrips = false) {
  const screen = onTrips ? 'trips' : 'trip';
  const portraits = onTrips ? ['imgEllipse1','imgEllipse4','imgEllipse2','imgEllipse3'] : ['imgEllipse2','imgEllipse4','imgEllipse3','imgEllipse5'];
  return `<button class="group-row" data-action="people" aria-label="Who’s going? Meet your travel group"><span class="avatars">${portraits.map(n=>asset(screen,n)).join('')}</span><span class="group-copy"><h3>${state.status==='confirmed'?'Your travel group':'Ananya invited you'}</h3><p class="small muted">${state.status==='confirmed'?'You and 4 friends are going':'4 friends are going'}</p></span><span class="group-chevron">${asset(screen,'imgCaretRight')}</span></button>`;
}
function header() {
  if (state.screen==='trips') return `<div class="app-header brand-header">${asset('trips','imgLogo','','Moving tech')}${navButton('Notifications','empty:Notifications','imgBell','trips')}</div>`;
  const title = {trip:'Trip details',review:'Review share',pending:'Trip details',organiser:'Joining request',confirmed:'Trip details',closed:'Trip details',empty:state.empty}[state.screen];
  const source = node[state.screen] ? state.screen : 'trip';
  return `<div class="app-header">${navButton('Back','back','imgCaretLeft',source)}<h2>${title}</h2>${state.screen==='empty'?'<span style="width:40px"></span>':navButton('Trip options','options','imgDotsThree',source)}</div>`;
}
function bottomNav() {
  return `<nav class="bottom-nav" aria-label="Main navigation">${[['Trips','trips','imgSuitcaseRolling'],['Inbox','empty:Inbox','imgChatCircleDots'],['Account','empty:Account','imgUser']].map(([label,action,img])=>`<button class="${label==='Trips'?'active':''}" data-action="${action}"${label==='Trips'?' aria-current="page"':''}>${asset('trips',img)}<span>${label}</span></button>`).join('')}</nav>`;
}
function statusLabel() {return {invited:'You’re invited',pending:'Request sent',confirmed:'You’re going',cancelled:'Request cancelled',declined:'Request declined'}[state.status];}
function tripsScreen() {
  return `<div class="tabs-heading"><h1>Your trips</h1><div class="tabs" role="tablist" aria-label="Trips"><button role="tab" aria-selected="${state.tab==='upcoming'}" class="tab ${state.tab==='upcoming'?'active':''}" data-action="tab:upcoming">Upcoming <span class="tab-count">1</span></button><button role="tab" aria-selected="${state.tab==='past'}" class="tab ${state.tab==='past'?'active':''}" data-action="tab:past">Past trips</button></div></div>${state.tab==='past'?`<div class="empty-screen" style="height:430px"><div class="empty-icon">${icon('trip')}</div><h1>No past trips yet</h1><p>Your next shared memory is waiting.<br>Take a look at your upcoming trip.</p>${button('Back to upcoming trips','tab:upcoming','secondary')}</div>`:`<article class="trip-card"><div class="cover">${asset('trips','imgDestinationCover','','Green forest in Coorg')}<span class="invite-badge">${statusLabel()}</span><div class="cover-content"><h1>Coorg, with the gang.</h1><p>Bengaluru to Madikeri</p></div></div><div class="dates"><div><span class="small">Leaving</span><h2>Sat, 3 Oct</h2></div><div><span class="small">Back</span><h2>Mon, 5 Oct</h2></div></div><div class="trip-meta"><span>${asset('trips','imgCar')}Road trip</span><span>${asset('trips','imgCloudMoon')}2 nights</span></div><div class="divider"></div>${groupRow(true)}${button(state.status==='invited'?'View invitation':'View trip','open-trip')}</article>`}`;
}
function tripScreen() {
  return `<div class="cover detail-cover">${asset('trip','imgFrame43','','Coorg forest')}<div class="cover-content"><h1>Coorg, with the gang.</h1><div class="trip-meta"><span>Sat, 3 Oct – Mon, 5 Oct</span><span>Road trip</span><span>2 nights</span></div></div></div><div class="detail-group">${groupRow()}</div><section class="pickup-section" aria-labelledby="pickup-title"><div class="row between"><div class="pickup-heading"><h2 id="pickup-title">Where will you join?</h2><p>Bengaluru to Madikeri</p></div>${link('View route','route')}</div><div class="pickup-options" role="radiogroup" aria-label="Pickup location">${Object.entries(stops).map(([key,s])=>`<label class="pickup-option ${state.stop===key?'selected':''}"><input type="radio" name="pickup" value="${key}" ${state.stop===key?'checked':''} aria-label="${s.name}, ${s.time}, ${money(s.travel+1500)} estimated total">${asset('trip',state.stop===key?'imgEllipse1':'imgEllipse')}<span class="details"><h3>${s.name} · ${s.time}</h3><p class="small muted">${s.place}</p></span><span class="option-price"><h3>${money(s.travel+1500)}</h3><p class="small muted">est. total</p></span></label>`).join('')}</div>${note('Reach the pickup on your own. Both stops are already on the group’s route.')}</section>`;
}
function pickupSummary(organiser = false) {
  return `<div class="pickup-summary"><div class="row between"><p class="small">${organiser?'Joining from':'Your pickup'}</p>${link(organiser?'View route':'Change',organiser?'route':'change-pickup')}</div><div><h3>${selected().place}</h3><p class="small">Sat, 3 Oct · ${selected().time}</p></div></div>`;
}
function costItem(label, amount, detail, img = '') {
  return `<div class="cost-item">${img?asset('review',img):''}<div class="grow"><div class="row between body"><span>${label}</span><strong>${money(amount)}</strong></div>${detail?`<p class="small muted">${detail}</p>`:''}</div></div>`;
}
function reviewScreen() {
  const s = selected();
  return `<div class="content review-content">${tripContext()}${pickupSummary()}<section class="cost-section"><div class="row between"><h2>Your estimated share</h2>${link('How it’s split?','split')}</div>${costItem('Onward travel',s.travel,`${s.name} to Madikeri<br>Fuel ${money(s.fuel)} · Tolls ${money(s.tolls)}`,'imgCostIcon')}${costItem('2 nights’ stay',1500,'Fixed contribution','imgCostIcon1')}<div class="divider"></div><div class="cost-total"><span>Estimated total</span><strong>${money(total())}</strong></div></section><div class="review-note">${note(`Bengaluru → ${s.name}: ₹0 for you. From ${s.name}, you share travel with the other 4 after Ananya approves.`,'review')}</div></div>`;
}
function agreedSummary() {
  return `<section class="agreed-summary">${tripContext(true)}<div class="pickup-detail"><p class="small muted">Requested pickup</p><h3>${selected().place}</h3><p class="small muted">Sat, 3 Oct · ${selected().time}</p></div><div class="divider"></div><div class="estimate-details"><div class="cost-total"><span>Agreed estimate</span><strong>${money(total())}</strong></div><div class="row between"><p class="small muted">Travel ${money(selected().travel)} · Stay ₹1,500</p>${link('View split','split')}</div></div></section>`;
}
function statusScreen() {
  const confirmed = state.status==='confirmed';
  return `<div class="content status-content"><section class="status-block" data-node-id="58095:1784"><div class="status-indicator ${confirmed?'confirmed':''}">${asset('status',confirmed?'imgCheck':'imgClockWaiting')}</div><div class="status-message ${confirmed?'confirmed-copy':''}"><h1>${confirmed?'Your seat is confirmed':'Request sent to Ananya'}</h1><p>${confirmed?`Ananya approved your request.<br>You’re joining the group at ${selected().name}.`:'Waiting for her to confirm your seat.<br>We’ll notify you when she responds.'}</p></div></section>${agreedSummary()}</div>`;
}
function organiserScreen() {
  const each = selected().prior + selected().travel + 1500;
  // Figma's displayed total does not add up; keep member amounts and reconcile the total.
  const groupTotal = each * 4 + total();
  return `<div class="content organiser-content">${tripContext()}<section class="incoming"><div class="row between"><h1>Riya wants to join</h1><span class="row new-request">${asset('organiser','imgAmberStatusDot')}New request</span></div><div class="row requester">${asset('organiser','imgEllipse2','','Riya Sharma')}<div><h3>Riya Sharma</h3><p class="small muted">${money(total())} agreed · Travel + fixed stay</p></div></div></section>${pickupSummary(true)}<section class="group-split"><h2>New split by leg</h2>${['Ananya (you)','Karthik','Meera','Dev','Riya'].map((name,i)=>`<div class="split-row ${i===4?'accent':''}"><span>${name}</span><strong>${money(i===4?total():each)}</strong></div>`).join('')}<div class="split-total"><span>Estimated group total</span><span>${money(groupTotal)}</span></div><p class="saving">${money(selected().saving)} less each compared to before</p></section></div>`;
}
function closedScreen() {
  const cancelled = state.status==='cancelled';
  return `<div class="content status-content closed-content"><section class="status-block closed-status" data-node-id="${cancelled?'58119:433':'58119:443'}"><div class="status-indicator closed">${asset(cancelled?'cancelledStatus':'declinedStatus','imgFrame')}</div><div class="status-message"><h1>${cancelled?'Request cancelled':'Ananya declined your request'}</h1><p>${cancelled?'Your request has been withdrawn.<br>Your seat was not confirmed.':'Ananya couldn’t confirm your seat.<br>Your request has been declined.'}</p></div></section>${cancelled?`${tripContext(true)}<div class="pickup-summary"><h3>Changed your mind?</h3><p class="body muted">You can review your pickup and send a new request whenever you’re ready.</p></div>`:tripContext()}</div>`;
}
function emptyScreen() {
  const symbols = {Inbox:'chat',Account:'user',Notifications:'bell','Message group':'chat'};
  return `<div class="empty-screen"><div class="empty-icon">${icon(symbols[state.empty]||'chat')}</div><h1>This part isn’t in the prototype</h1><p>${state.empty==='Message group'?'Group messaging':state.empty} isn’t included in this prototype.<br>You can continue exploring the trip.</p>${button('Return to trips','trips','secondary')}</div>`;
}
function footer() {
  switch (state.screen) {
    case 'trips': return bottomNav();
    case 'trip': return `<div class="price-footer"><div class="price"><strong>${money(total())}</strong><small>*est.total</small></div>${button(`Review share ${asset('trip','imgCaretRight1')}`,'review')}</div>`;
    case 'review': return `<div class="footer review-footer"><label class="agreement"><input id="agree" type="checkbox" ${state.consent?'checked':''}><span class="checkbox">${asset('review','imgCheck')}</span><span>I agree to my estimated share and the fixed stay contribution.</span></label>${button('Request to join','request','',!state.consent)}<p class="footer-note">No payment now. Ananya confirms your seat.</p></div>`;
    case 'pending': return `<div class="footer">${button('Message group','message-group')}${button('Cancel request','cancel-sheet','secondary')}</div>`;
    case 'organiser': return `<div class="footer">${button('Confirm seat','confirm')}${button('Decline','decline-sheet','secondary')}<p class="footer-note">New split applies only after you confirm.</p></div>`;
    case 'confirmed': return `<div class="footer"><a class="button" href="${mapURL(state.stop)}" target="_blank" rel="noopener noreferrer" aria-label="View map for ${selected().place} (opens Google Maps)">View map</a>${button('Message group','message-group','secondary')}</div>`;
    case 'closed': return `<div class="footer">${state.status==='cancelled'?button('Review pickup & try again','retry'):''}${button('Return to trips','trips','secondary')}</div>`;
    default: return '';
  }
}
const screens = {trips:tripsScreen,trip:tripScreen,review:reviewScreen,pending:statusScreen,organiser:organiserScreen,confirmed:statusScreen,closed:closedScreen,empty:emptyScreen};
function updateHandoff() {
  if (state.status==='pending' && state.screen!=='organiser') {
    const showCountdown=state.screen==='pending'&&!state.handoffDone;
    const seconds=Math.max(1,Math.ceil(state.remaining/1000));
    // Keep the recovery control mounted so pointer and keyboard interactions survive ticks.
    if (!$('handoff').querySelector('[data-action="organiser"]')) $('handoff').innerHTML='<span class="handoff-countdown"></span><button data-action="organiser">Continue as Ananya</button>';
    const copy=showCountdown?`${seconds}s · ${sheet?'Resumes after closing':'Continuing to organiser'}`:'';
    const countdown=$('handoff').querySelector('.handoff-countdown');
    if(countdown.textContent!==copy)countdown.textContent=copy;
  } else if($('handoff').firstChild) $('handoff').replaceChildren();
}
function render(animate = false) {
  $('phone').dataset.screen = state.screen;
  $('phone').dataset.requestState = state.status;
  $('statusbar').innerHTML = `<span>12:30</span>${asset(node[state.screen] && state.screen!=='empty'?state.screen:'trips','imgBaseSystemStatusIcons')}`;
  $('app-header').innerHTML = header();
  $('app').innerHTML = screens[state.screen]();
  $('app').classList.toggle('screen-enter',animate);
  $('app-footer').innerHTML = footer();
  document.title = 'Moving tech · ' + ({trips:'Your trips',trip:'Trip details',review:'Review share',pending:'Request sent',organiser:'Ananya’s organiser view',confirmed:'Seat confirmed',closed:'Request update',empty:state.empty}[state.screen]);
  updateHandoff();
}
function go(next) {
  if (!screens[next]) return;
  closeSheet(false);
  if (next==='trip' && locked()) next=state.status==='confirmed'?'confirmed':'pending';
  if (next==='review' && locked()) return;
  if (next==='organiser' && state.status!=='pending') return;
  state.screen=next;
  if(next!=='organiser') document.querySelector('.role-tip')?.remove();
  render(true);
  $('app').scrollTop=0;
  $('app').focus({preventScroll:true});
  lastTick=performance.now();
}
function announce(message) {
  clearTimeout(toastTimer);
  $('toast').textContent=message;
  $('toast').classList.add('show');
  $('live').textContent=message;
  toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2600);
}
function showOrganiser() {
  if (state.status!=='pending') return;
  state.handoffDone=true;
  go('organiser');
  document.querySelector('.role-tip')?.remove();
  const tip=document.createElement('div');
  tip.className='role-tip';tip.setAttribute('role','tooltip');tip.textContent='Ananya’s organiser view';
  $('phone').appendChild(tip);
  clearTimeout(roleTimer);roleTimer=setTimeout(()=>tip.remove(),3800);
  $('live').textContent='Ananya’s organiser view. Review Riya’s request, then confirm or decline.';
}
function openSheet(name, title, body) {
  if (!sheet) sheetFocus=document.activeElement;
  sheet=name;
  const closeAsset=name==='options'?'options':name==='split'?'split':'route';
  $('modal-root').innerHTML=`<div class="overlay"><section class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" data-sheet="${name}"><div class="handle" aria-hidden="true"></div><div class="sheet-header"><h1 id="sheet-title">${title}</h1><button class="close" aria-label="Close ${escape(title)}" data-action="close">${asset(closeAsset,'imgX')}</button></div><div class="sheet-body">${body}</div></section></div>`;
  ['app-header','app','app-footer'].forEach(id=>$(id).inert=true);
  $('modal-root').querySelector('button')?.focus({preventScroll:true});
  updateHandoff();
}
function closeSheet(restore = true) {
  if (!sheet) return;
  sheet=null;$('modal-root').innerHTML='';
  ['app-header','app','app-footer'].forEach(id=>$(id).inert=false);
  lastTick=performance.now();
  if (restore && sheetFocus?.isConnected) sheetFocus.focus({preventScroll:true});
  updateHandoff();
}
function routeSheet() {
  openSheet('route','Trip route',`<div class="route-itinerary"><h2>One route. Join where it works.</h2><div class="stops"><div class="route-stop first">${asset('route','imgTimelineMarkerAndConnector')}<div class="grow"><h3>Bengaluru</h3><p class="small muted">Departure · 7:00 AM</p></div></div>${Object.entries(stops).map(([key,s])=>`<div class="route-stop">${asset('route','imgTimelineMarkerAndConnector1')}<div class="grow"><div class="route-title"><h3>${s.name}</h3><span class="pickup-badge">Pickup stop</span></div><p class="small muted">${s.time} · ${s.place}</p><a class="map-link" href="${mapURL(key)}" target="_blank" rel="noopener noreferrer" aria-label="View map for ${s.name} (opens Google Maps)">View map ${asset('route','imgExternalLink')}</a></div></div>`).join('')}<div class="route-stop last">${asset('route','imgTimelineMarkerAndConnector2')}<div class="grow"><h3>Madikeri, Coorg</h3><p class="small muted">Arrival · 1:30 PM</p></div></div></div></div>${note('View map opens Google Maps directions from your current location to that pickup stop.','route')}`);
}
function splitSheet() {
  const fromMysuru=state.stop==='mysuru';
  openSheet('split','How it’s split',`<div class="split-breakdown"><h2>Your share by stretch</h2>${costItem('Bengaluru → Mysuru',0,'Original 4 travellers only')}${costItem('Mysuru → Kushalnagar',fromMysuru?360:0,fromMysuru?'₹1,800 ÷ 5 travellers':'Original 4 travellers only')}${costItem('Kushalnagar → Madikeri',280,'₹1,400 ÷ 5 travellers')}<div class="row between body"><strong>Your travel share</strong><strong>${money(selected().travel)}</strong></div></div><div class="divider"></div>${costItem('2 nights’ stay',1500,'Fixed contribution · Separate from travel')}<div class="cost-total sheet-total"><span>Your estimated total</span><strong>${money(total())}</strong></div>${note(`You share ${selected().name} onward with the other 4 travellers. Earlier travel is excluded. ${state.status==='confirmed'?'Ananya has approved this split.':'This split applies after Ananya approves.'}`,'split')}`);
}
function peopleSheet() {
  const people=[['Ananya','Organiser','imgEllipse1'],['Karthik','Travelling from Bengaluru','imgEllipse4'],['Meera','Travelling from Bengaluru','imgEllipse2'],['Dev','Travelling from Bengaluru','imgEllipse3']];
  openSheet('people','Who’s going',`${state.status==='confirmed'?'<p class="sheet-description">You and 4 friends, heading to Coorg together.</p>':''}<div class="people-list">${people.map(([name,description,img],i)=>`<div class="person-row">${asset('trips',img,'',name)}<div class="grow"><h3>${name}</h3><p>${description}</p></div>${i===0?'<span class="person-badge organiser-badge">Organiser</span>':''}</div>`).join('')}${state.status==='confirmed'?`<div class="person-row">${asset('organiser','imgEllipse2','','Riya')}<div class="grow"><h3>Riya <span class="muted">(you)</span></h3><p>Joining at ${selected().name}</p></div><span class="person-badge">Confirmed</span></div>`:''}</div>${state.status==='confirmed'?note(`Meet the group at ${selected().place}, ${selected().time}.`,'route'):''}`);
}
function optionsSheet() {
  openSheet('options','Trip options',`<div class="options-list"><button class="option-row" data-action="people">${asset('options','imgPeople')}<span class="grow"><h2>Who’s going</h2><p>Meet your travel group</p></span></button><button class="option-row" data-action="route">${asset('options','imgRoute')}<span class="grow"><h2>Full route</h2><p>Stops and estimated times</p></span></button></div>`);
}
function handle(action) {
  if (action.startsWith('empty:')) {returnScreen=state.screen;state.empty=action.slice(6);return go('empty');}
  if (action.startsWith('tab:')) {state.tab=action.slice(4);render();return;}
  switch(action) {
    case 'trips': state.tab='upcoming';return go('trips');
    case 'open-trip': return go(state.status==='confirmed'?'confirmed':state.status==='pending'?'pending':['cancelled','declined'].includes(state.status)?'closed':'trip');
    case 'back': return go(state.screen==='empty'?returnScreen:state.screen==='review'?'trip':state.screen==='organiser'?'pending':'trips');
    case 'review': return go('review');
    case 'change-pickup': return go('trip');
    case 'route': return routeSheet();
    case 'split': return splitSheet();
    case 'people': return peopleSheet();
    case 'options': return optionsSheet();
    case 'close': return closeSheet();
    case 'request':
      if (!state.consent || locked() || state.screen!=='review') return;
      state.status='pending';state.remaining=8000;state.handoffDone=false;
      go('pending');$('live').textContent='Request sent to Ananya. Your seat is not confirmed yet.';return;
    case 'organiser': if (state.status==='pending') showOrganiser();return;
    case 'message-group':
      if(state.status==='pending') $('live').textContent='Group messaging isn’t included. Your request is still pending.';
      else announce('Group messaging isn’t included in this prototype.');
      return;
    case 'traveller': return go('pending');
    case 'confirm':
      if (state.status!=='pending'||state.screen!=='organiser') return;
      state.status='confirmed';document.querySelector('.role-tip')?.remove();go('confirmed');$('live').textContent='Ananya confirmed Riya’s seat. You’re back in Riya’s view.';return;
    case 'cancel-sheet':
      if (state.status!=='pending') return;
      return openSheet('cancel','Cancel your request?',`<p class="sheet-description">Ananya won’t need to review this request. Your seat hasn’t been confirmed, and no payment has been made.</p><div class="sheet-actions">${button('Keep my request','close')}${button('Cancel request','cancel','secondary')}</div>`);
    case 'cancel':
      if (state.status!=='pending') return;
      state.status='cancelled';state.consent=false;go('closed');$('live').textContent='Request cancelled. You can review your pickup and try again.';return;
    case 'decline-sheet':
      if (state.status!=='pending'||state.screen!=='organiser') return;
      return openSheet('decline','Decline Riya’s request?',`<p class="sheet-description">Riya’s seat won’t be confirmed. She’ll be notified that her request was declined.</p><div class="sheet-actions">${button('Keep reviewing','close')}${button('Decline request','decline','secondary')}</div>`);
    case 'decline':
      if(state.status!=='pending'||state.screen!=='organiser')return;
      state.status='declined';state.consent=false;go('closed');$('live').textContent='Ananya declined your request.';return;
    case 'retry': if (locked()||state.status==='declined') return;state.consent=false;state.status='invited';return go('trip');
    case 'reset':
      clearTimeout(toastTimer);clearTimeout(roleTimer);document.querySelector('.role-tip')?.remove();$('toast').classList.remove('show');closeSheet(false);state=initial();returnScreen='trips';go('trips');$('live').textContent='Prototype reset. Start with your trip invitation.';return;
  }
}
document.addEventListener('click', event => {
  const target=event.target.closest('[data-action]');
  if (target && !target.disabled) handle(target.dataset.action);
  else if (event.target.classList.contains('overlay')) closeSheet();
});
document.addEventListener('change', event => {
  if (event.target.id==='agree') {state.consent=event.target.checked;const request=document.querySelector('[data-action="request"]');if(request)request.disabled=!state.consent;}
  if (event.target.name==='pickup' && !locked() && stops[event.target.value]) {
    state.stop=event.target.value;state.consent=false;
    document.querySelectorAll('.pickup-option').forEach(card=>{
      const input=card.querySelector('input'),active=input.value===state.stop;
      card.classList.toggle('selected',active);
      const marker=card.querySelector('img'),id=node.trip+'/'+(active?'imgEllipse1':'imgEllipse');
      marker.src=bundled.blobs[bundled.assets[id]];marker.dataset.asset=id;
    });
    document.querySelector('.price strong').textContent=money(total());
  }
});
document.addEventListener('keydown', event => {
  if (!sheet) return;
  if (event.key==='Escape') {event.preventDefault();closeSheet();}
  if (event.key==='Tab') {
    const items=[...$('modal-root').querySelectorAll('button:not(:disabled),a[href],input:not(:disabled)')];
    const first=items[0],last=items.at(-1);
    if (event.shiftKey&&document.activeElement===first) {event.preventDefault();last?.focus();}
    else if (!event.shiftKey&&document.activeElement===last) {event.preventDefault();first?.focus();}
  }
});
let swipeStart=null;
document.addEventListener('pointerdown',event=>{if(event.target.classList.contains('handle'))swipeStart=event.clientY;});
document.addEventListener('pointerup',event=>{if(swipeStart!==null&&event.clientY-swipeStart>50)closeSheet();swipeStart=null;});
setInterval(()=>{
  const now=performance.now(),elapsed=now-lastTick;lastTick=now;
  if(state.status==='pending'&&state.screen==='pending'&&!state.handoffDone&&!sheet&&!document.hidden){
    state.remaining=Math.max(0,state.remaining-elapsed);
    if(state.remaining===0)showOrganiser();else updateHandoff();
  }
},100);
document.addEventListener('visibilitychange',()=>{lastTick=performance.now();});
function fitFrame() {
  const viewport=window.visualViewport;
  const width=viewport?viewport.width:window.innerWidth,height=viewport?viewport.height:window.innerHeight;
  const presentation=document.querySelector('.presentation'),style=getComputedStyle(presentation);
  const horizontalPadding=parseFloat(style.paddingLeft)+parseFloat(style.paddingRight);
  const verticalPadding=parseFloat(style.paddingTop)+parseFloat(style.paddingBottom);
  const compact=width<700;
  const controlsHeight=compact?$('preview-chrome').getBoundingClientRect().height+16:0;
  const controlsWidth=compact?0:428;
  const scale=Math.max(.1,Math.min((width-horizontalPadding-controlsWidth-6)/408,(height-verticalPadding-controlsHeight)/862));
  presentation.style.height=`${height}px`;
  $('device').style.transform=`scale(${scale})`;
  $('device-space').style.width=`${408*scale}px`;
  $('device-space').style.height=`${862*scale}px`;
}
window.addEventListener('resize',fitFrame);window.visualViewport?.addEventListener('resize',fitFrame);render();fitFrame();document.fonts.ready.then(fitFrame);
})();
