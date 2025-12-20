import Logo from "@/app/dashboard/layout/shared/logo/Logo";
import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import AuthLogin from "../authforms/AuthLogin";
export const metadata: Metadata = {
  title: "Login | ระบบ บริหาร จัดการ การจองสนาม",
  description: "ระบบ บริหาร จัดการ การจองสนาม",
};
const BoxedLogin = () => {
  return (
    <>
      <div className="relative overflow-hidden h-screen bg-muted dark:bg-dark">
        <div className="flex h-full justify-center items-center px-4">
          <div className="rounded-lg dark:shadow-dark-md shadow-md bg-white dark:bg-darkgray p-6 relative w-full break-words md:w-[450px] border-none ">
            <div className="flex h-full flex-col justify-center gap-2 p-0 w-full">
              <div className="mx-auto">
                <Logo />
              </div>
              <p className=" font-kanit text-sm text-center text-dark my-3">ระบบ บริหาร จัดการ การจองสนาม</p>
              <AuthLogin />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BoxedLogin;
