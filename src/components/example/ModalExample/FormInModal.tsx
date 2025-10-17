"use client";

import React, { useEffect, useMemo, useState } from "react";

import Button from "../../ui/button/Button";
import { Modal } from "../../ui/modal";
import Label from "../../form/Label";
import Input from "../../form/input/InputField";

import { useModal } from "@/hooks/useModal";
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

const initialOptions = ["Option 1", "Option 2", "Option 3"];

const pollTypes = {
  single: "single_choice",
  multiple: "multi_choice",
  slider: "slide",
  text: "opinion",
} as const;

const categoryOptions = [
  { value: "business", text: "Business" },
  { value: "community", text: "Community" },
  { value: "education", text: "Education" },
  { value: "entertainment", text: "Entertainment" },
  { value: "environment", text: "Environment" },
  { value: "health", text: "Health" },
  { value: "politics", text: "Politics" },
  { value: "sports", text: "Sports" },
  { value: "technology", text: "Technology" },
  { value: "other", text: "Other" },
];

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

  const [type, setType] = useState<string>("");
  const [options, setOptions] = useState<string[]>(initialOptions);
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
          : initialOptions,
    );
    openModal();
  }, [editingPoll, openModal]);

  const isTextType = type === pollTypes.text;

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
    setOptions(initialOptions);
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
        setOptions(initialOptions);
      }
    }
  };

  const addOption = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setOptions((prev) => [...prev, `Option ${prev.length + 1}`]);
  };

  const deleteOption = (event: React.MouseEvent<HTMLDivElement>, index: number) => {
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
        New Poll
      </Button>

      <Modal isOpen={isOpen} onClose={handleClose} className="max-w-[584px] p-5 lg:p-10">
        <form>
          <h4 className="mb-6 text-lg font-medium text-gray-800 dark:text-white/90">
            {isEditing ? "Edit Poll" : "Poll"}
          </h4>

          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
            <div className="col-span-2">
              <Label>Title</Label>
              <Input
                type="text"
                placeholder="What's your question?"
                onChange={handleTitle}
                value={title}
              />
            </div>

            <div className="col-span-2">
              <MultiSelect
                label="Category"
                options={categoryOptions}
                value={category}
                placeholder="Choose categories"
                onChange={setCategory}
              />
            </div>

            <div className="grid grid-cols-4 col-span-2 mb-2">
              <div>
                <Checkbox
                  checked={type === pollTypes.single}
                  onChange={handleTypeSelect(pollTypes.single)}
                  label="Single"
                />
              </div>

              <div>
                <Checkbox
                  checked={type === pollTypes.multiple}
                  onChange={handleTypeSelect(pollTypes.multiple)}
                  label="Multi"
                />
              </div>

              <div>
                <Checkbox
                  checked={type === pollTypes.slider}
                  onChange={handleTypeSelect(pollTypes.slider)}
                  label="Slider"
                />
              </div>

              <div>
                <Checkbox
                  checked={type === pollTypes.text}
                  onChange={handleTypeSelect(pollTypes.text)}
                  label="Opinion"
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
                            placeholder={`Option ${index + 1}`}
                            onChange={(event) => handleOption(event, index)}
                            value={option}
                          />
                        </div>

                        <div
                          className="flex justify-center items-center cursor-pointer"
                          onClick={(event) => deleteOption(event, index)}
                        >
                          X
                        </div>
                      </div>
                    ))}

                    <Button size="sm" onClick={addOption} type="button">
                      Add Option
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end w-full gap-3 mt-6">
            <Button size="sm" variant="outline" onClick={handleClose} type="button">
              Close
            </Button>

            <Button size="sm" onClick={handleSave} disabled={!canSave} type="button">
              {isEditing ? "Update Poll" : "Save Changes"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default FormInModal;
