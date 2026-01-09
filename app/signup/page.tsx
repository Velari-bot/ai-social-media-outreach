"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/book");
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F3F1EB]">
      <p className="text-gray-500">Redirecting to booking...</p>
    </main>
  );
}
