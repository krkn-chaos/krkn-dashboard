#!/usr/bin/env node
/**
 * Verifies that each scenario's krknctl-input.json is reachable on GitHub.
 * The dashboard no longer has a static paramsList — fields are fetched at
 * runtime from krkn-hub — so this script only checks source availability.
 *
 * Usage:  node scripts/validate-params.mjs
 */

const SCENARIO_HUB_DIR = {
  'pod-scenarios':       'pod-scenarios',
  'container-scenarios': 'container-scenarios',
  'namespace-scenarios': 'namespace-scenarios',
  'node-scenarios':      'node-scenarios',
  'pvc-scenarios':       'pvc-scenario',
  'time-scenarios':      'time-scenarios',
  'power-outages':       'power-outages',
  'node-cpu-hog':        'node-cpu-hog',
  'node-io-hog':         'node-io-hog',
  'node-memory-hog':     'node-memory-hog',
  'kubevirt-outage':     'kubevirt-outage',
};

const BASE = 'https://raw.githubusercontent.com/redhat-chaos/krkn-hub/main';

console.log('\nChecking krkn-hub scenario sources are reachable...\n');

const results = await Promise.allSettled(
  Object.entries(SCENARIO_HUB_DIR).map(async ([scenario, hubDir]) => {
    const url = `${BASE}/${hubDir}/krknctl-input.json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const fields = await res.json();
    return { scenario, url, count: fields.length };
  })
);

let errors = 0;
for (const result of results) {
  if (result.status === 'fulfilled') {
    const { scenario, count } = result.value;
    console.log(`  ✅ ${scenario} — ${count} field(s)`);
  } else {
    const scenario = Object.keys(SCENARIO_HUB_DIR)[results.indexOf(result)];
    console.error(`  ❌ ${scenario} — ${result.reason?.message}`);
    errors++;
  }
}

console.log();
if (errors > 0) {
  console.error(`❌ ${errors} scenario source(s) unreachable`);
  process.exit(1);
} else {
  console.log('✅ All scenario sources reachable');
}
