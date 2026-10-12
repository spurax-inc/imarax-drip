import type { Metadata } from "next";
import Link from "next/link";
import InfoPage, { Block, List } from "@/components/InfoPage";

export const metadata: Metadata = { title: "About | Imarax Drip" };

const EMAIL = "support@imaraxdrip.com";

export default function AboutPage() {
  return (
    <InfoPage label="About" title="About Imarax Drip">
      <p className="text-xl font-bold leading-8 text-[#111111]">
        Imagine it. Wear it. Express it.
      </p>

      <Block title="Style for everyone">
        <p>
          Imarax Drip is a streetwear and casual clothing brand built on one
          idea: everyone deserves to wear what feels like them. We design for
          all styles and for everyone. Nobody is left behind and nobody is left
          out. Whatever you bring, we help you wear it your way.
        </p>
      </Block>

      <Block title="Where the name comes from">
        <p>
          Our name comes from a passion for visibility, for putting yourself
          out there and expressing who you are. That doesn’t stop at the
          street. Self-expression belongs in the corporate world too. You
          shouldn’t have to wear the same plain outfit and blend into the
          background to be taken seriously. Imarax Drip exists so you can show
          up as yourself, anywhere.
        </p>
      </Block>

      <Block title="Our story">
        <p>
          Imarax Drip started from a simple thought: wear what you want. Many
          people have a clear idea of what they want to wear, a message or a
          style that says “this is who I am.” But they don’t know where to find
          it, or they feel society won’t accept it. We’re here to bridge that
          gap.
        </p>

        <p>
          We didn’t set out to open another store. We set out to make an
          impact. We believe that when you can wear exactly what you imagine,
          you walk differently, and you feel more like yourself.
        </p>
      </Block>

      <Block title="What we stand for">
        <List>
          <li>
            <strong>Self-expression:</strong> your style is yours, and we help
            you wear it with confidence.
          </li>
          <li>
            <strong>Inclusivity:</strong> every style, every person, no
            exceptions.
          </li>
          <li>
            <strong>Quality:</strong> we’re not just making clothes, we’re
            making passion. Every piece is made to look and feel top notch.
          </li>
          <li>
            <strong>Imagination:</strong> whatever you picture yourself
            wearing, we want to help you bring it to life.
          </li>
        </List>
      </Block>

      <Block title="Who we are">
        <p>
          Imarax Drip is a brand operated by <strong>Spurax Inc</strong>, a
          company based in Nigeria that builds brands and platforms serving
          customers around the world. We ship worldwide, so wherever you are,
          you can express yourself with us.
        </p>

        <p className="font-bold text-[#111111]">
          You express yourself. You imagine it. You wear it.
        </p>

        <p>
          Questions or ideas? Contact us at{" "}
          <a
            href={`mailto:${EMAIL}`}
            className="font-semibold text-signal underline underline-offset-4"
          >
            {EMAIL}
          </a>
          .
        </p>
      </Block>

      <div>
        <Link
          href="/shop"
          className="inline-block rounded-full bg-signal px-8 py-4 text-sm font-semibold text-white transition hover:bg-signal-dark"
        >
          Shop the drop
        </Link>
      </div>
    </InfoPage>
  );
}