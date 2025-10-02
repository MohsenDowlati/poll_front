"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useState } from "react";
import PhoneInput from "@/components/form/group-input/PhoneInput";
import { signup, SignupPayload } from "@/services/auth/auth";
import Button from "@/components/ui/button/Button";
import { normalizePhone } from "@/utils/normalizePhone";
import { useRouter } from "next/navigation";
import { extractToken, setAuthTokenCookie } from "@/utils/authToken";

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

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

  async function sign_up(payload: SignupPayload) {
    try {
      const { status, data } = await signup(payload);
      console.log(status, data);
      if (status >= 200 && status < 300) {
        console.log("ok", data);
        const token = extractToken(data);
        if (token) {
          setAuthTokenCookie(token);
        } else {
          console.warn("Signup succeeded but no token was found in the response payload");
        }
        router.push("/home");
      } else {
        console.log("error", status);
        // TODO: surface error to the user
      }
    } catch (error) {
      console.error("Sign up failed", error);
    }
  }

  const setPhoneNumber = (val: string) => {
    const num = val;
    if (num.startsWith("+1")) {
      const normalizedPhone = normalizePhone(num, "US");
      setPhone(normalizedPhone);
    } else {
      const normalizedPhone = normalizePhone(num, "IR");
      setPhone(normalizedPhone);
    }
  };

  const handlePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    const p = e.target.value;
    setPassword(p);
  };

  const handleOrganization = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setOrganization(value);
  }

  const handleName = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
  }

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (phone === "" || password === "" || name === "" || organization === "" ) {
      console.log("fill up");
      // TODO: alert user about missing fields
      return;
    }

    const payload: SignupPayload = {
      name,
      phone,
      organization,
      password
    };

    await sign_up(payload);
  };





  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full overflow-y-auto no-scrollbar">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign Up
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your phone and password to sign up!
            </p>
          </div>
          <div>
            <form onSubmit={handleSignUp}>
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {/* <!-- Name --> */}
                  <div className="sm:col-span-1">
                    <Label>
                      Name<span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="fname"
                      name="fname"
                      placeholder="Enter your name"
                      onChange={handleName}
                    />
                  </div>
                  {/* <!-- Organization --> */}
                  <div className="sm:col-span-1">
                    <Label>
                      Organization<span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="lname"
                      name="lname"
                      placeholder="Your Organization name"
                      onChange={handleOrganization}
                    />
                  </div>
                </div>
                {/* <!-- Phone --> */}
                <div>
                  <Label>
                    Phone<span className="text-error-500">*</span>
                  </Label>
                  <PhoneInput countries={countries} onChange={(val)=>setPhoneNumber(val)}/>
                </div>
                {/* <!-- Password --> */}
                <div>
                  <Label>
                    Password<span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder="Enter your password"
                      type={showPassword ? "text" : "password"}
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
                {/* <!-- Checkbox --> */}
                <div className="flex items-center gap-3">
                  <Checkbox
                    className="w-5 h-5"
                    checked={isChecked}
                    onChange={setIsChecked}
                  />
                  <p className="inline-block font-normal text-gray-500 dark:text-gray-400">
                    By creating an account means you agree to the{" "}
                    <span className="text-gray-800 dark:text-white/90">
                      Terms and Conditions,
                    </span>{" "}
                    and our{" "}
                    <span className="text-gray-800 dark:text-white">
                      Privacy Policy
                    </span>
                  </p>
                </div>
                {/* <!-- Button --> */}
                <div>
                  <Button className="w-full" size="sm" disabled={!isChecked} type="submit">
                    Sign Up
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Already have an account?
                <Link
                  href="/signin"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


