'use client';

import React, { useEffect, useState } from 'react';
import { formatDateIndo } from '@/lib/constants';

interface FormattedDateProps {
  date: string;
  className?: string;
}

export const FormattedDate: React.FC<FormattedDateProps> = ({ date, className }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return empty placeholder or static fallback to prevent mismatch during SSR
    return <span className={className}>...</span>;
  }

  return <span className={className}>{formatDateIndo(date)}</span>;
};
