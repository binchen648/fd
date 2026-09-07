import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CardInspectionOverlay } from './CardInspectionOverlay';
import { CardSurface } from './CardSurface';
import type { InspectableCard } from '../state/playtest-fixture-loader';

const card: InspectableCard = {
  instanceId: 'own-card-1',
  definitionId: 'servant.francis_drake.skill.stormy_voyager',
  name: '星之开拓者',
  cardType: '从者技能',
  ownerLabel: '你 · 弗朗西斯·德雷克',
  visibility: '仅本人',
  rulesSummaryZh: '本回合你的移动无视地图路径且不消耗魔力。',
  imageUrl: '/cards/drake-stormy-voyager.png',
};

describe('universal card inspection', () => {
  it('opens a fixed hover preview and supports click-to-inspect', async () => {
    const user = userEvent.setup();
    const onInspect = vi.fn();
    render(<CardSurface card={card} onInspect={onInspect} />);

    await user.hover(screen.getByRole('button', { name: /检视 星之开拓者/ }));
    expect(screen.getByRole('tooltip')).toHaveTextContent('移动无视地图路径');
    expect(screen.getByRole('img', { name: '星之开拓者卡图' })).toHaveAttribute(
      'src',
      '/cards/drake-stormy-voyager.png',
    );

    await user.click(screen.getByRole('button', { name: /检视 星之开拓者/ }));
    expect(onInspect).toHaveBeenCalledWith(card);
  });

  it('closes the centered inspection with Escape and backdrop clicks', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { rerender } = render(
      <CardInspectionOverlay card={card} actions={[]} onClose={onClose} onAction={vi.fn()} />,
    );

    expect(screen.getByRole('dialog', { name: '星之开拓者' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '星之开拓者完整卡图' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);

    onClose.mockClear();
    rerender(<CardInspectionOverlay card={card} actions={[]} onClose={onClose} onAction={vi.fn()} />);
    await user.click(screen.getByTestId('card-inspection-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('mounts the inspection above the table and locks background scrolling', () => {
    render(
      <div data-testid='table-shell'>
        <CardInspectionOverlay card={card} actions={[]} onClose={vi.fn()} onAction={vi.fn()} />
      </div>,
    );

    const backdrop = screen.getByTestId('card-inspection-backdrop');
    expect(backdrop.parentElement).toBe(document.body);
    expect(document.body.style.overflow).toBe('hidden');
  });
});
