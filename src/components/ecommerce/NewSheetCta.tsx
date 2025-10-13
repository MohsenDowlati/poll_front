'use client';

import Link from 'next/link';
import React from 'react';
import Button from '@/components/ui/button/Button';
import { useLocale } from '@/hooks/useLocale';

const NewSheetCta: React.FC = () => {
  const { t, direction } = useLocale();

  return (
    <Link href="/add-sheet" className="inline-flex">
      <Button
        variant="primary"
        startIcon={<span className="text-lg font-semibold" aria-hidden>+</span>}
        className="w-52"
        type="button"
      >
        <span dir={direction}>{t('buttons.newSheet')}</span>
      </Button>
    </Link>
  );
};

export default NewSheetCta;
