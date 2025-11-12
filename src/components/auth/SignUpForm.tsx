"use client";
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
import { useLocale } from "@/hooks/useLocale";
import useAlert from "@/hooks/useAlert";

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const router = useRouter();
  const { showAlert } = useAlert();

  const {direction, t} = useLocale();

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
        showAlert({
          variant: "success",
          title: "Account created",
          message: "You have successfully signed up.",
        });
        router.push("/home");
      } else {
        console.log("error", status);
        // TODO: surface error to the user
        showAlert({
          variant: "error",
          title: "Sign up failed",
          message: "Please verify your details and try again.",
        });
      }
    } catch (error) {
      console.error("Sign up failed", error);
      showAlert({
        variant: "error",
        title: "Network issue",
        message: "Unable to reach the server. Please try again shortly.",
      });
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
      showAlert({
        variant: "warning",
        title: "Missing information",
        message: "Please fill out all required fields.",
      });
      return;
    }

    const payload: SignupPayload = {
      name,
      phone,
      organization,
      password
    };

    setIsLoading(true);
    try {
      await sign_up(payload);
    } finally {
      setIsLoading(false);
    }
  };





  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full overflow-y-auto no-scrollbar">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 dir={direction} className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              {t('auth.signup.title')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('auth.signup.description')}
            </p>
          </div>
          <div>
            <form onSubmit={handleSignUp}>
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {/* <!-- Name --> */}
                  <div className="sm:col-span-1">
                    <Label>
                      {t('auth.signup.name')}<span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="fname"
                      name="fname"
                      placeholder={t('auth.inputs.namePlaceholder')}
                      onChange={handleName}
                    />
                  </div>
                  {/* <!-- Organization --> */}
                  <div className="sm:col-span-1">
                    <Label>
                      {t('auth.signup.organization')}<span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="lname"
                      name="lname"
                      placeholder={t('auth.inputs.organizationPlaceholder')}
                      onChange={handleOrganization}
                    />
                  </div>
                </div>
                {/* <!-- Phone --> */}
                <div>
                  <Label>
                    {t('auth.login.phone')}<span className="text-error-500">*</span>
                  </Label>
                  <PhoneInput countries={countries} onChange={(val)=>setPhoneNumber(val)}/>
                </div>
                {/* <!-- Password --> */}
                <div>
                  <Label>
                    {t('auth.login.password')}<span className="text-error-500">*</span>
                  </Label>
                  <div className="relative" dir="ltr">
                    <Input
                      placeholder={t('auth.inputs.passwordPlaceholder')}
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
                {/* <!-- Button --> */}
                <div>
                  <Button className="w-full" size="sm" disabled={isLoading} type="submit">
                    {t('auth.signup.title')}
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                {t('auth.signup.alreadyHaveAccount')}{" "}
                <Link
                  href="/"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  {t('auth.signup.signInLink')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


