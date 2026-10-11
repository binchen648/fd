// Reproducible player-seat sparring against the shipped browser bots.
// Challenger decisions use snapshot.view + visible powers and engine legal actions only.
const { chromium } = require('../../binchen648_fd/work/node_modules/playwright');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const suffix = process.argv.includes('--after') ? '-after' : '';

async function play(browser, seed, policy) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
  await page.locator('.legal-screen.is-ready').waitFor({ timeout: 120000 });
  await page.evaluate(seed => {
    const create = window.FDBattleRuntime.create;
    window.FDBattleRuntime.create = options => create({ ...options, seed });
  }, seed);
  const click = async selector => { await page.locator(selector).click(); await page.waitForTimeout(800); };
  await click('[data-legal-continue]'); await page.waitForTimeout(800);
  await click('.press-any'); await click('[data-nav="single"]'); await click('[data-mode="free"]');
  await click('[data-pick-master="肯尼斯"]'); await click('[data-standard-next]');
  await click('[data-pick-servant="巴御前"]'); await click('[data-standard-next]');
  await click('[data-enter-battle-preview]'); await page.locator('.battle-host').waitFor();
  await page.evaluate(() => {
    window.__sparringTrace = []; window.__sparringLast = new Map();
    window.fdCurrentBattleRuntime.subscribe(snapshot => {
      const view = snapshot.view;
      for (const player of Object.values(view.players)) {
        const visible = { round: view.round, phase: view.phase, playerId: player.id,
          location: player.locationId, mana: player.mana, seals: player.commandSeals,
          points: player.victoryPoints, handCount: player.handCount,
          power: snapshot.combatPowers[player.id] ?? 0 };
        const key = JSON.stringify(visible);
        if (window.__sparringLast.get(player.id) !== key) {
          window.__sparringTrace.push(visible); window.__sparringLast.set(player.id, key);
        }
      }
    });
  });
  const start = Date.now(), decisions = [], rounds = new Set();
  let revision = -1, lastChanged = Date.now(), final;
  while (Date.now() - start < 360000) {
    const result = await page.evaluate(policy => {
      const runtime = window.fdCurrentBattleRuntime, snapshot = runtime.snapshot();
      const view = snapshot.view, root = document.querySelector('.battle-host').shadowRoot;
      const base = { round: view.round, revision: view.revision };
      if (snapshot.victory.finished) return { ...base, finished: true, victory: snapshot.victory,
        scores: Object.values(view.players).map(p => ({ id: p.id, points: p.victoryPoints, eliminated: p.eliminated })) };
      const next = root.querySelector('[data-settlement-next]');
      if (next && !next.disabled && next.getClientRects().length) { next.click(); return { ...base, operation: 'settlement.next' }; }
      const actions = snapshot.actions;
      const decision = actions.find(a => a.commandType === 'decision.resolve');
      if (decision) {
        runtime.dispatch(decision.id, (decision.input?.options ?? []).filter(o => !o.disabled).slice(0, decision.input?.min ?? 1).map(o => o.id));
        return { ...base, operation: 'decision.resolve' };
      }
      const self = view.players[runtime.playerId];
      // Never read runtime.app.state, roster assignments, queues, or hidden definitions.
      const printed = id => {
        const card = view.cards[id], definition = card?.definitionId ? snapshot.definitions[card.definitionId] : null;
        return { power: Number(definition?.basePower ?? 0), cost: Number(definition?.cost ?? 0) };
      };
      const hand = Object.values(view.cards).filter(c => c.ownerPlayerId === self.id && c.zone === 'hand' && c.definitionId);
      const futurePower = [...hand].sort((a, b) => printed(b.instanceId).power - printed(a.instanceId).power)
        .slice(0, 2).reduce((sum, c) => sum + printed(c.instanceId).power, 0);
      const threatAt = location => Math.max(0, ...Object.values(view.players)
        .filter(p => p.id !== self.id && !p.eliminated && p.locationId === location)
        .map(p => (snapshot.combatPowers[p.id] ?? 0) + (view.turnOrder.indexOf(p.id) > view.turnOrder.indexOf(self.id) && p.handCount ? Math.min(4, p.mana) : 0)));
      const deploys = actions.filter(a => a.commandType === 'player.deploy');
      let chosen, reason;
      if (deploys.length) {
        if (policy === 'fixed') {
          chosen = deploys.find(a => a.payload.locationId === (view.round % 2 ? 'workshop' : 'city')) ?? deploys[0];
          reason = '固定奇偶回合部署';
        } else {
          const score = a => {
            const destination = a.payload.locationId;
            if (destination === 'workshop') return self.mana < 3 ? 13 : 2;
            const terrain = (view.board.outpostRecords[destination] ?? []).filter(Boolean).length ? 1 : 3;
            const enough = futurePower + terrain >= threatAt(destination);
            return (destination === 'city' ? 12 : 8) * (enough ? 1 : .1) + self.mana * .1;
          };
          chosen = [...deploys].sort((a, b) => score(b) - score(a))[0]; reason = '比较可见威力与自己手牌，缺魔优先恢复';
        }
      } else {
        const commits = [...actions, ...(snapshot.draftAttackActions ?? [])]
          .filter(a => a.commandType === 'player.attack.commit' && a.payload.faceUpInstanceIds?.length && !a.payload.faceDownInstanceIds?.length);
        const end = actions.find(a => a.commandType === 'phase.player.complete');
        if (policy === 'fixed' && commits.length) {
          chosen = [...commits].sort((a, b) => b.payload.faceUpInstanceIds.length - a.payload.faceUpInstanceIds.length)[0]; reason = '固定优先明置最多张';
        } else if (policy === 'public-strategy' && (commits.length || end)) {
          const ownPower = snapshot.combatPowers[self.id] ?? 0, threat = threatAt(self.locationId);
          const opponents = Object.values(view.players).filter(p => p.id !== self.id && p.locationId === self.locationId && !p.eliminated);
          const futureEntrants = view.turnOrder.slice(view.turnOrder.indexOf(self.id) + 1).some(id => {
            const p = view.players[id]; return p?.locationId === 'workshop' && p.mana >= 3 && p.handCount > 0;
          });
          const target = opponents.length ? threat + 1 : futureEntrants ? 5 : 0;
          const value = a => {
            const ids = a?.payload?.faceUpInstanceIds ?? [];
            const cards = ids.map(printed), power = ownPower + cards.reduce((sum, c) => sum + c.power, 0);
            const cost = cards.reduce((sum, c) => sum + c.cost, 0);
            return (power >= target ? 30 : 0) - cost * .4 - ids.length * .7 - cards.reduce((sum, c) => sum + c.power / (Math.max(0, c.cost) + 1), 0) * .3;
          };
          chosen = [...commits, ...(end ? [end] : [])].sort((a, b) => value(b) - value(a))[0];
          reason = `只按公开威力估算目标 ${target}，比较赢面和消耗`;
          const scout = actions.find(a => a.commandType === 'player.move' && a.payload.locationId === 'scouting');
          if (scout && ownPower + futurePower < threat) { chosen = scout; reason = '公开威力明显不足，转侦察拿固定收益'; }
        }
        chosen ??= actions.find(a => ['combat.resolve', 'combat.response.complete', 'round.end', 'phase.player.complete'].includes(a.commandType));
        reason ??= '完成当前阶段';
      }
      if (!chosen) return { ...base, waiting: true, phase: view.phase, step: view.step };
      runtime.dispatch(chosen.id);
      return { ...base, operation: chosen.commandType, payload: chosen.payload ?? {}, reason,
        before: { location: self.locationId, mana: self.mana, power: snapshot.combatPowers[self.id] ?? 0, points: self.victoryPoints } };
    }, policy);
    if (!rounds.has(result.round)) { rounds.add(result.round); console.log(JSON.stringify({ seed, policy, round: result.round })); }
    if (result.operation) decisions.push(result);
    if (result.revision !== revision) { revision = result.revision; lastChanged = Date.now(); }
    if (result.finished) { final = result; break; }
    if (Date.now() - lastChanged > 25000) throw Error(`stall ${seed}/${policy}: ${JSON.stringify(result)}`);
    await page.waitForTimeout(140);
  }
  if (!final) throw Error(`timeout ${seed}/${policy}`);
  if (errors.length) throw Error(errors.join('\n'));
  const trace = await page.evaluate(() => window.__sparringTrace);
  const name = `ai-sparring-${seed}-${policy}${suffix}`;
  await page.screenshot({ path: path.resolve(__dirname, `../docs/${name}.png`) });
  const report = { seed, policy, elapsedMs: Date.now() - start, rounds: [...rounds], final, errors, decisions, publicTrace: trace };
  fs.writeFileSync(path.resolve(__dirname, `../docs/${name}.json`), JSON.stringify(report, null, 2));
  await page.close();
  console.log(JSON.stringify({ completed: true, seed, policy, scores: final.scores, victory: final.victory }));
  const firstRound = new Map();
  for (const sample of trace.filter(p => p.playerId !== 'p1' && p.round === 1)) firstRound.set(sample.playerId, sample);
  return { seed, policy, elapsedMs: report.elapsedMs, rounds: rounds.size, decisions: decisions.length, scores: final.scores, victory: final.victory, errors,
    firstRoundBots: [...firstRound.values()].map(p => ({ id: p.playerId, seals: p.seals, points: p.points })) };
}

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, args: ['--allow-file-access-from-files'] });
  try {
    const results = await Promise.all([
      play(browser, 20261006, 'fixed'),
      play(browser, 20261006, 'public-strategy'),
      play(browser, 20261007, 'public-strategy'),
    ]);
    fs.writeFileSync(path.resolve(__dirname, `../docs/ai-sparring-summary-20261006${suffix}.json`), JSON.stringify(results, null, 2));
    console.log(JSON.stringify({ results }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
