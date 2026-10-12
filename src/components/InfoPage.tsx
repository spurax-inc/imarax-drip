import type { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";

export function Block({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold tracking-tight text-[#111111]">
        {title}
      </h2>

      <div className="mt-3 space-y-4">{children}</div>
    </div>
  );
}

export function SubBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h3 className="text-base font-bold text-[#111111]">{title}</h3>

      <div className="mt-2 space-y-3">{children}</div>
    </div>
  );
}

export function List({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-2 pl-6">{children}</ul>;
}

export default function InfoPage({
  label,
  title,
  updated,
  children,
}: {
  label: string;
  title: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-white text-[#111111]">
      <Header />

      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-signal">
            {label}
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            {title}
          </h1>

          {updated && (
            <p className="mt-3 text-xs text-gray-500">Last updated: {updated}</p>
          )}

          <div className="mt-10 space-y-8 text-[15px] leading-8 text-gray-600">
            {children}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}