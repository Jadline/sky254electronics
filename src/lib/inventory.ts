/** Stock rules shared by the shop and the dashboard. */

/** At or below this many remaining, a counted product shows as low stock (and "Only N left" in the shop). */
export const LOW_STOCK = 3;

/** Order statuses whose units count as sold. Confirming an order takes its stock. */
export const SOLD_STATUSES = ["confirmed", "out_for_delivery", "completed"] as const;

export const isSoldStatus = (status: string) => (SOLD_STATUSES as readonly string[]).includes(status);
