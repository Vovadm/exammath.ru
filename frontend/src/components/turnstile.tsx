'use client';

import { Turnstile } from '@marsidev/react-turnstile';

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

interface TurnstileWidgetProps {
  onSuccess: (token: string) => void;
}

export function TurnstileWidget({ onSuccess }: TurnstileWidgetProps) {
  if (!SITE_KEY) return null;

  return (
    <div className="flex justify-center my-4">
      <Turnstile
        siteKey={SITE_KEY}
        onSuccess={onSuccess}
        options={{
          theme: 'light',
          language: 'ru',
        }}
      />
    </div>
  );
}
