'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function TrustBadges() {
  const { t } = useLanguage();
  const badges = [
    t('trustBadges.badge1'),
    t('trustBadges.badge2'),
    t('trustBadges.badge3'),
    t('trustBadges.badge4'),
    t('trustBadges.badge5'),
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">{t('trustBadges.title')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {badges.map((badge) => (
          <div
            key={badge}
            className="flex items-center gap-2 bg-blue-50 rounded-lg px-4 py-3"
          >
            <svg
              className="w-5 h-5 text-blue-600 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium text-gray-800">{badge}</span>
          </div>
        ))}
      </div>
      <p className="text-gray-600 leading-relaxed text-center max-w-3xl mx-auto">
        {t('trustBadges.description')}
      </p>
    </div>
  );
}
