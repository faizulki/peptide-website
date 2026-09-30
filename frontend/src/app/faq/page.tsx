'use client';

import { useEffect, useState } from 'react';
import { Faq } from '@/types';
import { api } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import Container from '@/components/layout/Container';
import Loading from '@/components/ui/Loading';

export default function FAQPage() {
  const { t, pick } = useLanguage();
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getFaqs()
      .then(setFaqs)
      .catch((error) => console.error('Error loading FAQs:', error))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Container className="py-12">
        <Loading />
      </Container>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-lg shadow-md p-8 md:p-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">{t('faqPage.title')}</h1>

        <div className="space-y-6">
          {faqs.map((faq) => (
            <div key={faq.id} className="border-b border-gray-200 pb-6 last:border-b-0">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                {pick(faq.question, faq.questionSv)}
              </h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {pick(faq.answer, faq.answerSv)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-blue-50 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('faqPage.stillHaveQuestions')}</h2>
          <p className="text-gray-700 mb-4">
            {t('faqPage.stillHaveQuestionsDesc')}{' '}
            <a href="/contact" className="text-blue-600 hover:underline font-semibold">{t('faqPage.contactUs')}</a>{' '}
            {t('faqPage.andWellHelp')}
          </p>
        </div>
      </div>
    </div>
  );
}
