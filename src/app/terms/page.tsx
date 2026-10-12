import type { Metadata } from "next";
import Link from "next/link";
import InfoPage, { Block, List } from "@/components/InfoPage";

export const metadata: Metadata = { title: "Terms & Conditions | Imarax Drip" };

const UPDATED = "October 11, 2026";
const EMAIL = "support@imaraxdrip.com";

const emailLink = (
  <a
    href={`mailto:${EMAIL}`}
    className="font-semibold text-signal underline underline-offset-4"
  >
    {EMAIL}
  </a>
);

const linkClass = "font-semibold text-signal underline underline-offset-4";

export default function TermsPage() {
  return (
    <InfoPage label="Legal" title="Terms & Conditions" updated={UPDATED}>
      <Block title="1. Who we are">
        <p>
          Imarax Drip is a clothing brand operated by Spurax Inc, which
          operates from Nigeria. These Terms apply to your use of our website
          and any order you place. By using the site or placing an order, you
          agree to them. Questions: {emailLink}
        </p>
      </Block>

      <Block title="2. Accounts">
        <List>
          <li>
            You must be <strong>at least 18 years old</strong> to create an
            account or place an order.
          </li>
          <li>
            You must give accurate information and keep your login details
            private. You are responsible for all activity on your account.
          </li>
          <li>
            We may suspend or close accounts that break these Terms, involve
            fraud, or abuse our policies.
          </li>
        </List>
      </Block>

      <Block title="3. Products and pricing">
        <p>
          We try to show colours, sizes and designs accurately, but screens
          differ and slight variations may occur. We may change or discontinue
          products and prices at any time. Please check the size guide before
          ordering.
        </p>

        <p>
          Prices may be shown in{" "}
          <strong>
            US dollars (USD), euros (EUR), British pounds (GBP), Japanese yen
            (JPY), Nigerian naira (NGN)
          </strong>{" "}
          and other currencies offered at checkout. Exchange rates are set at
          the time of purchase, and your bank may add its own conversion fees.
        </p>
      </Block>

      <Block title="4. Orders and payment">
        <List>
          <li>An order is accepted only when we confirm it by email.</li>
          <li>
            Payments are processed by <strong>Paystack</strong>. You can pay by
            card or any other method offered at checkout. We never store your
            full card details.
          </li>
          <li>
            We may cancel an order, with a full refund, if an item is
            unavailable, a price was listed in error, or we suspect fraud.
          </li>
        </List>
      </Block>

      <Block title="5. Delivery, returns and refunds">
        <p>
          These are covered in our{" "}
          <Link href="/returns" className={linkClass}>
            Shipping &amp; Returns Policy
          </Link>
          , which forms part of these Terms.
        </p>
      </Block>

      <Block title="6. Intellectual property">
        <p>
          All designs, logos, images and content on this site belong to Imarax
          Drip and Spurax Inc. You may not copy, reproduce, sell or use them
          without our written permission.
        </p>
      </Block>

      <Block title="7. Acceptable use">
        <p>
          You agree not to hack, disrupt or overload the site, use stolen or
          unauthorised payment details, abuse our return policy, or use the
          site for anything illegal.
        </p>
      </Block>

      <Block title="8. Limitation of liability">
        <p>
          To the fullest extent the law allows, Spurax Inc and Imarax Drip are
          not liable for indirect or consequential loss arising from your use
          of the site or products. Our liability for any order is limited to
          the amount you paid for it. Nothing in these Terms removes consumer
          rights you have under the law of your country that cannot be
          excluded.
        </p>
      </Block>

      <Block title="9. Privacy and cookies">
        <p>
          How we collect and use your data, including analytics, marketing and
          advertising tracking, is explained in our{" "}
          <Link href="/privacy" className={linkClass}>
            Privacy Policy
          </Link>
          .
        </p>
      </Block>

      <Block title="10. Changes">
        <p>
          We may update these Terms. The new version applies once it’s posted
          with a new “Last updated” date.
        </p>
      </Block>

      <Block title="11. Governing law">
        <p>
          These Terms are governed by the laws of the Federal Republic of
          Nigeria. If you have a problem, please contact us first so we can try
          to fix it.
        </p>
      </Block>
    </InfoPage>
  );
}