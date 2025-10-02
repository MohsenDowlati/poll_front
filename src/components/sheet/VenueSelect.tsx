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
        label: "place 1",
        value: "place 1",
    },
    {
        label: "place 2",
        value: "place 2",
    },
    {
        label: "place 3",
        value: "place 3",
    },
    {
        label: "place 4",
        value: "place 4",
    },
    {
        label: "place 5",
        value: "place 5",
    },
    {
        label: "place 6",
        value: "place 6",
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
