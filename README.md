# NEVER SETTLE — storefront

A single-page storefront for limited-run t-shirts, pants and shoes. No build step, no
framework, no dependencies to install — open `index.html` and it runs.

---

## Files

```
never-settle-site/
├── index.html              Storefront
├── admin.html              Admin panel  (passcode: admin)
├── assets/
│   ├── css/styles.css      Storefront styling
│   ├── css/admin.css       Admin styling
│   ├── js/data.js          SHARED data layer — catalogue, orders, settings
│   ├── js/app.js           Storefront logic
│   ├── js/admin.js         Admin logic
│   └── img/favicon.svg
├── robots.txt
├── sitemap.xml
└── README.md
```

## The admin panel

Open `admin.html` (passcode `admin`, changeable at the top of `assets/js/admin.js`).

| Section | What it does |
|---|---|
| **Dashboard** | Revenue, orders, average order value and gross margin; 14-day revenue chart; top sellers; low-stock and recent-order lists |
| **Orders** | Filter by status, search by order/name/phone, open any order to see lines, customer and totals, move it through pending → confirmed → packed → shipped → delivered, or cancel. Export CSV |
| **Invoices** | Generate a numbered invoice from any order, view it, print it or save as PDF (a print stylesheet strips the interface) |
| **Customers** | Derived from orders — order count, total spent, average order, last order date |
| **Discounts** | Create percentage, fixed-amount or free-delivery codes with a minimum order; pause or delete them. The storefront checkout validates against these |
| **Products** | Full CRUD — name, SKU, category, price, compare-at price, unit cost, badge, colourway, artwork, and stock per size. Draft products are hidden from the storefront |
| **Inventory** | Every product × size variant with editable stock, quick ±5 adjustments, low/out filters, and stock valued at cost and at retail |
| **Settings** | Store details, delivery charges, free-delivery threshold, VAT, low-stock threshold, number prefixes — plus JSON backup export/import and reset |

### How the two pages are connected

Both read and write one store in `assets/js/data.js`. So:

- A product added in the admin appears on the storefront immediately.
- Setting a product to **draft** hides it from the storefront.
- Stock reaching zero for a size **disables that size** on the product page.
- Changing the free-delivery threshold changes the storefront's delivery bar and checkout maths.
- A customer placing an order **creates a real order** in the admin and **decrements stock**.

**This works because both files are served from the same origin.** Open them from the same folder or the same domain. Opening one from disk and the other from a server means two separate stores.

### Two things to fix before trading

1. **The passcode is not security.** It is compared in JavaScript, so anyone who opens the file can read it. Put the admin behind real server-side authentication and do not deploy `admin.html` publicly until you have.
2. **The data lives in one browser.** localStorage is per-browser and per-device — your phone will not see what you changed on your laptop, and clearing site data wipes it. Export a backup from Settings regularly, and move to a real database and API before you depend on it. The `load()` and `save()` functions in `data.js` are the two places to swap for API calls; the object shape is what your endpoints should return.

Sample orders are seeded so the dashboard is not empty on first run. They are marked `sample` and **Settings → Remove sample orders** clears them.

Three libraries load from CDN at the bottom of `index.html`: GSAP, its ScrollTrigger
plugin, and Lenis for smooth scrolling. Fonts (Archivo, Instrument Sans, JetBrains Mono)
come from Google Fonts. Everything else is yours.

---

## Running it locally

Double-clicking `index.html` works. To run it on a local server instead:

```bash
cd never-settle-site
python3 -m http.server 8000
# then open http://localhost:8000
```

---

## Editing products

**The normal way is the admin panel** — Products → New product, or Edit on any row.
What follows describes the underlying data if you would rather edit code, or are
wiring this to a backend.

The starting catalogue lives in `DEFAULT_PRODUCTS` in `assets/js/data.js`. Note that
once a browser has saved its store, editing this array no longer changes what that
browser sees — it is the seed, not the live data. Use the admin panel, or
Settings → Reset everything to re-seed.

```js
var P = [
  {id:'p1', n:'Boxy Heavyweight Tee', c:'Bone', f:'f-bone', f2:'f-sand',
   g:'tee', price:749, was:0, cat:'tshirts', tag:'BEST',
   dots:['#E7E0D2','#141414','#5D6848']},
  ...
];
```

| Key | Meaning |
|---|---|
| `id` | Unique string. Used by the cart and by `data-open` links in the menus. |
| `n` | Product name |
| `c` | Colourway name shown on the detail panel |
| `f` / `f2` | Fabric classes — the main and hover/alternate swatch (see below) |
| `g` | Garment shape: `tee`, `tee_ls`, `pant`, `short`, `shoe`, `shoe_hi` |
| `price` | Current price in Taka, as a number |
| `was` | Original price, or `0` for no discount. Any non-zero value draws the SALE badge and the % off. |
| `cat` | `tshirts`, `pants` or `shoes` — drives filters, sizes and copy |
| `tag` | Corner badge: `NEW`, `BEST`, `SALE` or `''` |
| `dots` | Colour circles under the card. The first two also become the detail-panel swatches. |
| `sku` | Stock code, shown in admin tables and on invoices |
| `cost` | Unit cost — drives the gross-margin figures in the admin |
| `status` | `active` or `draft`. Drafts are hidden from the storefront |
| `stock` | Object of size → units, e.g. `{S:12, M:8, L:0}`. A size at 0 is disabled on the product page |

Adding a product is just another object in the array — the grid, search, filter counts,
mega menus and "more from this line" rows all pick it up automatically.

### Fabric swatches

Products are drawn in code rather than photographed. A fabric class is a CSS gradient in
`styles.css`, under `/* fabric swatch gradients */`:

```css
.f-obsidian{background:linear-gradient(155deg,#2B2B2A 0%,#101010 58%,#242422 100%)}
```

Available: `f-obsidian`, `f-bone`, `f-sand`, `f-cobalt`, `f-ash`, `f-moss`, `f-char`,
`f-olive`, `f-clay`, `f-navy`. Add your own the same way.

### Swapping in real photography

When you have product shots, replace the drawn tile in `cardHTML()` (app.js):

```js
'<div class="card-media">' + badge +
  '<img src="assets/img/' + p.img + '" alt="' + p.n + '" loading="lazy">' +
  ...
```

Do the same in `buildPDP()` for the large view. `.card-media` is already
`aspect-ratio: 3/4` with `overflow: hidden`, so any 3:4 image drops straight in.

### Sizes, fabric and care copy

Per-category, in the `CAT_INFO` object in `data.js` — size runs, the fabric paragraph,
fit note, care instructions, and the measurement table shown in the size guide.

### Policy text

The `INFO` object in `app.js` holds shipping, exchange, terms, privacy, tracking,
stockists, careers, press and fabric copy. **Read these before you go live** — they
describe a plausible business, not necessarily yours. Rates, timelines and the 9-day
exchange window all need to match what you actually offer.

---

## What is real and what is a demo

Working: product detail panels, size selection, colour switching, cart (persists in the
browser), search, category filtering, sorting, all policy panels, mobile menu, the full
admin panel, and checkout — which captures delivery details, validates discount codes,
creates a real order and decrements stock.

**Not working: payment.** Checkout records the order but takes no money, because that
needs a server and a payment gateway. Two ways forward:

- **Shopify** — keep this as the front end and use the Storefront API. The `P` array maps
  onto Shopify products; `addToCart()` becomes a cart mutation.
- **WooCommerce / Medusa / your own backend** — same shape, swap `addToCart()` and
  `#checkoutBtn` for API calls.

Either way the change is contained to `addToCart()`, `renderCart()` and the checkout
button handler.

Also placeholder: the phone number `+880 1700 000 000` and `hello@neversettle.store`
appear in the contact card, footer and JSON-LD. Search both strings and replace.

---

## Before launch

- [ ] Replace phone, email and studio address (also in the JSON-LD block in `index.html`)
- [ ] Rewrite the policy copy in `INFO` to match your real terms
- [ ] Set your real domain in `index.html` (`canonical`, `og:url`) and `sitemap.xml`
- [ ] Add an `og:image` (1200×630) for link previews
- [ ] Replace the drawn garments with photography
- [ ] Connect a real payment gateway
- [ ] Put the admin behind server-side authentication
- [ ] Move the data layer from localStorage to a real database
- [ ] Add analytics if you want it

---

## Browser support

Modern evergreen browsers — Chrome, Edge, Safari 15.4+, Firefox. Uses CSS nesting-free
custom properties, `aspect-ratio`, `grid-template-rows` transitions and `dvh`.

The page degrades safely: if the CDN is blocked, GSAP and Lenis simply do not load, and
everything renders and works without animation. `prefers-reduced-motion` is respected
throughout.

## Accessibility

Focus is trapped inside open panels and restored on close, Escape closes any overlay,
toggles carry `aria-pressed`, and every control has a label. Worth re-testing after you
change copy or add products.

---

© 2026 NEVER SETTLE
