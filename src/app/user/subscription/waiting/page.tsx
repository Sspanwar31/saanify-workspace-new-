"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function WaitingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"pending" | "completed" | "none">("pending");

  // --------------- 🔥 POLLING CHECK EVERY 4 SEC ------------------
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const res = await fetch("/api/subscription/payment-status", {
          method: "GET",
          credentials: "include"
        });

        const data = await res.json();

        // ---------- FIXED LOGIC -----------

        // 1️⃣ Session exist nahi → user ko plan select page par bhejo
        if (!data.authenticated || data.paymentStatus === "unknown" || data.paymentStatus === "not-paid") {
          router.push("/subscription/select-plan");
          return;
        }

        // 2️⃣ Payment pending → waiting page running (polling continue)
        if (data.paymentStatus === "pending") {
          setStatus("pending");
          setLoading(false);
          return;
        }

        // 3️⃣ Payment completed → success page redirect
        if (data.paymentStatus === "completed") {
          setStatus("completed");
          router.push("/user/subscription/success");  // <-- Change if your success page diff
          return;
        }

      } catch (err) {
        console.log("Error while checking payment status:", err);
      }
    };

    checkStatus();
    interval = setInterval(checkStatus, 4000);  // runs every 4 seconds

    return () => clearInterval(interval);
  }, [router]);

  // ---------------- UI SECTION ----------------
  return (
    <div className="h-[100vh] flex flex-col justify-center items-center">
      
      {loading ? (
        <h2 className="text-xl font-semibold">Checking payment status...</h2>
      ) : status === "pending" ? (
        <>
          <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-blue-500"></div>
          <p className="mt-4 text-lg font-medium text-gray-700">
            Payment verification in progress...
          </p>
          <p className="text-sm text-gray-500">Please wait, this may take a moment.</p>
        </>
      ) : null}

    </div>
  );
}