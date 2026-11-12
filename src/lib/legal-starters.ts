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
- When you browse: we save your cart and wishlist so they're still there when you come back. They're linked to a cookie on your device, not to your name or phone number. If we use analytics or advertising tools, they collect information about your visit, such as pages viewed and your device type.

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

  cookies: `Effective date: November 12, 2026

Last updated: November 12, 2026

## What are cookies?

This Cookie Policy explains what cookies are, how we use them, the types of cookies we use (i.e., the information we collect using cookies and how that information is used), and how to manage your cookie settings.

Cookies are small text files used to store small pieces of information. They are stored on your device when a website loads in your browser. These cookies help ensure that the website functions properly, enhance security, provide a better user experience, and analyse performance to identify what works and where improvements are needed.

## How do we use cookies?

Like most online services, our website uses both first-party and third-party cookies for various purposes. First-party cookies are primarily necessary for the website to function properly and do not collect any personally identifiable data.

The third-party cookies used on our website primarily help us understand how the website performs, track how you interact with it, keep our services secure, deliver relevant advertisements, and enhance your overall user experience while improving the speed of your future interactions with our website.

## Types of cookies we use

### Necessary

Necessary cookies are required to enable the basic features of this site, such as providing secure log-in or adjusting your consent preferences. These cookies do not store any personally identifiable data.

| Cookie | Duration | Description |
| --- | --- | --- |
| __cf_bm | 1 hour | This cookie, set by Cloudflare, is used to support Cloudflare Bot Management. |
| sky254-cart | 6 months | Keeps your cart and wishlist. It holds a random code only, with nothing about you. |

## Manage cookie preferences

[Consent Preferences](#consent-preferences)

You can modify your cookie settings anytime by clicking the 'Consent Preferences' button above. This will allow you to revisit the cookie consent banner and update your preferences or withdraw your consent immediately.

Additionally, different browsers offer various methods to block and delete cookies used by websites. You can adjust your browser settings to block or delete cookies. Below are links to support documents on how to manage and delete cookies in major web browsers.

Chrome: [https://support.google.com/accounts/answer/32050](https://support.google.com/accounts/answer/32050)

Safari: [https://support.apple.com/en-in/guide/safari/sfri11471/mac](https://support.apple.com/en-in/guide/safari/sfri11471/mac)

Firefox: [https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox?redirectslug=delete-cookies-remove-info-websites-stored&redirectlocale=en-US](https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox?redirectslug=delete-cookies-remove-info-websites-stored&redirectlocale=en-US)

Microsoft Edge: [https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09](https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09)

If you are using a different web browser, please refer to its official support documentation.

Cookie Policy generated by [CookieYes - Cookie Policy Generator](https://www.cookieyes.com/cookie-policy-generator/)`,
};
