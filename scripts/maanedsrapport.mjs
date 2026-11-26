// ══════════════════════════════════════════════════════════════
//  MÅNEDLIG RAPPORT – brukes av .github/workflows/maanedlig-rapport.yml
//
//  Leser testresultatene fra arbeidsflyten, åpne Dependabot-PR-er og
//  Dependabot-varsler, og oppretter en issue på norsk, tildelt eieren.
//  Funksjonene som lager teksten er rene og testes i maanedsrapport.test.mjs.
// ══════════════════════════════════════════════════════════════

const SEVERITY = { critical: 'kritisk', high: 'høy', medium: 'middels', moderate: 'middels', low: 'lav' };
const SEVERITY_ORDER = ['critical', 'high', 'medium', 'moderate', 'low'];
export const TITLE_PREFIX = 'Månedlig rapport – ';

/** «November 2026» */
export function monthTitle(date = new Date()) {
  const text = date.toLocaleDateString('nb-NO', { month: 'long', year: 'numeric', timeZone: 'Europe/Oslo' });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Vitest sin JSON-rapport → bestått/feilet og navnene på det som feilet. */
export function parseVitest(json) {
  if (!json) return null;
  const failed = [];
  for (const file of json.testResults ?? []) {
    const name = file.name?.replace(/^.*?(src\/|scripts\/)/, '$1') ?? 'ukjent fil';
    const failedTests = (file.assertionResults ?? []).filter(t => t.status === 'failed');
    for (const t of failedTests) failed.push(`${name}: ${t.fullName}`);
    // En fil som ikke kan lastes, har ingen tester, men status «failed».
    if (file.status === 'failed' && !failedTests.length) failed.push(`${name}: filen kunne ikke kjøres`);
  }
  return { passed: json.numPassedTests ?? 0, failed: Math.max(json.numFailedTests ?? 0, failed.length), failedNames: failed };
}

/** Playwright sin JSON-rapport → bestått/feilet/ustabil og navnene på det som feilet. */
export function parsePlaywright(json) {
  if (!json) return null;
  const failed = [], flaky = [];
  const walk = (suite, path) => {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        const name = `${spec.file ?? suite.file ?? ''}: ${[...path, spec.title].filter(Boolean).join(' › ')}`;
        if (test.status === 'unexpected') failed.push(name);
        else if (test.status === 'flaky') flaky.push(name);
      }
    }
    for (const child of suite.suites ?? []) walk(child, [...path, child.title]);
  };
  for (const suite of json.suites ?? []) walk(suite, []);
  // Feil før testene kom i gang (f.eks. at serveren ikke startet).
  for (const error of json.errors ?? []) failed.push(`Oppstart: ${String(error.message ?? error).split('\n')[0]}`);
  return { passed: json.stats?.expected ?? 0, failed: failed.length, flaky, failedNames: failed };
}

/** «Bump next from 16.4.2 to 16.4.3» → patch/minor/major, eller gruppe/ukjent. */
export function updateType(title) {
  if (/ group with /i.test(title) || /dependencies group/i.test(title)) return 'gruppe';
  const m = /from v?(\d+)(?:\.(\d+))?(?:\.\d+)? to v?(\d+)(?:\.(\d+))?/i.exec(title);
  if (!m) return 'ukjent';
  const [a1, a2, b1, b2] = [m[1], m[2] ?? '0', m[3], m[4] ?? '0'].map(Number);
  if (a1 !== b1) return 'major';
  // Under 1.0 regnes en ny andre-siffer som en stor endring (0.400 → 0.401 kan bryte ting).
  if (a1 === 0 && a2 !== b2) return 'major';
  if (a2 !== b2) return 'minor';
  return 'patch';
}

/** Sjekkene på en PR → grønn, rød, venter eller ingen. */
export function checksStatus(checkRuns = [], statuses = []) {
  const all = [
    ...checkRuns.map(c => c.status !== 'completed' ? 'pending' : c.conclusion),
    ...statuses.map(s => s.state === 'pending' ? 'pending' : s.state),
  ];
  if (!all.length) return 'ingen';
  if (all.some(s => ['failure', 'timed_out', 'cancelled', 'action_required', 'error', 'startup_failure'].includes(s))) return 'rød';
  if (all.includes('pending')) return 'venter';
  return 'grønn';
}

const STATUS_TEXT = { grønn: '🟢 grønn', rød: '🔴 rød', venter: '🟡 kjører', ingen: '⚪ ingen tester' };
const TYPE_TEXT = { patch: 'liten (patch)', minor: 'liten (minor)', major: 'stor (major)', gruppe: 'samlet (minor/patch)', ukjent: 'ukjent' };

/** Dependabot-PR-en som oppdaterer pakken i et varsel, hvis det finnes en. */
const fixingPr = (alert, prs) => prs.find(p => new RegExp(`(^|\\s)${alert.package.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`).test(p.title));

const resultLine = (label, outcome) =>
  `| ${label} | ${outcome === 'success' ? '✅ bestått' : outcome === 'skipped' ? '⏭️ ikke kjørt' : '❌ feilet'} |`;

/**
 * Hele rapporten som Markdown.
 * tests: { lint, unit, build, e2e } med utfall fra arbeidsflyten og tolkede resultater.
 * prs: [{ number, title, url, type, status, conflict }]
 * alerts: [{ number, package, severity, summary, fixedIn, url }] eller null når de ikke kunne leses.
 */
export function buildReport({ month, runUrl, tests, prs, alerts, alertsError }) {
  const lines = [];
  lines.push(`Automatisk rapport for **${month}**. Laget av [arbeidsflyten](${runUrl}).`, '');

  // ── Tester ──
  lines.push('## Tester', '', '| Kontroll | Resultat |', '| --- | --- |');
  lines.push(resultLine('Lint', tests.lint.outcome));
  const unit = tests.unit.result;
  lines.push(resultLine(`Enhetstester${unit ? ` (${unit.passed} bestått, ${unit.failed} feilet)` : ''}`, tests.unit.outcome));
  lines.push(resultLine('Bygging', tests.build.outcome));
  const e2e = tests.e2e.result;
  lines.push(resultLine(`Nettlesertester${e2e ? ` (${e2e.passed} bestått, ${e2e.failed} feilet)` : ''}`, tests.e2e.outcome));
  const failedNames = [...(unit?.failedNames ?? []), ...(e2e?.failedNames ?? [])];
  if (failedNames.length) {
    lines.push('', '**Feilet:**', ...failedNames.slice(0, 30).map(n => `- ${n}`));
    if (failedNames.length > 30) lines.push(`- … og ${failedNames.length - 30} til (se arbeidsflyten)`);
  }
  if (e2e?.flaky?.length) lines.push('', '**Ustabile (besto på andre forsøk):**', ...e2e.flaky.map(n => `- ${n}`));
  const testsFailed = ['lint', 'unit', 'build', 'e2e'].some(k => tests[k].outcome !== 'success');

  // ── Dependabot-PR-er ──
  lines.push('', '## Åpne Dependabot-PR-er', '');
  if (!prs.length) lines.push('Ingen åpne Dependabot-PR-er.');
  else {
    lines.push('| PR | Oppdatering | Tester |', '| --- | --- | --- |');
    for (const pr of prs) {
      lines.push(`| [#${pr.number} ${pr.title}](${pr.url}) | ${TYPE_TEXT[pr.type]} | ${STATUS_TEXT[pr.status]}${pr.conflict ? ' · konflikt' : ''} |`);
    }
  }

  // ── Sikkerhetsvarsler ──
  lines.push('', '## Dependabot-sikkerhetsvarsler', '');
  if (alerts === null) {
    lines.push(`⚠️ Varslene kunne ikke leses: ${alertsError}. Se «Oppsett» nederst.`);
  } else if (!alerts.length) {
    lines.push('Ingen åpne sikkerhetsvarsler.');
  } else {
    const sorted = [...alerts].sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity));
    lines.push('| Alvorlighet | Pakke | Hva | Rettet i |', '| --- | --- | --- | --- |');
    for (const a of sorted) {
      const pr = fixingPr(a, prs);
      const fixed = `${a.fixedIn ?? 'ingen rettelse ennå'}${pr ? ` (PR #${pr.number})` : ''}`;
      lines.push(`| ${SEVERITY[a.severity] ?? a.severity} | \`${a.package}\` | [${a.summary}](${a.url}) | ${fixed} |`);
    }
  }

  // ── Anbefaling ──
  lines.push('', '## Anbefaling', '');
  const advice = [];
  if (testsFailed) advice.push('**Testene feiler på `main`.** Fiks dette først: be Claude «se på månedsrapporten og fiks testene som feiler».');
  const green = prs.filter(p => p.status === 'grønn' && !p.conflict);
  const safe = green.filter(p => p.type !== 'major' && p.type !== 'ukjent');
  const big = green.filter(p => p.type === 'major' || p.type === 'ukjent');
  const red = prs.filter(p => p.status === 'rød');
  const conflicted = prs.filter(p => p.conflict);
  const waiting = prs.filter(p => p.status === 'venter' || p.status === 'ingen');
  if (safe.length) advice.push(`**Merge:** ${safe.map(p => `#${p.number}`).join(', ')} (små oppdateringer, testene er grønne).`);
  if (big.length) advice.push(`**Sjekk før merge:** ${big.map(p => `#${p.number}`).join(', ')} er store versjonshopp. Testene er grønne, men be gjerne Claude se på dem først.`);
  if (red.length) advice.push(`**Ikke merge:** ${red.map(p => `#${p.number}`).join(', ')} har røde tester. Be Claude fikse dem, eller lukk dem.`);
  if (conflicted.length) advice.push(`**Konflikt:** ${conflicted.map(p => `#${p.number}`).join(', ')}. Dependabot retter det vanligvis selv; skriv \`@dependabot rebase\` som kommentar hvis den blir stående.`);
  if (waiting.length) advice.push(`**Vent:** ${waiting.map(p => `#${p.number}`).join(', ')} har ikke ferdige tester ennå.`);
  const serious = (alerts ?? []).filter(a => a.severity === 'critical' || a.severity === 'high');
  const minor = (alerts ?? []).filter(a => !(a.severity === 'critical' || a.severity === 'high'));
  const fixing = [...new Set((alerts ?? []).map(a => fixingPr(a, prs)).filter(Boolean))];
  if (fixing.length) advice.push(`**Sikkerhet:** ${fixing.map(p => `#${p.number}`).join(', ')} retter sikkerhetsvarsler. Merge ${fixing.length > 1 ? 'dem' : 'den'} når testene er grønne.`);
  if (serious.length) advice.push(`**Må fikses snart:** ${serious.length} sikkerhetsvarsel med høy eller kritisk alvorlighet (${[...new Set(serious.map(a => a.package))].join(', ')}). Merge PR-en Dependabot lager for dem, eller be Claude oppdatere pakkene.`);
  if (minor.length) advice.push(`**Kan vente litt:** ${minor.length} varsel med middels eller lav alvorlighet (${[...new Set(minor.map(a => a.package))].join(', ')}). Rettes vanligvis av de neste Dependabot-oppdateringene.`);
  if (alerts === null) advice.push('**Oppsett:** legg inn tokenet for sikkerhetsvarsler (se under), så kommer de med neste gang.');
  if (!advice.length) advice.push('Alt ser bra ut. Ingenting å gjøre denne måneden.');
  lines.push(...advice.map(a => `- ${a}`));

  if (alerts === null) {
    lines.push('', '## Oppsett', '',
      'Sikkerhetsvarslene leses med en egen nøkkel. Lag et «fine-grained personal access token» for dette repoet med',
      'tilgangen **Dependabot alerts: Read-only**, og legg det inn som secret med navnet `DEPENDABOT_ALERTS_TOKEN`',
      '(Settings → Secrets and variables → Actions → New repository secret).');
  }
  return lines.join('\n');
}

const outcomeEnv = name => process.env[name] || 'skipped';

async function readJson(path) {
  try {
    const { readFile } = await import('node:fs/promises');
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return null;
  }
}

/** Kjøres av actions/github-script: henter data, lager rapporten og oppretter issuen. */
export default async function run({ github, context, core, getOctokit }) {
  const { owner, repo } = context.repo;
  const month = monthTitle();
  const title = `${TITLE_PREFIX}${month}`;
  const runUrl = `${context.serverUrl}/${owner}/${repo}/actions/runs/${context.runId}`;
  const dir = process.env.RAPPORT_MAPPE || 'reports';

  const tests = {
    lint: { outcome: outcomeEnv('UTFALL_LINT') },
    unit: { outcome: outcomeEnv('UTFALL_ENHET'), result: parseVitest(await readJson(`${dir}/vitest.json`)) },
    build: { outcome: outcomeEnv('UTFALL_BYGG') },
    e2e: { outcome: outcomeEnv('UTFALL_E2E'), result: parsePlaywright(await readJson(`${dir}/e2e.json`)) },
  };

  // Åpne Dependabot-PR-er og testene deres.
  const pulls = await github.paginate(github.rest.pulls.list, { owner, repo, state: 'open', per_page: 100 });
  const prs = [];
  for (const pr of pulls.filter(p => p.user?.login === 'dependabot[bot]')) {
    const [checks, combined, full] = await Promise.all([
      github.paginate(github.rest.checks.listForRef, { owner, repo, ref: pr.head.sha, per_page: 100 }),
      github.rest.repos.getCombinedStatusForRef({ owner, repo, ref: pr.head.sha }),
      github.rest.pulls.get({ owner, repo, pull_number: pr.number }),
    ]);
    prs.push({
      number: pr.number, title: pr.title, url: pr.html_url, type: updateType(pr.title),
      status: checksStatus(checks, combined.data.statuses), conflict: full.data.mergeable === false,
    });
  }

  // Sikkerhetsvarsler: med eget token hvis det finnes, ellers arbeidsflytens eget.
  let alerts = null, alertsError = '';
  try {
    const client = process.env.ALERTS_TOKEN ? getOctokit(process.env.ALERTS_TOKEN) : github;
    const raw = await client.paginate(client.rest.dependabot.listAlertsForRepo, { owner, repo, state: 'open', per_page: 100 });
    alerts = raw.map(a => ({
      number: a.number,
      package: a.dependency?.package?.name ?? 'ukjent',
      severity: a.security_advisory?.severity ?? a.security_vulnerability?.severity ?? 'ukjent',
      summary: a.security_advisory?.summary ?? 'Uten beskrivelse',
      fixedIn: a.security_vulnerability?.first_patched_version?.identifier ?? null,
      url: a.html_url,
    }));
  } catch (error) {
    alertsError = error.status === 403 || error.status === 404
      ? `ingen tilgang (HTTP ${error.status})`
      : String(error.message ?? error);
    core.warning(`Dependabot-varsler kunne ikke leses: ${alertsError}`);
  }

  const body = buildReport({ month, runUrl, tests, prs, alerts, alertsError });
  core.summary.addRaw(body).write();

  // Én issue per måned: kjøres den på nytt samme måned, oppdateres den.
  const open = await github.paginate(github.rest.issues.listForRepo, { owner, repo, state: 'open', per_page: 100 });
  const reports = open.filter(i => !i.pull_request && i.title.startsWith(TITLE_PREFIX));
  const existing = reports.find(i => i.title === title);
  if (existing) {
    await github.rest.issues.update({ owner, repo, issue_number: existing.number, body, assignees: [owner] });
    await github.rest.issues.createComment({ owner, repo, issue_number: existing.number, body: `Rapporten er oppdatert av en ny kjøring: ${runUrl}` });
    core.notice(`Oppdaterte #${existing.number}`);
  } else {
    const created = await github.rest.issues.create({ owner, repo, title, body, assignees: [owner] });
    core.notice(`Opprettet #${created.data.number}`);
    // Forrige måneds rapport lukkes, så bare den nyeste står åpen.
    for (const old of reports) {
      await github.rest.issues.createComment({ owner, repo, issue_number: old.number, body: `Erstattet av #${created.data.number}.` });
      await github.rest.issues.update({ owner, repo, issue_number: old.number, state: 'closed', state_reason: 'completed' });
    }
  }
}
