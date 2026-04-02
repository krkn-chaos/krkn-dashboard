// Fetches Grafana dashboard list on the server (avoids CORS); client matches titles to scenario_type.

// Match /d/<uid> or /d/<uid>/<slug> inside a path or href string.
const D_PATH_RE = /\/d\/([^"'?#\s]+(?:\/[^"'?#\s]+)?)/;

// Return the path after /d/ from a relative href or full URL, or null if not a dashboard link.
function extractDashboardPathFromHref(href) {
  if (!href) return null;
  try {
    const pathOnly = href.startsWith("http")
      ? new URL(href).pathname
      : href;
    const m = pathOnly.match(D_PATH_RE);
    if (!m) return null;
    return m[1].replace(/\/+$/, "");
  } catch {
    return null;
  }
}

// Try Grafana JSON search API first, then scrape /dashboards HTML for /d/ links.
export async function fetchGrafanaDashboardList(baseUrl) {
  const base = String(baseUrl || "").trim().replace(/\/+$/, "");
  if (!base) {
    return { source: "none", dashboards: [], error: "empty baseUrl" };
  }

  const dashboards = [];
  const seen = new Set();

  // Dedupe: add one { title, path } per unique dashboard path.
  const push = (title, path) => {
    if (!path || seen.has(path)) return;
    seen.add(path);
    dashboards.push({
      title: title || path,
      path,
    });
  };

  // Grafana /api/search — preferred when it returns JSON with title and url per dashboard.
  try {
    const apiRes = await fetch(`${base}/api/search?type=dash-db`, {
      headers: { Accept: "application/json" },
      redirect: "follow",
    });
    if (apiRes.ok) {
      const data = await apiRes.json();
      if (Array.isArray(data)) {
        for (const item of data) {
          const path = extractDashboardPathFromHref(item.url || item.uri || "");
          if (path) push(item.title, path);
        }
        if (dashboards.length) {
          return { source: "api", dashboards };
        }
      }
    }
  } catch {
    // Ignore and fall back to HTML scraping.
  }

  // Fallback: scan /dashboards page for hrefs pointing at /d/...
  try {
    const htmlRes = await fetch(`${base}/dashboards`, { redirect: "follow" });
    const html = await htmlRes.text();
    const hrefRe = /href=["']([^"']+)["']/gi;
    let m;
    while ((m = hrefRe.exec(html)) !== null) {
      const path = extractDashboardPathFromHref(m[1]);
      // HTML scrape has no title; use path words as a stand-in for client-side matching.
      if (path) push(path.split("/").join(" "), path);
    }
    return { source: "html", dashboards };
  } catch (err) {
    return {
      source: "error",
      dashboards: [],
      error: err.message || String(err),
    };
  }
}
