/** What a contact-form message is about. Shared by the form, the action and the dashboard. */
export const ENQUIRY_TOPICS = {
  general: "General question",
  product: "A product or price",
  order: "An order I placed",
  warranty: "Warranty or a return",
} as const;
export type EnquiryTopic = keyof typeof ENQUIRY_TOPICS;

export const isEnquiryTopic = (value: string): value is EnquiryTopic => Object.hasOwn(ENQUIRY_TOPICS, value);

export const ENQUIRY_LIMITS = { name: 100, email: 200, message: 3000 };
