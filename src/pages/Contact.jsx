import React, { useState } from 'react';
import { Mail, CheckCircle2, ChevronDown, MessageSquare, HelpCircle } from 'lucide-react';

export const Contact = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setName('');
    setEmail('');
    setMessage('');
    setTimeout(() => setSent(false), 5000);
  };

  const faqs = [
    {
      q: 'What makes ServeMate transparent?',
      a: 'Unlike traditional platforms where funds disappear into opaque pools, ServeMate implements a strict 95% Escrow / 5% Fee model and requires NGO volunteers to record live video proof directly inside the in-app camera within a 72-Hour SLA window.'
    },
    {
      q: 'Why focus on ₹10 micro-donations?',
      a: 'Most students cannot donate ₹500–₹1,000 regularly, but 40M+ Indian college students can easily contribute ₹10–₹20 if they trust the platform. By aggregating micro-gives through campus clubs, collective impact is created.'
    },
    {
      q: 'How does the 72-Hour SLA Video Guarantee work?',
      a: 'When a campaign reaches its target, a 72-Hour SLA countdown timer begins. The verified NGO volunteer must record live video proof on site. If missed, Gemini AI flags the campaign for immediate admin audit.'
    },
    {
      q: 'Is resence.in connected?',
      a: 'Yes! ServeMate is built under the parent brand Resence (resence.in), India\'s social impact technology incubator.'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-10 space-y-12">
      
      {/* Title */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-heading font-extrabold text-white">
          Contact & <span className="text-emerald-400">Support</span>
        </h1>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Have questions or want to partner your college club/NGO with ServeMate? Send us a message or check our FAQ.
        </p>
      </div>

      {/* Support Form & FAQ Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Contact Form */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-4">
          <h3 className="font-heading font-extrabold text-white text-lg flex items-center gap-2">
            <Mail className="w-5 h-5 text-emerald-400" />
            <span>Send Direct Message</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="text-slate-300 font-bold block mb-1">Your Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                className="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-bold block mb-1">Your Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@domain.com"
                className="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-bold block mb-1">Message</label>
              <textarea
                required
                rows="4"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="How can we help or collaborate with your campus?"
                className="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-heading font-extrabold text-xs"
            >
              ✉️ Send Support Message
            </button>
          </form>

          {sent && (
            <p className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 pt-2">
              <CheckCircle2 className="w-4 h-4" />
              Message sent successfully! We typically respond within 24 hours.
            </p>
          )}
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          <h3 className="font-heading font-extrabold text-white text-lg flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-cyan-400" />
            <span>Frequently Asked Questions</span>
          </h3>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className="glass-panel rounded-2xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                  className="w-full p-4 text-left flex items-center justify-between font-heading font-bold text-xs text-white hover:bg-white/5"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-cyan-400 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="p-4 pt-0 text-xs text-slate-300 leading-relaxed border-t border-white/5 bg-slate-950/40">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
