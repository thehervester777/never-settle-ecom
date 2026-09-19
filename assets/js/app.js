(function(){
"use strict";

/* Catalogue, settings and orders all live in assets/js/data.js so the
   admin panel and this page stay in sync. */
var P        = NS.data.products.filter(function(p){ return p.status !== 'draft'; });
var CAT_INFO = NS.CAT_INFO;
var SET      = NS.data.settings;

/* ============================================================
   1. DATA
   ============================================================ */


var REVIEWS = [
  {n:'Tanvir H.',  m:'Dhanmondi',   t:'Ordered Tuesday night, it was at my desk Thursday morning. The twill is genuinely heavy — nothing like the thin stuff I usually get online.'},
  {n:'Nusrat J.',  m:'Uttara',      t:'Bought two crew tees for my brother. He has not taken them off in two weeks. Sizing chart was accurate for once.'},
  {n:'Rakib A.',   m:'Chattogram',  t:'Exchanged an L for an XL, no argument, no fee. Courier picked it up the next day. That alone made me a repeat customer.'},
  {n:'Samira K.',  m:'Banani',      t:'The bone tee holds its shape after six washes. I have paid triple for imported tees that sagged in a month.'},
  {n:'Fahim R.',   m:'Mirpur',      t:'The court lows are the real find. Stitched sole, not glued — four months of daily wear and nothing has split.'},
  {n:'Ishrak M.',  m:'Sylhet',      t:'Delivery outside Dhaka took three days, which they told me upfront. No surprises, packaging was solid.'},
  {n:'Ayesha S.',  m:'Gulshan',     t:'Prices look too low for the quality until the parcel arrives. Then it makes sense — no showroom, no markup.'},
  {n:'Zubair T.',  m:'Bashundhara', t:'Wide pant fits exactly like the photos. Finally a local brand that does not photograph pinned garments.'},
  {n:'Mahin C.',   m:'Rampura',     t:'Cargo pockets are actually usable, not decorative. Small thing, but it shows someone thought about it.'},
  {n:'Sadia I.',   m:'Mohammadpur', t:'Took the trainers half a size up like the guide said and they fit perfectly. Insole is proper foam, not cardboard.'},
  {n:'Rifat N.',   m:'Khulna',      t:'Cash on delivery worked without a deposit. Rider waited while I checked the size. Good service.'}
];

var FAQ = [
  ['Do you deliver across Bangladesh?','Yes — every district. Inside Dhaka, orders placed before 4:00 PM arrive within 48 hours, usually next day. Outside Dhaka takes 2 to 4 working days depending on the courier route. Delivery is free on orders over Tk 1,999 and Tk 80 otherwise.'],
  ['How do your sizes run?','Tees and pants are cut relaxed, so they sit one step looser than standard local sizing — if you are between sizes and want a clean fit, size down; for the intended oversized look, take your normal size. Every product page carries flat-lay measurements in inches, so you can measure something you already own and match it. Shoes run in EU 39 to 46 and fit true to size, except the mesh trainer, which is narrow — take a half size up.'],
  ['What if the fit is wrong?','You have 9 days from delivery to exchange any unworn piece with its tags on. Message us on WhatsApp with your order number, we arrange the pickup, and the replacement ships the same day it reaches us. Exchanges are free once per order.'],
  ['Why do you only sell three things?','Tees, pants and shoes are what we know how to make properly. Every extra category means another supplier, another quality gamble and a thinner margin spread across more stock. Twelve pieces we control end to end beat two hundred we have to take someone else’s word on.'],
  ['Why do you run out so fast?','Each colourway is produced in a run of 200 units and we do not restock it. That keeps the fabric quality fixed and stops us from discounting dead inventory at the end of a season. If something sells out, a new colourway takes its slot in the next Thursday drop.'],
  ['Which payments do you take?','bKash, Nagad, Rocket, any local debit or credit card, and cash on delivery nationwide. COD needs no advance payment — you can inspect the parcel and check the size before you hand over the money.'],
  ['Do you have a physical store?','Our studio at Road 11, Banani is open for fittings from 11:00 to 20:00, Saturday through Thursday. It is a showroom rather than a shop — come to try sizes, then order whatever you like for delivery.']
];

/* ============================================================
   2. HELPERS
   ============================================================ */
var $ = function(s,c){return (c||document).querySelector(s);};
var $$ = function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s));};
var tk = function(v){return 'Tk ' + v.toLocaleString('en-US');};

var garmentSVG = NS.garmentSVG;
var toneFor = NS.toneFor;

function cardHTML(p){
  var badge = p.tag ? '<span class="badge'+(p.tag==='SALE'?' sale':'')+'">'+p.tag+'</span>' : '';
  var was = p.was ? '<span class="price was">'+tk(p.was)+'</span>' : '';
  var dots = p.dots.map(function(d){return '<i style="background:'+d+'"></i>';}).join('');
  return ''+
  '<article class="card" data-cat="'+p.cat+'" data-id="'+p.id+'" data-price="'+p.price+'">'+
    '<div class="card-media">'+ badge +
      '<span class="swatch '+p.f+' f-weave"></span>'+
      '<span class="swatch alt '+p.f2+' f-weave"></span>'+
      garmentSVG(p.g, toneFor(p.f)) +
      '<button class="quick" data-open="'+p.id+'">View product</button>'+
    '</div>'+
    '<div>'+
      '<h3 class="card-name"><button data-open="'+p.id+'" style="text-align:left">'+p.n+'</button></h3>'+
      '<div class="card-meta"><span class="price">'+tk(p.price)+'</span>'+was+'</div>'+
      '<div class="colors">'+dots+'</div>'+
    '</div>'+
  '</article>';
}

/* ============================================================
   3. RENDER
   ============================================================ */
var RAIL = ['p1','p6','p9','p3','p7','p10'].map(function(id){
  return P.filter(function(p){ return p.id === id; })[0];
});
$('#railTrack').innerHTML = RAIL.map(cardHTML).join('') +
  '<div class="rail-end"><p class="eyebrow">Volume 04</p>'+
  '<h3 class="cond">Six more<br>pieces live</h3>'+
  '<a class="btn btn-ghost-inv" href="#grid" data-cat-link="all">See all <span class="arrow">→</span></a></div>';

$('#prodGrid').innerHTML = P.map(cardHTML).join('');

var marqBits = ['Runs of 200','240 GSM minimum','No restocks','Free over Tk 1,999','Made in Bangladesh','48-hour delivery'];
$('#marqT').innerHTML = (function(){
  var one = marqBits.map(function(t){return '<span>'+t+'</span><b>◆</b>';}).join('');
  return one + one;
})();

function revHTML(r){
  var stars = new Array(5).join('x').split('x').map(function(){
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.6 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5l-5.9 3.1 1.2-6.5L2.5 9.5l6.6-.9z"/></svg>';
  }).join('');
  return '<figure class="rev"><div class="rev-top">'+
    '<span class="av">'+r.n.charAt(0)+'</span>'+
    '<span><strong>'+r.n+'</strong><span>'+r.m+' · Verified</span></span></div>'+
    '<div class="stars">'+stars+'</div>'+
    '<blockquote style="margin:0"><p>'+r.t+'</p></blockquote></figure>';
}
var half = Math.ceil(REVIEWS.length/2);
var rowA = REVIEWS.slice(0,half).map(revHTML).join('');
var rowB = REVIEWS.slice(half).map(revHTML).join('');
$('#revA').innerHTML = rowA + rowA;
$('#revB').innerHTML = rowB + rowB;

$('#acc').innerHTML = FAQ.map(function(f,i){
  return '<div class="acc-i">'+
    '<button class="acc-q" aria-expanded="false" aria-controls="ap'+i+'">'+f[0]+'<span class="pm"></span></button>'+
    '<div class="acc-p" id="ap'+i+'"><div><p>'+f[1]+'</p></div></div></div>';
}).join('');

var MENU = [
  ['New Drop', null, null],
  ['T-Shirts', 'tshirts', null],
  ['Pants', 'pants', null],
  ['Shoes', 'shoes', null],
  ['Manifesto', null, null],
  ['Support', null, null]
];
$('#mNav').innerHTML = MENU.map(function(m,i){
  if(!m[1]) return '<li><a class="m-item" href="#'+(m[0]==='New Drop'?'drop':m[0]==='Manifesto'?'manifesto':'faq')+'" data-close>'+m[0]+'</a></li>';
  var items = P.filter(function(p){ return p.cat === m[1]; });
  return '<li><button class="m-item" aria-expanded="false" data-sub="s'+i+'">'+m[0]+'<span class="plus">+</span></button>'+
    '<div class="m-sub" id="s'+i+'"><div>'+
      items.map(function(p){ return '<a href="#grid" data-open="'+p.id+'">'+p.n+'</a>'; }).join('')+
      '<a href="#grid" data-cat-link="'+m[1]+'"><strong>View all '+m[0].toLowerCase()+' →</strong></a>'+
    '</div></div></li>';
}).join('');

/* ============================================================
   4. INTERACTION
   ============================================================ */
var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* -- announcement rotator -- */
var ANN = ['Free delivery on orders over Tk 1,999 — nationwide',
           'Volume 04 is live — 200 units per colourway',
           'Cash on delivery available in every district',
           'New drop every Thursday, 8:00 PM'];
var ai = 0, annEl = $('#annLine');
if(!reduce){
  setInterval(function(){
    ai = (ai+1) % ANN.length;
    annEl.animate(
      [{transform:'translateY(0)',opacity:1},{transform:'translateY(-100%)',opacity:0}],
      {duration:380,easing:'cubic-bezier(.22,.61,.36,1)'}
    ).onfinish = function(){
      annEl.textContent = ANN[ai];
      annEl.animate([{transform:'translateY(100%)',opacity:0},{transform:'translateY(0)',opacity:1}],
        {duration:420,easing:'cubic-bezier(.22,.61,.36,1)'});
    };
  }, 4200);
}

/* -- overlay manager: drawers, PDP, search, info all share one stack -- */
var scrim = $('#scrim'), openLayer = null, lastFocus = null;

function lockScroll(on){
  document.body.style.overflow = on ? 'hidden' : '';
  if(window.__lenis){ on ? window.__lenis.stop() : window.__lenis.start(); }
}
function layerOpen(el, focusSel){
  if(openLayer && openLayer !== el) layerClose(true);
  lastFocus = document.activeElement;
  openLayer = el;
  el.classList.add('on');
  el.setAttribute('aria-hidden','false');
  scrim.classList.add('on');
  lockScroll(true);
  var f = el.querySelector(focusSel || '[data-close],[data-close-overlay]');
  if(f) setTimeout(function(){ try{ f.focus({preventScroll:true}); }catch(e){} }, 60);
}
function layerClose(silent){
  if(!openLayer) return;
  openLayer.classList.remove('on');
  openLayer.setAttribute('aria-hidden','true');
  openLayer = null;
  if(silent) return;
  scrim.classList.remove('on');
  lockScroll(false);
  $('#burger').setAttribute('aria-expanded','false');
  if(lastFocus) try{ lastFocus.focus({preventScroll:true}); }catch(e){}
}
$('#burger').addEventListener('click', function(){ layerOpen($('#menuDrawer')); this.setAttribute('aria-expanded','true'); });
$('#cartBtn').addEventListener('click', function(){ layerOpen($('#cartDrawer')); });
scrim.addEventListener('click', function(){ layerClose(); });
document.addEventListener('keydown', function(e){
  if(e.key === 'Escape'){ layerClose(); return; }
  /* focus trap inside the open layer */
  if(e.key !== 'Tab' || !openLayer) return;
  var f = $$('a[href],button:not(:disabled),input,select,textarea,[tabindex]:not([tabindex="-1"])', openLayer)
          .filter(function(el){ return el.offsetParent !== null; });
  if(!f.length) return;
  var first = f[0], last = f[f.length-1];
  if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
  else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
});
document.addEventListener('click', function(e){
  if(e.target.closest('[data-close],[data-close-overlay]')) layerClose();
});

/* -- mobile submenus -- */
$('#mNav').addEventListener('click', function(e){
  var b = e.target.closest('[data-sub]');
  if(!b) return;
  var panel = document.getElementById(b.getAttribute('data-sub'));
  var open = b.getAttribute('aria-expanded') === 'true';
  b.setAttribute('aria-expanded', open ? 'false' : 'true');
  panel.classList.toggle('on', !open);
});

/* -- accordion -- */
$('#acc').addEventListener('click', function(e){
  var q = e.target.closest('.acc-q');
  if(!q) return;
  var panel = document.getElementById(q.getAttribute('aria-controls'));
  var open = q.getAttribute('aria-expanded') === 'true';
  $$('.acc-q', this).forEach(function(o){
    if(o !== q){ o.setAttribute('aria-expanded','false');
      document.getElementById(o.getAttribute('aria-controls')).classList.remove('on'); }
  });
  q.setAttribute('aria-expanded', open ? 'false' : 'true');
  panel.classList.toggle('on', !open);
  if(window.ScrollTrigger) setTimeout(function(){ ScrollTrigger.refresh(); }, 520);
});

/* -- filter + sort -- */
var activeFilter = 'all';

function applyGrid(animate){
  var cards = $$('#prodGrid .card'), shown = 0;
  cards.forEach(function(c){
    var show = (activeFilter === 'all' || c.getAttribute('data-cat') === activeFilter);
    c.classList.toggle('off', !show);
    if(show){
      shown++;
      if(animate && window.gsap && !reduce){
        gsap.fromTo(c, {opacity:0, y:14}, {opacity:1, y:0, duration:.5, ease:'power2.out'});
      }
    }
  });
  $('#countNote').textContent = shown + (shown === 1 ? ' piece' : ' pieces');
  if(window.ScrollTrigger) ScrollTrigger.refresh();
}

function sortGrid(mode){
  var grid = $('#prodGrid');
  var cards = $$('.card', grid);
  cards.sort(function(a,b){
    var pa = +a.getAttribute('data-price'), pb = +b.getAttribute('data-price');
    if(mode === 'low') return pa - pb;
    if(mode === 'high') return pb - pa;
    return P.map(function(p){return p.id;}).indexOf(a.getAttribute('data-id')) -
           P.map(function(p){return p.id;}).indexOf(b.getAttribute('data-id'));
  });
  cards.forEach(function(c){ grid.appendChild(c); });
  applyGrid(true);
}

$('#tabs').addEventListener('click', function(e){
  var t = e.target.closest('.tab');
  if(!t) return;
  $$('.tab', this).forEach(function(x){ x.classList.remove('on'); x.setAttribute('aria-pressed','false'); });
  t.classList.add('on');
  t.setAttribute('aria-pressed','true');
  activeFilter = t.getAttribute('data-f');
  applyGrid(true);
});

$('#sortSel').addEventListener('change', function(){ sortGrid(this.value); });

/* jump from any nav/category link straight into a filtered grid */
function goToCategory(cat){
  activeFilter = cat;
  $$('#tabs .tab').forEach(function(t){
    var on = t.getAttribute('data-f') === cat;
    t.classList.toggle('on', on);
    t.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  applyGrid(true);
  layerClose();
  var target = $('#grid');
  if(window.__lenis) window.__lenis.scrollTo(target, {offset:-62, duration:1.2});
  else window.scrollTo({top: target.getBoundingClientRect().top + window.pageYOffset - 62, behavior:'smooth'});
}
document.addEventListener('click', function(e){
  var el = e.target.closest('[data-cat-link]');
  if(!el) return;
  e.preventDefault();
  goToCategory(el.getAttribute('data-cat-link'));
});

/* -- toast -- */
var toastEl = $('#toast'), toastT;
function toast(msg){
  toastEl.textContent = msg;
  toastEl.classList.add('on');
  clearTimeout(toastT);
  toastT = setTimeout(function(){ toastEl.classList.remove('on'); }, 2400);
}

/* -- cart: lines are keyed by product + size -- */
var FREE = SET.freeDeliveryOver;
var cart = [];
function findP(id){ for(var i=0;i<P.length;i++){ if(P[i].id===id) return P[i]; } return null; }

try{
  var saved = localStorage.getItem('ns_cart');
  if(saved){
    var parsed = JSON.parse(saved);
    if(Object.prototype.toString.call(parsed) === '[object Array]'){
      cart = parsed.filter(function(l){ return l && findP(l.id) && l.q > 0; });
    }
  }
}catch(e){ cart = []; }

function saveCart(){
  try{ localStorage.setItem('ns_cart', JSON.stringify(cart)); }catch(e){}
}
function sizeLabel(p, size){
  return p.cat === 'shoes' ? ('EU ' + size) : ('Size ' + size);
}

function renderCart(){
  var body = $('#cartBody'), n = 0, sub = 0;
  cart.forEach(function(l){ n += l.q; sub += l.q * findP(l.id).price; });

  if(!cart.length){
    body.innerHTML = '<div class="cart-empty">'+
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 7.5h13l-1.1 12H6.6z" stroke-linejoin="round"/><path d="M9 9.5V6.8a3 3 0 0 1 6 0v2.7" stroke-linecap="round"/></svg>'+
      '<p>Your bag is empty</p><span class="mono">Volume 04 is still live</span></div>';
  } else {
    body.innerHTML = cart.map(function(l,i){
      var p = findP(l.id);
      return '<div class="ci">'+
        '<div class="ci-media"><span class="swatch '+p.f+' f-weave"></span>'+garmentSVG(p.g, toneFor(p.f))+'</div>'+
        '<div class="ci-b"><h4>'+p.n+'</h4><span class="v">'+p.c+' · '+sizeLabel(p,l.s)+'</span>'+
          '<span class="p">'+tk(p.price * l.q)+'</span>'+
          '<span class="qty"><button data-q="-1" data-line="'+i+'" aria-label="Decrease quantity">−</button>'+
          '<span class="mono">'+l.q+'</span>'+
          '<button data-q="1" data-line="'+i+'" aria-label="Increase quantity">+</button></span>'+
        '</div></div>';
    }).join('');
  }

  $('#cartCount').textContent = n;
  $('#cartCount').classList.toggle('on', n > 0);
  $('#bagN').textContent = '(' + n + ')';
  $('#subTot').textContent = tk(sub);

  var pct = Math.min(100, (sub / FREE) * 100);
  $('#shipFill').style.width = pct + '%';
  $('#shipTxt').textContent = sub >= FREE
    ? 'Free delivery unlocked'
    : tk(FREE - sub) + ' away from free delivery';
  saveCart();
}
renderCart();

function addToCart(id, size, qty){
  var p = findP(id);
  if(!p) return;
  var found = null;
  cart.forEach(function(l){ if(l.id === id && l.s === size) found = l; });
  if(found){ found.q += (qty || 1); } else { cart.push({id:id, s:size, q:(qty || 1)}); }
  renderCart();
  toast(p.n + ' · ' + sizeLabel(p,size) + ' added');
  var badge = $('#cartCount');
  if(window.gsap && !reduce) gsap.fromTo(badge, {scale:.4}, {scale:1, duration:.5, ease:'back.out(3)'});
}

document.addEventListener('click', function(e){
  var q = e.target.closest('[data-q]');
  if(!q) return;
  var i = +q.getAttribute('data-line'), d = +q.getAttribute('data-q');
  if(!cart[i]) return;
  cart[i].q += d;
  if(cart[i].q < 1) cart.splice(i, 1);
  renderCart();
});

/* ============================================================
   CHECKOUT — writes a real order into the shared store, which is
   what the admin panel reads. No payment is captured here; a
   payment gateway needs a server.
   ============================================================ */
var coupon = null;

function orderTotals(){
  var sub = 0;
  cart.forEach(function(l){ sub += findP(l.id).price * l.q; });
  var area = ($('#coArea') && $('#coArea').value) || 'Dhaka';
  var discount = 0;
  if(coupon){
    if(coupon.type === 'pct')  discount = Math.round(sub * coupon.value / 100);
    if(coupon.type === 'flat') discount = Math.min(sub, coupon.value);
  }
  var delivery = NS.deliveryFor(sub - discount, area);
  if(coupon && coupon.type === 'ship') delivery = 0;
  return {sub:sub, discount:discount, delivery:delivery, total:sub - discount + delivery, area:area};
}

function renderCheckout(){
  var t = orderTotals();
  $('#coSummary').innerHTML =
    '<div class="co-row"><span>Subtotal</span><b>'+tk(t.sub)+'</b></div>'+
    (t.discount ? '<div class="co-row"><span>Discount ('+coupon.code+')</span><b>−'+tk(t.discount)+'</b></div>' : '')+
    '<div class="co-row"><span>Delivery</span><b>'+(t.delivery ? tk(t.delivery) : 'Free')+'</b></div>'+
    '<div class="co-row total"><span>Total</span><b>'+tk(t.total)+'</b></div>';
}

$('#checkoutBtn').addEventListener('click', function(){
  if(!cart.length){ toast('Your bag is empty'); return; }
  layerClose();
  setTimeout(function(){
    renderCheckout();
    $('#coDone').hidden = true;
    $('#coForm').hidden = false;
    layerOpen($('#checkout'), '#coName');
  }, 240);
});

['coArea'].forEach(function(id){
  var el = document.getElementById(id);
  if(el) el.addEventListener('change', renderCheckout);
});

$('#coApply').addEventListener('click', function(){
  var code = $('#coCode').value.trim().toUpperCase();
  var msg = $('#coCodeMsg');
  if(!code){ coupon = null; msg.textContent = ''; renderCheckout(); return; }
  var found = null;
  NS.data.coupons.forEach(function(c){ if(c.code === code && c.active) found = c; });
  var t = orderTotals();
  if(!found){ coupon = null; msg.className = 'co-msg bad'; msg.textContent = 'That code is not valid.'; }
  else if(t.sub < found.minOrder){
    coupon = null; msg.className = 'co-msg bad';
    msg.textContent = 'Needs a subtotal of ' + tk(found.minOrder) + '.';
  } else {
    coupon = found; msg.className = 'co-msg good'; msg.textContent = found.code + ' applied.';
  }
  renderCheckout();
});

$('#coForm').addEventListener('submit', function(e){
  e.preventDefault();
  var name = $('#coName').value.trim();
  var phone = $('#coPhone').value.trim();
  var address = $('#coAddr').value.trim();
  if(!name || !phone || !address) return;

  var t = orderTotals();
  var items = cart.map(function(l){
    var p = findP(l.id);
    return {id:p.id, name:p.n, sku:p.sku, size:l.s, qty:l.q, price:p.price, cost:p.cost};
  });

  var order = {
    id: NS.nextOrderId(),
    createdAt: Date.now(),
    customer:{name:name, phone:phone, address:address, area:t.area},
    items: items,
    subtotal:t.sub, discount:t.discount, delivery:t.delivery, total:t.total,
    payment: $('#coPay').value,
    status:'pending',
    note: $('#coNote').value.trim(),
    couponCode: coupon ? coupon.code : null,
    invoiceId: null
  };

  NS.data.orders.unshift(order);
  NS.commitStock(items);
  if(coupon){
    NS.data.coupons.forEach(function(c){ if(c.code === coupon.code) c.uses += 1; });
  }
  NS.save();

  cart = []; coupon = null;
  renderCart();

  $('#coForm').hidden = true;
  $('#coDone').hidden = false;
  $('#coOrderId').textContent = order.id;
  $('#coDoneTotal').textContent = tk(order.total);
  this.reset();
});

/* ============================================================
   PRODUCT DETAIL
   ============================================================ */
var pdpState = { id:null, size:null, colour:0 };

function pdpBlurb(p){
  var info = CAT_INFO[p.cat];
  var extra = (p.id === 'p10') ? ' This one runs narrow — take a half size up.' : '';
  return p.n + ' in ' + p.c.toLowerCase() + '. ' + info.fit + extra;
}
function stockLine(p){
  var left = NS.totalStock(p);
  if(left <= 0)  return '<b>Sold out</b> — this run has ended';
  if(left <= SET.lowStockAt) return '<b>Only ' + left + ' left</b> across all sizes';
  return left + ' of 200 remaining in this run';
}

function buildPDP(p){
  var info = CAT_INFO[p.cat];
  var fills = [p.f, p.f2];
  var fill = fills[pdpState.colour] || p.f;
  var was = p.was ? '<span class="old">'+tk(p.was)+'</span><span class="off">−'+Math.round((1-p.price/p.was)*100)+'%</span>' : '';

  var thumbs = fills.map(function(f,i){
    return '<button class="pdp-thumb" data-colour="'+i+'" aria-pressed="'+(i===pdpState.colour)+'" aria-label="View colourway '+(i+1)+'">'+
      '<span class="swatch '+f+' f-weave"></span>'+ garmentSVG(p.g, toneFor(f)) +'</button>';
  }).join('');

  var sizes = info.sizes.map(function(s){
    var left = NS.stockOf(p, s);
    return '<button class="size" data-size="'+s+'" aria-pressed="'+(pdpState.size===s)+'"'+
      (left <= 0 ? ' disabled aria-label="'+s+' sold out"' : '')+'>'+s+'</button>';
  }).join('');

  var swatches = p.dots.map(function(d,i){
    return '<button class="pdp-sw" data-colour="'+(i<2?i:0)+'" style="background:'+d+'" aria-pressed="'+(i===pdpState.colour)+'" aria-label="Colourway '+(i+1)+'"></button>';
  }).slice(0,2).join('');

  var table = '<table><thead><tr>'+info.measure[0].map(function(h){return '<th>'+h+'</th>';}).join('')+
    '</tr></thead><tbody>'+info.measure.slice(1).map(function(r){
      return '<tr>'+r.map(function(c){return '<td>'+c+'</td>';}).join('')+'</tr>';
    }).join('')+'</tbody></table>';

  var also = P.filter(function(x){ return x.cat === p.cat && x.id !== p.id; }).slice(0,4);

  return ''+
  '<div class="pdp-grid">'+
    '<div class="pdp-media">'+
      '<div class="pdp-shot"><span class="swatch '+fill+' f-weave"></span>'+ garmentSVG(p.g, toneFor(fill)) +'</div>'+
      '<div class="pdp-thumbs">'+thumbs+'</div>'+
    '</div>'+
    '<div class="pdp-body">'+
      '<p class="pdp-crumb">'+info.label+' / Volume 04</p>'+
      '<h2 class="pdp-name" id="pdpName">'+p.n+'</h2>'+
      '<div class="pdp-price"><span class="now">'+tk(p.price)+'</span>'+was+'</div>'+
      '<p class="pdp-stock">'+stockLine(p)+'</p>'+
      '<p class="pdp-blurb">'+pdpBlurb(p)+'</p>'+

      '<div class="opt-head"><span>Colour — <span class="val">'+p.c+'</span></span></div>'+
      '<div class="pdp-swatches">'+swatches+'</div>'+

      '<div class="opt-head"><span>Size'+(pdpState.size ? ' — <span class="val">'+pdpState.size+'</span>' : '')+'</span>'+
        '<button data-info="size">Size guide</button></div>'+
      '<div class="sizes" id="pdpSizes">'+sizes+'</div>'+

      '<div class="pdp-actions">'+
        '<button class="btn btn-solid" id="pdpAdd">Add to bag — '+tk(p.price)+' <span class="arrow">→</span></button>'+
      '</div>'+
      '<p class="pdp-note" id="pdpNote">Free delivery over Tk 1,999 · 9-day exchange · Cash on delivery</p>'+

      '<div class="acc pdp-acc" id="pdpAcc">'+
        '<div class="acc-i"><button class="acc-q" aria-expanded="true" aria-controls="pa1">Fabric &amp; construction<span class="pm"></span></button>'+
          '<div class="acc-p on" id="pa1"><div><p>'+info.fabric+'</p></div></div></div>'+
        '<div class="acc-i"><button class="acc-q" aria-expanded="false" aria-controls="pa2">Measurements<span class="pm"></span></button>'+
          '<div class="acc-p" id="pa2"><div>'+table+'</div></div></div>'+
        '<div class="acc-i"><button class="acc-q" aria-expanded="false" aria-controls="pa3">Care<span class="pm"></span></button>'+
          '<div class="acc-p" id="pa3"><div><p>'+info.care+'</p></div></div></div>'+
        '<div class="acc-i"><button class="acc-q" aria-expanded="false" aria-controls="pa4">Delivery &amp; exchange<span class="pm"></span></button>'+
          '<div class="acc-p" id="pa4"><div><p>Dispatched within 24 hours. Inside Dhaka delivery takes 48 hours, elsewhere 2 to 4 working days. Unworn pieces can be exchanged within 9 days with tags attached — the first exchange on an order is free.</p></div></div></div>'+
      '</div>'+
    '</div>'+
  '</div>'+
  (also.length ? '<div class="pdp-also"><h4>More from '+info.label.toLowerCase()+'</h4><div class="grid">'+also.map(cardHTML).join('')+'</div></div>' : '');
}

function openPDP(id){
  var p = findP(id);
  if(!p) return;
  pdpState = { id:id, size:null, colour:0 };
  $('#pdpInner').innerHTML = buildPDP(p);
  layerOpen($('#pdp'), '[data-close-overlay]');
  $('#pdpSheet').scrollTop = 0;
  if(window.gsap && !reduce){
    /* .pdp-actions is position-fixed on phones — animating it would shift the pinned CTA */
    gsap.from('#pdpInner .pdp-body > *:not(.pdp-actions)', {y:18, opacity:0, duration:.6, stagger:.04, ease:'power3.out', delay:.18});
  }
}

document.addEventListener('click', function(e){
  var open = e.target.closest('[data-open]');
  if(open){ e.preventDefault(); openPDP(open.getAttribute('data-open')); return; }

  var media = e.target.closest('.card-media');
  if(media && !e.target.closest('button')){
    var card = media.closest('.card');
    if(card){ openPDP(card.getAttribute('data-id')); }
  }
});

/* PDP internals */
$('#pdp').addEventListener('click', function(e){
  var p = findP(pdpState.id);
  if(!p) return;

  var sz = e.target.closest('.size');
  if(sz && !sz.disabled){
    pdpState.size = sz.getAttribute('data-size');
    $$('.size', this).forEach(function(b){ b.setAttribute('aria-pressed', b === sz ? 'true' : 'false'); });
    var head = $('#pdpSizes').previousElementSibling.querySelector('span');
    head.innerHTML = 'Size — <span class="val">'+pdpState.size+'</span>';
    $('#pdpSizes').classList.remove('needs');
    $('#pdpNote').classList.remove('warn');
    $('#pdpNote').textContent = 'Free delivery over Tk 1,999 · 9-day exchange · Cash on delivery';
    return;
  }

  var col = e.target.closest('[data-colour]');
  if(col){
    pdpState.colour = +col.getAttribute('data-colour');
    var fill = [p.f, p.f2][pdpState.colour] || p.f;
    var shot = $('.pdp-shot', this);
    shot.innerHTML = '<span class="swatch '+fill+' f-weave"></span>' + garmentSVG(p.g, toneFor(fill));
    $$('[data-colour]', this).forEach(function(b){
      b.setAttribute('aria-pressed', +b.getAttribute('data-colour') === pdpState.colour ? 'true' : 'false');
    });
    if(window.gsap && !reduce) gsap.from(shot, {opacity:.35, duration:.45, ease:'power2.out'});
    return;
  }

  var add = e.target.closest('#pdpAdd');
  if(add){
    if(!pdpState.size){
      var sizes = $('#pdpSizes');
      sizes.classList.add('needs');
      var note = $('#pdpNote');
      note.classList.add('warn');
      note.textContent = 'Choose a size first';
      /* on a phone the CTA is pinned to the bottom, so the size row
         may be off-screen when it is tapped — bring it into view */
      var box = sizes.getBoundingClientRect();
      if(box.top < 60 || box.bottom > window.innerHeight - 110){
        sizes.scrollIntoView({behavior:'smooth', block:'center'});
      }
      setTimeout(function(){ sizes.classList.remove('needs'); }, 420);
      return;
    }
    addToCart(pdpState.id, pdpState.size, 1);
    layerClose();
    setTimeout(function(){ layerOpen($('#cartDrawer')); }, 240);
    return;
  }

  var q = e.target.closest('.acc-q');
  if(q){
    var panel = document.getElementById(q.getAttribute('aria-controls'));
    var isOpen = q.getAttribute('aria-expanded') === 'true';
    q.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
    panel.classList.toggle('on', !isOpen);
  }
});

/* ============================================================
   SEARCH
   ============================================================ */
function searchRender(term){
  var q = term.trim().toLowerCase();
  var res = $('#searchRes');
  if(!q){
    res.innerHTML = '<div class="search-empty">Start typing to search 12 pieces</div>';
    return;
  }
  var hits = P.filter(function(p){
    return (p.n + ' ' + p.c + ' ' + CAT_INFO[p.cat].label).toLowerCase().indexOf(q) > -1;
  });
  if(!hits.length){
    res.innerHTML = '<div class="search-empty">Nothing matches “'+term+'”.<br>Try “tee”, “pant” or “sneaker”.</div>';
    return;
  }
  res.innerHTML = hits.map(function(p){
    return '<button class="sr" data-open="'+p.id+'">'+
      '<span class="sr-media"><span class="swatch '+p.f+' f-weave"></span>'+garmentSVG(p.g, toneFor(p.f))+'</span>'+
      '<span><b>'+p.n+'</b><span>'+CAT_INFO[p.cat].label+' · '+p.c+'</span></span>'+
      '<span class="p">'+tk(p.price)+'</span></button>';
  }).join('');
}

$('#searchBtn').addEventListener('click', function(){
  searchRender('');
  $('#searchInput').value = '';
  layerOpen($('#search'), '#searchInput');
});
$('#searchInput').addEventListener('input', function(){ searchRender(this.value); });
$('#searchSug').addEventListener('click', function(e){
  var b = e.target.closest('[data-q]');
  if(!b) return;
  $('#searchInput').value = b.getAttribute('data-q');
  searchRender(b.getAttribute('data-q'));
  $('#searchInput').focus();
});
document.addEventListener('keydown', function(e){
  if((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)){
    e.preventDefault();
    searchRender('');
    $('#searchInput').value = '';
    layerOpen($('#search'), '#searchInput');
  }
});

/* ============================================================
   INFO PANELS — policies, size guide, contact
   ============================================================ */
function guideTable(cat){
  var m = CAT_INFO[cat].measure;
  return '<h4>'+CAT_INFO[cat].label+'</h4><table><thead><tr>'+
    m[0].map(function(h){return '<th>'+h+'</th>';}).join('')+'</tr></thead><tbody>'+
    m.slice(1).map(function(r){ return '<tr>'+r.map(function(c){return '<td>'+c+'</td>';}).join('')+'</tr>'; }).join('')+
    '</tbody></table>';
}

var INFO = {
  size:{
    eyebrow:'Fit &amp; measurement',
    title:'Size guide',
    body:'<p>All garment measurements are taken flat and doubled where relevant. The most reliable method is to measure a piece you already own and match it to the table.</p>'+
      guideTable('tshirts') + guideTable('pants') + guideTable('shoes') +
      '<p>Still unsure? Send us your usual size in another brand on WhatsApp and we will tell you what to take.</p>'
  },
  shipping:{
    eyebrow:'Delivery',
    title:'Shipping policy',
    body:'<p>Orders placed before 4:00 PM are dispatched the same working day.</p>'+
      '<h4>Inside Dhaka</h4><p>Delivery within 48 hours, usually next day. Tk 80, or free on orders over Tk 1,999.</p>'+
      '<h4>Outside Dhaka</h4><p>2 to 4 working days depending on courier route. Tk 130, or free over Tk 1,999.</p>'+
      '<h4>Cash on delivery</h4><p>Available nationwide with no advance payment. You may open the parcel and check sizing before paying.</p>'
  },
  exchange:{
    eyebrow:'After your order',
    title:'Exchange &amp; returns',
    body:'<p>You have 9 days from delivery to exchange any unworn piece with its tags attached.</p>'+
      '<h4>How it works</h4><p>Message us on WhatsApp with your order number. We arrange the pickup, and the replacement ships the same day the original reaches us. The first exchange on an order is free; a second costs the courier fee.</p>'+
      '<h4>Not eligible</h4><p>Worn or washed pieces, anything without tags, and shoes returned without their box.</p>'+
      '<h4>Refunds</h4><p>If the piece arrived damaged or we sent the wrong item, we refund in full to bKash, Nagad or your card within 5 working days.</p>'
  },
  terms:{
    eyebrow:'Legal',
    title:'Terms of service',
    body:'<p>By placing an order you agree to the terms below.</p>'+
      '<h4>Pricing</h4><p>All prices are in Bangladeshi Taka and include VAT. Delivery is calculated at checkout.</p>'+
      '<h4>Stock</h4><p>Every colourway is produced in a run of 200 units and is not restocked. If an item sells out between your order and dispatch, we contact you within 24 hours and refund in full.</p>'+
      '<h4>Liability</h4><p>Our liability is limited to the value of the order. Nothing here affects your statutory consumer rights.</p>'
  },
  privacy:{
    eyebrow:'Legal',
    title:'Privacy policy',
    body:'<p>We collect only what is needed to deliver your order: name, phone number, delivery address and email.</p>'+
      '<h4>What we never do</h4><p>We do not sell customer data, and we do not share your number with anyone other than the courier handling your parcel.</p>'+
      '<h4>Payments</h4><p>Card and mobile-wallet details are handled by the payment provider. They never reach our servers.</p>'+
      '<h4>Your choices</h4><p>Ask us to delete your details at any time and we will do it within 7 days.</p>'
  },
  track:{
    eyebrow:'Order status',
    title:'Track your order',
    body:'<p>Every dispatch triggers an SMS with your courier tracking number. If you have not received it, send your order number to WhatsApp on +880 1700 000 000 and we will check the status for you.</p>'+
      '<h4>Typical timeline</h4><p>Order confirmed within 2 hours · dispatched same or next working day · delivered in 48 hours inside Dhaka, 2 to 4 days elsewhere.</p>'
  },
  stockists:{
    eyebrow:'Where to find us',
    title:'Studio &amp; stockists',
    body:'<p>We sell direct only — there are no resellers, and anything sold as Never Settle elsewhere is not ours.</p>'+
      '<h4>Studio</h4><p>Road 11, Banani, Dhaka 1213. Open 11:00 to 20:00, Saturday through Thursday. Come to try sizes; orders ship to your address.</p>'
  },
  careers:{
    eyebrow:'Join us',
    title:'Careers',
    body:'<p>We are a small team and hire rarely, but we always read what comes in.</p>'+
      '<h4>Currently open</h4><p>Production assistant (Dhaka, full time) and part-time studio host for weekends.</p>'+
      '<h4>How to apply</h4><p>Email hello@neversettle.store with what you have made before. No cover letter needed.</p>'
  },
  press:{
    eyebrow:'Media',
    title:'Press',
    body:'<p>For interviews, product samples or high-resolution imagery, email hello@neversettle.store with your outlet and deadline. We usually reply within a working day.</p>'
  },
  fabric:{
    eyebrow:'How it is made',
    title:'Our fabric',
    body:'<p>Three fabrics carry the whole range, chosen because they survive this climate.</p>'+
      '<h4>240 GSM combed cotton</h4><p>Every tee. Combed to remove short fibres, so it pills far less than the ring-spun jersey most local brands use.</p>'+
      '<h4>Cotton twill with 2% elastane</h4><p>Every pant. Enough stretch to move in, enough weight to hold a crease.</p>'+
      '<h4>Full-grain leather and knit mesh</h4><p>Our shoes. Cemented and stitched soles, never glued alone — a glued sole fails in one wet season here.</p>'
  },
  account:{
    eyebrow:'Account',
    title:'Sign in',
    body:'<p>Accounts are not open yet. Orders are placed as a guest with your phone number, and order updates arrive by SMS.</p>'+
      '<h4>Want your order history?</h4><p>Message us on WhatsApp with your number and we will send everything you have bought from us.</p>'
  }
};

function openInfo(key){
  var d = INFO[key];
  if(!d) return;
  $('#infoInner').innerHTML = '<p class="eyebrow">'+d.eyebrow+'</p><h3 id="infoTitle">'+d.title+'</h3>'+d.body;
  layerOpen($('#info'), '[data-close-overlay]');
}
document.addEventListener('click', function(e){
  var el = e.target.closest('[data-info]');
  if(!el) return;
  e.preventDefault();
  openInfo(el.getAttribute('data-info'));
});

$('#newsForm').addEventListener('submit', function(e){
  e.preventDefault();
  var v = $('#newsEmail').value.trim();
  if(!v) return;
  $('#newsMsg').textContent = "You're on the Thursday list.";
  this.reset();
});

/* ============================================================
   5. MOTION — Lenis + GSAP ScrollTrigger
   ============================================================ */
var hasGSAP = !!(window.gsap && window.ScrollTrigger);

if(hasGSAP) gsap.registerPlugin(ScrollTrigger);

/* -- smooth scroll -- */
var lenis = null;
if(window.Lenis && !reduce){
  lenis = new Lenis({
    lerp:0.085,
    wheelMultiplier:1,
    smoothWheel:true,
    touchMultiplier:1.6
  });
  window.__lenis = lenis;
  if(hasGSAP){
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function(t){ lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  } else {
    (function raf(t){ lenis.raf(t); requestAnimationFrame(raf); })(0);
  }
} else {
  document.documentElement.style.scrollBehavior = 'smooth';
}

/* -- anchor links through Lenis -- */
document.addEventListener('click', function(e){
  var a = e.target.closest('a[href^="#"]');
  if(!a) return;
  /* links that open a panel or filter the grid handle their own behaviour */
  if(a.hasAttribute('data-open') || a.hasAttribute('data-info') || a.hasAttribute('data-cat-link')) return;
  var id = a.getAttribute('href');
  if(id.length < 2) return;
  var target = document.querySelector(id);
  if(!target) return;
  e.preventDefault();
  if(openDrawer) drawerClose();
  var offset = -62;
  if(lenis){ lenis.scrollTo(target, {offset:offset, duration:1.25}); }
  else { window.scrollTo({top: target.getBoundingClientRect().top + window.pageYOffset + offset, behavior:'smooth'}); }
});

/* -- header hide on scroll down -- */
(function(){
  var header = $('#header'), last = 0;
  window.addEventListener('scroll', function(){
    var y = window.pageYOffset;
    if(y > 240 && y > last + 4) header.classList.add('is-hidden');
    else if(y < last - 4 || y < 240) header.classList.remove('is-hidden');
    last = y;
  }, {passive:true});
})();

if(hasGSAP && !reduce){

  /* ---------- word-split for the manifesto ---------- */
  (function(){
    var el = $('#mani');
    var walk = function(node){
      Array.prototype.slice.call(node.childNodes).forEach(function(child){
        if(child.nodeType === 3){
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function(part){
            if(!part.trim()){ frag.appendChild(document.createTextNode(part)); return; }
            var s = document.createElement('span');
            s.className = 'w';
            s.textContent = part;
            frag.appendChild(s);
          });
          node.replaceChild(frag, child);
        } else if(child.nodeType === 1){
          walk(child);
        }
      });
    };
    walk(el);
  })();

  /* ---------- hero entrance ---------- */
  var tl = gsap.timeline({ defaults:{ ease:'power3.out' } });
  tl.from('[data-hero-line]', {yPercent:112, duration:1.15, ease:'expo.out', stagger:.09})
    .from('[data-hero="2"]', {y:20, opacity:0, duration:.8}, '-=.72')
    .from('[data-hero="3"]', {y:22, opacity:0, duration:.8, stagger:.1}, '-=.62');

  /* counters */
  $$('[data-count]').forEach(function(el){
    var end = parseFloat(el.getAttribute('data-count'));
    var obj = {v:0};
    gsap.to(obj, {
      v:end, duration:1.5, ease:'power2.out', delay:.7,
      onUpdate:function(){ el.textContent = Math.round(obj.v); }
    });
  });

  /* ---------- hero parallax (desktop only — scrubbed effects are the
     main battery and jank cost on a phone) ---------- */
  var mmDesk = gsap.matchMedia();
  mmDesk.add('(min-width: 900px)', function(){
    gsap.to('#heroBg', {
      yPercent:16, ease:'none',
      scrollTrigger:{ trigger:'.hero', start:'top top', end:'bottom top', scrub:true }
    });
    gsap.to('.hero-title', {
      yPercent:-11, opacity:.35, ease:'none',
      scrollTrigger:{ trigger:'.hero', start:'top top', end:'bottom top', scrub:.6 }
    });
  });

  /* ---------- generic reveals ---------- */
  $$('.js-reveal').forEach(function(el){
    gsap.from(el, {
      y:34, opacity:0, duration:.95, ease:'power3.out',
      scrollTrigger:{ trigger:el, start:'top 88%', once:true }
    });
  });

  /* ---------- product card stagger ---------- */
  gsap.from('#prodGrid .card', {
    y:46, opacity:0, duration:.9, ease:'power3.out', stagger:{each:.055, from:'start'},
    scrollTrigger:{ trigger:'#prodGrid', start:'top 82%', once:true }
  });

  /* ---------- category parallax (desktop only) ---------- */
  mmDesk.add('(min-width: 900px)', function(){
    var tweens = $$('.cat').map(function(cat){
      return gsap.fromTo(cat.querySelector('.cat-bg'),
        {yPercent:-9},
        {yPercent:9, ease:'none',
         scrollTrigger:{ trigger:cat, start:'top bottom', end:'bottom top', scrub:.8 }}
      );
    });
    return function(){
      tweens.forEach(function(t){ if(t.scrollTrigger) t.scrollTrigger.kill(); });
      gsap.set('.cat-bg', {clearProps:'transform'});
    };
  });

  /* ---------- manifesto scrub ---------- */
  (function(){
    var words = $$('#mani .w');
    if(!words.length) return;
    ScrollTrigger.create({
      trigger:'#mani',
      start:'top 78%',
      end:'bottom 60%',
      scrub:.5,
      onUpdate:function(self){
        var cut = Math.round(self.progress * words.length);
        words.forEach(function(w,i){ w.classList.toggle('hot', i < cut); });
      },
      onLeave:function(){ words.forEach(function(w){ w.classList.add('hot'); }); },
      onLeaveBack:function(){ words.forEach(function(w){ w.classList.remove('hot'); }); }
    });
  })();

  /* ---------- pinned horizontal drop rail ---------- */
  var mm = gsap.matchMedia();
  mm.add('(min-width: 900px)', function(){
    var track = $('#railTrack'), vp = $('#railVp'), bar = $('#railBar');
    var getDist = function(){
      return Math.max(0, track.scrollWidth - vp.clientWidth);
    };
    var st = gsap.to(track, {
      x: function(){ return -getDist(); },
      ease:'none',
      scrollTrigger:{
        trigger:'.rail-sec',
        start:'top top',
        end:function(){ return '+=' + (getDist() + window.innerHeight * 0.35); },
        pin:true,
        scrub:.8,
        anticipatePin:1,
        invalidateOnRefresh:true,
        onUpdate:function(self){
          bar.style.width = (8 + self.progress * 92) + '%';
        }
      }
    });
    return function(){ st.scrollTrigger && st.scrollTrigger.kill(); gsap.set(track,{x:0}); };
  });

  /* ---------- magnetic buttons (pointer: fine only) ---------- */
  if(window.matchMedia('(pointer: fine)').matches){
    $$('.magnetic').forEach(function(btn){
      var xTo = gsap.quickTo(btn, 'x', {duration:.5, ease:'power3'});
      var yTo = gsap.quickTo(btn, 'y', {duration:.5, ease:'power3'});
      btn.addEventListener('mousemove', function(e){
        var r = btn.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width/2)) * .28);
        yTo((e.clientY - (r.top + r.height/2)) * .38);
      });
      btn.addEventListener('mouseleave', function(){ xTo(0); yTo(0); });
    });
  }

  /* ---------- refresh after fonts settle ---------- */
  if(document.fonts && document.fonts.ready){
    document.fonts.ready.then(function(){ ScrollTrigger.refresh(); });
  }
  window.addEventListener('load', function(){ ScrollTrigger.refresh(); });
}

})();
