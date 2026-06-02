import { recordAudit } from "../db/audit.js";
import * as usersDb from "../db/users.js";
import { attachUserToSession } from "./session.js";
import { hashPassword, verifyPassword } from "./password.js";

const MIN_PASSWORD_LEN = 8;
const MAX_USERNAME_LEN = 64;

function normalizeUsername(value) {
  return String(value ?? "").trim();
}

function validateUsername(username) {
  if (!username) return "Username is required";
  if (username.length > MAX_USERNAME_LEN) {
    return `Username must be at most ${MAX_USERNAME_LEN} characters`;
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
    return "Username may only contain letters, numbers, dots, underscores, and hyphens";
  }
  return null;
}

export async function applySelfAccountUpdate(req, body) {
  const usernameInput = body?.username;
  const currentPassword = body?.currentPassword;
  const newPassword = body?.newPassword;

  const row = await usersDb.findById(req.user.id);
  if (!row) {
    const err = new Error("Not authenticated");
    err.status = 401;
    throw err;
  }

  const mustChange = row.must_change_password === 1;
  const trimmedUsername =
    usernameInput !== undefined && usernameInput !== null
      ? normalizeUsername(usernameInput)
      : null;
  const wantsUsername =
    trimmedUsername !== null &&
    trimmedUsername.toLowerCase() !== String(row.username).toLowerCase();
  const wantsPassword =
    newPassword !== undefined &&
    newPassword !== null &&
    String(newPassword).length > 0;

  if (!wantsUsername && !wantsPassword) {
    const err = new Error("No changes provided");
    err.status = 400;
    throw err;
  }

  if (wantsUsername) {
    const usernameError = validateUsername(trimmedUsername);
    if (usernameError) {
      const err = new Error(usernameError);
      err.status = 400;
      throw err;
    }
    const existing = await usersDb.findByUsername(trimmedUsername);
    if (existing && existing.id !== row.id) {
      const err = new Error("Username already exists");
      err.status = 409;
      throw err;
    }
  }

  if (wantsPassword && String(newPassword).length < MIN_PASSWORD_LEN) {
    const err = new Error(
      `New password must be at least ${MIN_PASSWORD_LEN} characters`
    );
    err.status = 400;
    throw err;
  }

  if (!mustChange && (wantsUsername || wantsPassword)) {
    const ok = await verifyPassword(currentPassword || "", row.password_hash);
    if (!ok) {
      const err = new Error("Current password is incorrect");
      err.status = 400;
      throw err;
    }
  }

  const updates = {};
  if (wantsUsername) updates.username = trimmedUsername;
  if (wantsPassword) {
    updates.passwordHash = await hashPassword(newPassword);
    updates.mustChangePassword = false;
  }

  await usersDb.updateUser(row.id, updates);

  if (wantsUsername) {
    await recordAudit({
      userId: row.id,
      action: "account.username_changed",
      resourceType: "user",
      resourceId: String(row.id),
      metadata: {
        previousUsername: row.username,
        newUsername: trimmedUsername,
      },
    });
  }
  if (wantsPassword) {
    await recordAudit({
      userId: row.id,
      action: "account.password_changed",
      resourceType: "user",
      resourceId: String(row.id),
    });
  }

  const updated = await usersDb.findById(row.id);
  return attachUserToSession(req, updated);
}
