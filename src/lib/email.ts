const SUPPORT_EMAIL = "support@imaraxdrip.com";

export type EmailOrder = {
  reference: string;
  full_name: string;
  email: string;
  phone?: string | null;
  address: string;
  city: string;
  state: string;
  country: string;
  subtotal: number;
  currency: string;
  tracking_note?: string | null;
  trackUrl?: string | null;
  items: {
    name: string;
    size: string | null;
    color: string | null;
    quantity: number;
    unit_price: number;
  }[];
};

function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function money(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

export function emailConfigured() {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim()
  );
}

// Returns true when an email was actually sent.
export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  if (!emailConfigured()) return false;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [input.to],
      subject: input.subject,
      html: input.html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Email failed (${res.status}): ${text.slice(0, 200)}`);
  }

  return true;
}

function layout(title: string, body: string) {
  return `
<div style="background:#f3f3f3;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#111111">
  <div style="max-width:560px;margin:0 auto;background:#ffffff">
    <div style="background:#111111;padding:20px 24px;border-bottom:4px solid #d2561f">
      <span style="color:#ffffff;font-size:20px;font-weight:bold;letter-spacing:1px">IMARAX</span>
      <span style="color:#d2561f;font-size:20px"> dRip</span>
    </div>
    <div style="padding:28px 24px;font-size:14px;line-height:22px">
      <h1 style="margin:0 0 16px;font-size:22px">${esc(title)}</h1>
      ${body}
    </div>
    <div style="padding:16px 24px;background:#111111;color:#8c8c8c;font-size:12px">
      Imarax Drip is a brand of Spurax Inc. Questions? ${SUPPORT_EMAIL}
    </div>
  </div>
</div>`;
}

function trackButton(order: EmailOrder) {
  if (!order.trackUrl) return "";

  return `<p style="margin:20px 0"><a href="${esc(
    order.trackUrl
  )}" style="background:#d2561f;color:#ffffff;padding:12px 20px;text-decoration:none;font-weight:bold;display:inline-block">View receipt &amp; track your order</a></p>`;
}

function itemsTable(order: EmailOrder) {
  const rows = order.items
    .map((item) => {
      const options = [item.size, item.color].filter(Boolean).join(" / ");

      return `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #eeeeee">${esc(item.name)} × ${item.quantity}${
          options ? `<br><span style="color:#777777;font-size:12px">${esc(options)}</span>` : ""
        }</td>
        <td style="padding:8px 0;border-bottom:1px solid #eeeeee;text-align:right">${money(
          item.unit_price * item.quantity,
          order.currency
        )}</td>
      </tr>`;
    })
    .join("");

  return `<table style="width:100%;border-collapse:collapse;margin:16px 0">${rows}
    <tr>
      <td style="padding:12px 0;font-weight:bold">Total</td>
      <td style="padding:12px 0;text-align:right;font-weight:bold">${money(
        order.subtotal,
        order.currency
      )}</td>
    </tr></table>`;
}

function addressBlock(order: EmailOrder) {
  return `${esc(order.full_name)}<br>${esc(order.address)}<br>${esc(
    order.city
  )}, ${esc(order.state)}<br>${esc(order.country)}`;
}

export function confirmationEmail(order: EmailOrder) {
  const first = order.full_name.trim().split(/\s+/)[0] || "there";

  return {
    subject: `Your Imarax Drip order ${order.reference} is confirmed`,
    html: layout(
      `Thank you, ${first}. Your order is confirmed.`,
      `<p>We have received your payment. Your order number is <strong>${esc(
        order.reference
      )}</strong>.</p>
       ${itemsTable(order)}
       <p style="margin:0 0 6px"><strong>Delivering to</strong></p>
       <p style="margin:0 0 16px">${addressBlock(order)}</p>
       ${trackButton(order)}
       <p>We will email you again when your order ships.</p>`
    ),
  };
}

export function adminAlertEmail(order: EmailOrder) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3003";

  return {
    subject: `New order ${order.reference} (${money(order.subtotal, order.currency)})`,
    html: layout(
      "New paid order",
      `<p><strong>${esc(order.reference)}</strong></p>
       ${itemsTable(order)}
       <p style="margin:0 0 6px"><strong>Customer</strong></p>
       <p style="margin:0 0 16px">${addressBlock(order)}<br>${esc(
         order.email
       )}${order.phone ? `<br>${esc(order.phone)}` : ""}</p>
       <p><a href="${siteUrl}/admin/orders" style="color:#d2561f;font-weight:bold">Open the fulfilment page</a></p>`
    ),
  };
}

export function shippedEmail(order: EmailOrder) {
  const first = order.full_name.trim().split(/\s+/)[0] || "there";

  return {
    subject: `Your Imarax Drip order ${order.reference} is on its way`,
    html: layout(
      `Good news, ${first}. Your order is on its way.`,
      `<p>Your order <strong>${esc(order.reference)}</strong> has shipped.</p>
       ${
         order.tracking_note
           ? `<p style="margin:16px 0;padding:12px;background:#f3f3f3"><strong>Tracking:</strong> ${esc(
               order.tracking_note
             )}</p>`
           : ""
       }
       ${itemsTable(order)}
       <p style="margin:0 0 6px"><strong>Delivering to</strong></p>
       <p>${addressBlock(order)}</p>
       ${trackButton(order)}`
    ),
  };
}