"use client";

import React, { useEffect, useMemo, useState } from "react";

import Button from "../../ui/button/Button";
import { Modal } from "../../ui/modal";
import Label from "../../form/Label";
import Input from "../../form/input/InputField";

import { useModal } from "@/hooks/useModal";
import { useLocale } from "@/hooks/useLocale";
import Checkbox from "@/components/form/input/Checkbox";
import MultiSelect from "@/components/form/MultiSelect";

export interface PollDraftData {
  id: string;
  title: string;
  poll_type: string;
  options: string[];
  category: string[];
}

interface FormInModalProps {
  onPollCreated?: (poll: PollDraftData) => void;
  onPollUpdated?: (poll: PollDraftData) => void;
  editingPoll?: PollDraftData | null;
  onModalClosed?: () => void;
}

const pollTypes = {
  single: "single_choice",
  multiple: "multi_choice",
  slider: "slide",
  text: "opinion",
} as const;

const createId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

const FormInModal: React.FC<FormInModalProps> = ({
  onPollCreated,
  onPollUpdated,
  editingPoll,
  onModalClosed,
}) => {
  const { isOpen, openModal, closeModal } = useModal();
  const { t } = useLocale();

  const categoryOptions = useMemo(
    () => [
      { value: "حوزه ریاست", text: "حوزه ریاست" },
      { value: "معاونت فنی", text: "معاونت فنی" },
      { value: "تأسیسات", text: "تأسیسات" },
      { value: "تولید و فنی", text: "تولید و فنی" },
      { value: "فناوری‌های نوین (IT)", text: "فناوری‌های نوین (IT)" },
      { value: "حراست", text: "حراست" },
      { value: "کمک‌های اولیه", text: "کمک‌های اولیه" },
      { value: "تشریفات", text: "تشریفات" },
      { value: "معاونت اقتصادی", text: "معاونت اقتصادی" },
      { value: "امور مشتریان", text: "امور مشتریان" },
      { value: "قراردادها", text: "قراردادها" },
      { value: "روابط عمومی", text: "روابط عمومی" },
      { value: "دبیر همایش", text: "دبیر همایش" },
    ],
    [t],
  );

  const defaultOptions = useMemo(
    () => [1, 2, 3].map((index) => t("sheet.poll.optionLabel", { index })),
    [t],
  );

  const [type, setType] = useState<string>("");
  const [options, setOptions] = useState<string[]>(defaultOptions);
  const [category, setCategory] = useState<string[]>([]);
  const [title, setTitle] = useState<string>("");

  const isEditing = Boolean(editingPoll);

  useEffect(() => {
    if (!editingPoll) {
      return;
    }

    setTitle(editingPoll.title);
    setType(editingPoll.poll_type);
    setCategory(editingPoll.category ?? []);
    setOptions(
      editingPoll.poll_type === pollTypes.text
        ? ["opinion"]
        : editingPoll.options.length > 0
          ? [...editingPoll.options]
          : defaultOptions,
    );
    openModal();
  }, [editingPoll, openModal, defaultOptions]);

  const isTextType = type === pollTypes.text;

  useEffect(() => {
    if (isTextType) {
      return;
    }

    setOptions((current) => {
      if (current.length === 0) {
        return defaultOptions;
      }

      const normalizedCurrent = current.map((option) => option.trim());
      const normalizedDefault = defaultOptions.map((option) => option.trim());
      const matchesDefault =
        normalizedCurrent.length === normalizedDefault.length &&
        normalizedCurrent.every((value, index) => value === normalizedDefault[index]);

      return matchesDefault ? defaultOptions : current;
    });
  }, [defaultOptions, isTextType]);

  const sanitizedOptions = useMemo(() => {
    if (isTextType) {
      return ["opinion"];
    }
    return options.map((option) => option.trim()).filter((option) => option !== "");
  }, [isTextType, options]);

  const canSave =
    title.trim() !== "" &&
    type !== "" &&
    (isTextType || sanitizedOptions.length > 0) &&
    category.length > 0;

  const resetForm = () => {
    setType("");
    setTitle("");
    setCategory([]);
    setOptions(defaultOptions);
  };

  const handleTypeSelect = (targetType: string) => (checked: boolean) => {
    if (!checked && type === targetType) {
      setType("");
      if (targetType === pollTypes.text) {
        setOptions(["opinion"]);
      }
      return;
    }

      if (checked) {
        setType(targetType);
        if (targetType === pollTypes.text) {
          setOptions(["opinion"]);
        } else if (options.length === 0) {
          setOptions(defaultOptions);
        }
      }
  };

  const addOption = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setOptions((prev) => [
      ...prev,
      t("sheet.poll.optionLabel", { index: prev.length + 1 }),
    ]);
  };

  const deleteOption = (event: React.MouseEvent<HTMLButtonElement>, index: number) => {
    event.preventDefault();
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTitle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value);
  };

  const handleOption = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = event.target.value;
    setOptions((prev) => prev.map((option, i) => (i === index ? value : option)));
  };

  const handleSave = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (!canSave) {
      return;
    }

    const poll: PollDraftData = {
      id: editingPoll?.id ?? createId(),
      title: title.trim(),
      poll_type: type,
      options: sanitizedOptions,
      category,
    };

    if (isEditing) {
      onPollUpdated?.(poll);
    } else {
      onPollCreated?.(poll);
    }
    resetForm();
    closeModal();
    onModalClosed?.();
  };

  const handleClose = (event?: React.MouseEvent<HTMLButtonElement>) => {
    event?.preventDefault();
    resetForm();
    closeModal();
    onModalClosed?.();
  };

  return (
    <>
      <Button size="sm" onClick={openModal} type="button" disabled={isEditing}>
        {t("sheet.poll.buttons.openCreator")}
      </Button>

      <Modal isOpen={isOpen} onClose={handleClose} className="max-w-[584px] p-5 lg:p-10">
        <form>
          <h4 className="mb-6 text-lg font-medium text-gray-800 dark:text-white/90">
            {isEditing ? t("sheet.poll.dialog.title.edit") : t("sheet.poll.dialog.title.create")}
          </h4>

          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
            <div className="col-span-2">
              <Label>{t("sheet.poll.fields.titleLabel")}</Label>
              <Input
                type="text"
                placeholder={t("sheet.poll.fields.titlePlaceholder")}
                onChange={handleTitle}
                value={title}
              />
            </div>

            <div className="col-span-2">
              <MultiSelect
                label={t("sheet.poll.fields.categoryLabel")}
                options={categoryOptions}
                value={category}
                placeholder={t("sheet.poll.fields.categoryPlaceholder")}
                onChange={setCategory}
              />
            </div>

            <div className="grid grid-cols-4 col-span-2 mb-2">
              <div>
                <Checkbox
                  checked={type === pollTypes.single}
                  onChange={handleTypeSelect(pollTypes.single)}
                  label={t("sheet.poll.fields.type.single")}
                />
              </div>

              <div>
                <Checkbox
                  checked={type === pollTypes.multiple}
                  onChange={handleTypeSelect(pollTypes.multiple)}
                  label={t("sheet.poll.fields.type.multi")}
                />
              </div>

              <div>
                <Checkbox
                  checked={type === pollTypes.slider}
                  onChange={handleTypeSelect(pollTypes.slider)}
                  label={t("sheet.poll.fields.type.slider")}
                />
              </div>

              <div>
                <Checkbox
                  checked={type === pollTypes.text}
                  onChange={handleTypeSelect(pollTypes.text)}
                  label={t("sheet.poll.fields.type.opinion")}
                />
              </div>

              <div className="col-span-4">
                {!isTextType && type !== "" ? (
                  <div className="w-full">
                      {options.map((option, index) => (
                        <div key={option + index} className="grid grid-cols-7 my-2 w-full">
                          <div className="col-span-6">
                            <Input
                              type="text"
                              placeholder={t("sheet.poll.optionLabel", { index: index + 1 })}
                              onChange={(event) => handleOption(event, index)}
                            />
                          </div>

                          <button
                            type="button"
                            className="flex justify-center items-center text-lg font-semibold text-gray-400 transition-colors hover:text-error-500"
                            onClick={(event) => deleteOption(event, index)}
                            aria-label={t("sheet.poll.option.removeAria", { index: index + 1 })}
                          >
                            ×
                          </button>
                        </div>
                      ))}

                    <Button size="sm" onClick={addOption} type="button">
                      {t("sheet.poll.buttons.addOption")}
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

            <div className="flex items-center justify-end w-full gap-3 mt-6">
            <Button size="sm" variant="outline" onClick={handleClose} type="button">
              {t("sheet.poll.buttons.close")}
            </Button>

            <Button size="sm" onClick={handleSave} disabled={!canSave} type="button">
              {isEditing ? t("sheet.poll.buttons.update") : t("sheet.poll.buttons.save")}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default FormInModal;
