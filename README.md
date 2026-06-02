# krkn-dashboard

krkn Dashboard is the visualization component of [krkn-hub](https://github.com/redhat-chaos/krkn-hub/tree/main). It offers a set of user-friendly web interfaces through which users can manipulate and observe Chaos experiments.

## Prerequisites

Before building or running, check available releases at: https://github.com/krkn-chaos/krkn-dashboard/releases

## Run

For installation and run instructions (standalone and container), see the [Krkn documentation](https://krkn-chaos.dev/docs/installation/krkn-dashboard/).

## Dashboard directory structure

### public

Contains the root application `index.html` and React template artifacts.

### server

The source for an NPM express server that's used in developer mode.

### src

The krkn dashboard Javascript source plus additional CSS/LESS and artifacts.

#### assets

Assets placed in the `src/assets/images` directory are only referenced within component or layout definitions and are packaged in the generated `***.js` file during the build process.

#### reducers

Contains functions that manage store via actions.

#### utils

Helper functions for the dashboard.


## Storage

krkn dashboard stores data using local browser storage and cookies. When run in a container, the SQLite database is stored in the mounted `database` directory (or `/data` inside the container).

## Users and access control

On first startup the server creates SQLite tables for users, groups, policies, past runs, and kubeconfigs. An initial **admin** account is generated automatically; credentials are printed once to the server log and written to `database/INITIAL_ADMIN.txt` (gitignored). Sign in at `/login`. You can change your password anytime under **Account Settings**.

**Optional initial admin credentials** (only when the database has no users yet):

| Variable | Description |
|----------|-------------|
| `DASHBOARD_ADMIN_USERNAME` | Username for the first admin (default: random `admin-xxxx`) |
| `DASHBOARD_ADMIN_PASSWORD` | Password for the first admin (default: random) |

For local development, set these in a `.env` file in the project root (`npm run dev` loads it automatically). Example:

```bash
DASHBOARD_ADMIN_USERNAME=admin
DASHBOARD_ADMIN_PASSWORD=your-secure-password
```

For Podman, export them or pass arguments to `containers/podman-run.sh`:

```bash
./containers/podman-run.sh admin 'your-secure-password'
```

- **Platform roles:** `admin` (user/group administration, full access) or `user` (run experiments, view data; may upload group kubeconfigs only).
- **Groups:** Past runs are scoped to groups; members have a **group role** (group user or group viewer for platform user accounts; platform admins may also be group admins). Roles control run/view/cancel within that group via policies.
- **Policies:** Grant `view`, `run`, `cancel`, or `admin` per cluster key (API server URL from kubeconfig) to groups in **Administration**.
- **Kubeconfigs:** Platform admins manage kubeconfigs in **Administration**. Any group member can upload kubeconfigs for their groups under **Account Settings**; group admins can rename or delete them on **Manage group**.

Set `SESSION_SECRET` in production for session cookie signing.

## Template

This application is based on v5 of PatternFly which is a production-ready UI solution for admin interfaces. For more information regarding the foundation and template of the application, please visit [PatternFly](https://www.patternfly.org/get-started/develop) 

## Resources

- [Vite](https://vitejs.dev/guide/)   

- [ReactJS](https://reactjs.org/) 

- [React-Redux](https://github.com/reduxjs/react-redux)
