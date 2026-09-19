/* ============================================================
   NEVER SETTLE — admin panel
   Reads and writes the shared store in assets/js/data.js.
   ============================================================ */
(function(){
"use strict";

var $  = function(s,c){ return (c||document).querySelector(s); };
var $$ = function(s,c){ return Array.prototype.slice.call((c||document).querySelectorAll(s)); };
var esc = function(s){
  return String(s == null ? '' : s).replace(/[&<>"']/g, function(m){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];
  });
};
var money = function(v){ return NS.money(v); };
var D = function(ts){
  return new Date(ts).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
};
var DT = function(ts){
  return new Date(ts).toLocaleString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
};

/* ------------------------------------------------------------
   Passcode gate — browser-side only, and clearly labelled as such
   ------------------------------------------------------------ */
var PASS = 'admin';
function unlock(){
  $('#gate').hidden = true;
  $('#shell').hidden = false;
  try{ sessionStorage.setItem('ns_admin', '1'); }catch(e){}
  route();
}
try{ if(sessionStorage.getItem('ns_admin') === '1') unlock(); }catch(e){}

$('#gateForm').addEventListener('submit', function(e){
  e.preventDefault();
  if($('#gatePass').value === PASS){ unlock(); }
  else { $('#gateMsg').textContent = 'Wrong passcode.'; $('#gatePass').select(); }
});
$('#lockBtn').addEventListener('click', function(e){
  e.preventDefault();
  try{ sessionStorage.removeItem('ns_admin'); }catch(err){}
  location.reload();
});

/* ------------------------------------------------------------
   Chrome: toast, modal, mobile rail
   ------------------------------------------------------------ */
var toastT;
function toast(msg, bad){
  var t = $('#toast');
  t.textContent = msg;
  t.className = 'toast on' + (bad ? ' bad' : '');
  clearTimeout(toastT);
  toastT = setTimeout(function(){ t.className = 'toast' + (bad ? ' bad' : ''); }, 2600);
}

var modalOnSave = null;
function openModal(opts){
  $('#modalTitle').textContent = opts.title;
  $('#modalSub').textContent = opts.sub || '';
  $('#modalBody').innerHTML = opts.body;
  $('#modalFoot').innerHTML = opts.foot || '';
  $('#modalSheet').classList.toggle('wide', !!opts.wide);
  $('#modal').classList.add('on');
  $('#scrim').classList.add('on');
  document.body.style.overflow = 'hidden';
  modalOnSave = opts.onSave || null;
  if(opts.after) opts.after();
  var f = $('#modalBody input,#modalBody select,#modalBody textarea');
  if(f) setTimeout(function(){ try{ f.focus(); }catch(e){} }, 80);
}
function closeModal(){
  $('#modal').classList.remove('on');
  $('#scrim').classList.remove('on');
  document.body.style.overflow = '';
  modalOnSave = null;
}
$('#modalX').addEventListener('click', closeModal);
$('#scrim').addEventListener('click', function(){ closeModal(); closeRail(); });
document.addEventListener('keydown', function(e){ if(e.key === 'Escape'){ closeModal(); closeRail(); } });
document.addEventListener('click', function(e){
  if(e.target.closest('[data-modal-close]')) closeModal();
  var save = e.target.closest('[data-modal-save]');
  if(save && modalOnSave) modalOnSave();
});

function openRail(){ $('#rail').classList.add('on'); $('#scrim').classList.add('on'); }
function closeRail(){ $('#rail').classList.remove('on'); }
$('#railBtn').addEventListener('click', openRail);

/* ------------------------------------------------------------
   Confirm dialog — never delete on a single click
   ------------------------------------------------------------ */
function confirmAction(title, msg, label, fn){
  openModal({
    title:title,
    body:'<p style="margin:0;color:var(--fg-2)">'+esc(msg)+'</p>',
    foot:'<button class="btn" data-modal-close>Cancel</button>'+
         '<button class="btn btn-danger" data-modal-save>'+esc(label)+'</button>',
    onSave:function(){ fn(); closeModal(); }
  });
}

/* ============================================================
   DASHBOARD
   ============================================================ */
function revenueSeries(days){
  var out = [], now = new Date();
  now.setHours(23,59,59,999);
  for(var i = days - 1; i >= 0; i--){
    var end = new Date(now.getTime() - i * 86400000);
    var start = new Date(end); start.setHours(0,0,0,0);
    var total = 0;
    NS.data.orders.forEach(function(o){
      if(o.status === 'cancelled') return;
      if(o.createdAt >= start.getTime() && o.createdAt <= end.getTime()) total += o.total;
    });
    out.push({date:start, value:total});
  }
  return out;
}

/* Bars: discrete daily buckets, one series, one hue.
   Grid lines are labelled with values the chart actually reaches. */
function barChart(series){
  var max = Math.max.apply(null, series.map(function(d){ return d.value; }));
  if(max <= 0) max = 1;
  var step = Math.pow(10, Math.floor(Math.log(max) / Math.LN10));
  var top = Math.ceil(max / step) * step;
  var lines = [0, top / 2, top];

  var grid = lines.map(function(v){
    var pct = 100 - (v / top) * 100;
    return '<div class="grid-l" style="top:'+pct.toFixed(1)+'%"><span>'+
      (v >= 1000 ? (v/1000).toFixed(v % 1000 ? 1 : 0)+'k' : v)+'</span></div>';
  }).join('');

  var bars = series.map(function(d,i){
    var h = (d.value / top) * 100;
    return '<div class="bar-col'+(d.value ? '' : ' zero')+'" data-i="'+i+
      '" data-v="'+d.value+'" data-d="'+D(d.date.getTime())+'">'+
      '<div class="bar" style="height:'+Math.max(h,0.8).toFixed(1)+'%"></div></div>';
  }).join('');

  var MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var axis = series.map(function(d){
    return '<span>'+d.date.getDate()+' '+MON[d.date.getMonth()]+'</span>';
  }).join('');

  return '<div class="chart"><div class="plot" id="plot">'+grid+
    '<div class="bars">'+bars+'</div><div class="tip" id="tip"></div></div>'+
    '<div class="x-axis">'+axis+'</div></div>';
}

function wireChart(){
  var plot = $('#plot'); if(!plot) return;
  var tip = $('#tip');
  plot.addEventListener('mousemove', function(e){
    var col = e.target.closest('.bar-col');
    if(!col){ tip.classList.remove('on'); return; }
    tip.innerHTML = '<b>'+money(+col.getAttribute('data-v'))+'</b><span>'+col.getAttribute('data-d')+'</span>';
    var r = col.getBoundingClientRect(), pr = plot.getBoundingClientRect();
    tip.style.left = (r.left - pr.left + r.width / 2) + 'px';
    tip.style.top  = (r.top - pr.top) + 'px';
    tip.classList.add('on');
  });
  plot.addEventListener('mouseleave', function(){ tip.classList.remove('on'); });
}

function viewDashboard(){
  var orders = NS.data.orders;
  var live = orders.filter(function(o){ return o.status !== 'cancelled'; });
  var revenue = live.reduce(function(a,o){ return a + o.total; }, 0);
  var units = live.reduce(function(a,o){
    return a + o.items.reduce(function(s,l){ return s + l.qty; }, 0); }, 0);
  var aov = live.length ? revenue / live.length : 0;
  var pending = orders.filter(function(o){ return o.status === 'pending'; }).length;

  var cutoff = Date.now() - 7 * 86400000;
  var last7 = live.filter(function(o){ return o.createdAt >= cutoff; });
  var prev7 = live.filter(function(o){ return o.createdAt >= cutoff - 7*86400000 && o.createdAt < cutoff; });
  var r7 = last7.reduce(function(a,o){ return a+o.total; },0);
  var rp = prev7.reduce(function(a,o){ return a+o.total; },0);
  var delta = rp ? Math.round((r7 - rp) / rp * 100) : 0;

  /* cost is tracked per line, so margin is real rather than assumed */
  var cogs = live.reduce(function(a,o){
    return a + o.items.reduce(function(s,l){ return s + (l.cost || 0) * l.qty; }, 0); }, 0);
  var margin = revenue ? Math.round((revenue - cogs) / revenue * 100) : 0;

  var low = [];
  NS.data.products.forEach(function(p){
    NS.CAT_INFO[p.cat].sizes.forEach(function(s){
      var q = NS.stockOf(p, s);
      if(q <= NS.data.settings.lowStockAt) low.push({p:p, size:s, q:q});
    });
  });
  low.sort(function(a,b){ return a.q - b.q; });

  var sold = {};
  live.forEach(function(o){ o.items.forEach(function(l){
    sold[l.id] = (sold[l.id] || 0) + l.qty * l.price;
  }); });
  var top = Object.keys(sold).map(function(id){
    var p = NS.product(id);
    return {name:p ? p.n : id, value:sold[id]};
  }).sort(function(a,b){ return b.value - a.value; }).slice(0,5);
  var topMax = top.length ? top[0].value : 1;

  return {
    title:'Dashboard', sub:'Store overview',
    actions:'<a class="btn" href="index.html" target="_blank" rel="noopener">Open storefront</a>',
    html:
    '<div class="kpis">'+
      kpi('Revenue', money(revenue), (delta >= 0 ? 'up' : 'down'),
          (delta >= 0 ? '▲ ' : '▼ ') + Math.abs(delta) + '% vs prior 7 days') +
      kpi('Orders', live.length, '', pending + ' awaiting confirmation') +
      kpi('Average order', money(aov), '', units + ' units sold') +
      kpi('Gross margin', margin + '%', '', 'After ' + money(cogs) + ' cost of goods') +
    '</div>'+

    '<div class="two">'+
      '<section class="card"><div class="card-h"><div>'+
        '<h2>Revenue, last 14 days</h2><p class="sub">Cancelled orders excluded</p></div>'+
        '<div class="right"><span class="mono" style="font-size:18px;font-weight:600">'+money(r7)+'</span>'+
        '<span style="font-size:12px;color:var(--fg-3)">last 7 days</span></div></div>'+
        '<div class="card-b">'+barChart(revenueSeries(14))+'</div></section>'+

      '<section class="card"><div class="card-h"><div><h2>Top sellers</h2>'+
        '<p class="sub">By revenue</p></div></div><div class="card-b">'+
        (top.length ? '<div class="rank">'+top.map(function(t){
          return '<div class="rank-row"><span class="n">'+esc(t.name)+'</span>'+
                 '<span class="v">'+money(t.value)+'</span>'+
                 '<span class="rank-bar"><i style="width:'+((t.value/topMax)*100).toFixed(1)+'%"></i></span></div>';
        }).join('')+'</div>' : emptyState('No sales yet','Orders will appear here')) +
      '</div></section>'+
    '</div>'+

    '<div class="two" style="margin-top:16px">'+
      '<section class="card"><div class="card-h"><div><h2>Recent orders</h2></div>'+
        '<div class="right"><a class="btn btn-sm" href="#/orders">All orders</a></div></div>'+
        '<div class="card-b flush"><div class="tbl-wrap"><table class="tbl"><thead><tr>'+
        '<th>Order</th><th>Customer</th><th>Status</th><th class="num">Total</th></tr></thead><tbody>'+
        orders.slice(0,6).map(function(o){
          return '<tr class="clickable" data-order="'+o.id+'">'+
            '<td class="mono">'+esc(o.id)+'<br><span style="color:var(--fg-3);font-size:11px">'+DT(o.createdAt)+'</span></td>'+
            '<td>'+esc(o.customer.name)+'<br><span style="color:var(--fg-3);font-size:11.5px">'+esc(o.customer.area)+'</span></td>'+
            '<td><span class="pill '+o.status+'">'+o.status+'</span></td>'+
            '<td class="num">'+money(o.total)+'</td></tr>';
        }).join('')+
        '</tbody></table></div></div></section>'+

      '<section class="card"><div class="card-h"><div><h2>Low stock</h2>'+
        '<p class="sub">At or below '+NS.data.settings.lowStockAt+' units</p></div>'+
        '<div class="right"><a class="btn btn-sm" href="#/inventory">Inventory</a></div></div>'+
        '<div class="card-b flush">'+
        (low.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr>'+
          '<th>Product</th><th>Size</th><th class="num">Left</th></tr></thead><tbody>'+
          low.slice(0,7).map(function(r){
            return '<tr><td><div class="prod-cell">'+NS.thumb(r.p,'thumb-sm')+
              '<span><b>'+esc(r.p.n)+'</b><span>'+esc(r.p.sku)+'</span></span></div></td>'+
              '<td class="mono">'+esc(r.size)+'</td>'+
              '<td class="num"><span class="pill '+(r.q === 0 ? 'out' : 'low')+'">'+
              (r.q === 0 ? 'Out' : r.q + ' left')+'</span></td></tr>';
          }).join('')+'</tbody></table></div>'
        : emptyState('Everything is stocked','No size is below the threshold'))+
      '</div></section>'+
    '</div>',
    after:wireChart
  };
}

function kpi(label, value, dir, detail){
  return '<div class="kpi"><span class="l">'+esc(label)+'</span>'+
    '<span class="v">'+esc(value)+'</span>'+
    (detail ? '<span class="d '+(dir||'')+'">'+esc(detail)+'</span>' : '')+'</div>';
}
function emptyState(title, sub){
  return '<div class="empty"><svg viewBox="0 0 24 24"><path d="M4 7.5 12 3.5l8 4v9l-8 4-8-4z" stroke-linejoin="round"/>'+
    '<path d="m4 7.5 8 4 8-4M12 11.5v9" stroke-linejoin="round"/></svg>'+
    '<p>'+esc(title)+'</p><span style="font-size:12.5px">'+esc(sub)+'</span></div>';
}

/* ============================================================
   ORDERS
   ============================================================ */
var orderFilter = {status:'all', q:''};

function viewOrders(){
  var rows = NS.data.orders.filter(function(o){
    if(orderFilter.status !== 'all' && o.status !== orderFilter.status) return false;
    if(orderFilter.q){
      var hay = (o.id + ' ' + o.customer.name + ' ' + o.customer.phone + ' ' + o.customer.area).toLowerCase();
      if(hay.indexOf(orderFilter.q.toLowerCase()) < 0) return false;
    }
    return true;
  });

  var counts = {all:NS.data.orders.length};
  NS.ORDER_STATES.forEach(function(s){
    counts[s] = NS.data.orders.filter(function(o){ return o.status === s; }).length;
  });

  var seg = ['all'].concat(NS.ORDER_STATES).map(function(s){
    return '<button data-ostatus="'+s+'"'+(orderFilter.status === s ? ' class="on"' : '')+'>'+
      (s === 'all' ? 'All' : s.charAt(0).toUpperCase()+s.slice(1))+' ('+counts[s]+')</button>';
  }).join('');

  return {
    title:'Orders', sub:NS.data.orders.length + ' orders in total',
    actions:'<button class="btn" id="exportOrders">Export CSV</button>',
    html:
    '<section class="card"><div class="card-h">'+
      '<div class="filters"><div class="seg">'+seg+'</div></div>'+
      '<div class="right"><span class="search-inp">'+
        '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5" stroke-linecap="round"/></svg>'+
        '<input class="inp" id="orderSearch" type="search" placeholder="Order, name or phone" value="'+esc(orderFilter.q)+'">'+
      '</span></div></div>'+
      '<div class="card-b flush">'+
      (rows.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr>'+
        '<th>Order</th><th>Placed</th><th>Customer</th><th>Items</th><th>Payment</th>'+
        '<th>Status</th><th class="num">Total</th><th></th></tr></thead><tbody>'+
        rows.map(function(o){
          var n = o.items.reduce(function(a,l){ return a + l.qty; }, 0);
          return '<tr class="clickable" data-order="'+o.id+'">'+
            '<td class="mono">'+esc(o.id)+(o.sample ? ' <span class="pill draft" style="font-size:10px">sample</span>' : '')+'</td>'+
            '<td style="color:var(--fg-2);font-size:12.5px">'+DT(o.createdAt)+'</td>'+
            '<td>'+esc(o.customer.name)+'<br><span class="mono" style="color:var(--fg-3);font-size:11px">'+esc(o.customer.phone)+'</span></td>'+
            '<td class="num">'+n+'</td>'+
            '<td style="text-transform:uppercase;font-size:11.5px;color:var(--fg-2)">'+esc(o.payment)+'</td>'+
            '<td><span class="pill '+o.status+'">'+o.status+'</span></td>'+
            '<td class="num">'+money(o.total)+'</td>'+
            '<td class="acts"><button data-order="'+o.id+'">Open</button></td></tr>';
        }).join('')+'</tbody></table></div>'
      : emptyState('No orders match','Try another filter or search'))+
      '</div></section>'
  };
}

function openOrder(id){
  var o = null;
  NS.data.orders.forEach(function(x){ if(x.id === id) o = x; });
  if(!o) return;

  var lines = o.items.map(function(l){
    var p = NS.product(l.id);
    return '<div class="od-line">'+(p ? NS.thumb(p,'thumb-sm') : '')+
      '<span class="g"><b>'+esc(l.name)+'</b><span>'+esc(l.sku || '')+' · size '+esc(l.size)+' · ×'+l.qty+'</span></span>'+
      '<span class="mono">'+money(l.price * l.qty)+'</span></div>';
  }).join('');

  var steps = NS.ORDER_STATES.map(function(s){
    return '<button data-setstatus="'+s+'"'+(o.status === s ? ' class="on"' : '')+'>'+
      s.charAt(0).toUpperCase()+s.slice(1)+'</button>';
  }).join('');

  openModal({
    title:'Order ' + o.id,
    sub:DT(o.createdAt) + ' · ' + o.customer.area,
    wide:true,
    body:
      '<div class="od-grid">'+
        '<div>'+
          '<div class="od-box" style="background:var(--panel);border:0;padding:0">'+lines+'</div>'+
          '<div style="margin-top:16px;max-width:320px;margin-left:auto">'+
            '<div class="od-tot"><span>Subtotal</span><b>'+money(o.subtotal)+'</b></div>'+
            (o.discount ? '<div class="od-tot"><span>Discount'+(o.couponCode ? ' ('+esc(o.couponCode)+')' : '')+'</span><b>−'+money(o.discount)+'</b></div>' : '')+
            '<div class="od-tot"><span>Delivery</span><b>'+(o.delivery ? money(o.delivery) : 'Free')+'</b></div>'+
            '<div class="od-tot grand"><span>Total</span><b>'+money(o.total)+'</b></div>'+
          '</div>'+
        '</div>'+
        '<div class="stack">'+
          '<div class="od-box"><h4>Customer</h4>'+
            '<p><b>'+esc(o.customer.name)+'</b></p>'+
            '<p class="mono" style="font-size:12.5px">'+esc(o.customer.phone)+'</p>'+
            '<p class="mut">'+esc(o.customer.address)+'</p>'+
            '<p class="mut">'+esc(o.customer.area)+'</p>'+
            (o.note ? '<p class="mut" style="margin-top:8px">Note: '+esc(o.note)+'</p>' : '')+
          '</div>'+
          '<div class="od-box"><h4>Payment</h4>'+
            '<p style="text-transform:uppercase">'+esc(o.payment)+'</p>'+
            '<p class="mut">'+(o.payment === 'cod' ? 'Collect on delivery' : 'Confirm the transaction before dispatch')+'</p>'+
          '</div>'+
          '<div class="od-box"><h4>Status</h4><div class="steps">'+steps+'</div></div>'+
          '<div class="od-box"><h4>Invoice</h4>'+
            (o.invoiceId
              ? '<p class="mono">'+esc(o.invoiceId)+'</p><button class="btn btn-sm" style="margin-top:8px" data-openinv="'+esc(o.invoiceId)+'">View invoice</button>'
              : '<p class="mut">Not created yet</p><button class="btn btn-sm btn-pri" style="margin-top:8px" data-makeinv="'+esc(o.id)+'">Create invoice</button>')+
          '</div>'+
        '</div>'+
      '</div>',
    foot:'<button class="btn btn-danger" data-delorder="'+esc(o.id)+'">Delete order</button>'+
         '<button class="btn" data-modal-close>Close</button>'
  });
}

/* ============================================================
   PRODUCTS
   ============================================================ */
function viewProducts(){
  var p = NS.data.products;
  return {
    title:'Products', sub:p.length + ' products in the catalogue',
    actions:'<button class="btn btn-pri" id="addProduct">'+
      '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>New product</button>',
    html:'<section class="card"><div class="card-b flush"><div class="tbl-wrap">'+
      '<table class="tbl"><thead><tr><th>Product</th><th>Category</th><th class="num">Price</th>'+
      '<th class="num">Cost</th><th class="num">Margin</th><th class="num">Stock</th><th>Status</th><th></th>'+
      '</tr></thead><tbody>'+
      p.map(function(x){
        var stock = NS.totalStock(x);
        var m = x.price ? Math.round((x.price - (x.cost||0)) / x.price * 100) : 0;
        return '<tr><td><div class="prod-cell">'+NS.thumb(x)+
          '<span><b>'+esc(x.n)+'</b><span>'+esc(x.sku)+' · '+esc(x.c)+'</span></span></div></td>'+
          '<td>'+esc(NS.CAT_INFO[x.cat].label)+'</td>'+
          '<td class="num">'+money(x.price)+(x.was ? '<br><span style="color:var(--fg-3);font-size:11px;text-decoration:line-through">'+money(x.was)+'</span>' : '')+'</td>'+
          '<td class="num" style="color:var(--fg-2)">'+money(x.cost||0)+'</td>'+
          '<td class="num">'+m+'%</td>'+
          '<td class="num"><span class="pill '+(stock === 0 ? 'out' : stock <= NS.data.settings.lowStockAt ? 'low' : 'ok')+'">'+stock+'</span></td>'+
          '<td><span class="pill '+x.status+'">'+x.status+'</span></td>'+
          '<td class="acts"><button data-editprod="'+x.id+'">Edit</button>'+
          '<button class="del" data-delprod="'+x.id+'">Delete</button></td></tr>';
      }).join('')+
      '</tbody></table></div></div></section>'
  };
}

function productForm(prod){
  var isNew = !prod;
  var p = prod || {
    id:'p' + Date.now(), sku:'NS-', n:'', c:'', f:'f-bone', f2:'f-sand', g:'tee',
    price:0, was:0, cost:0, cat:'tshirts', tag:'', status:'draft',
    dots:['#E7E0D2','#141414','#5D6848'], stock:{}
  };
  var sizes = NS.CAT_INFO[p.cat].sizes;

  openModal({
    title:isNew ? 'New product' : 'Edit product',
    sub:isNew ? 'Added as a draft until you set it active' : p.sku,
    wide:true,
    body:
      '<div class="form-grid">'+
        '<div class="f wide"><label for="fName">Product name</label>'+
          '<input id="fName" value="'+esc(p.n)+'" placeholder="Boxy Heavyweight Tee"></div>'+
        '<div class="f"><label for="fSku">SKU</label><input id="fSku" value="'+esc(p.sku)+'"></div>'+
        '<div class="f"><label for="fCat">Category</label><select id="fCat">'+
          Object.keys(NS.CAT_INFO).map(function(k){
            return '<option value="'+k+'"'+(p.cat === k ? ' selected' : '')+'>'+NS.CAT_INFO[k].label+'</option>';
          }).join('')+'</select></div>'+
        '<div class="f"><label for="fColour">Colour name</label>'+
          '<input id="fColour" value="'+esc(p.c)+'" placeholder="Bone"></div>'+
        '<div class="f"><label for="fShape">Artwork shape</label><select id="fShape">'+
          Object.keys(NS.GARMENTS).map(function(k){
            return '<option value="'+k+'"'+(p.g === k ? ' selected' : '')+'>'+k+'</option>';
          }).join('')+'</select></div>'+
        '<div class="f"><label for="fFab">Main fabric</label><select id="fFab">'+
          NS.FABRICS.map(function(k){
            return '<option value="'+k+'"'+(p.f === k ? ' selected' : '')+'>'+k.replace('f-','')+'</option>';
          }).join('')+'</select></div>'+
        '<div class="f"><label for="fFab2">Second colourway</label><select id="fFab2">'+
          NS.FABRICS.map(function(k){
            return '<option value="'+k+'"'+(p.f2 === k ? ' selected' : '')+'>'+k.replace('f-','')+'</option>';
          }).join('')+'</select></div>'+
        '<div class="f"><label for="fPrice">Price</label><input id="fPrice" type="number" min="0" value="'+(p.price||0)+'"></div>'+
        '<div class="f"><label for="fWas">Compare-at price</label><input id="fWas" type="number" min="0" value="'+(p.was||0)+'">'+
          '<span class="hint">0 = not on sale</span></div>'+
        '<div class="f"><label for="fCost">Unit cost</label><input id="fCost" type="number" min="0" value="'+(p.cost||0)+'">'+
          '<span class="hint">Used for margin reporting</span></div>'+
        '<div class="f"><label for="fTag">Badge</label><select id="fTag">'+
          ['','NEW','BEST','SALE'].map(function(t){
            return '<option value="'+t+'"'+(p.tag === t ? ' selected' : '')+'>'+(t || 'None')+'</option>';
          }).join('')+'</select></div>'+
        '<div class="f"><label for="fStatus">Status</label><select id="fStatus">'+
          ['active','draft'].map(function(t){
            return '<option value="'+t+'"'+(p.status === t ? ' selected' : '')+'>'+t+'</option>';
          }).join('')+'</select><span class="hint">Drafts are hidden from the storefront</span></div>'+
      '</div>'+
      '<h4 style="margin:22px 0 10px;font-size:13px">Stock by size</h4>'+
      '<div class="size-stock" id="stockGrid">'+
        sizes.map(function(s){
          return '<div class="f"><label for="st_'+s+'">'+esc(s)+'</label>'+
            '<input id="st_'+s+'" class="st" data-size="'+esc(s)+'" type="number" min="0" value="'+(p.stock[s]||0)+'"></div>';
        }).join('')+
      '</div>'+
      '<p class="hint" style="margin-top:10px;color:var(--fg-3);font-size:12px">'+
        'Changing the category resets the size run — save, then reopen to set stock for the new sizes.</p>',
    foot:'<button class="btn" data-modal-close>Cancel</button>'+
         '<button class="btn btn-pri" data-modal-save>'+(isNew ? 'Create product' : 'Save changes')+'</button>',
    onSave:function(){
      var name = $('#fName').value.trim();
      if(!name){ toast('Product needs a name', true); return; }
      var cat = $('#fCat').value;
      var changedCat = cat !== p.cat;

      p.n = name;
      p.sku = $('#fSku').value.trim() || ('NS-' + Date.now());
      p.cat = cat;
      p.c = $('#fColour').value.trim() || 'Natural';
      p.g = $('#fShape').value;
      p.f = $('#fFab').value;
      p.f2 = $('#fFab2').value;
      p.price = Math.max(0, +$('#fPrice').value || 0);
      p.was = Math.max(0, +$('#fWas').value || 0);
      p.cost = Math.max(0, +$('#fCost').value || 0);
      p.tag = $('#fTag').value;
      p.status = $('#fStatus').value;

      if(changedCat){
        var fresh = {};
        NS.CAT_INFO[cat].sizes.forEach(function(s){ fresh[s] = 0; });
        p.stock = fresh;
      } else {
        $$('.st').forEach(function(i){
          p.stock[i.getAttribute('data-size')] = Math.max(0, +i.value || 0);
        });
      }

      if(isNew) NS.data.products.push(p);
      NS.save();
      closeModal();
      render();
      toast(isNew ? 'Product created' : 'Product saved');
    }
  });
}

/* ============================================================
   INVENTORY
   ============================================================ */
var invFilter = 'all';

function viewInventory(){
  var rows = [];
  NS.data.products.forEach(function(p){
    NS.CAT_INFO[p.cat].sizes.forEach(function(s){
      rows.push({p:p, size:s, q:NS.stockOf(p,s)});
    });
  });
  var lowAt = NS.data.settings.lowStockAt;
  var shown = rows.filter(function(r){
    if(invFilter === 'low') return r.q > 0 && r.q <= lowAt;
    if(invFilter === 'out') return r.q === 0;
    return true;
  });

  var units = rows.reduce(function(a,r){ return a + r.q; }, 0);
  var value = rows.reduce(function(a,r){ return a + r.q * (r.p.cost || 0); }, 0);
  var retail = rows.reduce(function(a,r){ return a + r.q * r.p.price; }, 0);

  return {
    title:'Inventory', sub:rows.length + ' variants across ' + NS.data.products.length + ' products',
    actions:'<button class="btn" id="restockAll">Restock all to 20</button>',
    html:
      '<div class="kpis">'+
        kpi('Units in stock', units, '', 'Across every size') +
        kpi('Stock at cost', money(value), '', 'What it cost to make') +
        kpi('Stock at retail', money(retail), '', 'If everything sells') +
        kpi('Out of stock', rows.filter(function(r){ return r.q === 0; }).length, '',
            rows.filter(function(r){ return r.q > 0 && r.q <= lowAt; }).length + ' more running low') +
      '</div>'+
      '<section class="card"><div class="card-h">'+
        '<div class="seg">'+
          ['all','low','out'].map(function(k){
            return '<button data-inv="'+k+'"'+(invFilter === k ? ' class="on"' : '')+'>'+
              (k === 'all' ? 'All variants' : k === 'low' ? 'Running low' : 'Out of stock')+'</button>';
          }).join('')+
        '</div>'+
        '<div class="right"><span style="font-size:12.5px;color:var(--fg-3)">Edit a number to update stock</span></div>'+
      '</div><div class="card-b flush">'+
      (shown.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr>'+
        '<th>Product</th><th>Size</th><th>State</th><th class="num">In stock</th>'+
        '<th class="num">Value at cost</th><th></th></tr></thead><tbody>'+
        shown.map(function(r){
          var state = r.q === 0 ? 'out' : r.q <= lowAt ? 'low' : 'ok';
          return '<tr><td><div class="prod-cell">'+NS.thumb(r.p,'thumb-sm')+
            '<span><b>'+esc(r.p.n)+'</b><span>'+esc(r.p.sku)+'</span></span></div></td>'+
            '<td class="mono">'+esc(r.size)+'</td>'+
            '<td><span class="pill '+state+'">'+(state === 'out' ? 'Out of stock' : state === 'low' ? 'Running low' : 'In stock')+'</span></td>'+
            '<td class="num"><input class="inp stock-in" style="width:76px;text-align:right" type="number" min="0" '+
              'data-pid="'+r.p.id+'" data-size="'+esc(r.size)+'" value="'+r.q+'"></td>'+
            '<td class="num" style="color:var(--fg-2)">'+money(r.q * (r.p.cost||0))+'</td>'+
            '<td class="acts"><button data-adj="1" data-pid="'+r.p.id+'" data-size="'+esc(r.size)+'">+5</button>'+
            '<button data-adj="-1" data-pid="'+r.p.id+'" data-size="'+esc(r.size)+'">−5</button></td></tr>';
        }).join('')+'</tbody></table></div>'
      : emptyState('Nothing here','No variant matches this filter'))+
      '</div></section>'
  };
}

/* ============================================================
   CUSTOMERS
   ============================================================ */
function viewCustomers(){
  var list = NS.customers();
  return {
    title:'Customers', sub:list.length + ' customers, derived from orders',
    actions:'',
    html:'<section class="card"><div class="card-b flush">'+
      (list.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr>'+
        '<th>Customer</th><th>Phone</th><th>District</th><th class="num">Orders</th>'+
        '<th class="num">Spent</th><th class="num">Avg order</th><th>Last order</th></tr></thead><tbody>'+
        list.map(function(c){
          return '<tr><td><b style="font-weight:500">'+esc(c.name)+'</b><br>'+
            '<span style="color:var(--fg-3);font-size:11.5px">'+esc(c.address)+'</span></td>'+
            '<td class="mono" style="font-size:12.5px">'+esc(c.phone)+'</td>'+
            '<td>'+esc(c.area)+'</td>'+
            '<td class="num">'+c.orders+'</td>'+
            '<td class="num">'+money(c.spent)+'</td>'+
            '<td class="num" style="color:var(--fg-2)">'+money(c.spent / c.orders)+'</td>'+
            '<td style="color:var(--fg-2);font-size:12.5px">'+D(c.last)+'</td></tr>';
        }).join('')+'</tbody></table></div>'
      : emptyState('No customers yet','They appear once an order is placed'))+
      '</div></section>'
  };
}

/* ============================================================
   DISCOUNTS
   ============================================================ */
function viewDiscounts(){
  var c = NS.data.coupons;
  return {
    title:'Discounts', sub:c.filter(function(x){ return x.active; }).length + ' active codes',
    actions:'<button class="btn btn-pri" id="addCoupon">'+
      '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>New code</button>',
    html:'<section class="card"><div class="card-b flush">'+
      (c.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr>'+
        '<th>Code</th><th>Type</th><th class="num">Value</th><th class="num">Min order</th>'+
        '<th class="num">Used</th><th>Status</th><th></th></tr></thead><tbody>'+
        c.map(function(x,i){
          var val = x.type === 'pct' ? x.value + '%' : x.type === 'flat' ? money(x.value) : 'Free delivery';
          return '<tr><td class="mono" style="font-weight:500">'+esc(x.code)+
            (x.note ? '<br><span style="font-family:inherit;color:var(--fg-3);font-size:11.5px">'+esc(x.note)+'</span>' : '')+'</td>'+
            '<td>'+(x.type === 'pct' ? 'Percentage' : x.type === 'flat' ? 'Fixed amount' : 'Free shipping')+'</td>'+
            '<td class="num">'+val+'</td>'+
            '<td class="num">'+money(x.minOrder)+'</td>'+
            '<td class="num">'+x.uses+'</td>'+
            '<td><span class="pill '+(x.active ? 'active' : 'draft')+'">'+(x.active ? 'active' : 'paused')+'</span></td>'+
            '<td class="acts"><button data-togglecoupon="'+i+'">'+(x.active ? 'Pause' : 'Activate')+'</button>'+
            '<button class="del" data-delcoupon="'+i+'">Delete</button></td></tr>';
        }).join('')+'</tbody></table></div>'
      : emptyState('No discount codes','Create one to run a promotion'))+
      '</div></section>'
  };
}

function couponForm(){
  openModal({
    title:'New discount code',
    body:'<div class="form-grid">'+
      '<div class="f"><label for="cCode">Code</label><input id="cCode" placeholder="VOLUME05" style="text-transform:uppercase"></div>'+
      '<div class="f"><label for="cType">Type</label><select id="cType">'+
        '<option value="pct">Percentage off</option><option value="flat">Fixed amount off</option>'+
        '<option value="ship">Free delivery</option></select></div>'+
      '<div class="f"><label for="cVal">Value</label><input id="cVal" type="number" min="0" value="10">'+
        '<span class="hint">Percent, or amount in '+esc(NS.data.settings.currency)+'</span></div>'+
      '<div class="f"><label for="cMin">Minimum order</label><input id="cMin" type="number" min="0" value="1000"></div>'+
      '<div class="f wide"><label for="cNote">Internal note</label><input id="cNote" placeholder="Eid campaign"></div>'+
    '</div>',
    foot:'<button class="btn" data-modal-close>Cancel</button>'+
         '<button class="btn btn-pri" data-modal-save>Create code</button>',
    onSave:function(){
      var code = $('#cCode').value.trim().toUpperCase();
      if(!code){ toast('Enter a code', true); return; }
      var clash = false;
      NS.data.coupons.forEach(function(x){ if(x.code === code) clash = true; });
      if(clash){ toast('That code already exists', true); return; }
      NS.data.coupons.push({
        code:code, type:$('#cType').value, value:Math.max(0, +$('#cVal').value || 0),
        minOrder:Math.max(0, +$('#cMin').value || 0), active:true, uses:0,
        note:$('#cNote').value.trim()
      });
      NS.save(); closeModal(); render(); toast('Code created');
    }
  });
}

/* ============================================================
   INVOICES
   ============================================================ */
function makeInvoice(orderId){
  var o = null;
  NS.data.orders.forEach(function(x){ if(x.id === orderId) o = x; });
  if(!o) return;
  if(o.invoiceId){ openInvoice(o.invoiceId); return; }

  var s = NS.data.settings;
  var vat = Math.round((o.subtotal - o.discount) * (s.vatPct || 0) / 100);
  var inv = {
    id:NS.nextInvoiceId(),
    orderId:o.id,
    issuedAt:Date.now(),
    customer:JSON.parse(JSON.stringify(o.customer)),
    items:JSON.parse(JSON.stringify(o.items)),
    subtotal:o.subtotal, discount:o.discount, delivery:o.delivery,
    vat:vat, total:o.total + vat, payment:o.payment
  };
  NS.data.invoices.unshift(inv);
  o.invoiceId = inv.id;
  NS.save();
  toast('Invoice ' + inv.id + ' created');
  openInvoice(inv.id);
}

function invoiceHTML(inv){
  var s = NS.data.settings;
  return '<div class="inv" id="invSheet">'+
    '<div class="inv-top">'+
      '<div><h2>'+esc(s.storeName)+'</h2>'+
        '<div style="color:#555C6B;font-size:12px;margin-top:6px">'+esc(s.address)+'<br>'+
        esc(s.phone)+' · '+esc(s.email)+'</div></div>'+
      '<div class="meta"><b style="font-size:14px">INVOICE</b><br>'+
        esc(inv.id)+'<br>Order '+esc(inv.orderId)+'<br>'+D(inv.issuedAt)+'</div>'+
    '</div>'+
    '<div class="inv-parties">'+
      '<div><h4>Billed to</h4><b>'+esc(inv.customer.name)+'</b><br>'+
        '<span style="color:#555C6B">'+esc(inv.customer.address)+'<br>'+
        esc(inv.customer.area)+'<br>'+esc(inv.customer.phone)+'</span></div>'+
      '<div><h4>Payment</h4><b style="text-transform:uppercase">'+esc(inv.payment)+'</b><br>'+
        '<span style="color:#555C6B">'+(inv.payment === 'cod' ? 'Collected on delivery' : 'Paid by mobile wallet')+'</span></div>'+
    '</div>'+
    '<table><thead><tr><th>Item</th><th>Size</th><th class="num">Qty</th>'+
      '<th class="num">Unit</th><th class="num">Amount</th></tr></thead><tbody>'+
      inv.items.map(function(l){
        return '<tr><td>'+esc(l.name)+'<br><span style="color:#858C9B;font-size:11px">'+esc(l.sku||'')+'</span></td>'+
          '<td>'+esc(l.size)+'</td><td class="num">'+l.qty+'</td>'+
          '<td class="num">'+money(l.price)+'</td><td class="num">'+money(l.price*l.qty)+'</td></tr>';
      }).join('')+
    '</tbody></table>'+
    '<div class="inv-sum">'+
      '<div class="r"><span>Subtotal</span><b>'+money(inv.subtotal)+'</b></div>'+
      (inv.discount ? '<div class="r"><span>Discount</span><b>−'+money(inv.discount)+'</b></div>' : '')+
      '<div class="r"><span>Delivery</span><b>'+(inv.delivery ? money(inv.delivery) : 'Free')+'</b></div>'+
      (inv.vat ? '<div class="r"><span>VAT ('+NS.data.settings.vatPct+'%)</span><b>'+money(inv.vat)+'</b></div>' : '')+
      '<div class="r grand"><span>Total</span><b>'+money(inv.total)+'</b></div>'+
    '</div>'+
    '<div class="inv-foot">Thank you for shopping with '+esc(s.storeName)+'. '+
      'Unworn pieces can be exchanged within 9 days with tags attached. '+
      'Questions: '+esc(s.phone)+'.</div>'+
  '</div>';
}

function openInvoice(id){
  var inv = null;
  NS.data.invoices.forEach(function(x){ if(x.id === id) inv = x; });
  if(!inv) return;
  openModal({
    title:'Invoice ' + inv.id,
    sub:'Order ' + inv.orderId + ' · ' + D(inv.issuedAt),
    wide:true,
    body:invoiceHTML(inv),
    foot:'<button class="btn" data-modal-close>Close</button>'+
         '<button class="btn btn-pri" id="printInv">Print / save as PDF</button>'
  });
  var b = $('#printInv');
  if(b) b.addEventListener('click', function(){ window.print(); });
}

function viewInvoices(){
  var inv = NS.data.invoices;
  var billed = inv.reduce(function(a,x){ return a + x.total; }, 0);
  return {
    title:'Invoices', sub:inv.length + ' issued',
    actions:'',
    html:
      '<div class="kpis">'+
        kpi('Invoices issued', inv.length, '', 'Created from orders') +
        kpi('Total billed', money(billed), '', 'Across all invoices') +
        kpi('Uninvoiced orders', NS.data.orders.filter(function(o){
          return !o.invoiceId && o.status !== 'cancelled'; }).length, '', 'Open an order to create one') +
      '</div>'+
      '<section class="card"><div class="card-b flush">'+
      (inv.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr>'+
        '<th>Invoice</th><th>Order</th><th>Customer</th><th>Issued</th>'+
        '<th class="num">Total</th><th></th></tr></thead><tbody>'+
        inv.map(function(x){
          return '<tr class="clickable" data-openinv="'+esc(x.id)+'">'+
            '<td class="mono" style="font-weight:500">'+esc(x.id)+'</td>'+
            '<td class="mono">'+esc(x.orderId)+'</td>'+
            '<td>'+esc(x.customer.name)+'</td>'+
            '<td style="color:var(--fg-2);font-size:12.5px">'+D(x.issuedAt)+'</td>'+
            '<td class="num">'+money(x.total)+'</td>'+
            '<td class="acts"><button data-openinv="'+esc(x.id)+'">View</button></td></tr>';
        }).join('')+'</tbody></table></div>'
      : emptyState('No invoices yet','Open an order and choose “Create invoice”'))+
      '</div></section>'
  };
}

/* ============================================================
   SETTINGS
   ============================================================ */
function viewSettings(){
  var s = NS.data.settings;
  return {
    title:'Settings', sub:'Store configuration — changes apply to the storefront',
    actions:'<button class="btn btn-pri" id="saveSettings">Save settings</button>',
    html:
      '<div class="two"><div class="stack">'+
        '<section class="card"><div class="card-h"><div><h2>Store details</h2>'+
          '<p class="sub">Shown on the storefront and on every invoice</p></div></div>'+
          '<div class="card-b"><div class="form-grid">'+
            sfield('sName','Store name', s.storeName)+
            sfield('sCurrency','Currency symbol', s.currency)+
            sfield('sPhone','Phone', s.phone)+
            sfield('sEmail','Email', s.email)+
            sfield('sAddress','Address', s.address, 'wide')+
          '</div></div></section>'+

        '<section class="card"><div class="card-h"><div><h2>Delivery &amp; tax</h2>'+
          '<p class="sub">The storefront calculates from these values</p></div></div>'+
          '<div class="card-b"><div class="form-grid">'+
            sfield('sFree','Free delivery over', s.freeDeliveryOver, '', 'number')+
            sfield('sVat','VAT percent', s.vatPct, '', 'number')+
            sfield('sDhaka','Delivery — Dhaka', s.deliveryDhaka, '', 'number')+
            sfield('sOutside','Delivery — outside Dhaka', s.deliveryOutside, '', 'number')+
            sfield('sLow','Low stock threshold', s.lowStockAt, '', 'number')+
            sfield('sOrderPrefix','Order number prefix', s.orderPrefix)+
            sfield('sInvPrefix','Invoice number prefix', s.invoicePrefix)+
          '</div></div></section>'+
      '</div>'+

      '<div class="stack">'+
        '<section class="card"><div class="card-h"><div><h2>Data</h2>'+
          '<p class="sub">This store lives in your browser</p></div></div>'+
          '<div class="card-b stack">'+
            '<div class="note"><b>Where your data is stored</b>'+
              'Products, orders and settings are saved in this browser only. Another device, '+
              'another browser, or a cleared cache will not see them. Export regularly, and '+
              'connect a real backend before you trade.</div>'+
            '<div style="display:flex;gap:8px;flex-wrap:wrap">'+
              '<button class="btn" id="exportData">Export backup (JSON)</button>'+
              '<button class="btn" id="importData">Import backup</button>'+
              '<input type="file" id="importFile" accept="application/json" hidden>'+
            '</div>'+
            '<div style="display:flex;gap:8px;flex-wrap:wrap">'+
              '<button class="btn btn-danger" id="clearSamples">Remove sample orders</button>'+
              '<button class="btn btn-danger" id="resetAll">Reset everything</button>'+
            '</div>'+
          '</div></section>'+

        '<section class="card"><div class="card-h"><div><h2>Security</h2></div></div>'+
          '<div class="card-b"><div class="note warn"><b>The passcode is not real protection</b>'+
            'It is checked in JavaScript, so anyone who can open this file can read it. '+
            'Move authentication to your server, and keep this page off a public URL until you do.</div>'+
          '</div></section>'+
      '</div></div>'
  };
}
function sfield(id, label, value, cls, type){
  return '<div class="f '+(cls||'')+'"><label for="'+id+'">'+esc(label)+'</label>'+
    '<input id="'+id+'" type="'+(type||'text')+'" value="'+esc(value)+'"></div>';
}

/* ============================================================
   ROUTER
   ============================================================ */
var ROUTES = {
  dashboard:viewDashboard, orders:viewOrders, products:viewProducts,
  inventory:viewInventory, customers:viewCustomers, discounts:viewDiscounts,
  invoices:viewInvoices, settings:viewSettings
};
var current = 'dashboard';

function render(){
  var v = (ROUTES[current] || viewDashboard)();
  $('#viewTitle').textContent = v.title;
  $('#viewSub').textContent = v.sub;
  $('#viewActions').innerHTML = v.actions || '';
  $('#view').innerHTML = v.html;
  $$('#railNav a').forEach(function(a){
    a.classList.toggle('on', a.getAttribute('data-route') === current);
  });
  $('#navOrders').textContent = NS.data.orders.filter(function(o){ return o.status === 'pending'; }).length;
  $('#navProducts').textContent = NS.data.products.length;
  var lowCount = 0;
  NS.data.products.forEach(function(p){
    NS.CAT_INFO[p.cat].sizes.forEach(function(s){
      if(NS.stockOf(p,s) <= NS.data.settings.lowStockAt) lowCount++;
    });
  });
  $('#navStock').textContent = lowCount;
  if(v.after) v.after();
  window.scrollTo(0,0);
}

function route(){
  var h = (location.hash || '#/dashboard').replace('#/','');
  current = ROUTES[h] ? h : 'dashboard';
  closeRail();
  $('#scrim').classList.remove('on');
  render();
}
window.addEventListener('hashchange', route);

/* ============================================================
   EVENT DELEGATION
   ============================================================ */
document.addEventListener('click', function(e){
  var t;

  if((t = e.target.closest('[data-order]'))){ openOrder(t.getAttribute('data-order')); return; }
  if((t = e.target.closest('[data-openinv]'))){ openInvoice(t.getAttribute('data-openinv')); return; }
  if((t = e.target.closest('[data-makeinv]'))){ makeInvoice(t.getAttribute('data-makeinv')); return; }

  if((t = e.target.closest('[data-setstatus]'))){
    var st = t.getAttribute('data-setstatus');
    var oid = $('#modalTitle').textContent.replace('Order ','');
    NS.data.orders.forEach(function(o){ if(o.id === oid) o.status = st; });
    NS.save(); openOrder(oid); render(); toast('Order marked ' + st);
    return;
  }
  if((t = e.target.closest('[data-delorder]'))){
    var did = t.getAttribute('data-delorder');
    closeModal();
    confirmAction('Delete order ' + did + '?', 'This cannot be undone. Stock is not returned automatically.',
      'Delete order', function(){
        NS.data.orders = NS.data.orders.filter(function(o){ return o.id !== did; });
        NS.save(); render(); toast('Order deleted');
      });
    return;
  }

  if(e.target.closest('#addProduct')){ productForm(null); return; }
  if((t = e.target.closest('[data-editprod]'))){ productForm(NS.product(t.getAttribute('data-editprod'))); return; }
  if((t = e.target.closest('[data-delprod]'))){
    var pid = t.getAttribute('data-delprod');
    var prod = NS.product(pid);
    confirmAction('Delete ' + prod.n + '?', 'It disappears from the storefront immediately. Past orders keep their record.',
      'Delete product', function(){
        NS.data.products = NS.data.products.filter(function(p){ return p.id !== pid; });
        NS.save(); render(); toast('Product deleted');
      });
    return;
  }

  if((t = e.target.closest('[data-inv]'))){ invFilter = t.getAttribute('data-inv'); render(); return; }
  if((t = e.target.closest('[data-adj]'))){
    var p = NS.product(t.getAttribute('data-pid'));
    var sz = t.getAttribute('data-size');
    var by = +t.getAttribute('data-adj') * 5;
    p.stock[sz] = Math.max(0, (p.stock[sz] || 0) + by);
    NS.save(); render();
    return;
  }
  if(e.target.closest('#restockAll')){
    confirmAction('Restock everything?', 'Every size of every product is set to 20 units.',
      'Restock all', function(){
        NS.data.products.forEach(function(p){
          NS.CAT_INFO[p.cat].sizes.forEach(function(s){ p.stock[s] = 20; });
        });
        NS.save(); render(); toast('All variants restocked to 20');
      });
    return;
  }

  if((t = e.target.closest('[data-ostatus]'))){ orderFilter.status = t.getAttribute('data-ostatus'); render(); return; }

  if(e.target.closest('#addCoupon')){ couponForm(); return; }
  if((t = e.target.closest('[data-togglecoupon]'))){
    var ci = +t.getAttribute('data-togglecoupon');
    NS.data.coupons[ci].active = !NS.data.coupons[ci].active;
    NS.save(); render();
    return;
  }
  if((t = e.target.closest('[data-delcoupon]'))){
    var di = +t.getAttribute('data-delcoupon');
    var code = NS.data.coupons[di].code;
    confirmAction('Delete ' + code + '?', 'Customers using this code at checkout will be told it is invalid.',
      'Delete code', function(){
        NS.data.coupons.splice(di,1); NS.save(); render(); toast('Code deleted');
      });
    return;
  }

  if(e.target.closest('#saveSettings')){
    var s = NS.data.settings;
    s.storeName = $('#sName').value.trim() || s.storeName;
    s.currency = $('#sCurrency').value.trim() || 'Tk';
    s.phone = $('#sPhone').value.trim();
    s.email = $('#sEmail').value.trim();
    s.address = $('#sAddress').value.trim();
    s.freeDeliveryOver = Math.max(0, +$('#sFree').value || 0);
    s.vatPct = Math.max(0, +$('#sVat').value || 0);
    s.deliveryDhaka = Math.max(0, +$('#sDhaka').value || 0);
    s.deliveryOutside = Math.max(0, +$('#sOutside').value || 0);
    s.lowStockAt = Math.max(0, +$('#sLow').value || 0);
    s.orderPrefix = $('#sOrderPrefix').value.trim() || 'NS';
    s.invoicePrefix = $('#sInvPrefix').value.trim() || 'INV';
    NS.save(); render(); toast('Settings saved');
    return;
  }

  if(e.target.closest('#exportData')){
    download('never-settle-backup-' + new Date().toISOString().slice(0,10) + '.json',
             JSON.stringify(NS.data, null, 2), 'application/json');
    return;
  }
  if(e.target.closest('#importData')){ $('#importFile').click(); return; }
  if(e.target.closest('#clearSamples')){
    confirmAction('Remove sample orders?', 'The seeded demo orders go; anything you placed yourself stays.',
      'Remove samples', function(){ NS.clearSamples(); render(); toast('Sample orders removed'); });
    return;
  }
  if(e.target.closest('#resetAll')){
    confirmAction('Reset everything?', 'Products, orders, invoices and settings all return to defaults. Export a backup first if you need one.',
      'Reset store', function(){ NS.reset(); render(); toast('Store reset'); });
    return;
  }
  if(e.target.closest('#exportOrders')){ exportOrdersCSV(); return; }
});

document.addEventListener('input', function(e){
  if(e.target.id === 'orderSearch'){
    orderFilter.q = e.target.value;
    var pos = e.target.selectionStart;
    render();
    var box = $('#orderSearch');
    if(box){ box.focus(); try{ box.setSelectionRange(pos,pos); }catch(err){} }
  }
});

document.addEventListener('change', function(e){
  if(e.target.classList && e.target.classList.contains('stock-in')){
    var p = NS.product(e.target.getAttribute('data-pid'));
    p.stock[e.target.getAttribute('data-size')] = Math.max(0, +e.target.value || 0);
    NS.save(); render(); toast('Stock updated');
  }
  if(e.target.id === 'importFile' && e.target.files && e.target.files[0]){
    var fr = new FileReader();
    fr.onload = function(){
      try{
        var parsed = JSON.parse(fr.result);
        if(!parsed.products || !parsed.settings) throw new Error('bad shape');
        NS.data = parsed; NS.save(); render(); toast('Backup restored');
      }catch(err){ toast('That file is not a valid backup', true); }
    };
    fr.readAsText(e.target.files[0]);
  }
});

/* ------------------------------------------------------------
   Utilities
   ------------------------------------------------------------ */
function download(name, text, type){
  try{
    var blob = new Blob([text], {type:type});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
    toast('Downloaded ' + name);
  }catch(e){
    toast('Download blocked by the browser', true);
  }
}

function exportOrdersCSV(){
  var head = ['Order','Date','Customer','Phone','District','Items','Payment','Status','Subtotal','Discount','Delivery','Total'];
  var rows = NS.data.orders.map(function(o){
    return [
      o.id, new Date(o.createdAt).toISOString(),
      o.customer.name, o.customer.phone, o.customer.area,
      o.items.map(function(l){ return l.name + ' (' + l.size + ') x' + l.qty; }).join('; '),
      o.payment, o.status, o.subtotal, o.discount, o.delivery, o.total
    ].map(function(c){ return '"' + String(c).replace(/"/g,'""') + '"'; }).join(',');
  });
  download('orders-' + new Date().toISOString().slice(0,10) + '.csv',
           head.join(',') + '\n' + rows.join('\n'), 'text/csv');
}

/* boot */
if(!$('#shell').hidden) route();

})();
