'use client';

import React, { useCallback, useMemo, useState } from "react";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import VenueSelect from "@/components/sheet/VenueSelect";
import PhoneSwitch from "@/components/sheet/PhoneSwitch";
import FormInModal, { PollDraftData } from "@/components/example/ModalExample/FormInModal";
import Button from "@/components/ui/button/Button";
import PollCard from "@/components/sheet/PollCard";
import { createSheet, CreateSheetPayload, SheetPollPayload } from "@/services/sheet/sheet";

interface DraftPoll extends PollDraftData {
  description?: string;
}

const isTextPollType = (type: string | undefined | null): boolean => {
  if (!type) {
    return false;
  }

  const normalizedType = type.toLowerCase();
  return normalizedType === "text" || normalizedType === "opinion";
};

const mapPollToPayload = (poll: DraftPoll): SheetPollPayload => {
  return {
    title: poll.title,
    poll_type: poll.poll_type,
    options: isTextPollType(poll.poll_type) ? ["opinion"] : poll.options,
    category: poll.category
  };
};

export default function SheetMaker() {
  const [sheetName, setSheetName] = useState<string>("");
  const [venue, setVenue] = useState<string>("");
  const [isPhoneRequired, setIsPhoneRequired] = useState<boolean>(false);
  const [polls, setPolls] = useState<DraftPoll[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return sheetName.trim() !== "" && venue.trim() !== "" && !isSubmitting;
  }, [sheetName, venue, isSubmitting]);

  const handlePollCreated = useCallback((poll: PollDraftData) => {
    const normalizedPoll: DraftPoll = {
      ...poll,
      options: isTextPollType(poll.poll_type) ? ["opinion"] : poll.options,
    };

    setPolls((prev) => [...prev, normalizedPoll]);
  }, []);

  const handlePollDelete = useCallback((pollId: string) => {
    setPolls((prev) => prev.filter((poll) => poll.id !== pollId));
  }, []);

  const resetForm = () => {
    setSheetName("");
    setVenue("");
    setIsPhoneRequired(false);
    setPolls([]);
  };

  const handleSubmit = async () => {
    if (!sheetName.trim() || !venue.trim()) {
      setErrorMessage("Please provide both sheet name and venue before submitting.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const payload: CreateSheetPayload = {
      title: sheetName.trim(),
      venue,
      is_phone_required: isPhoneRequired,
      polls: polls.length ? polls.map(mapPollToPayload) : undefined,
    };

    try {
      await createSheet(payload);
      setSuccessMessage("Sheet created successfully.");
      resetForm();
    } catch (error) {
      console.error(error);
      setErrorMessage("We couldn't create the sheet right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[780px] text-center flex flex-col">
      <h3 className="mb-4 font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl">
        Make your own survey
      </h3>

      <div className="grid grid-cols-6 mb-8 gap-4">
        <div className="col-span-4">
          <Label>Sheet&apos;s Name</Label>
          <Input
            type="text"
            placeholder="Name"
            value={sheetName}
            onChange={(event) => setSheetName(event.target.value)}
          />
        </div>
        <div className="col-span-4 mt-5">
          <VenueSelect value={venue} onChange={setVenue} />
        </div>
        <PhoneSwitch value={isPhoneRequired} onChange={setIsPhoneRequired} />
      </div>

      <div className="grid grid-cols-2 mb-8 gap-4">
        <FormInModal onPollCreated={handlePollCreated} />
        <Button
          variant="outline"
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </Button>
      </div>

      {errorMessage ? (
        <p className="text-sm text-error-500 mb-4">{errorMessage}</p>
      ) : null}
      {successMessage ? (
        <p className="text-sm text-success-500 mb-4">{successMessage}</p>
      ) : null}

      <div className="space-y-4">
        {polls.map((poll) => {
          const pollOptions = isTextPollType(poll.poll_type) ? ["opinion"] : poll.options;

          return (
            <PollCard
              key={poll.id}
              title={poll.title}
              options={pollOptions}
              category={poll.category || ""}
              type={poll.poll_type}
              onDelete={() => handlePollDelete(poll.id)}
            />
          );
        })}
      </div>
    </div>
  );
}









