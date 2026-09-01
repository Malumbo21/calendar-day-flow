/**
 * Minimal semver range evaluator.
 *
 * Deliberately dependency-free: this runs during publish preflight, where
 * pulling in node_modules state we are about to change would be circular.
 * Supports the range syntax actually used across the workspace and by our
 * published manifests: exact, ^, ~, >, >=, <, <=, x-ranges, AND (space), OR (||).
 */

/** @returns {{major:number,minor:number,patch:number,pre:string[]}|null} Parsed parts, or null when `version` is not semver. */
export function parse(version) {
  const m =
    /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-.]+))?(?:\+[0-9A-Za-z-.]+)?$/.exec(
      String(version).trim()
    );
  if (!m) return null;
  return {
    major: Number(m[1]),
    minor: Number(m[2]),
    patch: Number(m[3]),
    pre: m[4] ? m[4].split('.') : [],
  };
}

export function valid(version) {
  return parse(version) ? String(version).trim().replace(/^v/, '') : null;
}

function comparePre(a, b) {
  // A version with a prerelease is lower than the same version without one.
  if (a.length === 0 && b.length === 0) return 0;
  if (a.length === 0) return 1;
  if (b.length === 0) return -1;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i];
    const y = b[i];
    if (x === undefined) return -1;
    if (y === undefined) return 1;
    const nx = /^\d+$/.test(x);
    const ny = /^\d+$/.test(y);
    if (nx && ny) {
      const d = Number(x) - Number(y);
      if (d !== 0) return d < 0 ? -1 : 1;
    } else if (nx !== ny) {
      return nx ? -1 : 1; // numeric identifiers sort lower than alphanumeric
    } else if (x !== y) {
      return x < y ? -1 : 1;
    }
  }
  return 0;
}

/** @returns {-1|0|1} Negative when `a` sorts before `b`, positive when after. */
export function compare(a, b) {
  const pa = parse(a);
  const pb = parse(b);
  if (!pa || !pb) throw new Error(`invalid version: ${pa ? b : a}`);
  for (const k of ['major', 'minor', 'patch']) {
    if (pa[k] === pb[k]) continue;
    return pa[k] < pb[k] ? -1 : 1;
  }
  const p = comparePre(pa.pre, pb.pre);
  return p === 0 ? 0 : p < 0 ? -1 : 1;
}

export function gt(a, b) {
  return compare(a, b) > 0;
}
export function lt(a, b) {
  return compare(a, b) < 0;
}
export function eq(a, b) {
  return compare(a, b) === 0;
}

/** Highest version in a list, or null. */
export function maxVersion(versions) {
  let best = null;
  for (const v of versions) {
    if (!parse(v)) continue;
    if (best === null || gt(v, best)) best = v;
  }
  return best;
}

function xToZero(part) {
  return part === undefined || part === '' || /^[xX*]$/.test(part)
    ? null
    : Number(part);
}

/** Expand one comparator token into {op, version} pairs. */
function expand(token) {
  const t = token.trim();
  if (t === '' || t === '*' || t === 'x' || t === 'X') return [];

  let m =
    /^([~^]|>=|<=|>|<|=)?\s*v?(\d+|[xX*])(?:\.(\d+|[xX*]))?(?:\.(\d+|[xX*]))?(?:-([0-9A-Za-z-.]+))?/.exec(
      t
    );
  if (!m) throw new Error(`unsupported range token: ${token}`);

  const op = m[1] || '=';
  const major = xToZero(m[2]);
  const minor = xToZero(m[3]);
  const patch = xToZero(m[4]);
  const pre = m[5] ? `-${m[5]}` : '';

  if (major === null) return []; // "*" style

  const lo = `${major}.${minor ?? 0}.${patch ?? 0}${pre}`;

  if (op === '^') {
    // ^1.2.3 -> <2.0.0 | ^0.2.3 -> <0.3.0 | ^0.0.3 -> <0.0.4
    let hi;
    if (major > 0 || minor === null) hi = `${major + 1}.0.0`;
    else if (minor > 0 || patch === null) hi = `0.${minor + 1}.0`;
    else hi = `0.0.${patch + 1}`;
    return [
      { op: '>=', version: lo },
      { op: '<', version: hi },
    ];
  }
  if (op === '~') {
    // ~1.2.3 -> <1.3.0 | ~1.2 -> <1.3.0 | ~1 -> <2.0.0
    const hi = minor === null ? `${major + 1}.0.0` : `${major}.${minor + 1}.0`;
    return [
      { op: '>=', version: lo },
      { op: '<', version: hi },
    ];
  }
  if (op === '=' && (minor === null || patch === null)) {
    // x-range: 1.2.x -> >=1.2.0 <1.3.0
    const hi = minor === null ? `${major + 1}.0.0` : `${major}.${minor + 1}.0`;
    return [
      { op: '>=', version: lo },
      { op: '<', version: hi },
    ];
  }
  return [{ op, version: lo }];
}

function satisfiesComparator(version, { op, version: target }) {
  const c = compare(version, target);
  switch (op) {
    case '=':
      return c === 0;
    case '>':
      return c > 0;
    case '>=':
      return c >= 0;
    case '<':
      return c < 0;
    case '<=':
      return c <= 0;
    default:
      throw new Error(`unsupported operator: ${op}`);
  }
}

/**
 * Does `version` satisfy `range`?
 * Throws on ranges we cannot model, so callers can surface "unknown" rather
 * than silently passing a check they never actually ran.
 */
export function satisfies(version, range) {
  if (!parse(version)) throw new Error(`invalid version: ${version}`);
  const raw = String(range).trim();
  if (
    raw === '' ||
    raw === '*' ||
    raw === 'x' ||
    raw === 'X' ||
    raw === 'latest'
  ) {
    return true;
  }
  for (const clause of raw.split('||')) {
    const tokens = clause.trim().split(/\s+/).filter(Boolean);
    const comparators = tokens.flatMap(expand);
    if (comparators.every(c => satisfiesComparator(version, c))) return true;
  }
  return false;
}

/** True when the range can never be satisfied by anything but one exact version. */
export function isExactPin(range) {
  return /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-.]+)?$/.test(String(range).trim());
}
