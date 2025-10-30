'use client';

import React, { useEffect, useState } from 'react';
import Select from "@/components/form/Select";

interface VenueOption {
    label: string;
    value: string;
}

interface VenueSelectProps {
    value?: string;
    onChange?: (value: string) => void;
    options?: VenueOption[];
    placeholder?: string;
}

const defaultVenues: VenueOption[] = [
    {
        label: "خواجه نصیر",
        value: "خواجه نصیر",
    },
    {
        label: "مولانا",
        value: "مولانا",
    },
    {
        label: "فیض",
        value: "فیض",
    },
    {
        label: "عطار",
        value: "عطار",
    },
    {
        label: "شیخ مفید",
        value: "شیخ مفید",
    },
    {
        label: "مجموعه مذاکرات",
        value: "مجموعه مذاکرات",
    },{
    label: "ابن سینا",
        value: "ابن سینا",
    },
    {
        label: "خورشید",
        value: "خورشید",
    },
    {
        label: "شمس",
        value: "شمس",
    },
    {
        label: "سفره‌خانه",
        value: "سفره‌خانه",
    },
    {
        label: "لابی خواجه‌نصیر",
        value: "لابی خواجه‌نصیر",
    },
    {
        label: "لابی فیض و عطار",
        value: "لابی فیض و عطار",
    },
    {
        label: "پارکینگ",
        value: "پارکینگ",
    },
    {
        label: "درب اختصاصی",
        value: "درب اختصاصی",
    }
];

const VenueSelect: React.FC<VenueSelectProps> = ({
    value,
    onChange,
    options = defaultVenues,
    placeholder = "Venue",
}) => {
    const [internalValue, setInternalValue] = useState<string>(value ?? "");


    useEffect(() => {
        if (value !== undefined) {
            setInternalValue(value);
        }
    }, [value]);

    const handleChange = (val: string) => {
        if (value === undefined) {
            setInternalValue(val);
        }
        onChange?.(val);
        console.log(val)
    };

    return (
        <div>
            <Select
                options={options}
                placeholder={placeholder}
                value={value !== undefined ? value : internalValue}
                defaultValue={value === undefined ? internalValue : undefined}
                onChange={handleChange}
            />
        </div>
    );
};

export default VenueSelect;
