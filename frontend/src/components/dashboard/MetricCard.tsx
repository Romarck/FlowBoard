import { ReactNode } from 'react';
import { Card } from '../ui/card';

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: ReactNode;
  variant?: 'default' | 'warning' | 'success' | 'danger';
}

const variantStyles = {
  default: 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700',
  warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700',
  success: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700',
  danger: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700',
};

const titleStyles = {
  default: 'text-gray-600 dark:text-gray-400',
  warning: 'text-amber-700 dark:text-amber-300',
  success: 'text-emerald-700 dark:text-emerald-300',
  danger: 'text-red-700 dark:text-red-300',
};

const valueStyles = {
  default: 'text-gray-900 dark:text-white',
  warning: 'text-amber-900 dark:text-amber-100',
  success: 'text-emerald-900 dark:text-emerald-100',
  danger: 'text-red-900 dark:text-red-100',
};

const subtitleStyles = {
  default: 'text-gray-500 dark:text-gray-500',
  warning: 'text-amber-600 dark:text-amber-400',
  success: 'text-emerald-600 dark:text-emerald-400',
  danger: 'text-red-600 dark:text-red-400',
};

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  variant = 'default',
}: MetricCardProps) {
  return (
    <Card className={`p-6 ${variantStyles[variant]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`text-sm font-medium ${titleStyles[variant]}`}>
            {title}
          </p>
          <p className={`mt-2 text-3xl font-bold ${valueStyles[variant]}`}>
            {value}
          </p>
          {subtitle && (
            <p className={`mt-1 text-xs ${subtitleStyles[variant]}`}>
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div className="ml-4 flex-shrink-0">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
