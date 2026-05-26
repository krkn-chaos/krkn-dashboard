// Assisted-by: Cursor:Codex5.3
import { all, exec, get, run } from "./connection.js";

const MIGRATIONS = [
  {
    name: "001_schema_migrations",
    up: async () => {
      await exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
    },
  },
  {
    name: "002_users_groups",
    up: async () => {
      await exec(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE COLLATE NOCASE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'user', 'viewer')),
        must_change_password INTEGER NOT NULL DEFAULT 0,
        disabled INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
      await exec(`CREATE TABLE IF NOT EXISTS groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE COLLATE NOCASE,
        description TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
      await exec(`CREATE TABLE IF NOT EXISTS user_groups (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, group_id)
      )`);
    },
  },
  {
    name: "003_policies_kubeconfigs_audit",
    up: async () => {
      await exec(`CREATE TABLE IF NOT EXISTS policies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subject_type TEXT NOT NULL CHECK(subject_type IN ('user', 'group')),
        subject_id INTEGER NOT NULL,
        cluster_key TEXT NOT NULL,
        permission TEXT NOT NULL CHECK(permission IN ('view', 'run', 'cancel', 'admin')),
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(subject_type, subject_id, cluster_key, permission)
      )`);
      await exec(`CREATE TABLE IF NOT EXISTS kubeconfigs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        owner_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        group_id INTEGER REFERENCES groups(id) ON DELETE SET NULL,
        cluster_key TEXT NOT NULL,
        context_name TEXT,
        storage_path TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
      await exec(`CREATE TABLE IF NOT EXISTS audit_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER REFERENCES groups(id) ON DELETE SET NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action TEXT NOT NULL,
        resource_type TEXT,
        resource_id TEXT,
        metadata TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`);
      await exec(
        `CREATE INDEX IF NOT EXISTS idx_audit_group ON audit_events(group_id, created_at DESC)`
      );
    },
  },
  {
    name: "004_experiment_presets",
    up: async () => {
      const hasConfig = await get(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='config'`
      );
      const hasPresets = await get(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='experiment_presets'`
      );
      if (hasConfig && !hasPresets) {
        await exec(`ALTER TABLE config RENAME TO experiment_presets`);
      } else if (!hasPresets) {
        await exec(`CREATE TABLE IF NOT EXISTS experiment_presets (
          id INTEGER PRIMARY KEY,
          name varchar(50),
          params json
        )`);
      }
    },
  },
  {
    name: "005_past_runs",
    up: async () => {
      const hasDetails = await get(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='details'`
      );
      const hasPastRuns = await get(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='past_runs'`
      );

      if (!hasPastRuns) {
        await exec(`CREATE TABLE past_runs (
          container_id varchar(250) PRIMARY KEY,
          image varchar(150),
          mounts varchar(100),
          state varchar(20),
          status varchar(10),
          name varchar(50),
          content TEXT,
          stored_at TEXT,
          scenario_params TEXT,
          replay_of_container_id TEXT,
          run_kind TEXT DEFAULT 'original',
          group_id INTEGER REFERENCES groups(id),
          kubeconfig_id INTEGER REFERENCES kubeconfigs(id),
          started_by_user_id INTEGER REFERENCES users(id),
          cluster_key TEXT
        )`);
      }

      if (hasDetails && hasPastRuns) {
        const count = await get(`SELECT COUNT(*) AS c FROM past_runs`);
        if ((count?.c ?? 0) === 0) {
          await run(`INSERT INTO past_runs (
            container_id, image, mounts, state, status, name, content,
            stored_at, scenario_params, replay_of_container_id, run_kind
          )
          SELECT
            container_id, image, mounts, state, status, name, content,
            stored_at, scenario_params, replay_of_container_id, run_kind
          FROM details`);
        }
      } else if (hasDetails && !hasPastRuns) {
        // handled above
      } else if (!hasPastRuns) {
        await exec(`CREATE TABLE IF NOT EXISTS past_runs (
          container_id varchar(250) PRIMARY KEY,
          image varchar(150),
          mounts varchar(100),
          state varchar(20),
          status varchar(10),
          name varchar(50),
          content TEXT,
          stored_at TEXT,
          scenario_params TEXT,
          replay_of_container_id TEXT,
          run_kind TEXT DEFAULT 'original',
          group_id INTEGER REFERENCES groups(id),
          kubeconfig_id INTEGER REFERENCES kubeconfigs(id),
          started_by_user_id INTEGER REFERENCES users(id),
          cluster_key TEXT
        )`);
      }

      // Legacy details table columns (existing DBs)
      if (hasDetails) {
        for (const col of [
          "stored_at TEXT",
          "scenario_params TEXT",
          "replay_of_container_id TEXT",
          "run_kind TEXT DEFAULT 'original'",
        ]) {
          try {
            await run(`ALTER TABLE details ADD COLUMN ${col.split(" ")[0]} ${col.split(" ").slice(1).join(" ")}`);
          } catch (e) {
            if (!/duplicate column name/i.test(String(e?.message || ""))) {
              // ignore
            }
          }
        }
      }
    },
  },
  {
    name: "006_group_only_policies",
    up: async () => {
      await run(`DELETE FROM policies WHERE subject_type = 'user'`);
    },
  },
  {
    name: "007_user_groups_role",
    up: async () => {
      try {
        await run(
          `ALTER TABLE user_groups ADD COLUMN role TEXT NOT NULL DEFAULT 'user'`
        );
      } catch (e) {
        if (!/duplicate column name/i.test(String(e?.message || ""))) {
          throw e;
        }
      }
      await run(
        `UPDATE user_groups SET role = (
          SELECT u.role FROM users u WHERE u.id = user_groups.user_id
        )`
      );
    },
  },
  {
    name: "008_kubeconfigs_group_required",
    up: async () => {
      const defaultGroup = await get(
        `SELECT id FROM groups WHERE name = ? COLLATE NOCASE LIMIT 1`,
        ["default-group"]
      );
      const fallback = await get(`SELECT id FROM groups ORDER BY id LIMIT 1`);
      const gid = defaultGroup?.id ?? fallback?.id;
      if (gid) {
        await run(`UPDATE kubeconfigs SET group_id = ? WHERE group_id IS NULL`, [
          gid,
        ]);
      }
    },
  },
  {
    name: "009_platform_roles_admin_user",
    up: async () => {
      await run(`UPDATE users SET role = 'user' WHERE role = 'viewer'`);
    },
  },
  {
    name: "010_platform_users_not_group_admin",
    up: async () => {
      await run(
        `UPDATE user_groups SET role = 'user'
         WHERE role = 'admin'
           AND user_id IN (SELECT id FROM users WHERE role = 'user')`
      );
    },
  },
];

export async function runMigrations() {
  await MIGRATIONS[0].up();
  const applied = await all(`SELECT name FROM schema_migrations`);
  const appliedSet = new Set(applied.map((r) => r.name));

  for (const migration of MIGRATIONS) {
    if (appliedSet.has(migration.name)) continue;
    await migration.up();
    await run(`INSERT INTO schema_migrations (name) VALUES (?)`, [
      migration.name,
    ]);
    console.log(`[db] Applied migration: ${migration.name}`);
  }
}
