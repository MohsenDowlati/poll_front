import React from 'react';
import Image from "next/image";
import Label from "@/components/form/Label";

export default function SheetAuth() {
    return(
        <>
            <div>
                <div>
                    <Image 
                    src={'/images/cards/card-03.jpg'} 
                    alt={"sheet description"} 
                    width={472} 
                    height={152}/>
                </div>
                <Label>
                    The Sheet has been submitted successfully.
                </Label>
            </div>
        </>
    )
}