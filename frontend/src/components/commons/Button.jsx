import { Loader2 } from 'lucide-react';
import React, { memo } from 'react';

/**
 * Button component with loading state and improved responsiveness.
 */
const Button = memo(function Button({
  onClick,
  className = '',
  isLoading = false,
  disabled = false,
  children,
  type = 'button',
  ...rest
}) {
  const isDisabled = isLoading || disabled;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        ${isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
        inline-flex items-center justify-center
        rounded-md px-3 py-2
      text-white
        transition-colors duration-150 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${className}
      `}
      {...rest}
    >
      {isLoading ? (
        <>
          <Loader2 className="animate-spin w-5 h-5" aria-hidden="true" />
          <span className="ml-2">Chargement...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
});

export default Button;