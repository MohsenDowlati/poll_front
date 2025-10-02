"use client";

import React, { useMemo, useState } from "react";

import Button from "../../ui/button/Button";

import { Modal } from "../../ui/modal";

import Label from "../../form/Label";

import Input from "../../form/input/InputField";

import { useModal } from "@/hooks/useModal";

import Checkbox from "@/components/form/input/Checkbox";

import Select from "@/components/form/Select";

export interface PollDraftData {
  id: string;
  title: string;
  poll_type: string;
  options: string[];
  category: string;
}

interface FormInModalProps {
  onPollCreated?: (poll: PollDraftData) => void;
}

const initialOptions = ["Option 1", "Option 2", "Option 3"];

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

const FormInModal: React.FC<FormInModalProps> = ({ onPollCreated }) => {
  const { isOpen, openModal, closeModal } = useModal();

  const [type, setType] = useState<string>("");
  const [options, setOptions] = useState<string[]>(initialOptions);
  const [category, setCategory] = useState<string>("");
  const [title, setTitle] = useState<string>("");

  const isTextType = type === pollTypes.text;

  const sanitizedOptions = useMemo(() => {
    if (isTextType) {
      return ["opinion"];
    }
    return options.map((option) => option.trim()).filter((option) => option !== "");
  }, [isTextType, options]);

  const canSave = title.trim() !== "" && type !== "" && (isTextType || sanitizedOptions.length > 0) && category !== "";

  const resetForm = () => {
    setType("");
    setTitle("");
    setCategory("");
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

  const addOption = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setOptions((prev) => [...prev, `Option ${prev.length + 1}`]);
  };

  const deleteOption = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleOption = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value;
    setOptions((prev) => prev.map((option, i) => (i === index ? val : option)));
  };

  const handleSave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!canSave) {
      return;
    }

    const poll: PollDraftData = {
      id: createId(),
      title: title.trim(),
      poll_type: type,
      options: sanitizedOptions,
      category,
    };

    onPollCreated?.(poll);
    resetForm();
    closeModal();
  };

  const handleClose = (event?: React.MouseEvent<HTMLButtonElement>) => {
    event?.preventDefault();
    resetForm();
    closeModal();
  };

  const categories = [
    { value: "category 1", label: "category 1" },
    { value: "category 2", label: "category 2" },
    { value: "category 3", label: "category 3" },
    { value: "category 4", label: "category 4" },
    { value: "category 5", label: "category 5" },
    { value: "category 6", label: "category 6" },
  ];

  return (
    <>
      <Button size="sm" onClick={openModal} type="button">
        New Poll
      </Button>

      <Modal isOpen={isOpen} onClose={handleClose} className="max-w-[584px] p-5 lg:p-10">
        <form>
          <h4 className="mb-6 text-lg font-medium text-gray-800 dark:text-white/90">Poll</h4>

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
              <Select
                options={categories}
                onChange={(val) => setCategory(val)}
                placeholder="Category"
                value={category}
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
                      <div key={index} className="grid grid-cols-7 my-2 w-full">
                        <div className="col-span-6">
                          <Input
                            type="text"
                            placeholder={`Option ${index + 1}`}
                            onChange={(e) => handleOption(e, index)}
                          />
                        </div>

                        <div
                          className="flex justify-center items-center cursor-pointer"
                          onClick={(e) => deleteOption(e, index)}
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
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default FormInModal;


