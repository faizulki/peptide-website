'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import Container from '@/components/layout/Container';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

const content = {
  en: {
    heading: 'Contact Us',
    intro:
      "We'd love to hear from you! Whether you have a question about our products, need help with an order, or just want to say hello, feel free to reach out.",
    emailLabel: 'Email',
    hoursLabel: 'Business Hours',
    hoursText: 'Monday - Friday: 9:00 AM - 6:00 PM EST\nSaturday: 10:00 AM - 4:00 PM EST\nSunday: Closed',
    responseLabel: 'Response Time',
    responseText: 'We typically respond to inquiries within 24-48 hours during business days.',
    sendMessage: 'Send us a Message',
    thankYou: "Thank you for your message! We'll get back to you soon.",
    name: 'Name',
    email: 'Email',
    subject: 'Subject',
    selectSubject: 'Select a subject',
    subjectOptions: [
      { value: 'product', label: 'Product Inquiry' },
      { value: 'order', label: 'Order Question' },
      { value: 'shipping', label: 'Shipping & Delivery' },
      { value: 'return', label: 'Returns & Refunds' },
      { value: 'other', label: 'Other' },
    ],
    message: 'Message',
    send: 'Send Message',
  },
  sv: {
    heading: 'Kontakta oss',
    intro:
      'Vi vill gärna höra från dig! Oavsett om du har en fråga om våra produkter, behöver hjälp med en beställning eller bara vill säga hej, tveka inte att höra av dig.',
    emailLabel: 'E-post',
    hoursLabel: 'Öppettider',
    hoursText: 'Måndag - Fredag: 9:00 - 18:00\nLördag: 10:00 - 16:00\nSöndag: Stängt',
    responseLabel: 'Svarstid',
    responseText: 'Vi svarar normalt på förfrågningar inom 24-48 timmar under vardagar.',
    sendMessage: 'Skicka oss ett meddelande',
    thankYou: 'Tack för ditt meddelande! Vi återkommer till dig snart.',
    name: 'Namn',
    email: 'E-post',
    subject: 'Ämne',
    selectSubject: 'Välj ett ämne',
    subjectOptions: [
      { value: 'product', label: 'Produktfråga' },
      { value: 'order', label: 'Fråga om beställning' },
      { value: 'shipping', label: 'Frakt och leverans' },
      { value: 'return', label: 'Returer och återbetalningar' },
      { value: 'other', label: 'Övrigt' },
    ],
    message: 'Meddelande',
    send: 'Skicka meddelande',
  },
};

export default function ContactPage() {
  const { language } = useLanguage();
  const c = content[language];
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const subjectOptions = [
    { value: '', label: c.selectSubject },
    ...c.subjectOptions,
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 3000);
  };

  return (
    <Container maxWidth="4xl" className="py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-6">{c.heading}</h1>
          <p className="text-gray-700 mb-8">{c.intro}</p>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">{c.emailLabel}</h3>
              <p className="text-gray-700">support@eupeptides.org</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">{c.hoursLabel}</h3>
              <p className="text-gray-700 whitespace-pre-line">{c.hoursText}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">{c.responseLabel}</h3>
              <p className="text-gray-700">{c.responseText}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">{c.sendMessage}</h2>

          {submitted && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              {c.thankYou}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={c.name}
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <Input
              label={c.email}
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <Select
              label={c.subject}
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              options={subjectOptions}
              required
            />

            <Textarea
              label={c.message}
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={6}
            />

            <Button type="submit" fullWidth>
              {c.send}
            </Button>
          </form>
        </div>
      </div>
    </Container>
  );
}
