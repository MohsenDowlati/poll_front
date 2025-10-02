"use client";

import { DonutChart } from "./chart";
import {DataType} from "csstype";
import React from "react";

type PropsType = {
  className?: string;
  option: string[];
  votes: number[];
};

type DataType = {
  name: string;
  amount: number;
};

export default function SingleChart({
  className = "",
    option,
    votes
}: PropsType) {


  const constructData = () => {
    const data: DataType[] = option.map((str, index) => ({
      name: str,
      amount: votes[index]
    }));

    return data;
  }

  return (
      <div className="max-w-full overflow-x-auto custom-scrollbar grid grid-cols-1 grid-rows-[auto_1fr] ">
        <div id="chartOne" className="min-w-[1000px] grid place-items-center py-5">
          <DonutChart data={constructData()} />
        </div>
      </div>
  );
}
