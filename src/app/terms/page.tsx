import { Card, CardContent } from "@/components/ui/card";
import { FileText, AlertTriangle } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-24 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mb-4">
            <FileText className="w-7 h-7" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
            Terms of Service
          </h1>
          <p className="text-slate-500 mt-3">
            Effective date: December 2025
          </p>
        </div>

        {/* Content */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-8 md:p-10 space-y-10 text-slate-700 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">
                Acceptance of Terms
              </h2>
              <p>
                By accessing or using Saanify, you agree to comply with and be
                bound by these Terms of Service. If you do not agree, you should
                discontinue use of platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">
                User Responsibilities
              </h2>
              <p>
                You are responsible for safeguarding your login credentials and
                for all activities that occur under your account. Any misuse or
                unauthorized access must be reported immediately.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">
                Service Availability
              </h2>
              <p>
                We aim to provide uninterrupted service; however, temporary
                downtime may occur due to maintenance, updates, or technical
                issues beyond our control.
              </p>
            </section>

            <section className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-1" />
              <p>
                We reserve right to suspend or terminate accounts that
                violate these Terms, applicable laws, or misuse platform in
                any manner.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}