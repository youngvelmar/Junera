import crypto from "node:crypto";

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

function signPart(data, secret) {
  return crypto.createHmac("sha256", secret).update(data).digest("base64url");
}

export function createToken(payload, expiresInSeconds = 86400) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is missing");

  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(JSON.stringify({
    ...payload,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  }));
  const signature = signPart(`${header}.${body}`, secret);
  return `${header}.${body}.${signature}`;
}

export function verifyToken(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Authentification requise" });

    const [header, body, signature] = token.split(".");
    if (!header || !body || !signature) {
      return res.status(401).json({ message: "Token invalide" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET is missing");

    const expected = signPart(`${header}.${body}`, secret);
    const valid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    if (!valid) return res.status(401).json({ message: "Token invalide" });

    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return res.status(401).json({ message: "Session expirée" });
    }

    req.user = payload;
    next();
  } catch (error) {
    console.error("AUTH MIDDLEWARE ERROR:", error.message);
    res.status(401).json({ message: "Authentification invalide" });
  }
}
