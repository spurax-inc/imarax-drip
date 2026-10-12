import type { Metadata } from "next";
import Link from "next/link";
import InfoPage, { Block } from "@/components/InfoPage";

export const metadata: Metadata = { title: "Help & Support | Imarax Drip" };

// =====================================================
//  EDIT YOUR WORDS HERE (change only the text in quotes)
//  Anything in [SQUARE BRACKETS] must be replaced.
// =====================================================

const EMAIL = "support@imaraxdrip.com";
const PHONE = "";
const HOURS = "[YOUR SUPPORT HOURS, e.g. Monday to Friday, 9am to 5pm]";

const FAQS = [
  {
    q: "How do I track my order?",
    a: "Sign in to your account and open the Your orders section. If you have a question about a specific order, email us with your order number.",
  },
  {
    q: "How do I pay?",
    a: "Payments are processed securely by Paystack when you check out. We never see or store your full card details.",
  },
  {
    q: "How long will delivery take?",
    a: "It depends on where you are. See our Shipping & returns page for the estimated times.",
  },
  {
    q: "Can I return something?",
    a: "Yes. You have 5 working days from the day you receive your order to request a return if it doesn’t fit, arrived damaged, or is the wrong item. See our Shipping & returns page for how it works.",
  },
  {
    q: "I entered the wrong address. What should I do?",
    a: "Contact us as soon as possible with your order number, and we will do our best to correct it before it ships.",
  },
];

// =====================================================
//  YOU DO NOT NEED TO EDIT ANYTHING BELOW THIS LINE
// =====================================================

export default function SupportPage() {
  return (
    <InfoPage label="Help & Support" title="How can we help?">
      <div className="rounded-sm border-t-4 border-signal bg-ash p-6">
        <p className="font-semibold text-[#111111]">Contact us</p>

        <p className="mt-3">
          Email:{" "}
          <a
            href={`mailto:${EMAIL}`}
            className="font-semibold text-signal underline underline-offset-4"
          >
            {EMAIL}
          </a>
        </p>

        {PHONE.trim() !== "" && <p className="mt-1">Phone: {PHONE}</p>}

        <p className="mt-1">Hours: {HOURS}</p>
      </div>

      <Block title="Frequently asked questions">
        <div className="space-y-6">
          {FAQS.map((item) => (
            <div key={item.q}>
              <p className="font-semibold text-[#111111]">{item.q}</p>
              <p className="mt-1">{item.a}</p>
            </div>
          ))}
        </div>
      </Block>

      <p>
        Looking for more? Read our{" "}
        <Link
          href="/returns"
          className="font-semibold text-signal underline underline-offset-4"
        >
          Shipping &amp; returns
        </Link>{" "}
        page.
      </p>
    </InfoPage>
  );
}