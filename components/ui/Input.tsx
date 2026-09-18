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
                        'w-full px-3.5 py-2.5 rounded-lg text-zinc-100 text-sm transition-all duration-150',
                        'bg-zinc-950/40 border focus:outline-none focus:ring-2 focus:ring-indigo-550/20 focus:border-indigo-500',
                        error
                            ? 'border-red-500/50 focus:ring-red-500/20 focus:border-red-550'
                            : 'border-zinc-800 hover:border-zinc-700',
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
