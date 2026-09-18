import { clsx } from 'clsx';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={clsx(
                    'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#09090b] disabled:opacity-50 disabled:cursor-not-allowed',
                    {
                        'bg-zinc-100 text-zinc-950 hover:bg-zinc-200 border border-zinc-200/50 focus:ring-zinc-400 active:scale-[0.98]':
                            variant === 'primary',
                        'bg-zinc-900/40 text-zinc-350 border border-zinc-800 hover:bg-zinc-850 hover:text-white focus:ring-zinc-700':
                            variant === 'secondary',
                        'bg-transparent text-zinc-400 hover:bg-zinc-900/50 hover:text-white focus:ring-zinc-700':
                            variant === 'ghost',
                    },
                    {
                        'px-3 py-1.5 text-sm': size === 'sm',
                        'px-5 py-2.5 text-base': size === 'md',
                        'px-7 py-3.5 text-lg': size === 'lg',
                    },
                    className
                )}
                {...props}
            >
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';
export default Button;
