import type { DeliveryMethod } from "@/lib/order-labels";

/** A way to deliver, from Delivery in the dashboard. */
export type DeliveryOption = {
  id: string;
  name: string;
  areas: string | null;
  town: string | null;
  /** null = the shop confirms the fee by phone. */
  costKes: number | null;
  /** The shop's own rider: the customer can pay on delivery. Otherwise a courier, paid by M-Pesa first. */
  ownRider: boolean;
};

/** Somewhere to collect an order. Always free. */
export type PickupPoint = { id: string; name: string; address: string | null; hours: string | null };

/** What checkout offers: the options and pickup points switched on, and the free-delivery amount. */
export type DeliveryChoices = { options: DeliveryOption[]; pickupPoints: PickupPoint[]; freeOver: number | null };

/** The customer's choice, as checkout sends it: "option:<id>" or "pickup:<id>". */
export type DeliveryChoice = { kind: "option"; option: DeliveryOption } | { kind: "pickup"; point: PickupPoint };

export function findChoice(choices: DeliveryChoices, value: string): DeliveryChoice | null {
  const [kind, id] = value.split(":");
  if (kind === "option") {
    const option = choices.options.find((o) => o.id === id);
    return option ? { kind, option } : null;
  }
  if (kind === "pickup") {
    const point = choices.pickupPoints.find((p) => p.id === id);
    return point ? { kind, point } : null;
  }
  return null;
}

/** The fee for a choice, or null when the shop confirms it by phone. Pickup is free. */
export function choiceFee(choice: DeliveryChoice, payable: number, freeOver: number | null): number | null {
  if (choice.kind === "pickup") return 0;
  if (freeOver != null && payable >= freeOver) return 0;
  return choice.option.costKes;
}

/** How the order is stored: own rider, courier or pickup. */
export function choiceMethod(choice: DeliveryChoice): DeliveryMethod {
  if (choice.kind === "pickup") return "pickup";
  return choice.option.ownRider ? "nairobi" : "countrywide";
}

/**
 * One delivery price for Google, which takes a single rate: the dearest courier (it
 * reaches anywhere), else the dearest own-rider option. null when none has a fixed cost.
 */
export function shippingRate(choices: DeliveryChoices): number | null {
  const costs = (ownRider: boolean) => choices.options.filter((o) => o.ownRider === ownRider && o.costKes != null).map((o) => o.costKes!);
  const courier = costs(false);
  const rider = courier.length ? courier : costs(true);
  return rider.length ? Math.max(...rider) : null;
}

export const choiceName =(choice: DeliveryChoice) => (choice.kind === "pickup" ? choice.point.name : choice.option.name);
