/**
 * Cloudflare Pages Function: /api/btc-price
 *
 * Fetches BTC futures price from Coinbase Advanced Trade API using JWT auth.
 * Dynamically selects the next quarterly expiry contract (Mar, Jun, Sep, Dec).
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

/** Determine the next quarterly futures contract expiry (Mar, Jun, Sep, Dec) */
function getNextQuarterlyContract(): string {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();
  
  // Quarterly expirations: March (3), June (6), September (9), December (12)
  const quarters = [3, 6, 9, 12];
  
  // Find the next quarter
  let expireMonth = quarters.find(q => q > currentMonth);
  let expireYear = currentYear;
  
  if (!expireMonth) {
    // Current quarter has passed; use first quarter of next year
    expireMonth = quarters[0];
    expireYear = currentYear + 1;
  }
  
  const monthStr = String(expireMonth).padStart(2, "0");
  const yearStr = String(expireYear).slice(-2);
  
  return `BTC-USD-${monthStr}${yearStr}`;
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

    // Attempt authenticated futures fetch with dynamic quarterly contract
    try {
      const product = getNextQuarterlyContract();
      const uri = `GET /api/v3/brokerage/market/products/${product}`;
      const jwt = await buildJWT(apiKeyId, privateKey, uri);

      const res = await fetch(
        `https://api.coinbase.com/api/v3/brokerage/market/products/${product}`,
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
          product,
          source: "futures",
          timestamp: new Date().toISOString(),
        }),
        { headers },
      );
    } catch (err) {
      // Futures failed — log error and fall back to spot
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`[btc-price] Futures fetch failed: ${errorMsg}`);
      try {
        const spot = await fetchSpotPrice();
        return new Response(JSON.stringify(spot), { headers });
      } catch (spotErr) {
        const spotErrorMsg = spotErr instanceof Error ? spotErr.message : String(spotErr);
        console.error(`[btc-price] Spot fallback also failed: ${spotErrorMsg}`);
        throw spotErr;
      }
    }
  } catch (err) {
    // Everything failed
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[btc-price] All price sources failed: ${errorMsg}`);
    return new Response(
      JSON.stringify({
        price: null,
        product: null,
        source: null,
        timestamp: new Date().toISOString(),
        error: "unavailable",
        details: errorMsg,
      }),
      { status: 502, headers },
    );
  }
};
