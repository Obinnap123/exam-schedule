import React from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    
    React.useImperativeHandle(ref, () => textareaRef.current!);

    const handleAutoHeight = (element: HTMLTextAreaElement) => {
      if (element) {
        element.style.height = 'auto';
        element.style.height = `${element.scrollHeight}px`;
      }
    };

    React.useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        handleAutoHeight(textareaRef.current);
      }
    }, []);

    React.useEffect(() => {
      if (textareaRef.current) {
        handleAutoHeight(textareaRef.current);
      }
    }, [props.value]);

    return (
      <textarea
        {...props}
        ref={textareaRef}
        className={cn(
          "w-full resize-none text-white placeholder-gray-400 focus:outline-none focus:ring-0 focus-visible:outline-none",
          "bg-transparent caret-white selection:bg-gray-400/20",
          className
        )}
        rows={1}
        onFocus={(e) => {
          handleAutoHeight(e.target);
          props.onFocus?.(e);
        }}
        onChange={(e) => {
          handleAutoHeight(e.target);
          props.onChange?.(e);
        }}
      />
    );
  }
);

Textarea.displayName = "Textarea";
