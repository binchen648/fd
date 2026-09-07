import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('FD playtest v1 documentation', () => {
  it('describes the current five-servant normal content scope', () => {
    const index = readFileSync(resolve('docs/spec/fd-playtest-v1-content-index.md'), 'utf8');
    const capabilityMatrix = readFileSync(resolve('docs/spec/engine-capability-matrix.md'), 'utf8');

    expect(index).toContain('当前编译报告为 7 名御主、5 名从者、20 个事件槽、0 个阻塞问题；五套从者初始牌库共 60 张。');
    expect(index).toContain('## 盈月之仪事件组');
    expect(index).toContain('事件组 `event-set.waxing_moon_ritual`');

    expect(index).not.toContain('| 查尔斯·巴贝奇 `servant.babbage`');
    expect(index).not.toContain('| B.B. `servant.bb`');
    expect(index).not.toContain('## 月之圣杯事件组');
    expect(index).not.toContain('event-set.moon_holy_grail');
    expect(index).not.toContain('event.moon_holy_grail');
    expect(index).not.toContain('B.B. 的月之癌');

    expect(capabilityMatrix).toContain('5-player normal first-playable fixture');
    expect(capabilityMatrix).toContain('Waxing Moon Ritual event set');
    expect(capabilityMatrix).not.toContain('Moon Holy Grail event set');
    expect(capabilityMatrix).not.toContain('优势火力学说');
  });
});
