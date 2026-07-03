import { useState } from 'react';

const GOOGLE_FORM_ACTION_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfO7l875BGC0CMFDhbQRwtiQL6pgA-8vtK8uSaFkhr6fyK8Vw/formResponse';
const EMAIL_ENTRY_ID = 'entry.77618089';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function useGoogleForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!EMAIL_REGEX.test(trimmedEmail)) return;

    setStatus('submitting');

    const formData = new FormData();
    formData.append(EMAIL_ENTRY_ID, trimmedEmail);

    try {
      await fetch(GOOGLE_FORM_ACTION_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: formData,
      });
      setStatus('success');
      setEmail('');
    } catch (error) {
      console.error('Form submission error:', error);
      setStatus('error');
    }
  };

  const resetForm = () => {
    setStatus('idle');
    setEmail('');
  };

  return {
    email,
    setEmail,
    status,
    handleSubmit,
    resetForm,
  };
}
