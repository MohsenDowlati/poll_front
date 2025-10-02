'use client';

import React, {useEffect, useState} from 'react';
import Multi from '@/components/client/Multi';
import Slide from '@/components/client/Slide'
import Button from "@/components/ui/button/Button";
import PhoneInput from "@/components/form/group-input/PhoneInput";
import {extractPollPaginationMeta, extractPolls, fetchPolls, PollRecord} from "@/services/poll/poll";
import {useRouter} from "next/navigation";
import Text from "@/components/client/Text";
import Single from "@/components/client/Single";
import { buildMultiChoiceVotes, buildOpinionVotes, buildSingleChoiceVotes, buildSlideVotes, inferPollType } from '@/utils/votes';
import { submitPollVotes } from '@/services/poll/poll';


const Poll = ({data, onChange}:{data: PollRecord, onChange:(payload:{ id: string; votes: number[] | string[] })=>void}) => {

    const id = data.id as string | number;
    const idStr = String(id);
    const title = (data.title as string) ?? '';
    const options = (data.options as string[]) ?? [];


    const type = inferPollType(data);

    switch (type) {
        case "single_choice":
            return <Single id={idStr} title={title} options={options} onChangeSelection={(index)=>{
                onChange({ id: idStr, votes: buildSingleChoiceVotes(index, options.length) });
            }}/>
        case "multi_choice":
            return <Multi id={idStr} title={title} options={options} onChangeSelection={(indices)=>{
                onChange({ id: idStr, votes: buildMultiChoiceVotes(indices, options.length) });
            }}/>
        case "slide":
            return <Slide id={idStr} title={title} options={options} onChangeOrder={()=>{
                // orderIndices is the new order of original indices; translate to descending weights
                const arrangedLength = options.length;
                const votes = buildSlideVotes(arrangedLength);
                // votes already matches the spec [n-1..1]; the order is visual only
                onChange({ id: idStr, votes });
            }}/>
        case "opinion":
            return <Text id={idStr} title={title} onChangeOpinion={(value)=>{
                onChange({ id: idStr, votes: buildOpinionVotes(value) });
            }}/>
        default:
            return null;
    }

}

export default function PollMaker({id}:{id:string}) {
    const countries = [
        {
            code: "IR",
            label: "+98",
        },
        {
            code: "US",
            label: "+1",
        },
    ];
    const router = useRouter();


    const [page, setPage] = useState(1);
    const [Polls, setPolls] = useState<PollRecord[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentVotes, setCurrentVotes] = useState<Record<string, number[] | string[]>>({});

    const pageSize = 10;

    useEffect(() => {
        let isMounted = true;

        const loadPolls = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const { status, data } = await fetchPolls({
                    id,
                    page,
                    page_size: pageSize,
                });

                if (!isMounted) {
                    return;
                }

                if (status >= 200 && status < 300) {
                    const fetchedPolls = extractPolls(data);
                    setPolls(fetchedPolls);

                    const meta = extractPollPaginationMeta(data);
                    const effectivePageSize = meta.pageSize && meta.pageSize > 0 ? meta.pageSize : pageSize;
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
                        resolvedTotalPages = isLastPage
                            ? Math.max(effectivePage, 1)
                            : Math.max(effectivePage + 1, 1);
                    }

                    setTotalPages(Math.max(resolvedTotalPages, 1));

                    if (effectivePage !== page) {
                        setPage(effectivePage);
                    }
                } else {
                    setPolls([]);
                    setError(`Unable to retrieve polls (status ${status}).`);
                    router.push('/404');
                }
            } catch (fetchError) {
                console.error("Failed to load polls", fetchError);
                if (!isMounted) {
                    return;
                }
                setPolls([]);
                setError("Failed to load polls. Please try again.");
                router.push('/404');
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
    }, [id, page, pageSize, router]);



    return (
                    <section className="min-h-screen bg-gray-100 p-[1px] mb-6 w-full lg:p-8">
                <div className="mx-auto px-[1px] flex justify-center flex-col items-center lg:px-4">
                    {isLoading && <div style={{display:'none'}}>Loading...</div>}
                    {error && <div style={{display:'none'}}>{error}</div>}
                    <div style={{display:'none'}}>Items: {Polls.length} Total pages: {totalPages}</div>
                    <h1 className="text-3xl font-bold text-center mb-8 text-blue-950">some titles and blah blah blah</h1>
                    <article className="bg-[#6bbf6e] rounded-[21px] shadow-lg mt-[24px] py-[44px] w-full lg:w-[90%]">

                        {Polls.length > 0
                            ? Polls.map((poll, index) => (
                                <Poll
                                  key={`poll-${poll.id ?? index}`}
                                  data={poll}
                                  onChange={({ id, votes }) => {
                                      setCurrentVotes(prev => ({ ...prev, [id]: votes }));
                                  }}
                                />
                              ))
                            : null}
                         <div className="flex flex-col w-full justify-around items-center md:flex-row gap-3">
                            <PhoneInput countries={countries}/>
                             <Button className="mb" onClick={async ()=>{
                                 try {
                                     // submit each poll's votes separately
                                     const entries = Object.entries(currentVotes);
                                     for (const [pollId, votes] of entries) {
                                         await submitPollVotes({ id: pollId, votes: votes });
                                     }
                                     // success UX could be added here
                                 } catch (e) {
                                     console.error('Failed to submit votes', e);
                                     setError('Failed to submit votes');
                                 }
                             }}>Submit</Button>
                        </div>

                    </article>

                </div>
            </section>

    );
}