export type OrderView = {
  reference: string;
  key: string;
  status: string;
  fulfilment_status: string | null;
  tracking_note: string | null;
  created_at: string;
  paid_at: string | null;
  shipped_at: string | null;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  subtotal: number;
  currency: string;
  items: {
    name: string;
    size: string | null;
    color: string | null;
    quantity: number;
    unit_price: number;
  }[];
};

export const STEPS = [
  {
    key: "confirmed",
    label: "Order confirmed",
    text: "We have your payment and your order.",
  },
  {
    key: "packed",
    label: "Packed",
    text: "Your order is being prepared.",
  },
  {
    key: "shipped",
    label: "On the way",
    text: "Your order has shipped and is on its way to you.",
  },
  {
    key: "delivered",
    label: "Delivered",
    text: "Your order has arrived.",
  },
];

// -1 means the order has not been paid yet.
export function currentStep(order: {
  status: string;
  fulfilment_status: string | null;
}): number {
  if (order.status !== "paid") return -1;

  switch (order.fulfilment_status) {
    case "packed":
      return 1;
    case "shipped":
      return 2;
    case "delivered":
      return 3;
    default:
      return 0;
  }
}

export async function fetchOrder(params: {
  reference: string;
  key?: string;
  email?: string;
}): Promise<{ order: OrderView | null; error: string }> {
  const query = new URLSearchParams({ reference: params.reference });

  if (params.key) query.set("key", params.key);
  if (params.email) query.set("email", params.email);

  try {
    const res = await fetch(`/api/orders/lookup?${query.toString()}`);
    const json = await res.json();

    if (!res.ok) {
      return {
        order: null,
        error: json.error ?? "We could not find that order.",
      };
    }

    return { order: json.order as OrderView, error: "" };
  } catch {
    return { order: null, error: "Network error. Please try again." };
  }
}