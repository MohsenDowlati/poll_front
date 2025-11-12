import React from 'react';
import Image from "next/image";
import Label from "@/components/form/Label";

export default function SheetAuth() {
    return(
        <>
            <div>
                <div>
                    <Image 
                    src={'/images/cards/salon2.jpeg'}
                    alt={"sheet description"} 
                    width={472} 
                    height={152}/>
                </div>
                <Label>
                    با تشکر از نظر شما💐
                </Label>
            </div>
        </>
    )
}