"use client";

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <section
      className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-20 px-4"
      style={{ background: "linear-gradient(160deg, #EFF6FF 0%, #F0FDFF 100%)" }}
    >
      <div className="w-full max-w-md">
        <div className="flex justify-center">
          <SignIn
            routing="path"
            path="/sign-in"
            appearance={{ elements: { footer: "hidden" } }}
          />
        </div>
      </div>
    </section>
  );
}
