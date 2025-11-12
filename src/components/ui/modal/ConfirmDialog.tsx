'use client';

import React from 'react';
import { Modal } from '@/components/ui/modal';
import Button from '@/components/ui/button/Button';

type ConfirmTone = 'primary' | 'danger';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isProcessing?: boolean;
  tone?: ConfirmTone;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

const toneClassNames: Record<ConfirmTone, string> = {
  primary: '',
  danger: 'bg-error-500 hover:bg-error-600 disabled:bg-error-300',
};

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isProcessing = false,
  tone = 'primary',
  onConfirm,
  onCancel,
}) => {
  const confirmButtonClasses = toneClassNames[tone] ?? toneClassNames.primary;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      className="max-w-md px-6 py-6"
      showCloseButton={false}
    >
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          {description ? (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{description}</p>
          ) : null}
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            disabled={isProcessing}
            className={confirmButtonClasses}
          >
            {isProcessing ? `${confirmLabel}…` : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
