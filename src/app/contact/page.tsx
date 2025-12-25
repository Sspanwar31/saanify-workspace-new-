'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Shield } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center text-sm font-medium text-slate-600 hover:text-blue-600">
            <ArrowLeft className="w-4 h-4 mr-1"/> Back to Home
          </Link>
          <span className="font-bold text-lg tracking-tight flex items-center gap-2"><Shield className="w-5 h-5 text-blue-600"/> Saanify Support</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="grid lg:grid-cols-2 gap-12">
          
          {/* LEFT: FORM */}
          <div>
             <h1 className="text-3xl font-bold text-slate-900 mb-2">Submit a Ticket</h1>
             <p className="text-slate-500 mb-8">We usually respond within 24 hours.</p>
             
             <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100">
                <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); toast.success("Ticket Submitted!"); }}>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Full Name</Label><Input placeholder="John Doe" required/></div>
                      <div className="space-y-2"><Label>Society Name</Label><Input placeholder="Green Valley" required/></div>
                   </div>
                   <div className="space-y-2"><Label>Email</Label><Input type="email" placeholder="admin@society.com" required/></div>
                   
                   <div className="space-y-2"><Label>Issue Category</Label>
                      <Select>
                         <SelectTrigger><SelectValue placeholder="Select Topic" /></SelectTrigger>
                         <SelectContent>
                            <SelectItem value="billing">Billing & Subscription</SelectItem>
                            <SelectItem value="technical">Technical / Bug</SelectItem>
                            <SelectItem value="account">Account Access</SelectItem>
                            <SelectItem value="feature">Feature Request</SelectItem>
                         </SelectContent>
                      </Select>
                   </div>

                   <div className="space-y-2"><Label>Message</Label><Textarea placeholder="Describe issue..." className="h-32 resize-none"/></div>
                   <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg">Send Message</Button>
                </form>
             </div>
          </div>

          {/* RIGHT: FAQ */}
          <div className="space-y-8">
             <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Common Questions</h2>
                <Accordion type="single" collapsible className="w-full bg-white rounded-xl border px-4 shadow-sm">
                   <AccordionItem value="item-1">
                      <AccordionTrigger>How is my data secured?</AccordionTrigger>
                      <AccordionContent>We use 256-bit encryption and daily cloud backups.</AccordionContent>
                   </AccordionItem>
                   <AccordionItem value="item-2">
                      <AccordionTrigger>Can I export my data?</AccordionTrigger>
                      <AccordionContent>Yes, Admins can export all ledgers to Excel/PDF anytime.</AccordionContent>
                   </AccordionItem>
                   <AccordionItem value="item-3">
                      <AccordionTrigger>Loan calculation logic?</AccordionTrigger>
                      <AccordionContent>We use Reducing Balance method (1% monthly default).</AccordionContent>
                   </AccordionItem>
                </Accordion>
             </div>
             
             {/* Contact Info */}
             <div className="bg-blue-900 text-white p-6 rounded-2xl">
                <h3 className="font-bold text-lg mb-2">Enterprise Support</h3>
                <p className="text-blue-200 text-sm mb-4">Direct line for critical financial issues.</p>
                <p className="font-mono text-lg">+91 98765 43210</p>
                <p className="text-sm text-blue-300">Mon-Fri, 9am - 6pm IST</p>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}