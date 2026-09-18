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
                    'bg-zinc-900/40 rounded-xl p-5 border border-zinc-800 shadow-sm',
                    hover &&
                    'transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-900/60 hover:shadow-[0_0_24px_rgba(255,255,255,0.02)] hover:-translate-y-0.5 cursor-pointer',
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
