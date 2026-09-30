'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function ResearchCredibility() {
  const { t } = useLanguage();
  const credibilityPoints = [
    { title: t('credibility.point1Title'), description: t('credibility.point1Desc') },
    { title: t('credibility.point2Title'), description: t('credibility.point2Desc') },
    { title: t('credibility.point3Title'), description: t('credibility.point3Desc') },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">{t('credibility.title')}</h2>
      <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto">
        {t('credibility.subtitle')}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {credibilityPoints.map((point) => (
          <div key={point.title} className="text-center px-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{point.title}</h3>
            <p className="text-sm text-gray-600">{point.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
