'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import Button from './Button';

interface EmptyStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export default function EmptyState({
  title,
  message,
  actionLabel,
  actionHref = '/',
  onAction,
}: EmptyStateProps) {
  const { t } = useLanguage();
  const label = actionLabel ?? t('cart.continueShopping');
  return (
    <div className="bg-white rounded-lg shadow-md p-12 text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">{title}</h1>
      <p className="text-gray-600 mb-6">{message}</p>
      {onAction ? (
        <Button onClick={onAction}>{label}</Button>
      ) : (
        <Button asLink href={actionHref}>
          {label}
        </Button>
      )}
    </div>
  );
}
