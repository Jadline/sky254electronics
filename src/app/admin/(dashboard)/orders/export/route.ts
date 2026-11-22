import { getAdmin } from "@/lib/admin-auth";
import { DELIVERY, ORDER_STATUS, PAID_VIA, PAYMENT_METHOD, PAYMENT_STATE, paymentState, prettyPhone, type DeliveryMethod, type OrderStatus, type PaymentMethod } from "@/lib/admin/orders";

// A spreadsheet runs a cell that starts with = + - @ as a formula, so those get a leading quote.
const cell = (v: string | number) => {
  const s = String(v);
  return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
};

type Row = {
  order_number: string;
  created_at: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  delivery_method: DeliveryMethod;
  delivery_option_name: string | null;
  delivery_address: string | null;
  paid_via: keyof typeof PAID_VIA | null;
  payment_reference: string | null;
  subtotal_kes: number;
  delivery_fee_kes: number | null;
  total_kes: number;
  order_items: { product_name: string; qty: number }[];
};

/** GET /admin/orders/export: every order as CSV, newest first. Admin only. */
export async function GET() {
  const admin = await getAdmin();
  if (!admin) return new Response("Not found", { status: 404 });

  const { data, error } = await admin.supabase
    .from("orders")
    .select(
      "*, order_items(product_name, qty)",
    )
    .order("created_at", { ascending: false })
    .limit(10000);
  if (error) return new Response("Couldn't load the orders.", { status: 500 });

  const rows: (string | number)[][] = [
    ["order_number", "placed", "customer", "phone", "email", "delivery", "address", "items", "subtotal_kes", "delivery_kes", "total_kes", "payment_method", "payment", "paid_via", "mpesa_code", "status"],
    ...(data as unknown as Row[]).map((o) => [
      o.order_number,
      o.created_at,
      o.customer_name,
      prettyPhone(o.customer_phone),
      o.customer_email ?? "",
      o.delivery_option_name ?? DELIVERY[o.delivery_method]?.label ?? o.delivery_method,
      o.delivery_address ?? "",
      o.order_items.map((i) => `${i.qty} x ${i.product_name}`).join("; "),
      o.subtotal_kes,
      o.delivery_fee_kes ?? "",
      o.total_kes,
      PAYMENT_METHOD[o.payment_method] ?? o.payment_method,
      PAYMENT_STATE[paymentState(o)].label,
      o.paid_via ? PAID_VIA[o.paid_via] : "",
      o.payment_reference ?? "",
      ORDER_STATUS[o.status]?.label ?? o.status,
    ]),
  ];
  const csv = rows.map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sky254-orders-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
