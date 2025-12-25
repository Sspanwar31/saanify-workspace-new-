'use client';
import { Mail, BookOpen, ArrowRight, LifeBuoy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SupportSection() {
  return (
    <section id="contact" className="py-24 bg-white border-t border-slate-100">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-4">
             <LifeBuoy className="w-4 h-4"/> We are here to help
          </div>
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Need Assistance?</h2>
          <p className="text-lg text-slate-600">
            Resolve issues quickly with our dedicated support channels.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Card 1: Contact Support */}
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 hover:border-blue-500/20 hover:shadow-xl transition-all group">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Contact Support</h3>
            <p className="text-slate-500 mb-8 leading-relaxed">
              Facing account, billing, or technical issues? Open a priority ticket directly.
            </p>
            <Link href="/contact" className="block">
              <Button className="w-full h-12 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-base shadow-lg shadow-slate-200">
                Open Support Ticket <ArrowRight className="ml-2 w-4 h-4"/>
              </Button>
            </Link>
          </div>

          {/* Card 2: Help Center */}
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 hover:border-purple-500/20 hover:shadow-xl transition-all group">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Help & Documentation</h3>
            <p className="text-slate-500 mb-8 leading-relaxed">
              Browse guides on loan calculations, passbook management, and reports.
            </p>
            <Link href="/contact" className="block">
              <Button variant="outline" className="w-full h-12 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-base">
                Visit Help Center <ArrowRight className="ml-2 w-4 h-4"/>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}