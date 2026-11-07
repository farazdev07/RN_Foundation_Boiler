import { Component, type ErrorInfo, type PropsWithChildren } from 'react';
import { useTranslation } from '@shared/lib/i18n';
import { devError } from '@shared/lib/logger';
import { reportError } from '@shared/lib/monitoring';
import { EmptyState } from '../EmptyState';

type State = { hasError: boolean };

function Fallback({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();

  return (
    <EmptyState
      title={t('errorTitle')}
      icon="triangle-alert"
      actionLabel={t('retry')}
      onAction={onRetry}
    />
  );
}

export class ErrorBoundary extends Component<PropsWithChildren, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    devError('ErrorBoundary caught an error', error, info.componentStack);
    reportError(error, { componentStack: info.componentStack });
  }

  private readonly reset = (): void => {
    this.setState({ hasError: false });
  };

  override render() {
    return this.state.hasError ? (
      <Fallback onRetry={this.reset} />
    ) : (
      this.props.children
    );
  }
}
