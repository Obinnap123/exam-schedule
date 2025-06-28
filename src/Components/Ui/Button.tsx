import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const Button: React.FC<ButtonProps> = ({ className, children, ...props }) => {
  return (
    <button
      className={className}
      {...props}
    >
      {children}
    </button>
  );
};
