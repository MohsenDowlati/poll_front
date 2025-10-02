'use client';

import React, { useEffect, useState } from "react";
import Switch from "@/components/form/switch/Switch";

interface PhoneSwitchProps {
    value?: boolean;
    onChange?: (checked: boolean) => void;
    label?: string;
}

const PhoneSwitch: React.FC<PhoneSwitchProps> = ({
    value,
    onChange,
    label = "Phone number",
}) => {
    const [internalValue, setInternalValue] = useState<boolean>(value ?? true);

    useEffect(() => {
        if (value !== undefined) {
            setInternalValue(value);
        }
    }, [value]);

    const handleSwitchChange = (checked: boolean) => {
        if (value === undefined) {
            setInternalValue(checked);
        }
        onChange?.(checked);
    };

    const resolvedValue = value !== undefined ? value : internalValue;

    return (
        <div className="flex flex-row justify-center items-center mt-5 ml-4 col-span-2">
            <Switch
                label={label}
                checked={resolvedValue}
                onChange={handleSwitchChange}
            />
        </div>
    );
};

export default PhoneSwitch;

