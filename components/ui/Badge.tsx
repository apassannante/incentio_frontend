import { clsx } from 'clsx';
import { HTMLAttributes } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    color?: 'green' | 'blue' | 'orange' | 'yellow' | 'red' | 'gray';
}

export default function Badge({ className, color = 'gray', children, ...props }: BadgeProps) {
    return (
        <span
            className={clsx(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                {
                    'bg-emerald-500/15 text-emerald-400 border-emerald-500/25': color === 'green',
                    'bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/25': color === 'blue',
                    'bg-orange-400/15 text-orange-300 border-orange-400/25': color === 'orange',
                    'bg-amber-400/15 text-amber-300 border-amber-400/25': color === 'yellow',
                    'bg-red-400/15 text-red-300 border-red-400/25': color === 'red',
                    'bg-white/10 text-white/60 border-white/15': color === 'gray',
                },
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
}
