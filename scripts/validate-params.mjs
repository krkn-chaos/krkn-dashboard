#!/usr/bin/env node
/**
 * Validates experimentFormData.js field definitions against the
 * krknctl.input_fields label baked into each quay.io/krkn-chaos/krkn-hub:<tag>
 * image.  Falls back to local krkn-hub repo files when Quay.io is unreachable
 * or a tag cannot be inspected.
 *
 * Exits 1 (fails build) on defaultValue or isRequired mismatches.
 * Exits 0 with warnings for fields missing from the dashboard.
 *
 * Usage:
 *   node scripts/validate-params.mjs
 *   node scripts/validate-params.mjs --kraken-hub-path /path/to/kraken-hub
 *   KRAKEN_HUB_PATH=/path/to/kraken-hub node scripts/validate-params.mjs
 */

import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

// Resolve local krkn-hub fallback path
const argIdx = process.argv.indexOf('--kraken-hub-path')
const krakenHubPath = argIdx !== -1
  ? resolve(process.argv[argIdx + 1])
  : process.env.KRAKEN_HUB_PATH
    ? resolve(process.env.KRAKEN_HUB_PATH)
    : resolve(rootDir, '../kraken-hub')

const QUAY_REGISTRY = 'https://quay.io/v2'
const QUAY_REPO     = 'krkn-chaos/krkn-hub'

// Maps dashboard scenario keys → { quayTag, hubDir }
const SCENARIO_MAP = {
  'pod-scenarios':       { quayTag: 'pod-scenarios',       hubDir: 'pod-scenarios' },
  'container-scenarios': { quayTag: 'container-scenarios', hubDir: 'container-scenarios' },
  'node-scenarios':      { quayTag: 'node-scenarios',      hubDir: 'node-scenarios' },
  'pvc-scenarios':       { quayTag: 'pvc-scenarios',       hubDir: 'pvc-scenario' },
  'time-scenarios':      { quayTag: 'time-scenarios',      hubDir: 'time-scenarios' },
  'power-outages':       { quayTag: 'power-outages',       hubDir: 'power-outages' },
  'node-cpu-hog':        { quayTag: 'node-cpu-hog',        hubDir: 'node-cpu-hog' },
  'node-io-hog':         { quayTag: 'node-io-hog',         hubDir: 'node-io-hog' },
  'node-memory-hog':     { quayTag: 'node-memory-hog',     hubDir: 'node-memory-hog' },
  'kubevirt-outage':     { quayTag: 'kubevirt-outage',     hubDir: 'kubevirt-outage' },
}

// Dashboard keys whose krkn-hub variable name differs from key.toUpperCase()
const KEY_OVERRIDES = {
  node_selectors: 'NODE_SELECTOR',
}

// Dashboard-only fields with no krkn-hub equivalent — suppress warnings
const DASHBOARD_ONLY_FIELDS = new Set([
  'name',       // experiment display name (dashboard concept, not a krkn param)
  'block_size', // pvc-scenarios: dd fallback block size, not in krkn-hub
])

function toVariable(dashboardKey) {
  return KEY_OVERRIDES[dashboardKey] ?? dashboardKey.replace(/-/g, '_').toUpperCase()
}

// ── Quay.io Registry API helpers ──────────────────────────────────────────────

async function getQuayToken() {
  const res = await fetch(
    `https://quay.io/v2/auth?service=quay.io&scope=repository:${QUAY_REPO}:pull`,
    { signal: AbortSignal.timeout(10_000) }
  )
  if (!res.ok) throw new Error(`Quay auth failed: ${res.status}`)
  const { token } = await res.json()
  return token
}

async function fetchScenarioFields(tag, token) {
  // Fetch manifest to get the config blob digest
  const manifestRes = await fetch(
    `${QUAY_REGISTRY}/${QUAY_REPO}/manifests/${tag}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.docker.distribution.manifest.v2+json',
      },
      signal: AbortSignal.timeout(15_000),
    }
  )
  if (!manifestRes.ok) throw new Error(`Manifest fetch failed for ${tag}: ${manifestRes.status}`)
  const manifest = await manifestRes.json()
  const configDigest = manifest.config?.digest
  if (!configDigest) throw new Error(`No config digest in manifest for ${tag}`)

  // Fetch config blob (Quay redirects to CDN; fetch follows automatically)
  const configRes = await fetch(
    `${QUAY_REGISTRY}/${QUAY_REPO}/blobs/${configDigest}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(20_000),
    }
  )
  if (!configRes.ok) throw new Error(`Config blob fetch failed for ${tag}: ${configRes.status}`)
  const config = await configRes.json()

  const inputFieldsJson = config.config?.Labels?.['krknctl.input_fields']
  if (!inputFieldsJson) throw new Error(`Label 'krknctl.input_fields' not found on ${tag}`)
  return JSON.parse(inputFieldsJson)
}

// ── Local fallback ─────────────────────────────────────────────────────────────

function loadLocalFields(hubDir) {
  const jsonPath = join(krakenHubPath, hubDir, 'krknctl-input.json')
  if (!existsSync(jsonPath)) return null
  return JSON.parse(readFileSync(jsonPath, 'utf-8'))
}

// ── Validation ─────────────────────────────────────────────────────────────────

function validateScenario(scenarioKey, dashboardFields, hubFields, source) {
  const hubByVariable = new Map(hubFields.map(f => [f.variable, f]))
  const messages = []
  let errors = 0
  let warnings = 0

  for (const field of dashboardFields) {
    if (DASHBOARD_ONLY_FIELDS.has(field.key)) continue

    const variable = toVariable(field.key)
    const hubField = hubByVariable.get(variable)

    if (!hubField) {
      messages.push(`  ℹ️  Dashboard-only: ${field.key} (no krkn-hub variable ${variable})`)
      continue
    }

    if (hubField.default !== undefined) {
      const dashDefault = String(field.defaultValue ?? '')
      if (dashDefault !== String(hubField.default)) {
        messages.push(
          `  ❌ DEFAULT [${field.key}]: dashboard="${dashDefault}"  ${source}="${hubField.default}"`
        )
        errors++
      }
    } else if (field.defaultValue !== undefined && field.defaultValue !== '') {
      messages.push(
        `  ⚠️  DEFAULT set in dashboard but absent in ${source} [${field.key}]: "${field.defaultValue}"`
      )
      warnings++
    }

    const hubRequired = hubField.required === 'true' || hubField.required === true
    if (field.isRequired !== hubRequired) {
      messages.push(
        `  ❌ REQUIRED [${field.key}]: dashboard=${field.isRequired}  ${source}=${hubRequired}`
      )
      errors++
    }
  }

  // Fields in krkn-hub that are absent from the dashboard
  const dashVariables = new Set(
    dashboardFields
      .filter(f => !DASHBOARD_ONLY_FIELDS.has(f.key))
      .map(f => toVariable(f.key))
  )
  for (const hubField of hubFields) {
    if (hubField.type === 'file') continue
    if (!dashVariables.has(hubField.variable)) {
      messages.push(
        `  ⚠️  Missing from dashboard: ${hubField.variable}  (${source} name: "${hubField.name}")`
      )
      warnings++
    }
  }

  return { errors, warnings, messages }
}

// ── Main ────────────────────────────────────────────────────────────────────────

const { paramsList } = await import('../src/components/NewExperiment/experimentFormData.js')

console.log('\nValidating experimentFormData.js against krkn-hub scenario images...\n')

// Try to get a Quay.io auth token once for all scenarios
let quayToken = null
let quayAvailable = false
try {
  quayToken = await getQuayToken()
  quayAvailable = true
} catch (err) {
  console.warn(`⚠️  Quay.io unreachable (${err.message}) — using local fallback only.\n`)
}

// Fetch all scenario field definitions in parallel
const scenarioEntries = Object.entries(SCENARIO_MAP)
const fetchResults = await Promise.allSettled(
  scenarioEntries.map(async ([scenarioKey, { quayTag, hubDir }]) => {
    if (quayAvailable) {
      try {
        const fields = await fetchScenarioFields(quayTag, quayToken)
        return { scenarioKey, fields, source: `quay:${quayTag}` }
      } catch (err) {
        // Fall through to local
        const fields = loadLocalFields(hubDir)
        if (fields) return { scenarioKey, fields, source: `local:${hubDir}`, quayErr: err.message }
        return { scenarioKey, fields: null, source: null, quayErr: err.message }
      }
    } else {
      const fields = loadLocalFields(hubDir)
      return { scenarioKey, fields, source: fields ? `local:${hubDir}` : null }
    }
  })
)

let totalErrors = 0
let totalWarnings = 0

for (const result of fetchResults) {
  // Promise.allSettled only rejects if there's a coding bug; we handle errors above
  const { scenarioKey, fields, source, quayErr } = result.value ?? {}
  const dashboardFields = paramsList[scenarioKey]
  if (!dashboardFields) continue

  if (!fields) {
    const fallbackNote = quayErr ? ` (Quay error: ${quayErr})` : ''
    console.error(`❌ [${scenarioKey}] No source available${fallbackNote} — cannot validate`)
    totalErrors++
    continue
  }

  if (quayErr) {
    console.warn(`  ⚠️  [${scenarioKey}] Quay fetch failed (${quayErr}), used local fallback`)
  }

  const { errors, warnings, messages } = validateScenario(scenarioKey, dashboardFields, fields, source)
  totalErrors += errors
  totalWarnings += warnings

  const icon = errors > 0 ? '❌' : warnings > 0 ? '⚠️ ' : '✅'
  const srcLabel = source.startsWith('quay:') ? '(quay)' : '(local)'
  if (messages.length > 0) {
    console.log(`${icon} ${scenarioKey} ${srcLabel}`)
    messages.forEach(m => console.log(m))
  } else {
    console.log(`✅ ${scenarioKey} ${srcLabel}`)
  }
}

console.log()

if (totalErrors > 0) {
  console.error(`❌ Validation FAILED — ${totalErrors} error(s), ${totalWarnings} warning(s)`)
  console.error('   Fix defaultValue/isRequired mismatches in experimentFormData.js.')
  process.exit(1)
} else if (totalWarnings > 0) {
  console.warn(`⚠️  Validation passed with ${totalWarnings} warning(s)`)
} else {
  console.log('✅ All scenario parameters validated successfully!')
}
