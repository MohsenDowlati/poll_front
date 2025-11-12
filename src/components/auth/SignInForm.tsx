"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import React, { useState } from "react";
import PhoneInput from "@/components/form/group-input/PhoneInput";
import { normalizePhone } from "@/utils/normalizePhone";
import { login, LoginCredentials } from "@/services/auth/auth";
import { useRouter } from "next/navigation";
import { extractToken, setAuthTokenCookie } from "@/utils/authToken";
import {useLocale} from "@/hooks/useLocale";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const {t} = useLocale();

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

  const log_in = async (payload: LoginCredentials) => {
    try {
      const { status, data } = await login(payload);
      if (status >= 200 && status < 300) {
        const token = extractToken(data);
        if (token) {
          setAuthTokenCookie(token);
        } else {
          console.warn("Login succeeded but no token was found in the response payload");
        }
        router.push("/home");
      } else {
        console.log("error", status);
        // TODO: surface error to the user
      }
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const setPhone = (val: string) => {
    const num = val;
    if (num.startsWith("+1")) {
      const normalizedPhone = normalizePhone(num, "US");
      setPhoneNumber(normalizedPhone);
    } else {
      const normalizedPhone = normalizePhone(num, "IR");
      setPhoneNumber(normalizedPhone);
    }
  };

  const handlePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pass = e.target.value;
    setPassword(pass);
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsLoading(true);
    e.preventDefault();
    if (phoneNumber === "" || password === "") {
      console.log("fill up");
      // TODO: alert user about missing fields
      return;
    }

    const payload: LoginCredentials = {
      phone: phoneNumber,
      password,
    };

    await log_in(payload);
    setIsLoading(false)
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              {t('auth.login.title')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('auth.login.description')}
            </p>
          </div>
          <div>
            <form onSubmit={handleLogin}>
              <div className="space-y-6">
                <div>
                  <Label>
                    {t('auth.login.phone')} <span className="text-error-500">*</span>{" "}
                  </Label>
                  <PhoneInput countries={countries} onChange={(val) => setPhone(val)} />
                </div>
                <div>
                  <Label>
                    {t('auth.login.password')} <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative" dir={"ltr"}>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder={t('auth.inputs.passwordPlaceholder')}
                      onChange={handlePassword}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                      )}
                    </span>
                  </div>
                </div>
                <div>
                  <Button className="w-full" size="sm" type="submit" disabled={isLoading}>
                    {t('auth.login.title')}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}


