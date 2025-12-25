"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, ArrowRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/dashboard");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  const handleGoHome = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
              Payment Successful!
            </CardTitle>
            <CardDescription className="text-gray-600">
              Your subscription has been activated successfully
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Success Message */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-green-800 font-medium">
                🎉 Welcome to Saanify Premium!
              </p>
              <p className="text-green-700 text-sm mt-1">
                You now have access to all premium features
              </p>
            </div>

            {/* Countdown Timer */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Redirecting to dashboard in{" "}
                <span className="font-bold text-green-600">{countdown}</span> seconds...
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={handleGoToDashboard}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium py-3"
              >
                Go to Dashboard Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
              <Button 
                variant="outline"
                onClick={handleGoHome}
                className="w-full border-gray-300 hover:bg-gray-50"
              >
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </div>

            {/* Additional Info */}
            <div className="text-center text-xs text-gray-500 space-y-1">
              <p>✓ Payment verified and processed</p>
              <p>✓ Premium features activated</p>
              <p>✓ Email confirmation sent</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}