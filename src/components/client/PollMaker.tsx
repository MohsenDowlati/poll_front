'use client';

import React, {useEffect, useMemo, useState} from 'react';
import Multi from '@/components/client/Multi';
import Slide from '@/components/client/Slide';
import Button from '@/components/ui/button/Button';
import PhoneInput from '@/components/form/group-input/PhoneInput';
import {extractPollPaginationMeta, extractPolls, fetchPolls, PollRecord, submitPollVotes} from '@/services/poll/poll';
import Text from '@/components/client/Text';
import Single from '@/components/client/Single';
import {buildMultiChoiceVotes, buildOpinionVotes, buildSingleChoiceVotes, buildSlideVotes, inferPollType} from '@/utils/votes';

interface SheetInfo {
    id?: string;
    title?: string;
    isPhoneRequired?: boolean;
}

type PollAnswer = {
    votes: Array<number | string>;
    inputs?: string[];
};

const PAGE_SIZE = 10;

const Poll = ({data, onChange}: {data: PollRecord; onChange: (payload: { id: string; votes: Array<number | string>; inputs?: string[] }) => void}) => {
    const id = data.id as string | number;
    const idStr = String(id);
    const title = (data.title as string) ?? '';
    const options = (data.options as string[]) ?? [];

    const type = inferPollType(data);

    switch (type) {
        case 'single_choice':
            return (
                <Single
                    id={idStr}
                    title={title}
                    options={options}
                    onChangeSelection={(index) => {
                        onChange({ id: idStr, votes: buildSingleChoiceVotes(index, options.length) });
                    }}
                />
            );
        case 'multi_choice':
            return (
                <Multi
                    id={idStr}
                    title={title}
                    options={options}
                    onChangeSelection={(indices) => {
                        onChange({ id: idStr, votes: buildMultiChoiceVotes(indices, options.length) });
                    }}
                />
            );
        case 'slide':
            return (
                <Slide
                    id={idStr}
                    title={title}
                    options={options}
                    onChangeOrder={(orderIndices) => {
                        const votes = buildSlideVotes(options.length, orderIndices);
                        onChange({ id: idStr, votes });
                    }}
                />
            );
        case 'opinion':
            return (
                <Text
                    id={idStr}
                    title={title}
                    onChangeOpinion={(value) => {
                        onChange({ id: idStr, votes: buildOpinionVotes(value), inputs: [value] });
                    }}
                />
            );
        default:
            return null;
    }
};

export default function PollMaker({id}: {id: string}) {
    const countries = [
        {
            code: 'IR',
            label: '+98',
        },
        {
            code: 'US',
            label: '+1',
        },
    ];

    const [page, setPage] = useState(1);
    const [polls, setPolls] = useState<PollRecord[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentVotes, setCurrentVotes] = useState<Record<string, PollAnswer>>({});
    const [sheetInfo, setSheetInfo] = useState<SheetInfo>({});
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<string | null>(null);

    const isPhoneRequired = Boolean(sheetInfo.isPhoneRequired);

    const isPhoneValid = useMemo(() => {
        if (!isPhoneRequired) {
            return true;
        }
        const sanitized = phoneNumber.replace(/[^\d+]/g, '');
        if (sanitized.length === 0) {
            return false;
        }

        return /^\+?\d{10,15}$/.test(sanitized);
    }, [isPhoneRequired, phoneNumber]);

    const hasAnyVote = useMemo(() => {
        return Object.values(currentVotes).some(({ votes, inputs }) => {
            const voteArray = Array.isArray(votes) ? votes : [];
            const hasVote = voteArray.some((value) => {
                if (typeof value === 'number') {
                    return Number.isFinite(value) && value !== 0;
                }
                if (typeof value === 'string') {
                    return value.trim().length > 0;
                }
                return Boolean(value);
            });

            const hasInput = (inputs ?? []).some((value) => value.trim().length > 0);

            return hasVote || hasInput;
        });
    }, [currentVotes]);

    const canSubmit = !isSubmitting && !isLoading && polls.length > 0 && hasAnyVote && (!isPhoneRequired || isPhoneValid);

    const progressPercentage = useMemo(() => {
        if (totalPages <= 0) {
            return 0;
        }
        const raw = Math.round((page / totalPages) * 100);
        return Math.max(0, Math.min(raw, 100));
    }, [page, totalPages]);

    useEffect(() => {
        let isMounted = true;

        const loadPolls = async () => {
            setIsLoading(true);
            setError(null);
            setSubmitMessage(null);

            try {
                const { status, data } = await fetchPolls({
                    id,
                    page,
                    page_size: PAGE_SIZE,
                });

                if (!isMounted) {
                    return;
                }

                if (status >= 200 && status < 300) {
                    const fetchedPolls = extractPolls(data);
                    setPolls(fetchedPolls);

                    const meta = extractPollPaginationMeta(data);
                    const effectivePageSize = meta.pageSize && meta.pageSize > 0 ? meta.pageSize : PAGE_SIZE;
                    const effectivePage = meta.page && meta.page > 0 ? meta.page : page;

                    let resolvedTotalPages = meta.totalPages;
                    if (
                        (resolvedTotalPages === undefined || resolvedTotalPages <= 0) &&
                        meta.totalItems !== undefined &&
                        effectivePageSize > 0
                    ) {
                        resolvedTotalPages = Math.ceil(meta.totalItems / effectivePageSize);
                    }

                    if (resolvedTotalPages === undefined) {
                        const isLastPage = fetchedPolls.length < effectivePageSize;
                        resolvedTotalPages = isLastPage ? Math.max(effectivePage, 1) : Math.max(effectivePage + 1, 1);
                    }

                    setTotalPages(Math.max(resolvedTotalPages, 1));

                    if (effectivePage !== page) {
                        setPage(effectivePage);
                    }

                    const sheet = (data as Record<string, unknown>)?.sheet as Record<string, unknown> | undefined;
                    if (sheet) {
                        setSheetInfo({
                            id: typeof sheet.id === 'string' ? sheet.id : undefined,
                            title: typeof sheet.title === 'string' ? sheet.title : undefined,
                            isPhoneRequired: Boolean(
                                typeof sheet.is_phone_required === 'boolean'
                                    ? sheet.is_phone_required
                                    : sheet.isPhoneRequired,
                            ),
                        });
                    } else {
                        setSheetInfo({});
                    }
                } else {
                    setPolls([]);
                    setError(`Unable to retrieve polls (status ${status}).`);
                }
            } catch (fetchError) {
                console.error('Failed to load polls', fetchError);
                if (!isMounted) {
                    return;
                }
                setPolls([]);
                setError('Failed to load polls. Please try again.');
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        void loadPolls();

        return () => {
            isMounted = false;
        };
    }, [id, page]);

    const handleVoteChange = ({ id: pollId, votes, inputs }: { id: string; votes: Array<number | string>; inputs?: string[] }) => {
        setCurrentVotes((prev) => {
            const next = { ...prev };
            const voteArray = Array.isArray(votes) ? votes : [];
            const sanitizedVotes = voteArray.map((value) =>
                typeof value === 'string' ? value.trim() : value,
            );

            const inputArray = Array.isArray(inputs) ? inputs : [];
            const sanitizedInputs = inputArray
                .map((value) => (value ?? '').toString().trim())
                .filter((value) => value.length > 0);

            const hasVote = sanitizedVotes.some((value) => {
                if (typeof value === 'number') {
                    return Number.isFinite(value) && value !== 0;
                }
                if (typeof value === 'string') {
                    return value.length > 0;
                }
                return Boolean(value);
            });

            const rawInputProvided = inputArray.length > 0;
            const hasInput = sanitizedInputs.length > 0;
            const shouldKeep = rawInputProvided ? hasInput : hasVote;

            if (shouldKeep) {
                next[pollId] = {
                    votes: sanitizedVotes,
                    inputs: hasInput ? sanitizedInputs : undefined,
                };
            } else {
                delete next[pollId];
            }

            return next;
        });
    };

    const handlePrevPage = () => {
        if (isLoading || page <= 1) {
            return;
        }
        setPage((prev) => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        if (isLoading || page >= totalPages) {
            return;
        }
        setPage((prev) => Math.min(prev + 1, totalPages));
    };

    const handleSubmit = async () => {
        if (!canSubmit) {
            if (isPhoneRequired && !isPhoneValid) {
                setError('Please enter a valid phone number to continue.');
            } else if (!hasAnyVote) {
                setError('Please answer at least one poll before submitting.');
            }
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setSubmitMessage(null);

        try {
            const entries = Object.entries(currentVotes);
            await Promise.all(
                entries.map(([pollId, answer]) =>
                    submitPollVotes({
                        id: pollId,
                        votes: answer.votes,
                        inputs: answer.inputs ?? [],
                    }),
                ),
            );
            setSubmitMessage('Your votes were submitted successfully.');
        } catch (submitError) {
            console.error('Failed to submit votes', submitError);
            setError('Failed to submit votes. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="min-h-screen bg-gray-100 p-[1px] mb-6 w-full lg:p-8">
            <div className="mx-auto px-[1px] flex justify-center flex-col items-center lg:px-4 w-full">
                {isLoading && <div className="loader" aria-label="Loading polls" />}
                {error && (
                    <div className="mb-4 w-full rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">
                        {error}
                    </div>
                )}
                {submitMessage && (
                    <div className="mb-4 w-full rounded-md bg-green-50 p-3 text-sm text-green-700" role="status">
                        {submitMessage}
                    </div>
                )}
                <div className="sr-only">Items: {polls.length} Total pages: {totalPages}</div>
                <h1 className="text-3xl font-bold text-center mb-8 text-blue-950">
                    {sheetInfo.title ?? 'some titles and blah blah blah'}
                </h1>
                <article className="bg-[#6bbf6e] rounded-[21px] shadow-lg mt-[24px] py-[44px] w-full lg:w-[90%]">
                    {polls.length > 0 ? (
                        <div className="flex flex-col gap-8">
                            {totalPages > 1 && (
                                <div className="flex flex-col gap-2 px-6">
                                    <div className="flex items-center justify-between text-sm text-white">
                                        <span>Page {page}</span>
                                        <span>of {totalPages}</span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-white/40" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercentage}>
                                        <div
                                            className="h-full rounded-full bg-blue-600 transition-all"
                                            style={{ width: `${progressPercentage}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {polls.map((poll, index) => (
                                <Poll
                                    key={`poll-${poll.id ?? index}`}
                                    data={poll}
                                    onChange={handleVoteChange}
                                />
                            ))}

                            {totalPages > 1 && (
                                <div className="flex flex-col gap-3 px-6 md:flex-row md:items-center md:justify-between">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={page === 1 || isLoading}
                                        onClick={handlePrevPage}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={page === totalPages || isLoading}
                                        onClick={handleNextPage}
                                    >
                                        Next
                                    </Button>
                                </div>
                            )}

                            <div className="flex flex-col w-full gap-3 px-6 md:flex-row md:items-center md:justify-between">
                                <div className="w-full md:w-auto">
                                    <PhoneInput
                                        countries={countries}
                                        onChange={(value) => {
                                            setPhoneNumber(value);
                                            setError(null);
                                        }}
                                    />
                                    {isPhoneRequired && !isPhoneValid && (
                                        <p className="mt-2 text-sm text-red-50/90">
                                            Enter a valid phone number (include country code).
                                        </p>
                                    )}
                                </div>
                                <Button
                                    className="mb-0"
                                    onClick={handleSubmit}
                                    disabled={!canSubmit}
                                    type="button"
                                >
                                    {isSubmitting ? 'Submitting…' : 'Submit'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        !isLoading && (
                            <p className="px-6 text-center text-white">No polls available at the moment.</p>
                        )
                    )}
                </article>
            </div>
        </section>
    );
}
