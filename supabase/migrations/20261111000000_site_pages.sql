-- The information pages (About, Contact, FAQs, Delivery, Returns, Privacy, Terms).
-- The owner edits their wording in the dashboard under Pages. The set of pages is
-- fixed by the site, so there is no insert or delete from the dashboard.
-- Safe to run more than once: the starting drafts never overwrite edited text.

create table if not exists public.site_pages (
  slug text primary key check (slug in ('about', 'contact', 'faqs', 'delivery', 'returns', 'privacy', 'terms')),
  title text not null check (char_length(title) between 1 and 80),
  description text check (description is null or char_length(description) <= 300),  -- for Google
  body text not null default '' check (char_length(body) <= 30000),
  updated_at timestamptz not null default now()
);

drop trigger if exists site_pages_set_updated_at on public.site_pages;
create trigger site_pages_set_updated_at
  before update on public.site_pages
  for each row execute function public.set_updated_at();

alter table public.site_pages enable row level security;
revoke all on public.site_pages from anon, authenticated;
grant select on public.site_pages to anon, authenticated;
grant update (title, description, body) on public.site_pages to authenticated;
grant all on public.site_pages to service_role;

drop policy if exists "site_pages_public_read" on public.site_pages;
create policy "site_pages_public_read" on public.site_pages
  for select to anon, authenticated using (true);

drop policy if exists "site_pages_admin_update" on public.site_pages;
create policy "site_pages_admin_update" on public.site_pages
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- Starting drafts. Review them before launch: they describe policies the shop
-- must actually follow. Delivery fees, the address, hours and the phone number
-- are added to the pages automatically from Shop settings, so they are not here.
-- ----------------------------------------------------------------------------
insert into public.site_pages (slug, title, description, body) values
(
  'about',
  'About us',
  'Sky254 Electronics is a Nairobi electronics shop selling genuine phones, TVs, fridges, CCTV and accessories, with delivery across Kenya.',
  $$Sky254 Electronics is an electronics shop in Nairobi. We sell phones, TVs, fridges, sound systems, CCTV and accessories from the brands Kenyans trust, and we deliver across the country.

## What we promise

- Genuine products only. Everything we sell is new and sealed, with the official warranty.
- Fair, clear prices in shillings. The price you see is the price you pay.
- Pay the way that suits you: M-Pesa, or cash when your order arrives.
- Real people to talk to. Call or WhatsApp us before you buy, and after.

## Visit us

You are welcome to come to the shop, see the products and pick up your order. Our address and opening hours are on the [contact page](/contact).$$
),
(
  'contact',
  'Contact us',
  'Call, WhatsApp, email or visit Sky254 Electronics in Nairobi.',
  $$We're happy to help you choose, check stock, or follow up an order. WhatsApp is usually the fastest way to reach us.

If you're asking about an order, please have your order number ready. You can also [track your order](/track-order) yourself.$$
),
(
  'faqs',
  'Frequently asked questions',
  'Answers about ordering, M-Pesa payment, delivery, warranty and returns at Sky254 Electronics.',
  $$## Are your products genuine?

Yes. Everything we sell is new, sealed and genuine, with the official manufacturer's warranty.

## How do I place an order?

Add products to your cart and check out with your name, phone number and delivery details. We call you to confirm the order before we send it.

## How can I pay?

By M-Pesa, or in cash when your order is delivered or when you collect it from our shop.

## How long does delivery take?

Orders in Nairobi are usually delivered the same day or the next day. Orders outside Nairobi usually arrive in 1 to 3 days. See [delivery information](/delivery) for fees.

## Can I collect my order from the shop?

Yes. Choose pickup at checkout and collect it from our Nairobi shop for free.

## How do I track my order?

Use the link we sent you after you ordered, or enter your order number and phone number on the [track your order](/track-order) page.

## What if my product is faulty?

Contact us straight away. Faulty products are repaired or replaced under warranty. See [returns and warranty](/returns) for the details.

## Can I return something I changed my mind about?

Please read our [returns policy](/returns) before you buy. Products must be unopened and unused, with all packaging.$$
),
(
  'delivery',
  'Delivery information',
  'Delivery fees and times for Sky254 Electronics orders in Nairobi and across Kenya, plus free pickup from our shop.',
  $$## How it works

After you order, we call you to confirm the details and the delivery time. You pay by M-Pesa, or in cash when your order arrives.

## Delivery times

- Nairobi: usually the same day or the next day.
- Outside Nairobi: usually 1 to 3 days, by courier.
- Pickup: collect from our shop once we've confirmed your order is ready.

## When your order arrives

Please check the product and its packaging before you accept it. If anything is damaged or missing, tell the delivery person and call us straight away.$$
),
(
  'returns',
  'Returns & warranty',
  'Warranty cover and the returns policy for products bought from Sky254 Electronics.',
  $$## Warranty

Every product comes with the manufacturer's official warranty. The warranty period is shown on each product page. Keep your receipt or order number, because you'll need it for a warranty claim.

If a product develops a fault during its warranty, contact us. We'll arrange a repair or replacement through the manufacturer or its authorised service centre.

## Faulty or wrong products

If your product is faulty, damaged when it arrives, or not what you ordered, tell us within 7 days of delivery. We'll replace it, or refund you if a replacement isn't available.

## Changing your mind

We can accept a return within 7 days of delivery if the product is unopened, unused and in its original sealed packaging. Delivery fees are not refunded, and you cover the cost of returning it.

## What warranty doesn't cover

- Damage from drops, liquid, power surges or misuse.
- Products that have been opened or repaired by someone else.
- Normal wear, such as scratches.

## How to start a return

Call or WhatsApp us with your order number and a short description of the problem. Refunds are paid by M-Pesa.$$
),
(
  'privacy',
  'Privacy policy',
  'How Sky254 Electronics collects, uses and protects your personal data.',
  $$This policy explains what personal data Sky254 Electronics collects when you use this website, and how we use it. We handle your data in line with the Kenya Data Protection Act, 2019.

## What we collect

- When you order: your name, phone number, email address (if you give one) and delivery address.
- When you pay by M-Pesa: the payment details Safaricom sends us, such as the transaction code and phone number.
- When you sign up for stock alerts: your email address.
- When you browse: your cart and wishlist are stored on your own device, not by us. If we use analytics or advertising tools, they collect information about your visit, such as pages viewed and your device type.

## How we use it

- To confirm, deliver and support your order.
- To send you updates about your order by SMS or email.
- To send stock alerts, if you asked for them. You can unsubscribe at any time.
- To understand how the site is used and improve it.

We don't sell your personal data.

## Who we share it with

Only the services we need to run the shop: delivery couriers, Safaricom for M-Pesa payments, and the companies that host our website and send our messages. They may only use your data to provide that service.

## How long we keep it

We keep order records for as long as the law requires for tax and accounting, and other data only for as long as we need it.

## Your rights

You can ask to see the personal data we hold about you, correct it, or ask us to delete it. Contact us using the details on the [contact page](/contact).$$
),
(
  'terms',
  'Terms & conditions',
  'The terms that apply when you buy from Sky254 Electronics.',
  $$These terms apply when you buy from Sky254 Electronics through this website.

## Orders

Placing an order is an offer to buy. Your order is confirmed when we call you to confirm it. We may decline an order, for example if a product is out of stock or a price was shown incorrectly. If you've already paid, we'll refund you in full.

## Prices

Prices are in Kenya shillings. Delivery fees are shown at checkout, or confirmed when we call you.

## Payment

You can pay by M-Pesa or in cash on delivery or pickup. The product remains ours until it's paid for in full.

## Delivery

Delivery times are estimates. We'll tell you if there's a delay. See [delivery information](/delivery).

## Returns and warranty

Our [returns and warranty policy](/returns) explains what to do if something is wrong with your order.

## Your data

Our [privacy policy](/privacy) explains how we use your personal data.

## Changes

We may update these terms. The version on this page when you order is the one that applies to your order.$$
)
on conflict (slug) do nothing;
