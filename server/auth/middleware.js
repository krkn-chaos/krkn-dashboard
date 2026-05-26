// Assisted-by: Cursor:Codex5.3
import { loadSessionUser } from "./session.js";

const PUBLIC_PATHS = new Set([
  "/auth/login",
  "/auth/bootstrap-status",
  "/auth/initial-login-hint",
]);

export function isPublicPath(req) {
  if (PUBLIC_PATHS.has(req.path)) return true;
  return false;
}

export async function requireAuth(req, res, next) {
  if (isPublicPath(req)) return next();

  const user = req.session?.user || (await loadSessionUser(req));
  if (!user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  req.user = user;
  if (!req.session.user) req.session.user = user;
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}
