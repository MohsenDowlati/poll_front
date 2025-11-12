import React, { useCallback, useState } from "react";
import { useLocale } from "@/hooks/useLocale";
import ConfirmDialog from "@/components/ui/modal/ConfirmDialog";

interface ComponentCardProps {
  title: string;
  options: string[];
  category: string[];
  className?: string;
  type: string;
  onDelete?: () => void;
  onEdit?: () => void;
}

const PollCard: React.FC<ComponentCardProps> = ({
  title,
  options,
  category,
  className = "",
  type,
  onDelete,
  onEdit,
}) => {
  const { t } = useLocale();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const normalizedType = type.toLowerCase();
  const isTextType = normalizedType === "text" || normalizedType === "opinion";
  const translateCategory = (rawValue: unknown) => {
    const value = typeof rawValue === "string" ? rawValue : String(rawValue ?? "");
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return value;
    }
    if (normalized === "uncategorized") {
      return t("sheet.poll.uncategorized");
    }
    return t(`sheet.poll.categories.${normalized}`, { defaultValue: value });
  };
  const categoriesLabel =
    category.length > 0
      ? category.map((item) => translateCategory(item)).join(", ")
      : t("sheet.poll.uncategorized");

  const handleConfirmDelete = useCallback(() => {
    if (onDelete) {
      onDelete();
    }
    setIsDeleteDialogOpen(false);
  }, [onDelete]);

  const handleCancelDelete = useCallback(() => {
    setIsDeleteDialogOpen(false);
  }, []);

  return (
    <div className={`rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] ${className}`}>
      <div className="px-6 py-5 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90">{title}</h3>
          <div className="flex flex-row gap-2">
            {
              onEdit ? (
                  <button
                      type="button"
                      onClick={onEdit}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:text-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                      aria-label={t("sheet.poll.actions.edit")}>
                    <svg

                        className="h-8 w-8"
                        viewBox="0 0 21 21"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M17.0911 3.53206C16.2124 2.65338 14.7878 2.65338 13.9091 3.53206L5.6074 11.8337C5.29899 12.1421 5.08687 12.5335 4.99684 12.9603L4.26177 16.445C4.20943 16.6931 4.286 16.9508 4.46529 17.1301C4.64458 17.3094 4.90232 17.3859 5.15042 17.3336L8.63507 16.5985C9.06184 16.5085 9.45324 16.2964 9.76165 15.988L18.0633 7.68631C18.942 6.80763 18.942 5.38301 18.0633 4.50433L17.0911 3.53206ZM14.9697 4.59272C15.2626 4.29982 15.7375 4.29982 16.0304 4.59272L17.0027 5.56499C17.2956 5.85788 17.2956 6.33276 17.0027 6.62565L16.1043 7.52402L14.0714 5.49109L14.9697 4.59272ZM13.0107 6.55175L6.66806 12.8944C6.56526 12.9972 6.49455 13.1277 6.46454 13.2699L5.96704 15.6283L8.32547 15.1308C8.46772 15.1008 8.59819 15.0301 8.70099 14.9273L15.0436 8.58468L13.0107 6.55175Z"
                          fill="currentColor"
                      />
                    </svg>
                  </button>
              ):null
            }
            {onDelete ? (
                <button
                    type="button"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:text-error-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-error-500"
                    aria-label={t("sheet.poll.actions.delete")}
                >
                  <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 16 16"
                      className="h-8 w-8"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                  >
                    <path d="M3 4h10" />
                    <path d="M6 4V2.75A.75.75 0 0 1 6.75 2h2.5a.75.75 0 0 1 .75.75V4" />
                    <path d="M6.5 7v4" />
                    <path d="M9.5 7v4" />
                    <path d="M4.5 4h7l-.55 8.25A1 1 0 0 1 9.96 13H6.04a1 1 0 0 1-.99-.75L4.5 4Z" />
                  </svg>
                </button>
            ) : null}
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-right">{categoriesLabel}</p>
      </div>

      <div className="p-4 border-t border-gray-100 dark:border-gray-800 sm:p-6">
        {!isTextType && options.length > 0 ? (
          <div className="space-y-6">
            {options.map((option, index) => (
              <div key={index} className="flex flex-row gap-2 items-center">
                <div className="h-3 w-3 rounded-full bg-blue-950" />
                <p className="text-gray-700 dark:text-gray-400">{option}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      {onDelete ? (
        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          title={t("sheet.poll.confirmDeleteTitle", {
            defaultValue: "Delete this poll?",
          })}
          description={t("sheet.poll.confirmDeleteDescription", {
            defaultValue: `Removing "${title}" will erase its options from this sheet.`,
          })}
          confirmLabel={t("sheet.poll.actions.delete", { defaultValue: "Delete" })}
          cancelLabel={t("actions.cancel", { defaultValue: "Cancel" })}
          tone="danger"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      ) : null}
    </div>
  );
};

export default PollCard;
