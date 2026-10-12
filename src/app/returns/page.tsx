import type { Metadata } from "next";
import InfoPage, { Block, List, SubBlock } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Shipping & Returns | Imarax Drip",
};

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

export default function ReturnsPage() {
  return (
    <InfoPage
      label="Policy"
      title="Shipping & Returns Policy"
      updated={UPDATED}
    >
      <Block title="Shipping">
        <p>
          We ship worldwide. Delivery times are counted from the day your order
          is dispatched:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-black/20 text-[#111111]">
                <th className="py-3 pr-6 font-semibold">Destination</th>
                <th className="py-3 font-semibold">Estimated delivery</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-black/10">
              <tr>
                <td className="py-3 pr-6">Within Nigeria</td>
                <td className="py-3">Within 72 hours</td>
              </tr>
              <tr>
                <td className="py-3 pr-6">Within Africa</td>
                <td className="py-3">5 to 10 working days</td>
              </tr>
              <tr>
                <td className="py-3 pr-6">Rest of the world</td>
                <td className="py-3">10 to 21 working days</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          These are estimates, not guarantees. Customs, weather and courier
          delays can happen. Please give a correct address and phone number,
          because we can’t be responsible for orders delayed or lost due to
          wrong details.
        </p>

        <p>
          <strong>International orders:</strong> customs charges, taxes and
          import duties in your country are your responsibility unless stated
          at checkout.
        </p>
      </Block>

      <Block title="Returns">
        <p>
          You have <strong>5 working days from the day you receive your order</strong>{" "}
          to request a return if:
        </p>

        <List>
          <li>
            The item <strong>doesn’t fit</strong> or is the wrong size for you.
          </li>
          <li>
            The item <strong>arrived damaged</strong> from shipping.
          </li>
          <li>
            We sent you the <strong>wrong item</strong>.
          </li>
        </List>

        <p>
          To request a return, email {emailLink} with your order number and,
          for damaged items, clear photos of the item and packaging. We’ll
          reply with instructions.
        </p>

        <SubBlock title="Size and fit returns">
          <p>
            The item must be unworn, unwashed, and in its original condition
            and packaging.
          </p>
        </SubBlock>

        <SubBlock title="Wrong or damaged items">
          <p>
            If we sent the wrong item or it arrived damaged, we’ll replace it,
            or you can return the item we sent and we’ll refund you. We cover
            the return shipping in these cases.
          </p>
        </SubBlock>

        <SubBlock title="Refunds">
          <p>
            Approved refunds are sent to your original payment method within 7
            to 10 working days after we receive the returned item.
          </p>
        </SubBlock>

        <SubBlock title="What we can’t accept">
          <p>
            We can’t accept returns after the 5-day window, or for items that
            have been worn, washed or altered.
          </p>
        </SubBlock>
      </Block>
    </InfoPage>
  );
}