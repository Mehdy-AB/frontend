import { useTranslations } from 'next-intl'
import LanguageSelector from '../../components/i18n/LanguageSelector'

export default function HomePage() {
  const t = useTranslations('common')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">AebDMS</h1>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSelector variant="compact" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              {t('welcome')}
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Document Management System
            </p>
          </div>

          {/* Language Selector Demo */}
          <div className="mt-12">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Language Selector Examples
                </h3>
                
                <div className="space-y-6">
                  {/* Dropdown Variant */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Dropdown Variant</h4>
                    <LanguageSelector variant="dropdown" />
                  </div>

                  {/* Buttons Variant */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Buttons Variant</h4>
                    <LanguageSelector variant="buttons" />
                  </div>

                  {/* Compact Variant */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Compact Variant</h4>
                    <LanguageSelector variant="compact" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Translation Demo */}
          <div className="mt-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Translation Examples
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-gray-900">{t('documents')}</h4>
                    <p className="text-sm text-gray-600">{t('description')}</p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-gray-900">{t('folders')}</h4>
                    <p className="text-sm text-gray-600">{t('description')}</p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-gray-900">{t('administration')}</h4>
                    <p className="text-sm text-gray-600">{t('description')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

