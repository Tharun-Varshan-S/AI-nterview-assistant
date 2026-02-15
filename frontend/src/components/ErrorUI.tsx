import { AlertCircle, Wifi, WifiOff } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
  description?: string;
  type?: 'error' | 'warning' | 'info';
  onRetry?: () => void;
  onDismiss?: () => void;
  isNetworkError?: boolean;
}

/**
 * Reusable error alert component
 */
export function ErrorAlert({
  message,
  description,
  type = 'error',
  onRetry,
  onDismiss,
  isNetworkError = false,
}: ErrorAlertProps) {
  const bgColor = type === 'error' ? 'bg-rose-50' : type === 'warning' ? 'bg-amber-50' : 'bg-blue-50';
  const borderColor = type === 'error' ? 'border-rose-200' : type === 'warning' ? 'border-amber-200' : 'border-blue-200';
  const textColor = type === 'error' ? 'text-rose-800' : type === 'warning' ? 'text-amber-800' : 'text-blue-800';
  const IconComponent = isNetworkError ? WifiOff : AlertCircle;

  return (
    <div className={`${bgColor} border ${borderColor} rounded-lg p-4 mb-4`}>
      <div className="flex items-start gap-3">
        <IconComponent className={`flex-shrink-0 mt-0.5 ${textColor}`} size={20} />
        <div className="flex-1">
          <h3 className={`font-semibold ${textColor} mb-1`}>{message}</h3>
          {description && <p className={`text-sm ${textColor} opacity-80 mb-3`}>{description}</p>}
          <div className="flex gap-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className={`text-sm font-medium px-3 py-1.5 rounded transition-colors ${
                  type === 'error'
                    ? 'bg-rose-100 hover:bg-rose-200 text-rose-700'
                    : type === 'warning'
                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-700'
                      : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                }`}
              >
                Retry
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className={`text-sm font-medium px-3 py-1.5 rounded transition-colors ${
                  type === 'error'
                    ? 'bg-rose-100 hover:bg-rose-200 text-rose-700'
                    : type === 'warning'
                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-700'
                      : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                }`}
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Empty state component for various scenarios
 */
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionText, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && <div className="mb-4 text-gray-400">{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-sm">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}

/**
 * Loading error component with retry
 */
interface LoadingErrorProps {
  message?: string;
  onRetry: () => void;
  isLoading?: boolean;
}

export function LoadingError({ message = 'Failed to load. Please try again.', onRetry, isLoading = false }: LoadingErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <AlertCircle className="text-rose-500 mb-3" size={32} />
      <p className="text-gray-700 mb-4 text-center">{message}</p>
      <button
        onClick={onRetry}
        disabled={isLoading}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400"
      >
        {isLoading ? 'Retrying...' : 'Retry'}
      </button>
    </div>
  );
}
