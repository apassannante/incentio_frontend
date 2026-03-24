import { clsx } from 'clsx';
import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    hover?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className, hover = false, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={clsx(
                    'bg-[#0F1F3D] rounded-xl p-5 border border-[#38BDF8]/20 shadow-sm',
                    hover &&
                    'transition-all duration-200 hover:border-[#38BDF8]/60 hover:shadow-[0_0_24px_rgba(56,189,248,0.08)] hover:-translate-y-0.5 cursor-pointer',
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = 'Card';
export default Card;
