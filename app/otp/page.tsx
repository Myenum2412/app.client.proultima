import type { Metadata } from "next";
import { OTPForm } from "@/components/otp-form"
import Image from "next/image"

export const metadata: Metadata = {
  title: "Verify OTP",
  description: "Enter your one-time password to complete authentication",
};

export default function OTPPage() {
  return (
    <div className="flex min-h-svh w-full">
      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-xs">
          <OTPForm />
        </div>
      </div>
      <div className="relative hidden w-1/2 lg:block">
        <Image
          alt="Authentication"
          className="object-cover"
          fill
          sizes="50vw"
          src="/placeholder.svg"
        />
      </div>
    </div>
  )
}
