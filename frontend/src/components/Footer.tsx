'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-gray-900 text-white py-8 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-icon-white.png" alt="" className="h-8 w-8" />
              <h3 className="text-lg font-semibold">EuPeptides</h3>
            </div>
            <p className="text-gray-400 text-sm">{t('footer.tagline')}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">{t('footer.quickLinks')}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="/" className="hover:text-white">{t('nav.products')}</a></li>
              <li><a href="/about" className="hover:text-white">{t('nav.about')}</a></li>
              <li><a href="/lab-reports" className="hover:text-white">{t('nav.labReports')}</a></li>
              <li><a href="/blog" className="hover:text-white">{t('nav.blog')}</a></li>
              <li><a href="/faq" className="hover:text-white">{t('nav.faq')}</a></li>
              <li><a href="/contact" className="hover:text-white">{t('nav.contact')}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">{t('footer.account')}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="/signin" className="hover:text-white">{t('nav.signIn')}</a></li>
              <li><a href="/signup" className="hover:text-white">{t('nav.signUp')}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">{t('footer.legal')}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white">{t('footer.privacyPolicy')}</a></li>
              <li><a href="#" className="hover:text-white">{t('footer.termsOfService')}</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 space-y-4 text-xs text-gray-500 leading-relaxed">
          <p>{t('footer.disclaimer1')}</p>
          <p>{t('footer.disclaimer2')}</p>
          <p>{t('footer.disclaimer3')}</p>
        </div>
        <div className="border-t border-gray-800 mt-6 pt-6 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} EuPeptides. {t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  );
}
