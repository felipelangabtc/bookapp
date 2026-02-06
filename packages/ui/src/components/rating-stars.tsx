import * as React from 'react';
import { Star, StarHalf } from 'lucide-react';

import { cn } from '../lib/utils';

export interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

const RatingStars = React.forwardRef<HTMLDivElement, RatingStarsProps>(
  ({ rating, maxRating = 5, size = 'md', showValue = false, className }, ref) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.25 && rating % 1 < 0.75;
    const adjustedFullStars = rating % 1 >= 0.75 ? fullStars + 1 : fullStars;

    return (
      <div ref={ref} className={cn('flex items-center gap-0.5', className)}>
        {Array.from({ length: maxRating }).map((_, index) => {
          if (index < adjustedFullStars) {
            return (
              <Star
                key={index}
                className={cn(sizeClasses[size], 'fill-yellow-400 text-yellow-400')}
              />
            );
          } else if (index === fullStars && hasHalfStar) {
            return (
              <div key={index} className="relative">
                <Star className={cn(sizeClasses[size], 'text-gray-300')} />
                <div className="absolute left-0 top-0 overflow-hidden" style={{ width: '50%' }}>
                  <Star className={cn(sizeClasses[size], 'fill-yellow-400 text-yellow-400')} />
                </div>
              </div>
            );
          } else {
            return <Star key={index} className={cn(sizeClasses[size], 'text-gray-300')} />;
          }
        })}
        {showValue && (
          <span className="ml-1 text-sm text-muted-foreground">{rating.toFixed(1)}</span>
        )}
      </div>
    );
  }
);
RatingStars.displayName = 'RatingStars';

export interface RatingInputProps {
  value: number;
  onChange: (value: number) => void;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  allowHalf?: boolean;
  className?: string;
  disabled?: boolean;
}

const RatingInput = React.forwardRef<HTMLDivElement, RatingInputProps>(
  (
    { value, onChange, maxRating = 5, size = 'md', allowHalf = true, className, disabled = false },
    ref
  ) => {
    const [hoverValue, setHoverValue] = React.useState<number | null>(null);

    const handleClick = (starIndex: number, isLeftHalf: boolean) => {
      if (disabled) return;
      const newValue = allowHalf && isLeftHalf ? starIndex + 0.5 : starIndex + 1;
      onChange(newValue);
    };

    const handleMouseMove = (
      e: React.MouseEvent<HTMLDivElement>,
      starIndex: number
    ) => {
      if (disabled) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const isLeftHalf = e.clientX - rect.left < rect.width / 2;
      const newValue = allowHalf && isLeftHalf ? starIndex + 0.5 : starIndex + 1;
      setHoverValue(newValue);
    };

    const displayValue = hoverValue ?? value;

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-0.5',
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
          className
        )}
        onMouseLeave={() => setHoverValue(null)}
      >
        {Array.from({ length: maxRating }).map((_, index) => {
          const isFilled = index + 1 <= displayValue;
          const isHalfFilled = !isFilled && index + 0.5 === displayValue;

          return (
            <div
              key={index}
              className="relative"
              onMouseMove={(e) => handleMouseMove(e, index)}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const isLeftHalf = e.clientX - rect.left < rect.width / 2;
                handleClick(index, isLeftHalf);
              }}
            >
              {isFilled ? (
                <Star
                  className={cn(
                    sizeClasses[size],
                    'fill-yellow-400 text-yellow-400 transition-colors'
                  )}
                />
              ) : isHalfFilled ? (
                <div className="relative">
                  <Star className={cn(sizeClasses[size], 'text-gray-300')} />
                  <div
                    className="absolute left-0 top-0 overflow-hidden"
                    style={{ width: '50%' }}
                  >
                    <Star
                      className={cn(
                        sizeClasses[size],
                        'fill-yellow-400 text-yellow-400 transition-colors'
                      )}
                    />
                  </div>
                </div>
              ) : (
                <Star
                  className={cn(
                    sizeClasses[size],
                    'text-gray-300 transition-colors hover:text-yellow-200'
                  )}
                />
              )}
            </div>
          );
        })}
        <span className="ml-2 text-sm font-medium">{displayValue.toFixed(1)}</span>
      </div>
    );
  }
);
RatingInput.displayName = 'RatingInput';

export { RatingStars, RatingInput };
