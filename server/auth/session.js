// Assisted-by: Cursor:Codex5.3
import session from "express-session";

const isProd = process.env.NODE_ENV === "production";

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET?.trim();
  if (secret) return secret;
  if (isProd) {
    throw new Error("SESSION_SECRET must be set in production");
  }
  return "krkn-dashboard-dev-session-secret-change-me";
}

export function createSessionMiddleware() {
  return session({
    secret: getSessionSecret(),
    resave: false,
    saveUninitialized: false,
    name: "krkn.sid",
    cookie: {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  });
}

export async function loadSessionUser(req) {
  const sid = req.session?.userId;
  if (!sid) return null;
  const { findById, getUserGroupMemberships, toPublicUser } = await import(
    "../db/users.js"
  );
  const row = await findById(sid);
  if (!row || row.disabled) return null;
  const groupMemberships = await getUserGroupMemberships(row.id);
  return {
    ...toPublicUser(row),
    groupMemberships,
    groupIds: groupMemberships.map((m) => m.groupId),
  };
}

export async function attachUserToSession(req, userRow) {
  const { getUserGroupMemberships, toPublicUser } = await import(
    "../db/users.js"
  );
  const groupMemberships = await getUserGroupMemberships(userRow.id);
  req.session.userId = userRow.id;
  req.session.user = {
    ...toPublicUser(userRow),
    groupMemberships,
    groupIds: groupMemberships.map((m) => m.groupId),
  };
  return req.session.user;
}
