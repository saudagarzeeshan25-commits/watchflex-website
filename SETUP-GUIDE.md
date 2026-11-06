# Watch Flex: Setup Guide (India)

## 1. Install the theme
Shopify admin → **Online Store → Themes → Add theme → Upload zip** → `watch-flex-theme.zip` → **Customize**.

## 2. Set rupees
- **Settings → Store details**: Store currency = **Indian Rupee (INR)**.
- **Settings → General → Currency formatting**: HTML without currency = `₹{{amount_no_decimals}}`.

## 3. Add products
1. **Products → Import** → `products.csv`. This creates the 5 watches with ₹ price and MRP (the struck-through price).
2. Upload photos: open each product and add the matching file from the `product-photos` folder (file names match the product names).
3. Change names, prices and stock to your real ones. Stock is set to 10 each as a placeholder.

## 4. Collections (optional)
Create automated collections: **Gold** (Type = Gold), **Steel** (Type = Steel), **Sport** (Type = Sport). In the Theme Editor, pick the collection on the **New arrivals** section (or an "All products" collection).

## 5. Payments (India)
**Settings → Payments**: activate Shopify Payments if it is available for your account, or add Razorpay, Cashfree or PayU for UPI, cards and net banking. Turn on **Cash on Delivery** under *Manual payment methods*.

## 6. Shipping and tax
- **Settings → Shipping**: one flat or free rate for India. The site promises free delivery, so set it to ₹0.
- **Settings → Taxes**: add your GST number if you're registered, and keep prices tax-inclusive.
- Connect a courier app such as Shiprocket for labels and tracking.

## 7. WhatsApp ordering
**Theme settings → Cart & WhatsApp**: enter your number with country code (e.g. `919876543210`). An "Order on WhatsApp" button appears on product pages.

## 8. Pages and menus
Create pages from `PAGES.md` and link them in the **footer** menu. Edit the **main-menu** to *Shop* and *Why Us*.

## 9. Before you go live
- [ ] Real, licensed photos on every product
- [ ] Test order on your phone: one prepaid (UPI) and one COD
- [ ] Policies filled in: **Settings → Policies**
- [ ] Remove the storefront password and publish

## Important: product names and photos
The demo photos were supplied for placeholder use and show other brands' names on the dials. Before you launch, replace them with photos of the exact watches you sell. If you list a watch under a famous brand's name, you must be an authorised seller of the genuine product. Genuine watches of those brands cost far more than the prices on this site.
