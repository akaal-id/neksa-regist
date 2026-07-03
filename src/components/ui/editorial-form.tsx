'use client';

import { forwardRef, useId } from 'react';
import styles from './EditorialForm.module.css';

export interface EditorialLabelProps {
  children: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  className?: string;
}

export function EditorialLabel({ children, htmlFor, required, className = '' }: EditorialLabelProps) {
  return (
    <label htmlFor={htmlFor} className={`${styles.label} ${className}`}>
      {children}
      {required && <span className={styles.labelRequired} aria-hidden>*</span>}
    </label>
  );
}

export interface EditorialInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label?: string;
  error?: string;
  required?: boolean;
  containerClassName?: string;
}

export const EditorialInput = forwardRef<HTMLInputElement, EditorialInputProps>(
  ({ label, error, required, containerClassName = '', id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className={[styles.container, containerClassName].filter(Boolean).join(' ')}>
        {label && (
          <EditorialLabel htmlFor={inputId} required={required}>
            {label}
          </EditorialLabel>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`${styles.inputBase} ${error ? styles.inputError : ''}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className={styles.errorText} role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

EditorialInput.displayName = 'EditorialInput';

export interface EditorialSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  containerClassName?: string;
}

export const EditorialSelect = forwardRef<HTMLSelectElement, EditorialSelectProps>(
  ({ label, error, options, placeholder, required, containerClassName = '', id, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id || generatedId;

    return (
      <div className={[styles.container, containerClassName].filter(Boolean).join(' ')}>
        {label && (
          <EditorialLabel htmlFor={selectId} required={required}>
            {label}
          </EditorialLabel>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`${styles.selectBase} ${error ? styles.inputError : ''}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${selectId}-error` : undefined}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={`${selectId}-error`} className={styles.errorText} role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

EditorialSelect.displayName = 'EditorialSelect';

export interface EditorialTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  label?: string;
  error?: string;
  required?: boolean;
  containerClassName?: string;
}

export const EditorialTextarea = forwardRef<HTMLTextAreaElement, EditorialTextareaProps>(
  ({ label, error, required, containerClassName = '', id, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id || generatedId;

    return (
      <div className={[styles.container, containerClassName].filter(Boolean).join(' ')}>
        {label && (
          <EditorialLabel htmlFor={textareaId} required={required}>
            {label}
          </EditorialLabel>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`${styles.textareaBase} ${error ? styles.inputError : ''}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${textareaId}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${textareaId}-error`} className={styles.errorText} role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

EditorialTextarea.displayName = 'EditorialTextarea';
