import type { Metadata } from "next";
import InfoPage, { Block, List, SubBlock } from "@/components/InfoPage";

export const metadata: Metadata = { title: "Privacy Policy | Imarax Drip" };

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

export default function PrivacyPage() {
  return (
    <InfoPage label="Legal" title="Privacy Policy" updated={UPDATED}>
      <Block title="1. Who we are">
        <p>
          Imarax Drip is a clothing brand operated by <strong>Spurax Inc</strong>,
          which operates from Nigeria (“we”, “us”). Spurax Inc is responsible
          for the personal data we collect through this website. This policy
          explains what we collect, why, and the choices you have.
        </p>

        <p>Contact: {emailLink}</p>
      </Block>

      <Block title="2. What we collect">
        <SubBlock title="Information you give us">
          <List>
            <li>
              Name, email address, phone number and delivery address when you
              create an account or place an order.
            </li>
            <li>
              Messages you send us, such as support requests or return claims
              (including any photos you attach).
            </li>
            <li>
              Your marketing preferences, for example if you subscribe to our
              emails.
            </li>
          </List>
        </SubBlock>

        <SubBlock title="Payment information">
          <p>
            Payments are handled by <strong>Paystack</strong>. Your card or
            payment details go directly to Paystack, and we don’t see or store
            your full card number. We receive only confirmation of payment,
            such as the amount, status and a transaction reference.
          </p>
        </SubBlock>

        <SubBlock title="Information collected automatically">
          <List>
            <li>
              Device and browser type, IP address, approximate location, pages
              visited, and how you use the site.
            </li>
            <li>Cookies and similar technologies (see section 5).</li>
          </List>
        </SubBlock>
      </Block>

      <Block title="3. How we use your information">
        <List>
          <li>To create your account, process orders, and deliver your products.</li>
          <li>To handle payments, returns, refunds and customer support.</li>
          <li>To prevent fraud and keep the site secure.</li>
          <li>To understand how the site is used and improve it (analytics).</li>
          <li>
            To send you offers and updates, if you’ve agreed (marketing).
          </li>
          <li>To show you relevant ads on other platforms (advertising).</li>
          <li>To meet legal obligations.</li>
        </List>
      </Block>

      <Block title="4. Who we share it with">
        <p>We don’t sell your personal data. We share it only with:</p>

        <List>
          <li>
            <strong>Payment processor:</strong> Paystack, to process your
            payment.
          </li>
          <li>
            <strong>Delivery and fulfilment partners:</strong> couriers and
            production or fulfilment partners who need your name, address and
            phone number to deliver your order.
          </li>
          <li>
            <strong>Analytics provider:</strong>{" "}
            <strong>Google Analytics</strong> (Google LLC), which helps us
            understand how visitors use our site. This only runs if you accept
            analytics cookies.
          </li>
          <li>
            <strong>Service providers:</strong> companies that host our
            website, store our data, and send our emails.
          </li>
          <li>
            <strong>Authorities,</strong> when required by law or to protect
            our rights and prevent fraud.
          </li>
        </List>

        <p>
          Our providers, including Google, may process data outside your
          country, including outside Nigeria. When we transfer data
          internationally, we take reasonable steps to make sure it stays
          protected.
        </p>
      </Block>

      <Block title="5. Cookies, analytics and advertising">
        <p>
          When you first visit, we show a cookie banner. You can accept all,
          reject non-essential cookies, or customise your choices. We use three
          types:
        </p>

        <List>
          <li>
            <strong>Essential cookies:</strong> needed for the site to work,
            such as keeping your cart and login. These can’t be switched off.
          </li>
          <li>
            <strong>Analytics cookies:</strong> set by{" "}
            <strong>Google Analytics</strong> to measure traffic and see which
            pages are used. These only run if you accept them. They collect
            information such as pages visited, device and browser type, and
            approximate location.
          </li>
          <li>
            <strong>Marketing and advertising cookies:</strong> used to measure
            our marketing and to show you relevant ads on other websites and
            platforms. These only run if you accept them.
          </li>
        </List>

        <p>
          <strong>Changing your mind:</strong> you can change your choices at
          any time by clicking <strong>Cookie Settings</strong> in the footer
          of any page. You can also delete cookies in your browser settings,
          though blocking some cookies may affect how the site works.
        </p>
      </Block>

      <Block title="6. Marketing emails">
        <p>
          If you subscribe or agree to marketing, we may email you about new
          drops, offers and news. You can unsubscribe at any time using the
          link in any email or by contacting us. Order and account emails (like
          receipts and delivery updates) will still be sent.
        </p>
      </Block>

      <Block title="7. How long we keep your data">
        <p>
          We keep your information only as long as needed to provide our
          services, meet legal and accounting requirements, resolve disputes,
          and enforce our policies. After that, we delete or anonymise it.
        </p>
      </Block>

      <Block title="8. Your rights">
        <p>Depending on where you live, you may have the right to:</p>

        <List>
          <li>Access the personal data we hold about you.</li>
          <li>Correct inaccurate data.</li>
          <li>Ask us to delete your data.</li>
          <li>Object to or restrict certain processing, including marketing.</li>
          <li>Withdraw consent at any time.</li>
          <li>Receive a copy of your data.</li>
        </List>

        <p>
          To use any of these rights, email {emailLink}. We may need to verify
          your identity first. If you’re unhappy with how we handle your data,
          you can also complain to your local data protection authority. In
          Nigeria, that is the Nigeria Data Protection Commission.
        </p>
      </Block>

      <Block title="9. Security">
        <p>
          We use reasonable technical and organisational measures to protect
          your data. No online system is completely secure, so we can’t
          guarantee absolute security, and you should keep your account
          password private.
        </p>
      </Block>

      <Block title="10. Age">
        <p>
          Our site is for people aged <strong>18 and over</strong>. We don’t
          knowingly collect data from anyone under 18. If you think a child has
          given us their data, contact us and we’ll delete it.
        </p>
      </Block>

      <Block title="11. Changes to this policy">
        <p>
          We may update this policy from time to time. The new version applies
          once it’s posted on this page with a new “Last updated” date. If
          changes are significant, we’ll let you know on the site or by email.
        </p>
      </Block>
    </InfoPage>
  );
}