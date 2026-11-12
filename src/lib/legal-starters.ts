import type { LegalSlug } from "@/lib/site-pages";

/**
 * Our plain-English starting drafts for the legal pages, the same text the site_pages
 * migration put in. The website shows them until a page is saved under Legal pages, and
 * "Reset to starter text" brings them back. They're not legal advice: the shop should
 * check them against how it really works. Delivery fees, the address, hours and phone
 * number are added to the pages from settings, so they aren't written here.
 */
export const LEGAL_STARTERS: Record<LegalSlug, string> = {
  privacy: `This policy explains what personal data Sky254 Electronics collects when you use this website, and how we use it. We handle your data in line with the Kenya Data Protection Act, 2019.

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

You can ask to see the personal data we hold about you, correct it, or ask us to delete it. Contact us using the details on the [contact page](/contact).`,

  terms: `These terms apply when you buy from Sky254 Electronics through this website.

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

We may update these terms. The version on this page when you order is the one that applies to your order.`,

  returns: `## Warranty

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

Call or WhatsApp us with your order number and a short description of the problem. Refunds are paid by M-Pesa.`,

  delivery: `## How it works

After you order, we call you to confirm the details and the delivery time. You pay by M-Pesa, or in cash when your order arrives.

## Delivery times

- Nairobi: usually the same day or the next day.
- Outside Nairobi: usually 1 to 3 days, by courier.
- Pickup: collect from our shop once we've confirmed your order is ready.

## When your order arrives

Please check the product and its packaging before you accept it. If anything is damaged or missing, tell the delivery person and call us straight away.`,
};
