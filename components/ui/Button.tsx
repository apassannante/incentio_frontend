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
                    'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0F1E] disabled:opacity-50 disabled:cursor-not-allowed',
                    {
                        'bg-[#38BDF8] text-[#0A0F1E] hover:opacity-90 focus:ring-[#38BDF8] active:scale-[0.98]':
                            variant === 'primary',
                        'bg-transparent text-[#38BDF8] border-2 border-[#38BDF8] hover:bg-[#38BDF8]/10 focus:ring-[#38BDF8]':
                            variant === 'secondary',
                        'bg-transparent text-[#38BDF8] hover:bg-[#38BDF8]/10 focus:ring-[#38BDF8]':
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
