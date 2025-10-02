"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useState } from "react";
import PhoneInput from "@/components/form/group-input/PhoneInput";
import { normalizePhone } from "@/utils/normalizePhone";
import { login, LoginCredentials } from "@/services/auth/auth";
import { useRouter } from "next/navigation";
import { extractToken, setAuthTokenCookie } from "@/utils/authToken";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const router = useRouter();

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
        console.log("ok", data);
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
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your phone and password to sign in!
            </p>
          </div>
          <div>
            <form onSubmit={handleLogin}>
              <div className="space-y-6">
                <div>
                  <Label>
                    Phone <span className="text-error-500">*</span>{" "}
                  </Label>
                  <PhoneInput countries={countries} onChange={(val) => setPhone(val)} />
                </div>
                <div>
                  <Label>
                    Password <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
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
                  <Button className="w-full" size="sm" type="submit">
                    Sign in
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Don&apos;t have an account? {""}
                <Link
                  href="/signup"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


