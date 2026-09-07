import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import MatchTable from './MatchTable';
import type { PlaytestClientFixture } from '../state/playtest-fixture-loader';

const fixture: PlaytestClientFixture = {
  match: { round: 4, phase: '行动阶段', priorityPlayerId: 'player-1' },
  phaseTrack: [
    { id: 'round_start', label: '回合开始', status: 'done' },
    { id: 'preparation', label: '准备阶段', status: 'done' },
    { id: 'advance', label: '移动阶段', status: 'done' },
    { id: 'action', label: '行动阶段', status: 'current' },
    { id: 'battle', label: '战斗阶段', status: 'upcoming' },
    { id: 'cleanup', label: '清理阶段', status: 'upcoming' },
    { id: 'round_end', label: '回合结束', status: 'upcoming' },
  ],
  players: [
    {
      id: 'player-1',
      seat: 1,
      name: '你',
      masterName: '久宇舞弥',
      servantName: '弗朗西斯·德雷克',
      location: '新都',
      vp: 3,
      mana: 4,
      commandSpells: 3,
      isSelf: true,
      publicMasterCardId: 'public-master-card-1',
      publicMasterSkillIds: ['public-master-skill-1'],
      publicAscensionSkillIds: ['public-ascension-skill-1'],
    },
    {
      id: 'player-2',
      seat: 2,
      name: '对手',
      masterName: '间桐慎二',
      servantName: '弗朗西斯·德雷克',
      location: '深山町',
      vp: 2,
      mana: 3,
      commandSpells: 2,
      isSelf: false,
      publicMasterCardId: 'public-master-card-2',
      publicMasterSkillIds: ['public-master-skill-2'],
      publicAscensionSkillIds: ['public-ascension-skill-2'],
    },
  ],
  locations: [
    {
      id: 'magic_workshop',
      name: '魔术工房',
      subtitle: '非战场 · 通常容量 4',
      occupants: [],
      mapArea: 'A2',
      capacityLabel: '通常 4',
      workshopManaSlots: [2, 1, 1, 1],
      moveCostToNext: 1,
    },
    {
      id: 'miyama_town',
      name: '深山町',
      subtitle: '战场 · 明置事件',
      occupants: ['player-2'],
      mapArea: 'B2',
      terrainSlots: [3, 1],
      contestVp: 2,
      moveCostToNext: 2,
    },
    {
      id: 'shinto',
      name: '新都',
      subtitle: '战场 · 暗置后展示',
      occupants: ['player-1'],
      mapArea: 'B3',
      terrainSlots: [3, 1],
      contestVp: 3,
      moveCostToNext: 2,
    },
    {
      id: 'recon',
      name: '侦察',
      subtitle: '非战场 · 容量 1',
      occupants: [],
      mapArea: 'G',
      capacityLabel: '1',
      reconVp: 2,
    },
  ],
  situation: {
    cardId: 'public-situation-1',
    effectText: '魔术攻击于深山町和新都获得威力 +2。',
    manaRecovery: 2,
  },
  battleEvents: [
    { id: 'battle-event-miyama', locationId: 'miyama_town', label: '深山町明置事件', cardId: 'public-event-miyama' },
    { id: 'battle-event-shinto', locationId: 'shinto', label: '新都暗置事件', cardId: 'hidden-event-shinto' },
    { id: 'battle-event-shinto-extra', locationId: 'shinto', label: '新都追加事件', cardId: 'public-event-shinto-extra' },
  ],
  self: {
    masterName: '久宇舞弥',
    servantName: '弗朗西斯·德雷克',
    deck: {
      size: 12,
      attributeCounts: { strength: 3, agility: 5, magecraft: 0, special: 4 },
      entries: [],
    },
    hand: ['own-card-1'],
    stagedAttackArea: ['own-card-1'],
    attackArea: ['own-attack-area-1'],
    discard: ['own-discard-1'],
    skills: [],
    masterSkills: ['public-master-skill-1'],
    commandSpells: ['own-command-spell-1'],
    ascensionSkills: ['public-ascension-skill-1'],
    servantDeckGuideCardId: 'self-servant-deck-guide',
  },
  cards: [
    {
      instanceId: 'public-master-card-1',
      definitionId: 'master.maiya.overview',
      name: '久宇舞弥',
      cardType: '御主主卡',
      cardRole: 'public_state',
      ownerLabel: '你 · 久宇舞弥',
      visibility: '公开',
      rulesSummaryZh: '御主主卡卡面能力为公开信息。',
    },
    {
      instanceId: 'public-master-card-2',
      definitionId: 'master.shinji.overview',
      name: '间桐慎二',
      cardType: '御主主卡',
      cardRole: 'public_state',
      ownerLabel: '对手 · 间桐慎二',
      visibility: '公开',
      rulesSummaryZh: '御主主卡卡面能力为公开信息。',
    },
    {
      instanceId: 'own-card-1',
      definitionId: 'servant.francis_drake.skill.stormy_voyager',
      name: '星之开拓者',
      cardType: '从者技能',
      cardRole: 'skill_effect',
      effectTiming: '行动阶段',
      revealPolicy: '发动时公开',
      ownerLabel: '你 · 弗朗西斯·德雷克',
      visibility: '仅本人',
      rulesSummaryZh: '本回合你的移动无视地图路径且不消耗魔力。',
    },
    {
      instanceId: 'own-attack-area-1',
      definitionId: 'master.maiya.deck.support-shot',
      name: '援护射击',
      cardType: '攻击区',
      cardRole: 'combat_card',
      ownerLabel: '你 · 久宇舞弥',
      visibility: '公开',
      rulesSummaryZh: '已加入本回合攻击区，战斗结算前公开可检视。',
    },
    {
      instanceId: 'self-servant-deck-guide',
      definitionId: 'servant.francis_drake.overview',
      name: '弗朗西斯·德雷克牌库构成',
      cardType: '从者牌库说明',
      cardRole: 'public_state',
      ownerLabel: '你 · 弗朗西斯·德雷克',
      visibility: '仅本人',
      rulesSummaryZh: '从者卡牌组第一张图。当前基础牌库：力量 2×3、敏捷 2×3、魔术 2×3、远隔操作×1、急行×1、幸运×1。',
    },
    {
      instanceId: 'own-command-spell-1',
      definitionId: 'master.maiya.command-spell',
      name: '令咒',
      cardType: '令咒',
      cardRole: 'skill_effect',
      effectTiming: '行动阶段',
      ownerLabel: '你 · 久宇舞弥',
      visibility: '仅本人',
      rulesSummaryZh: '令咒效果只在后端返回合法 action 时可发动。',
    },
    {
      instanceId: 'own-discard-1',
      definitionId: 'basic.luck',
      name: '幸运',
      cardType: '弃牌',
      cardRole: 'combat_card',
      ownerLabel: '你 · 弃牌堆',
      visibility: '仅本人',
      rulesSummaryZh: '本人弃牌堆可查看；其他玩家不能提前读取。幸运基础攻击威力为 4。',
    },
    {
      instanceId: 'public-opponent-1',
      definitionId: 'servant.francis_drake.skill.riding',
      name: '骑乘',
      cardType: '公开技能',
      ownerLabel: '对手 · 德雷克',
      visibility: '公开',
      rulesSummaryZh: '已公开的对手技能牌。',
    },
    {
      instanceId: 'public-master-skill-1',
      definitionId: 'master.maiya.skill.demo',
      name: '支援射击',
      cardType: '御主技能',
      masterSkillKind: 'native',
      ownerLabel: '你 · 久宇舞弥',
      visibility: '公开',
      rulesSummaryZh: '御主本体技能示例。',
    },
    {
      instanceId: 'public-ascension-skill-1',
      definitionId: 'master.maiya.ascension.demo',
      name: '战术升华',
      cardType: '升华技',
      masterSkillKind: 'ascension',
      ownerLabel: '你 · 久宇舞弥',
      visibility: '公开',
      rulesSummaryZh: '御主升华技示例。',
    },
    {
      instanceId: 'public-master-skill-2',
      definitionId: 'master.shinji.skill.demo',
      name: '虚张声势',
      cardType: '御主技能',
      masterSkillKind: 'native',
      ownerLabel: '对手 · 间桐慎二',
      visibility: '公开',
      rulesSummaryZh: '对手御主本体技能示例。',
    },
    {
      instanceId: 'public-ascension-skill-2',
      definitionId: 'master.shinji.ascension.demo',
      name: '伪臣升华',
      cardType: '升华技',
      masterSkillKind: 'ascension',
      ownerLabel: '对手 · 间桐慎二',
      visibility: '公开',
      rulesSummaryZh: '对手御主升华技示例。',
    },
    {
      instanceId: 'public-situation-1',
      definitionId: 'situation.perfect_flow',
      name: '完美的流动',
      cardType: '局势牌',
      ownerLabel: '公共区域',
      visibility: '公开',
      rulesSummaryZh: '魔术攻击于深山町和新都获得威力 +2。所有玩家立即获得 2 点魔力。',
    },
    {
      instanceId: 'public-event-miyama',
      definitionId: 'event.miyama.demo',
      name: '深山町明置事件',
      cardType: '事件牌',
      ownerLabel: '深山町',
      visibility: '公开',
      rulesSummaryZh: '深山町战斗事件示例。',
    },
    {
      instanceId: 'hidden-event-shinto',
      definitionId: 'event.shinto.demo',
      name: '新都暗置事件',
      cardType: '事件牌',
      ownerLabel: '新都',
      visibility: '暗置',
      rulesSummaryZh: '暗置事件尚未展示。',
    },
    {
      instanceId: 'public-event-shinto-extra',
      definitionId: 'event.shinto.extra',
      name: '新都追加事件',
      cardType: '事件牌',
      ownerLabel: '新都',
      visibility: '公开',
      rulesSummaryZh: '新都追加事件示例。',
    },
  ],
  publicCardIds: ['public-master-card-1', 'public-master-card-2', 'public-opponent-1', 'public-master-skill-1', 'public-ascension-skill-1', 'public-master-skill-2', 'public-ascension-skill-2', 'public-situation-1', 'public-event-miyama', 'hidden-event-shinto'],
  powerPreview: {
    title: '权限访问后续攻击预览',
    total: 8,
    terms: [
      { label: '基础威力', value: 2 },
      { label: '新都地利', value: 3 },
      { label: '局势牌', value: 1 },
      { label: '事件牌', value: 2 },
    ],
  },
  availableActions: [
    {
      actionId: 'play:own-card-1',
      kind: 'play_card',
      ownerPlayerId: 'player-1',
      label: '加入常规出牌',
      sourceCardInstanceId: 'own-card-1',
    },
    {
      actionId: 'stage:own-card-1',
      kind: 'play_card',
      ownerPlayerId: 'player-1',
      label: '加入待确认攻击',
      sourceCardInstanceId: 'own-card-1',
      backendCommand: {
        type: 'stage_attack_card',
        cardInstanceId: 'own-card-1',
      },
    },
    {
      actionId: 'confirm:staged',
      kind: 'pass',
      ownerPlayerId: 'player-1',
      label: '确认打出攻击区',
      backendCommand: {
        type: 'confirm_staged_attack',
      },
    },
    {
      actionId: 'cancel:staged',
      kind: 'pass',
      ownerPlayerId: 'player-1',
      label: '取消待确认攻击',
      backendCommand: {
        type: 'cancel_staged_attack',
      },
    },
    {
      actionId: 'deploy:magic_workshop',
      kind: 'deploy',
      ownerPlayerId: 'player-1',
      label: '部署到 魔术工房',
      backendCommand: {
        type: 'deploy_player',
        locationId: 'magic_workshop',
      },
    },
    {
      actionId: 'activate:own-card-1:stormy-voyager',
      kind: 'play_card',
      ownerPlayerId: 'player-1',
      label: '发动能力 stormy_voyager.action',
      sourceCardInstanceId: 'own-card-1',
      sourceCardName: '星之开拓者',
      sourceCardType: '从者技能',
      abilityId: 'stormy_voyager.action',
      abilityLabel: '行动阶段：本回合你的移动无视地图路径且不消耗魔力。',
      effectTiming: '行动阶段',
      backendCommand: {
        type: 'activate_ability',
        cardInstanceId: 'own-card-1',
        abilityId: 'stormy_voyager.action',
      },
    },
  ],
  interactionWindows: [
    {
      id: 'payment:own-card-1',
      kind: 'payment',
      title: '支付窗口',
      controllerId: 'player-1',
      sourceCardInstanceId: 'own-card-1',
      min: 1,
      max: 3,
      currentMana: 4,
      actions: [
        {
          actionId: 'activate:x-cost',
          kind: 'play_card',
          ownerPlayerId: 'player-1',
          label: '支付 X=1',
          sourceCardInstanceId: 'own-card-1',
          backendCommand: {
            type: 'activate_ability',
            cardInstanceId: 'own-card-1',
            abilityId: 'demo.x',
          },
        },
      ],
      variableCosts: [{ name: 'X', min: 1, max: 3 }],
    },
    {
      id: 'target:demo',
      kind: 'target',
      title: '选择目标',
      controllerId: 'player-1',
      min: 1,
      max: 2,
      candidates: [
        { id: 'own-card-1', label: '星之开拓者', kind: 'card', zone: 'hand' },
        { id: 'player-2', label: '对手', kind: 'player' },
        { id: 'shinto', label: '新都', kind: 'location' },
      ],
      actions: [
        {
          actionId: 'choose-target:demo',
          kind: 'respond',
          ownerPlayerId: 'player-1',
          label: '确认目标',
          targetId: 'own-card-1',
          backendCommand: {
            type: 'choose_target',
            decisionId: 'target:demo',
            selectedIds: [],
          },
        },
      ],
    },
    {
      id: 'response:demo',
      kind: 'response',
      title: '唯一触发选择',
      controllerId: 'player-1',
      actions: [
        {
          actionId: 'response:activate',
          kind: 'respond',
          ownerPlayerId: 'player-1',
          label: '发动响应',
          responseWindowId: 'response:demo',
          backendCommand: {
            type: 'resolve_response',
            windowId: 'response:demo',
            cardInstanceId: 'own-card-1',
            abilityId: 'demo.response',
          },
        },
        {
          actionId: 'response:decline',
          kind: 'pass',
          ownerPlayerId: 'player-1',
          label: '放弃响应',
          responseWindowId: 'response:demo',
          backendCommand: {
            type: 'decline_this_window',
            windowId: 'response:demo',
          },
        },
      ],
    },
    {
      id: 'mode:demo',
      kind: 'mode',
      title: '模式选择',
      controllerId: 'player-1',
      candidates: [
        { id: 'face-up', label: '公开打出', kind: 'option' },
        { id: 'face-down', label: '盖放', kind: 'option' },
        { id: 'additional-play', label: '追加打出', kind: 'option' },
      ],
      actions: [
        {
          actionId: 'mode:face-down',
          kind: 'play_card',
          ownerPlayerId: 'player-1',
          label: '盖放',
          sourceCardInstanceId: 'own-card-1',
          backendCommand: {
            type: 'play_card',
            cardInstanceId: 'own-card-1',
            faceDown: true,
          },
        },
      ],
    },
    {
      id: 'variable:replacement',
      kind: 'variable',
      title: '替换方向',
      controllerId: 'player-1',
      candidates: [
        { id: 'replace-master', label: '替换御主', kind: 'option' },
        { id: 'replace-servant', label: '替换从者', kind: 'option' },
      ],
      actions: [
        {
          actionId: 'replacement:host',
          kind: 'respond',
          ownerPlayerId: 'player-1',
          label: '提交房主裁定',
        },
      ],
    },
  ],
  directives: [
    {
      id: 'directive:demo',
      controllerId: 'player-1',
      kind: 'host_adjudicated',
      status: 'pending',
      label: 'create_independent_deck',
    },
  ],
  zones: [
    { id: 'hand', label: '手牌', cardIds: ['own-card-1'], count: 1, status: 'enabled' },
    { id: 'event_deck', label: '事件牌库', cardIds: [], count: 20, status: 'enabled' },
    { id: 'unowned_servant_pool', label: '无主从者池', cardIds: [], count: 0, status: 'host_adjudicated' },
  ],
  logs: [{ id: 'log:1', type: 'dispatch_ok', message: 'player-1:play_card' }],
  replay: [{ id: 'checkpoint:1', round: 1, phase: '行动阶段', revision: 1, label: 'round 1 start' }],
  finalRanking: [
    { playerId: 'player-1', seat: 1, vp: 7, militaryResult: 3, rank: 1 },
    { playerId: 'player-2', seat: 2, vp: 5, militaryResult: 1, rank: 2 },
  ],
  backendRejection: 'illegal_target: Selected targets are not legal',
  optionalAbilityReminder: '久宇舞弥的支援射击尚未处理',
};

describe('MatchTable', () => {
  it('loads the default seven-player authoring reference table without Moon Cancer or Babbage cards', () => {
    render(<MatchTable />);

    expect(screen.getByLabelText('中央地图')).toBeInTheDocument();
    expect(screen.getByLabelText('侦察')).toHaveTextContent('G 侦察 +2 VP');
    expect(screen.getAllByRole('button', { name: /查看玩家 \d+：/ })).toHaveLength(7);
    expect(screen.queryByText('B.B.')).not.toBeInTheDocument();
    expect(screen.queryByText('查尔斯·巴贝奇')).not.toBeInTheDocument();
    expect(screen.queryByText('月之圣杯')).not.toBeInTheDocument();
  });

  it('lets public opponent cards be inspected but never acted on', async () => {
    const user = userEvent.setup();
    render(<MatchTable fixture={fixture} />);

    await user.click(screen.getByRole('button', { name: '查看玩家 2：对手' }));
    await user.click(screen.getByRole('button', { name: '检视 虚张声势' }));
    expect(screen.getByRole('dialog', { name: '虚张声势' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '加入常规出牌' })).not.toBeInTheDocument();
  });

  it('opens a public-only player dossier from an opponent seat', async () => {
    const user = userEvent.setup();
    render(<MatchTable fixture={fixture} />);

    await user.click(screen.getByRole('button', { name: '查看玩家 2：对手' }));
    expect(screen.getByRole('dialog', { name: '对手公开情报' })).toHaveTextContent('间桐慎二');
    expect(screen.getByRole('dialog', { name: '对手公开情报' })).toHaveTextContent('弗朗西斯·德雷克');
    expect(screen.getByRole('dialog', { name: '对手公开情报' })).toHaveTextContent('御主主卡');
    expect(screen.getByRole('dialog', { name: '对手公开情报' })).toHaveTextContent('魔力3');
    expect(screen.getByRole('dialog', { name: '对手公开情报' })).toHaveTextContent('令咒2');
    expect(screen.getByRole('dialog', { name: '对手公开情报' })).toHaveTextContent('仅展示公开信息');
  });

  it('keeps master identity cards in each player dossier instead of crowding the map dock', () => {
    render(<MatchTable fixture={fixture} />);

    expect(screen.queryByLabelText('公开效果牌')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /检视 间桐慎二/ })).not.toBeInTheDocument();
  });

  it('opens the full master identity card from the public dossier', async () => {
    const user = userEvent.setup();
    render(<MatchTable fixture={fixture} />);

    await user.click(screen.getByRole('button', { name: '查看玩家 2：对手' }));
    await user.click(screen.getByRole('button', { name: '检视 间桐慎二' }));
    expect(screen.getByRole('dialog', { name: '间桐慎二' })).toHaveTextContent('御主主卡卡面能力为公开信息');
  });

  it('renders an action for an own card only when the server supplied its action ID', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<MatchTable fixture={fixture} onAction={onAction} />);

    await user.click(screen.getByRole('button', { name: /检视 星之开拓者/ }));
    await user.click(screen.getByRole('button', { name: '加入常规出牌' }));
    expect(onAction).toHaveBeenCalledWith(fixture.availableActions[0]);
  });

  it('renders preparation deployment actions in the decision panel', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<MatchTable fixture={fixture} onAction={onAction} />);

    await user.click(screen.getByRole('button', { name: '部署到 魔术工房' }));

    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({
      backendCommand: { type: 'deploy_player', locationId: 'magic_workshop' },
    }));
  });

  it('shows the servant deck guide card in the self workbench', async () => {
    const user = userEvent.setup();
    render(<MatchTable fixture={fixture} />);

    expect(screen.getByLabelText('从者牌库说明')).toHaveTextContent('从者牌库说明');
    await user.click(screen.getByRole('button', { name: /检视 弗朗西斯·德雷克牌库构成/ }));

    expect(screen.getByRole('dialog', { name: '弗朗西斯·德雷克牌库构成' })).toHaveTextContent('当前基础牌库');
  });

  it('shows the current round attack area separately from hand cards', () => {
    render(<MatchTable fixture={fixture} />);

    expect(screen.getByText('待确认攻击 · 1 张')).toBeInTheDocument();
    expect(screen.getByText('攻击区 · 1 张')).toBeInTheDocument();
    expect(screen.getByText('手牌 · 0 张')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '检视 援护射击' })).toBeInTheDocument();
  });

  it('shows command spell and private discard zones in the self workbench', async () => {
    const user = userEvent.setup();
    render(<MatchTable fixture={fixture} />);

    expect(screen.getByText('令咒区 · 1 张')).toBeInTheDocument();
    expect(screen.getByText('弃牌堆 · 1 张')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '检视 幸运' }));

    expect(screen.getByRole('dialog', { name: '幸运' })).toHaveTextContent('威力为 4');
  });

  it('expands the self workbench into focus mode while the player has operations', () => {
    const { container } = render(<MatchTable fixture={fixture} />);

    expect(container.querySelector('.match-table--workbench-focused')).toBeTruthy();
    expect(screen.getByRole('button', { name: /本人操作台/ })).toHaveTextContent('操作聚焦');
    expect(screen.getByRole('button', { name: /CONFIRM\s*结束行动/ })).toBeInTheDocument();
    expect(screen.getByText('牌库构成')).toBeInTheDocument();
    expect(screen.getByText('手牌 · 0 张').nextElementSibling).toHaveClass('card-row--fan');
    expect(screen.getByText('御主本体技能')).toBeInTheDocument();
    expect(screen.getByText('令咒区 · 1 张')).toBeInTheDocument();
    expect(screen.getByText('攻击区 · 1 张')).toBeInTheDocument();
    expect(screen.getByText('弃牌堆 · 1 张')).toBeInTheDocument();
  });

  it('collapses the self workbench into a zone summary when there is no own operation', async () => {
    const idleFixture: PlaytestClientFixture = {
      ...fixture,
      availableActions: [],
      interactionWindows: [],
      optionalAbilityReminder: undefined,
    };

    render(<MatchTable fixture={idleFixture} />);

    await waitFor(() => expect(screen.getByLabelText('本人操作台区域概览')).toBeInTheDocument());
    expect(screen.getByLabelText('本人操作台区域概览')).toHaveTextContent('御主技能');
    expect(screen.getByLabelText('本人操作台区域概览')).toHaveTextContent('令咒');
    expect(screen.queryByText('御主本体技能')).not.toBeInTheDocument();
  });

  it('re-expands the workbench when the priority player changes to another playable decision', async () => {
    const idleFixture: PlaytestClientFixture = {
      ...fixture,
      availableActions: [],
      interactionWindows: [],
      optionalAbilityReminder: undefined,
    };
    const nextFixture: PlaytestClientFixture = {
      ...fixture,
      match: { ...fixture.match, priorityPlayerId: 'player-2' },
    };
    const { container, rerender } = render(<MatchTable fixture={idleFixture} />);

    await waitFor(() => expect(screen.getByLabelText('本人操作台区域概览')).toBeInTheDocument());
    rerender(<MatchTable fixture={nextFixture} />);

    await waitFor(() => expect(container.querySelector('.match-table--workbench-focused')).toBeTruthy());
    expect(screen.getByRole('button', { name: /本人操作台/ })).toHaveTextContent('操作聚焦');
  });

  it('renders staged attack confirm and cancel actions from the backend', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<MatchTable fixture={fixture} onAction={onAction} />);

    await user.click(screen.getByRole('button', { name: '确认打出攻击区' }));
    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({
      backendCommand: { type: 'confirm_staged_attack' },
    }));

    await user.click(screen.getByRole('button', { name: '取消待确认攻击' }));
    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({
      backendCommand: { type: 'cancel_staged_attack' },
    }));
  });

  it('renders phase ability prompts with activate and decline choices', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<MatchTable fixture={fixture} onAction={onAction} />);

    const abilityWindow = screen.getByLabelText('技能发动窗口');
    expect(abilityWindow).toHaveTextContent('星之开拓者');
    expect(abilityWindow).toHaveTextContent('行动阶段：本回合你的移动无视地图路径且不消耗魔力。');

    await user.click(within(abilityWindow).getByRole('button', { name: '发动' }));
    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({
      backendCommand: { type: 'activate_ability', cardInstanceId: 'own-card-1', abilityId: 'stormy_voyager.action' },
    }));

    await user.click(within(abilityWindow).getByRole('button', { name: '不发动' }));
    expect(screen.queryByLabelText('技能发动窗口')).not.toBeInTheDocument();
  });

  it('places public cards and scoring marks according to the rulebook map', async () => {
    const user = userEvent.setup();
    render(<MatchTable fixture={fixture} />);

    expect(screen.getByLabelText('实战阶段流程')).toHaveTextContent('准备阶段');
    expect(screen.getByLabelText('实战阶段流程')).toHaveTextContent('移动阶段');
    expect(screen.getByLabelText('当前局势牌')).toHaveTextContent('完美的流动');
    expect(screen.getByLabelText('当前局势牌')).toHaveTextContent('回蓝 2');
    expect(screen.getByLabelText('当前局势牌')).toHaveTextContent('魔术攻击于深山町和新都获得威力 +2');
    expect(screen.getByLabelText('魔术工房')).toHaveTextContent('C 工房位');
    expect(screen.getByLabelText('魔术工房')).toHaveTextContent('+2');
    expect(screen.getByLabelText('魔术工房')).toHaveTextContent('+1');
    expect(screen.getByLabelText('深山町')).toHaveTextContent('D 地利');
    expect(screen.getByLabelText('深山町')).toHaveTextContent('+3');
    expect(within(screen.getByLabelText('深山町')).getByRole('button', { name: '查看玩家 2' })).toBeInTheDocument();
    expect(screen.getByLabelText('深山町')).toHaveTextContent('F 竞争战果 2');
    expect(screen.getByLabelText('新都')).toHaveTextContent('F 竞争战果 3');
    expect(screen.getByLabelText('侦察')).toHaveTextContent('G 侦察 +2 VP');
    expect(screen.getByLabelText('深山町')).toHaveTextContent('深山町明置事件');
    expect(screen.getByLabelText('新都事件牌')).toHaveTextContent('新都暗置事件');
    expect(screen.getByLabelText('新都事件牌')).toHaveTextContent('新都追加事件');

    await user.click(screen.getByRole('button', { name: /检视 新都暗置事件/ }));
    expect(screen.getByRole('dialog', { name: '新都暗置事件' })).toHaveTextContent('暗置事件尚未展示');
  });

  it('shows effect-only cards without fake cost or power values', async () => {
    const user = userEvent.setup();
    render(<MatchTable fixture={fixture} />);

    await user.click(screen.getByRole('button', { name: /检视 星之开拓者/ }));
    const dialog = screen.getByRole('dialog', { name: '星之开拓者' });
    expect(dialog).toHaveTextContent('行动阶段');
    expect(dialog).toHaveTextContent('发动时公开');
    expect(dialog).not.toHaveTextContent('费用');
    expect(dialog).not.toHaveTextContent('威力');
  });

  it('shows master native skills and ascension skills as separate public groups', async () => {
    const user = userEvent.setup();
    render(<MatchTable fixture={fixture} />);

    await user.click(screen.getByRole('button', { name: '查看玩家 2：对手' }));
    const dossier = screen.getByRole('dialog', { name: '对手公开情报' });
    expect(dossier).toHaveTextContent('御主本体技能');
    expect(dossier).toHaveTextContent('虚张声势');
    expect(dossier).toHaveTextContent('升华技');
    expect(dossier).toHaveTextContent('伪臣升华');
  });

  it('displays server-style power calculation terms and total', () => {
    render(<MatchTable fixture={fixture} />);

    expect(screen.getByLabelText('威力计算预览')).toHaveTextContent('基础威力');
    expect(screen.getByLabelText('威力计算预览')).toHaveTextContent('事件牌');
    expect(screen.getByLabelText('威力计算预览')).toHaveTextContent('最终 8');
  });

  it('reminds the player about an optional ability before ending the phase-turn', async () => {
    const user = userEvent.setup();
    render(<MatchTable fixture={fixture} />);

    await user.click(screen.getByRole('button', { name: '结束行动' }));
    expect(screen.getByRole('alertdialog', { name: '可选能力提醒' })).toHaveTextContent(
      '久宇舞弥的支援射击尚未处理',
    );
  });

  it('can switch to a server-supplied non-priority view without losing inspection', async () => {
    const user = userEvent.setup();
    const switchableFixture = {
      ...fixture,
      nonPriorityView: {
        priorityPlayerId: 'player-2',
        availableActions: [],
      },
    } as PlaytestClientFixture;
    render(<MatchTable fixture={switchableFixture} />);

    await user.click(screen.getByRole('button', { name: '切换至非优先视角' }));
    expect(screen.getByText('非优先视角')).toBeInTheDocument();
    expect(screen.getByText('0', { selector: '.decision-panel__metric strong' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '查看玩家 2：对手' }));
    await user.click(screen.getByRole('button', { name: /检视 间桐慎二/ }));
    expect(screen.getByRole('dialog', { name: '间桐慎二' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '加入常规出牌' })).not.toBeInTheDocument();
  });

  it('renders payment, target, response, directive, zones, logs, and backend rejection windows', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const onConsumeDirective = vi.fn();
    const onPauseForFix = vi.fn();
    const onRestoreReplay = vi.fn();
    render(
      <MatchTable
        fixture={fixture}
        onAction={onAction}
        onConsumeDirective={onConsumeDirective}
        onPauseForFix={onPauseForFix}
        onRestoreReplay={onRestoreReplay}
        canAdjudicate
      />,
    );

    expect(screen.getByLabelText('交互窗口')).toHaveTextContent('支付窗口');
    expect(screen.getByLabelText('交互窗口')).toHaveTextContent('当前魔力');
    expect(screen.getByLabelText('交互窗口')).toHaveTextContent('支付后');
    expect(screen.getByLabelText('交互窗口')).toHaveTextContent('选择目标');
    expect(screen.getByLabelText('交互窗口')).toHaveTextContent('最小');
    expect(screen.getByLabelText('交互窗口')).toHaveTextContent('最大');
    expect(screen.getByLabelText('交互窗口')).toHaveTextContent('唯一触发选择');
    expect(screen.getByLabelText('交互窗口')).toHaveTextContent('模式选择');
    expect(screen.getByLabelText('模式选择选项')).toHaveTextContent('追加打出');
    expect(screen.getByLabelText('交互窗口')).toHaveTextContent('替换方向');
    expect(screen.getByLabelText('directive 面板')).toHaveTextContent('create_independent_deck');
    expect(screen.getByLabelText('游戏区域投影')).toHaveTextContent('事件牌库');
    expect(screen.getByLabelText('游戏区域投影')).toHaveTextContent('无主从者池');
    await user.click(screen.getByRole('button', { name: /手牌/ }));
    expect(screen.getByLabelText('手牌区域详情')).toHaveTextContent('1 张');
    await user.click(screen.getByRole('button', { name: /事件牌库/ }));
    expect(screen.getByLabelText('事件牌库区域详情')).toHaveTextContent('20 张');
    expect(screen.getByLabelText('事件牌库区域详情')).toHaveTextContent('当前没有可检视卡牌');
    expect(screen.getByLabelText('日志与回放')).toHaveTextContent('dispatch_ok');
    expect(screen.getByLabelText('最终排名')).toHaveTextContent('#1');
    expect(screen.getByLabelText('最终排名')).toHaveTextContent('7 VP / 军功 3');
    expect(screen.getByRole('alert')).toHaveTextContent('illegal_target');

    await user.click(screen.getByRole('button', { name: '发动响应' }));
    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ actionId: 'response:activate' }));

    await user.click(screen.getByRole('button', { name: '人工确认继续' }));
    expect(onConsumeDirective).toHaveBeenCalledWith('directive:demo');

    await user.click(screen.getByRole('button', { name: '暂停并保存现场' }));
    expect(onPauseForFix).toHaveBeenCalledWith('directive:demo');

    await user.click(screen.getByRole('button', { name: /round 1 start/ }));
    expect(onRestoreReplay).toHaveBeenCalledWith('checkpoint:1');
  });

  it('submits X payment and selected targets through backend commands', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<MatchTable fixture={fixture} onAction={onAction} />);

    const xInput = screen.getByRole('spinbutton');
    await user.clear(xInput);
    await user.type(xInput, '3');
    await user.click(screen.getByRole('button', { name: '支付 X=1' }));
    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({
      backendCommand: expect.objectContaining({ variables: { X: 3 } }),
    }));

    const targetWindow = screen.getByText('选择目标').closest('article');
    expect(targetWindow).not.toBeNull();
    const targetControls = within(targetWindow as HTMLElement);
    await user.click(targetControls.getByRole('button', { name: /星之开拓者/ }));
    await user.click(targetControls.getByRole('button', { name: /对手/ }));
    await user.click(targetControls.getByRole('button', { name: '确认目标' }));
    expect(onAction).toHaveBeenLastCalledWith(expect.objectContaining({
      backendCommand: expect.objectContaining({ selectedIds: ['own-card-1', 'player-2'] }),
    }));
  });
});
