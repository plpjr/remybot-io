/**
 * Cloudflare Pages Function: /api/btc-price
 *
 * Fetches BTC nano futures (BIP) price from Coinbase Advanced Trade API
 * using JWT auth with EC keys (ES256) via Web Crypto API.
 * Falls back to public spot BTC-USD if keys are missing or futures call fails.
 */

interface Env {
  COINBASE_API_KEY_ID?: string;
  COINBASE_API_PRIVATE_KEY?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function base64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlEncode(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Strip PEM headers and decode to ArrayBuffer */
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const lines = pem
    .replace(/-----BEGIN[^-]+-----/g, "")
    .replace(/-----END[^-]+-----/g, "")
    .replace(/\s+/g, "");
  const binary = atob(lines);
  const buf = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
  return buf.buffer;
}

// ─── JWT Builder (Web Crypto, ES256) ─────────────────────────────────

async function buildJWT(apiKeyId: string, privateKeyPem: string, uri: string): Promise<string> {
  const keyData = pemToArrayBuffer(privateKeyPem);
  const key = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );

  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "ES256",
    kid: apiKeyId,
    nonce: crypto.randomUUID(),
    typ: "JWT",
  };
  const payload = {
    sub: apiKeyId,
    iss: "cdp",
    aud: ["cdp_service"],
    nbf: now,
    exp: now + 120,
    uris: [uri],
  };

  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(signingInput),
  );

  return `${signingInput}.${base64url(signature)}`;
}

// ─── Spot fallback (public, no auth) ─────────────────────────────────

async function fetchSpotPrice(): Promise<{ price: number; product: string; source: "spot"; timestamp: string }> {
  const res = await fetch("https://api.exchange.coinbase.com/products/BTC-USD/ticker", {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Spot API ${res.status}`);
  const data: { price: string } = await res.json();
  return {
    price: parseFloat(data.price),
    product: "BTC-USD",
    source: "spot",
    timestamp: new Date().toISOString(),
  };
}

// ─── Handler ─────────────────────────────────────────────────────────

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const apiKeyId = context.env.COINBASE_API_KEY_ID;
    const privateKey = context.env.COINBASE_API_PRIVATE_KEY;

    // If no keys configured, fall back to spot
    if (!apiKeyId || !privateKey) {
      const spot = await fetchSpotPrice();
      return new Response(JSON.stringify(spot), { headers });
    }

    // Attempt authenticated futures fetch
    try {
      const uri = "GET /api/v3/brokerage/market/products/BTC-USD-301220";
      const jwt = await buildJWT(apiKeyId, privateKey, uri);

      const res = await fetch(
        "https://api.coinbase.com/api/v3/brokerage/market/products/BTC-USD-301220",
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            Accept: "application/json",
          },
        },
      );

      if (!res.ok) throw new Error(`Futures API ${res.status}`);
      const data = await res.json();
      const price = parseFloat((data as Record<string, string>).price ?? (data as Record<string, string>).mid_market ?? "0");

      if (!price || isNaN(price)) throw new Error("No price in futures response");

      return new Response(
        JSON.stringify({
          price,
          product: "BTC-USD-301220",
          source: "futures",
          timestamp: new Date().toISOString(),
        }),
        { headers },
      );
    } catch {
      // Futures failed — silent fallback to spot
      const spot = await fetchSpotPrice();
      return new Response(JSON.stringify(spot), { headers });
    }
  } catch {
    // Everything failed
    return new Response(
      JSON.stringify({ price: null, product: null, source: null, timestamp: new Date().toISOString(), error: "unavailable" }),
      { status: 502, headers },
    );
  }
};
