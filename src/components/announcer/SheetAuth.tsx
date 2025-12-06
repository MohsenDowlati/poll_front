import React from 'react';
import Image from "next/image";
import Label from "@/components/form/Label";
import Link from "next/link";

export default function SheetAuth() {
    return(
        <>
            <div>
                <Image src={'/images/logo/logo-text.png'} alt={"logo"} width={472} height={67} className="mb-14"/>
                <div>
                    <Image 
                    src={'/images/cards/salon2.jpeg'}
                    alt={"sheet description"} 
                    width={472} 
                    height={152}
                    loading="lazy"
                    />
                </div>
                <Label className="mt-2 text-bolder text-lg">
                    با تشکر از نظر شما💐
                </Label>
                <Label  className="text-bolder text-lg text-center mt-8">
                    تماس با ما :
                </Label>
                <div className="flex flex-row justify-between items-center">
                    <Link href="tel: +989104300215">
                        <Label className="mt-2 text-bolder text-lg text-left mr-4">
                            ۰۹۱۰-۴۳۰۰۲۱۵
                        </Label>
                    </Link>
                    <Link href="https://iicc.ir" >
                        <Label className="mt-2 text-bolder text-lg text-left ml-4">
                            https://iicc.ir
                        </Label>
                    </Link>
                </div>


            </div>
        </>
    )
}