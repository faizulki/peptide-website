'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';

const navLinks = [
  { href: '/', key: 'nav.products' as const },
  { href: '/about', key: 'nav.about' as const },
  { href: '/blog', key: 'nav.blog' as const },
  { href: '/faq', key: 'nav.faq' as const },
  { href: '/contact', key: 'nav.contact' as const },
];

export default function Header() {
  const { user, signOut } = useAuth();
  const { getTotalItems } = useCart();
  const { language, setLanguage, t } = useLanguage();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
    setShowMobileMenu(false);
  };

  const closeMobileMenu = () => setShowMobileMenu(false);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-icon.png" alt="" className="h-9 w-9 flex-shrink-0" />
            <span className="text-2xl font-bold text-blue-600 truncate">EuPeptides</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                {t(link.key)}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="hidden md:flex items-center rounded-lg border border-gray-200 overflow-hidden text-sm font-medium">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 transition-colors ${
                  language === 'en' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
                aria-label="English"
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('sv')}
                className={`px-2 py-1 transition-colors ${
                  language === 'sv' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
                aria-label="Svenska"
              >
                SV
              </button>
            </div>

            <Link
              href="/cart"
              className="relative p-2 text-gray-700 hover:text-blue-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {getTotalItems() > 0 && (
                <span className="absolute top-0 right-0 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors max-w-[180px]"
                >
                  <span className="text-gray-700 truncate">{user.name}</span>
                  <svg
                    className="w-4 h-4 text-gray-500 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      {t('nav.signOut')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Link
                  href="/signin"
                  className="px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  {t('nav.signIn')}
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('nav.signUp')}
                </Link>
              </div>
            )}

            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-gray-700 hover:text-blue-600 transition-colors"
              aria-label="Menu"
              aria-expanded={showMobileMenu}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {showMobileMenu ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-200 py-4 space-y-4">
            <nav className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMobileMenu}
                  className="px-2 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  {t(link.key)}
                </Link>
              ))}
            </nav>

            <div className="flex items-center justify-between px-2">
              <span className="text-sm text-gray-500">Language</span>
              <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden text-sm font-medium">
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1 transition-colors ${
                    language === 'en' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  aria-label="English"
                >
                  EN
                </button>
                <button
                  onClick={() => setLanguage('sv')}
                  className={`px-3 py-1 transition-colors ${
                    language === 'sv' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  aria-label="Svenska"
                >
                  SV
                </button>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 px-2">
              {user ? (
                <div className="space-y-2">
                  <p className="text-gray-700 truncate">{user.name}</p>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    {t('nav.signOut')}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col space-y-2">
                  <Link
                    href="/signin"
                    onClick={closeMobileMenu}
                    className="px-4 py-2 text-center text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {t('nav.signIn')}
                  </Link>
                  <Link
                    href="/signup"
                    onClick={closeMobileMenu}
                    className="px-4 py-2 text-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {t('nav.signUp')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
