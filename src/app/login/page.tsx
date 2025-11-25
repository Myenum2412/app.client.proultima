import { Lock } from "lucide-react"
import { GalleryVerticalEnd } from "lucide-react"

import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="relative min-h-svh">
      {/* Background image for all screen sizes */}
      <div className="absolute inset-0 bg-muted">
        <img
          src="/login-bg.jpeg"
          alt="Background"
          className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
      
      {/* Content overlay */}
      <div className="relative z-10 grid min-h-svh lg:grid-cols-2">
        <div className="flex flex-col gap-4 p-6 pt-20 md:p-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex justify-center gap-2 md:justify-start">
            <a href="#" className="flex items-center gap-2 font-medium">
              <div className=" flex size-6 items-center justify-center rounded-md">
                <img src="/logo.png" alt="ProUltima" width={200} height={60} />
              </div>
              ProUltima
            </a>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-xs">
              <LoginForm />
            </div>
          </div>
        </div>
        <div className="hidden lg:block"></div>
      </div>
    </div>
  )
}