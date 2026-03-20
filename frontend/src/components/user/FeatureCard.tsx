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
    <CardHeader className={`pb-2 px-4 md:px-6 ${className}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className="p-1.5 bg-gray-100 rounded-lg flex items-center justify-center">
              <Icon className="h-5 w-5 text-blue-600" />
            </div>
          )}
          <div>
            <CardTitle className="text-base md:text-lg flex items-center gap-2">{title}</CardTitle>
            {description && <CardDescription className="text-xs md:text-sm">{description}</CardDescription>}
          </div>
        </div>
        {rightAction}
      </div>
    </CardHeader>
  );
}

export default FeatureCard;
