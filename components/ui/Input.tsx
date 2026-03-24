import { clsx } from 'clsx';
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, id, ...props }, ref) => {
        return (
            <div className="flex flex-col gap-1">
                {label && (
                    <label htmlFor={id} className="text-sm font-medium text-white/80">
                        {label}
                    </label>
                )}
                <input
                    id={id}
                    ref={ref}
                    className={clsx(
                        'w-full px-3.5 py-2.5 rounded-lg text-white text-sm transition-all duration-150',
                        'bg-white/5 focus:outline-none focus:ring-2 focus:ring-[#38BDF8] focus:border-[#38BDF8]',
                        error
                            ? 'border-red-400 focus:ring-red-400'
                            : 'border border-[#38BDF8]/20 hover:border-[#38BDF8]/40',
                        className
                    )}
                    {...props}
                />
                {error && <p className="text-xs text-red-400">{error}</p>}
            </div>
        );
    }
);

Input.displayName = 'Input';
export default Input;
