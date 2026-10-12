import { STEPS, currentStep } from "@/lib/orderView";

export default function OrderTimeline({
  order,
}: {
  order: { status: string; fulfilment_status: string | null };
}) {
  const step = currentStep(order);

  return (
    <ol>
      {STEPS.map((item, index) => {
        const done = index < step;
        const current = index === step;
        const last = index === STEPS.length - 1;

        return (
          <li key={item.key} className="relative flex gap-4 pb-8 last:pb-0">
            {!last && (
              <span
                className={`absolute left-[11px] top-7 h-[calc(100%-1.75rem)] w-0.5 ${
                  done ? "bg-signal" : "bg-gray-200"
                }`}
              />
            )}

            <span
              className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                done
                  ? "bg-signal text-white"
                  : current
                  ? "border-4 border-signal bg-white"
                  : "border-2 border-gray-300 bg-white"
              }`}
            >
              {done ? "✓" : ""}
            </span>

            <div>
              <p
                className={`text-sm font-semibold ${
                  index > step ? "text-gray-400" : "text-[#111111]"
                }`}
              >
                {item.label}
              </p>

              {(current || done) && (
                <p className="mt-0.5 text-sm text-gray-500">{item.text}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}