"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import CustomerDetailPageClient from "./CustomerPageClient";

function CustomerDetailPageInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";

  if (!id) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <div className="mx-auto max-w-2xl p-6 text-sm text-zinc-800">
          Missing customer id. Please open this page via a valid customer link.
        </div>
      </div>
    );
  }

  return <CustomerDetailPageClient id={id} />;
}

export default function CustomerDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50" />}>
      <CustomerDetailPageInner />
    </Suspense>
  );
}
