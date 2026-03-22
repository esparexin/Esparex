import React from 'react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface FeatureCardProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  Icon?: React.ComponentType<any>;
  rightAction?: React.ReactNode;
  className?: string;
}

export function FeatureCard({ title, description, Icon, rightAction, className = '' }: FeatureCardProps) {
  return (
    <CardHeader className={`py-3 px-4 md:px-6 md:py-4 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {Icon && (
            <div className="p-1.5 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
            </div>
          )}
          <div className="min-w-0">
            <CardTitle className="text-sm md:text-base flex items-center gap-2 leading-tight">{title}</CardTitle>
            {description && <CardDescription className="text-xs mt-0.5 leading-tight">{description}</CardDescription>}
          </div>
        </div>
        {rightAction && <div className="shrink-0">{rightAction}</div>}
      </div>
    </CardHeader>
  );
}

export default FeatureCard;
