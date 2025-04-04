import React, { ReactNode } from 'react';

// Type for Dialog props
interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ open, children }) => {
  if (!open) return null;
 
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%]">
        {children}
      </div>
    </div>
  );
};

// Type for DialogContent props
interface DialogContentProps {
  children: ReactNode;
  className?: string;
}

export const DialogContent: React.FC<DialogContentProps> = ({ 
  children, 
  className = "" 
}) => (
  <div className={`bg-background shadow-lg rounded-lg border p-6 ${className}`}>
    {children}
  </div>
);

// Type for DialogHeader props
interface DialogHeaderProps {
  children: ReactNode;
}

export const DialogHeader: React.FC<DialogHeaderProps> = ({ children }) => (
  <div className="flex flex-col space-y-1.5 mb-4">
    {children}
  </div>
);

// Type for DialogTitle props
interface DialogTitleProps {
  children: ReactNode;
}

export const DialogTitle: React.FC<DialogTitleProps> = ({ children }) => (
  <h2 className="text-lg font-semibold leading-none tracking-tight">
    {children}
  </h2>
);

// Type for DialogFooter props
interface DialogFooterProps {
  children: ReactNode;
}

export const DialogFooter: React.FC<DialogFooterProps> = ({ children }) => (
  <div className="flex justify-end space-x-2 mt-4">
    {children}
  </div>
);

// Type for FormField props
interface FormFieldProps {
  label: string;
  children: ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({ label, children }) => (
  <div className="grid gap-2">
    <label className="text-sm font-medium leading-none">
      {label}
    </label>
    {children}
  </div>
);