/**
 * Stripe helpers for subscription checkout.
 * Products: Pro $4.95/mo, Elite $19.95/mo, Clan Ultra $49.99/mo
 * Webhook must be deployed separately (Vercel serverless or PC + Caddy).
 */

export const STRIPE_PRODUCTS = {
  pro: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || '',
  elite: process.env.NEXT_PUBLIC_STRIPE_ELITE_PRICE_ID || '',
  clanUltra: process.env.NEXT_PUBLIC_STRIPE_CLAN_ULTRA_PRICE_ID || '',
} as const

export function getCheckoutUrl(priceId: string, successUrl: string, cancelUrl: string, metadata?: Record<string, string>): string {
  const params = new URLSearchParams({
    'prefilled_promo_code': '',
    'client_reference_id': metadata?.user_id ?? '',
    'metadata[server_id]': metadata?.server_id ?? '',
  })
  return `https://checkout.stripe.com/c/pay/cs_placeholder?${params}` // Replace with Stripe Checkout session URL from your backend
}
