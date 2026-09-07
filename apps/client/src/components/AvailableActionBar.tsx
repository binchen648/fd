import type { ClientAvailableAction } from '../state/playtest-fixture-loader';

export interface AvailableActionBarProps {
  actions: ClientAvailableAction[];
  onAction: (action: ClientAvailableAction) => void;
}

export function AvailableActionBar({ actions, onAction }: AvailableActionBarProps) {
  if (actions.length === 0) {
    return <p className='action-bar__empty'>此牌当前仅可检视</p>;
  }

  return (
    <div className='action-bar' aria-label='可执行操作'>
      {actions.map((action) => (
        <button key={action.actionId} type='button' onClick={() => onAction(action)}>
          {action.label}
        </button>
      ))}
    </div>
  );
}
