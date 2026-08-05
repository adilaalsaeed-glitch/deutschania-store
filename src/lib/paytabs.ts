// PayTabs Hosted Payment Page integration.
// Docs: https://docs.paytabs.com/manuals/PT-API-Endpoints/Integration-Types-Manuals/Hosted-Payment-Page/

const REGION_ENDPOINTS: Record<string, string> = {
  SAU: "https://secure.paytabs.sa/payment/request",
  ARE: "https://secure.paytabs.com/payment/request",
  EGY: "https://secure-egypt.paytabs.com/payment/request",
  OMN: "https://secure-oman.paytabs.com/payment/request",
  JOR: "https://secure-jordan.paytabs.com/payment/request",
  KWT: "https://secure-kuwait.paytabs.com/payment/request",
  IRQ: "https://secure-iraq.paytabs.com/payment/request",
  MAR: "https://secure-morocco.paytabs.com/payment/request",
  QAT: "https://secure-doha.paytabs.com/payment/request",
  GLOBAL: "https://secure-global.paytabs.com/payment/request",
};

export type CreateHostedPaymentInput = {
  cartId: string;
  cartDescription: string;
  amount: number; // in major currency units, e.g. 49.99
  currency: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  returnUrl: string;
  callbackUrl: string;
  lang?: "en" | "ar";
};

export type PayTabsHostedPaymentResponse = {
  tran_ref: string;
  redirect_url: string;
  cart_id: string;
};

export async function createHostedPaymentPage(
  input: CreateHostedPaymentInput
): Promise<PayTabsHostedPaymentResponse> {
  const profileId = process.env.PAYTABS_PROFILE_ID;
  const serverKey = process.env.PAYTABS_SERVER_KEY;
  const region = process.env.PAYTABS_REGION ?? "ARE";
  const endpoint = REGION_ENDPOINTS[region] ?? REGION_ENDPOINTS.ARE;

  if (!profileId || !serverKey) {
    throw new Error("PAYTABS_PROFILE_ID and PAYTABS_SERVER_KEY must be set to create a payment.");
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: serverKey,
    },
    body: JSON.stringify({
      profile_id: Number(profileId),
      tran_type: "sale",
      tran_class: "ecom",
      cart_id: input.cartId,
      cart_description: input.cartDescription,
      cart_currency: input.currency,
      cart_amount: input.amount,
      customer_details: {
        name: input.customerName,
        email: input.customerEmail,
        phone: input.customerPhone ?? "",
      },
      return: input.returnUrl,
      callback: input.callbackUrl,
      paypage_lang: input.lang ?? "en",
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`PayTabs request failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  if (!data.redirect_url) {
    throw new Error(`PayTabs response missing redirect_url: ${JSON.stringify(data)}`);
  }

  return { tran_ref: data.tran_ref, redirect_url: data.redirect_url, cart_id: data.cart_id };
}
