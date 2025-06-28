import React from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={`w-full resize-none rounded-lg border border-[#444654] bg-[#40414f] p-4 text-white placeholder-gray-400 focus:outline-none transition ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
