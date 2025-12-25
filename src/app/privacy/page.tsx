import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Mail } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-24 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 mb-4">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
            Privacy Policy
          </h1>
          <p className="text-slate-500 mt-3">
            Last updated: December 2025
          </p>
        </div>

        {/* Content */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-8 md:p-10 space-y-10 text-slate-700 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">
                Information We Collect
              </h2>
              <p>
                We collect information you provide directly to us when you
                register or use Saanify, including your name, email address,
                society details, and payment-related information required to
                deliver our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">
                How We Use Your Data
              </h2>
              <p>
                Your information is used to operate, maintain, and improve our
                platform, process transactions, provide support, ensure legal
                compliance, and enhance overall system security.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">
                Data Security
              </h2>
              <p>
                We follow industry-standard security practices including access
                controls, encryption, and secure infrastructure to protect your
                data from unauthorized access or misuse.
              </p>
            </section>

            <section className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-indigo-600 mt-1" />
              <p>
                If you have any privacy-related questions, contact us at{" "}
                <span className="font-medium text-indigo-600">
                  contact@saanify.com
                </span>
                .
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}