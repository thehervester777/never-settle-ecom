/* ============================================================
   NEVER SETTLE — shared data layer
   ------------------------------------------------------------
   Both the storefront (index.html) and the admin panel
   (admin.html) read and write this single store, so a change in
   one is visible in the other. It persists to localStorage.

   IMPORTANT: localStorage is per-browser and per-origin. This is
   a working front-end data layer, not a database — two different
   devices do not see each other's data. Replace the load/save
   functions with API calls when you connect a real backend; the
   shape below is what your endpoints should return.
   ============================================================ */
(function(global){
"use strict";

var KEY = 'ns_store_v1';
var NS  = global.NS = global.NS || {};

/* ------------------------------------------------------------
   Garment artwork — shared so product thumbnails look the same
   in the storefront and the admin tables.
   ------------------------------------------------------------ */
NS.GARMENTS = {
  tee:'<path d="M74 14 44 26 18 50l22 30 20-14v148h80V66l20 14 22-30-26-24-30-12c-6 16-46 16-52 0z"/><path d="M74 14c6 16 46 16 52 0" fill="none" stroke-opacity=".55"/>',
  tee_ls:'<path d="M74 14 44 26 18 50l5 94h30l-5-72 12-6v152h80V92l12 6-5 72h30l5-94-26-24-30-12c-6 16-46 16-52 0z"/><path d="M74 14c6 16 46 16 52 0" fill="none" stroke-opacity=".55"/>',
  pant:'<path d="M52 12h96l4 34-10 178h-38l-6-104-6 104H54L44 46z"/><path d="M52 12h96M96 46v60" stroke-opacity=".5" fill="none"/>',
  short:'<path d="M56 16h88l5 22-5 112h-34l-6-62-6 62H62l-5-112z"/><path d="M56 16h88M100 38v56" stroke-opacity=".5" fill="none"/>',
  shoe:'<path d="M28 145c0-24 6-41 19-54l13-13h20l8 13 21 8c25 9 43 15 51 25 5 6 9 14 9 21z"/><path d="M18 145h164v14a8 8 0 0 1-8 8H26a8 8 0 0 1-8-8z"/><path d="M64 96l24 9M57 112l28 11M52 128l30 12" fill="none" stroke-opacity=".45" stroke-width="2.6"/>',
  shoe_hi:'<path d="M28 145c0-21 5-37 14-49V60h40v25l14 5c25 9 43 15 51 25 5 6 9 14 9 21z"/><path d="M18 145h164v14a8 8 0 0 1-8 8H26a8 8 0 0 1-8-8z"/><path d="M42 68h40M50 106l28 10M50 126l30 11" fill="none" stroke-opacity=".45" stroke-width="2.6"/>'
};

NS.FABRICS = ['f-obsidian','f-bone','f-sand','f-cobalt','f-ash','f-moss','f-char','f-olive','f-clay','f-navy'];

NS.toneFor = function(f){
  return (f === 'f-bone' || f === 'f-sand' || f === 'f-ash')
    ? 'rgba(18,18,15,.34)' : 'rgba(255,255,255,.30)';
};
NS.garmentSVG = function(key, tone){
  return '<svg class="garment" viewBox="0 0 200 240" fill="'+tone+'" stroke="'+tone+
         '" stroke-width="1.4" aria-hidden="true">'+(NS.GARMENTS[key]||NS.GARMENTS.tee)+'</svg>';
};
NS.thumb = function(p, cls){
  return '<span class="'+(cls||'thumb')+'"><span class="swatch '+p.f+' f-weave"></span>'+
         NS.garmentSVG(p.g, NS.toneFor(p.f))+'</span>';
};

/* ------------------------------------------------------------
   Category definitions — size runs and copy
   ------------------------------------------------------------ */
NS.CAT_INFO = {
  tshirts:{
    label:'T-Shirts',
    sizes:['S','M','L','XL','XXL'],
    fabric:'240 GSM combed cotton, single jersey, pre-shrunk. Ribbed collar with taped shoulder seams so the neck keeps its shape.',
    fit:'Boxy through the body with a slightly dropped shoulder. Between sizes, size down for a clean fit.',
    care:'Cold machine wash inside out. Line dry in shade. Do not iron over the print area.',
    measure:[['Size','Chest (in)','Length (in)'],['S','20','27'],['M','21','28'],['L','22','29'],['XL','23','30'],['XXL','24','31']]
  },
  pants:{
    label:'Pants',
    sizes:['30','32','34','36','38'],
    fabric:'Cotton twill with 2% elastane for recovery. Bar-tacked stress points, YKK zip, and a fully enclosed waistband.',
    fit:'Relaxed through the thigh with a straight leg. Sits at the natural waist.',
    care:'Cold machine wash. Tumble dry low or line dry. Warm iron if needed.',
    measure:[['Size','Waist (in)','Inseam (in)'],['30','30','29'],['32','32','29.5'],['34','34','30'],['36','36','30.5'],['38','38','31']]
  },
  shoes:{
    label:'Shoes',
    sizes:['39','40','41','42','43','44','45','46'],
    fabric:'Full-grain upper on a cemented and stitched rubber outsole. Removable moulded footbed.',
    fit:'True to size with a roomy toe box — take your usual EU size.',
    care:'Wipe with a damp cloth. Air dry away from direct heat. Never machine wash.',
    measure:[['EU','UK','Foot (cm)'],['39','6','24.5'],['40','6.5','25'],['41','7.5','25.5'],['42','8','26.5'],['43','9','27'],['44','9.5','28'],['45','10.5','28.5'],['46','11','29']]
  }
};

/* ------------------------------------------------------------
   Defaults — the starting catalogue and store configuration
   ------------------------------------------------------------ */
function stockFor(cat, base){
  var out = {};
  NS.CAT_INFO[cat].sizes.forEach(function(s,i){
    out[s] = Math.max(0, base - (i * 3) + (i % 2 ? 5 : 0));
  });
  return out;
}

var DEFAULT_PRODUCTS = [
  {id:'p1', sku:'NS-TEE-BNE', n:'Boxy Heavyweight Tee',   c:'Bone',      f:'f-bone',     f2:'f-sand',  g:'tee',     price:749,  was:0,    cat:'tshirts', tag:'BEST', status:'active', cost:340, dots:['#E7E0D2','#141414','#5D6848']},
  {id:'p2', sku:'NS-TEE-OBS', n:'Washed Crew Tee',        c:'Obsidian',  f:'f-obsidian', f2:'f-char',  g:'tee',     price:690,  was:0,    cat:'tshirts', tag:'',     status:'active', cost:310, dots:['#141414','#3A3A35','#A8A59D']},
  {id:'p3', sku:'NS-TEE-CLY', n:'Drop-Shoulder Oversized',c:'Clay',      f:'f-clay',     f2:'f-sand',  g:'tee',     price:790,  was:0,    cat:'tshirts', tag:'NEW',  status:'active', cost:355, dots:['#AE6A4C','#C9B18C','#141414']},
  {id:'p4', sku:'NS-TEE-MSS', n:'Long-Sleeve Rib Tee',    c:'Moss',      f:'f-moss',     f2:'f-olive', g:'tee_ls',  price:890,  was:1090, cat:'tshirts', tag:'SALE', status:'active', cost:420, dots:['#5D6848','#736E46','#E7E0D2']},
  {id:'p5', sku:'NS-PNT-OBS', n:'Relaxed Twill Trouser',  c:'Obsidian',  f:'f-obsidian', f2:'f-char',  g:'pant',    price:1390, was:0,    cat:'pants',   tag:'',     status:'active', cost:640, dots:['#141414','#4A4A47','#736E46']},
  {id:'p6', sku:'NS-PNT-ASH', n:'Pleated Wide Pant',      c:'Ash',       f:'f-ash',      f2:'f-bone',  g:'pant',    price:1490, was:0,    cat:'pants',   tag:'NEW',  status:'active', cost:690, dots:['#A8A59D','#E7E0D2','#141414']},
  {id:'p7', sku:'NS-PNT-OLV', n:'Utility Cargo',          c:'Olive',     f:'f-olive',    f2:'f-moss',  g:'pant',    price:1690, was:1990, cat:'pants',   tag:'SALE', status:'active', cost:780, dots:['#736E46','#5D6848','#141414']},
  {id:'p8', sku:'NS-SHT-BNE', n:'Heavy Jersey Short',     c:'Bone',      f:'f-bone',     f2:'f-ash',   g:'short',   price:849,  was:0,    cat:'pants',   tag:'',     status:'active', cost:390, dots:['#E7E0D2','#A8A59D','#141414']},
  {id:'p9', sku:'NS-SHO-CRT', n:'Court Low Sneaker',      c:'Bone',      f:'f-bone',     f2:'f-ash',   g:'shoe',    price:2290, was:0,    cat:'shoes',   tag:'NEW',  status:'active', cost:1150, dots:['#E7E0D2','#141414','#22314C']},
  {id:'p10',sku:'NS-SHO-RUN', n:'Runner Mesh Trainer',    c:'Cobalt',    f:'f-cobalt',   f2:'f-navy',  g:'shoe',    price:2690, was:0,    cat:'shoes',   tag:'',     status:'active', cost:1340, dots:['#2C40BE','#22314C','#A8A59D']},
  {id:'p11',sku:'NS-SHO-HIT', n:'Canvas High-Top',        c:'Obsidian',  f:'f-obsidian', f2:'f-bone',  g:'shoe_hi', price:1990, was:2390, cat:'shoes',   tag:'SALE', status:'active', cost:980, dots:['#141414','#E7E0D2','#AE6A4C']},
  {id:'p12',sku:'NS-SHO-TRL', n:'Suede Trail Low',        c:'Sandstone', f:'f-sand',     f2:'f-olive', g:'shoe',    price:2890, was:0,    cat:'shoes',   tag:'',     status:'active', cost:1450, dots:['#C9B18C','#736E46','#3A3A35']}
];
DEFAULT_PRODUCTS.forEach(function(p,i){ p.stock = stockFor(p.cat, 18 - (i % 5) * 3); });

var DEFAULT_SETTINGS = {
  storeName:'NEVER SETTLE',
  currency:'Tk',
  freeDeliveryOver:1999,
  deliveryDhaka:80,
  deliveryOutside:130,
  vatPct:0,
  lowStockAt:5,
  phone:'+880 1700 000 000',
  email:'hello@neversettle.store',
  address:'Road 11, Banani, Dhaka 1213',
  invoicePrefix:'INV',
  orderPrefix:'NS'
};

var DEFAULT_COUPONS = [
  {code:'VOLUME04', type:'pct',  value:10, minOrder:1500, active:true,  uses:0, note:'Launch code for Volume 04'},
  {code:'FREESHIP', type:'ship', value:0,  minOrder:900,  active:true,  uses:0, note:'Waives delivery charge'},
  {code:'FIRST200', type:'flat', value:200,minOrder:2000, active:false, uses:0, note:'Retired — first 200 customers'}
];

/* Sample orders so the dashboard is not empty on first run.
   Clearly marked with sample:true and removable from Settings. */
function seedOrders(){
  var names = [
    ['Tanvir Hossain','+8801711000001','House 24, Road 7, Dhanmondi','Dhaka'],
    ['Nusrat Jahan','+8801711000002','Sector 4, Uttara','Dhaka'],
    ['Rakib Ahmed','+8801711000003','Nasirabad Housing Society','Chattogram'],
    ['Samira Karim','+8801711000004','Road 11, Banani','Dhaka'],
    ['Fahim Rahman','+8801711000005','Block C, Mirpur 10','Dhaka'],
    ['Ishrak Mahmud','+8801711000006','Zindabazar','Sylhet'],
    ['Ayesha Siddiqua','+8801711000007','Gulshan 2','Dhaka'],
    ['Zubair Talukder','+8801711000008','Bashundhara R/A','Dhaka']
  ];
  var states = ['delivered','delivered','delivered','shipped','packed','confirmed','pending','cancelled'];
  var out = [], n = 1001, now = Date.now(), day = 86400000;

  for(var i = 0; i < 22; i++){
    var who = names[i % names.length];
    var when = now - Math.floor(i * 0.62 * day) - Math.floor(Math.random() * day * 0.4);
    var picks = [];
    var count = 1 + (i % 3);
    for(var k = 0; k < count; k++){
      var p = DEFAULT_PRODUCTS[(i * 3 + k * 5) % DEFAULT_PRODUCTS.length];
      var sizes = NS.CAT_INFO[p.cat].sizes;
      picks.push({
        id:p.id, name:p.n, sku:p.sku, size:sizes[(i + k) % sizes.length],
        qty:1 + ((i + k) % 2), price:p.price, cost:p.cost
      });
    }
    var sub = picks.reduce(function(a,l){ return a + l.price * l.qty; }, 0);
    var outside = who[3] !== 'Dhaka';
    var del = sub >= DEFAULT_SETTINGS.freeDeliveryOver ? 0 : (outside ? DEFAULT_SETTINGS.deliveryOutside : DEFAULT_SETTINGS.deliveryDhaka);
    out.push({
      id: DEFAULT_SETTINGS.orderPrefix + '-' + (n + i),
      createdAt: when,
      customer:{name:who[0], phone:who[1], address:who[2], area:who[3]},
      items:picks,
      subtotal:sub, discount:0, delivery:del, total:sub + del,
      payment: i % 3 === 0 ? 'bkash' : 'cod',
      status: states[i % states.length],
      note:'',
      sample:true,
      invoiceId: null
    });
  }
  return out.sort(function(a,b){ return b.createdAt - a.createdAt; });
}

function defaults(){
  return {
    version:1,
    settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
    products: JSON.parse(JSON.stringify(DEFAULT_PRODUCTS)),
    orders: seedOrders(),
    coupons: JSON.parse(JSON.stringify(DEFAULT_COUPONS)),
    invoices: [],
    counters:{order:1023, invoice:0}
  };
}

/* ------------------------------------------------------------
   Load / save
   ------------------------------------------------------------ */
NS.data = null;

NS.load = function(){
  var raw = null;
  try{ raw = localStorage.getItem(KEY); }catch(e){}
  if(raw){
    try{
      var parsed = JSON.parse(raw);
      if(parsed && parsed.products && parsed.settings){
        NS.data = parsed;
        /* forward-fill any key added after this browser last saved */
        Object.keys(DEFAULT_SETTINGS).forEach(function(k){
          if(NS.data.settings[k] === undefined) NS.data.settings[k] = DEFAULT_SETTINGS[k];
        });
        if(!NS.data.invoices) NS.data.invoices = [];
        if(!NS.data.counters) NS.data.counters = {order:1023, invoice:0};
        return NS.data;
      }
    }catch(e){}
  }
  NS.data = defaults();
  NS.save();
  return NS.data;
};

NS.save = function(){
  try{ localStorage.setItem(KEY, JSON.stringify(NS.data)); }catch(e){
    /* quota or private mode — the app still works for this session */
    if(global.console) console.warn('NEVER SETTLE: could not persist store', e);
  }
  try{
    global.dispatchEvent(new CustomEvent('ns:change'));
  }catch(e){}
};

NS.reset = function(){ NS.data = defaults(); NS.save(); return NS.data; };

NS.clearSamples = function(){
  NS.data.orders = NS.data.orders.filter(function(o){ return !o.sample; });
  NS.save();
};

/* ------------------------------------------------------------
   Helpers
   ------------------------------------------------------------ */
NS.money = function(v){
  var s = NS.data && NS.data.settings ? NS.data.settings : DEFAULT_SETTINGS;
  return s.currency + ' ' + Math.round(v).toLocaleString('en-US');
};
NS.product = function(id){
  var list = NS.data.products, i;
  for(i = 0; i < list.length; i++){ if(list[i].id === id) return list[i]; }
  return null;
};
NS.stockOf = function(p, size){
  return (p && p.stock && typeof p.stock[size] === 'number') ? p.stock[size] : 0;
};
NS.totalStock = function(p){
  var t = 0, k;
  for(k in p.stock){ if(Object.prototype.hasOwnProperty.call(p.stock, k)) t += p.stock[k]; }
  return t;
};
NS.nextOrderId = function(){
  NS.data.counters.order += 1;
  return NS.data.settings.orderPrefix + '-' + NS.data.counters.order;
};
NS.nextInvoiceId = function(){
  NS.data.counters.invoice += 1;
  var y = new Date().getFullYear();
  return NS.data.settings.invoicePrefix + '-' + y + '-' + String(NS.data.counters.invoice).padStart(4,'0');
};
NS.deliveryFor = function(subtotal, area){
  var s = NS.data.settings;
  if(subtotal >= s.freeDeliveryOver) return 0;
  return (area && area.toLowerCase() !== 'dhaka') ? s.deliveryOutside : s.deliveryDhaka;
};

/* Decrement stock for an order's lines. Never goes below zero. */
NS.commitStock = function(items){
  items.forEach(function(l){
    var p = NS.product(l.id);
    if(p && p.stock && typeof p.stock[l.size] === 'number'){
      p.stock[l.size] = Math.max(0, p.stock[l.size] - l.qty);
    }
  });
};

/* Customers are derived from orders — there is no separate table to drift. */
NS.customers = function(){
  var map = {};
  NS.data.orders.forEach(function(o){
    if(o.status === 'cancelled') return;
    var k = o.customer.phone;
    if(!map[k]){
      map[k] = {name:o.customer.name, phone:k, area:o.customer.area,
                address:o.customer.address, orders:0, spent:0, last:0};
    }
    map[k].orders += 1;
    map[k].spent += o.total;
    map[k].last = Math.max(map[k].last, o.createdAt);
  });
  return Object.keys(map).map(function(k){ return map[k]; })
    .sort(function(a,b){ return b.spent - a.spent; });
};

NS.ORDER_STATES = ['pending','confirmed','packed','shipped','delivered','cancelled'];

NS.load();

})(window);
