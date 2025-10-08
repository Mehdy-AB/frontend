# Internationalization (i18n) Setup

This directory contains the internationalization configuration and setup for the AebDMS frontend application, supporting English, French, and Arabic languages.

## 🌍 Supported Languages

- **English (en)** - Default language
- **French (fr)** - Français
- **Arabic (ar)** - العربية (RTL support)

## 📁 File Structure

```
src/
├── i18n/
│   ├── config.ts          # i18n configuration and utilities
│   └── README.md          # This documentation
├── messages/
│   ├── en.json           # English translations
│   ├── fr.json           # French translations
│   └── ar.json           # Arabic translations
├── components/
│   └── i18n/
│       ├── LanguageSelector.tsx  # Language selector component
│       └── index.ts              # Component exports
└── hooks/
    └── useTranslations.ts        # Translation hooks
```

## 🚀 Quick Start

### 1. Using Translations in Components

```typescript
import { useTranslations } from 'next-intl'

function MyComponent() {
  const t = useTranslations('common')
  
  return (
    <div>
      <h1>{t('welcome')}</h1>
      <p>{t('description')}</p>
    </div>
  )
}
```

### 2. Using the Language Selector

```typescript
import { LanguageSelector } from '@/components/i18n'

function Header() {
  return (
    <header>
      <h1>My App</h1>
      <LanguageSelector variant="dropdown" />
    </header>
  )
}
```

### 3. Using Translation Hooks

```typescript
import { useCommonTranslations, useAuthTranslations } from '@/hooks/useTranslations'

function MyComponent() {
  const commonT = useCommonTranslations()
  const authT = useAuthTranslations()
  
  return (
    <div>
      <h1>{commonT('welcome')}</h1>
      <button>{authT('signIn')}</button>
    </div>
  )
}
```

## 🎨 Language Selector Variants

### Dropdown Variant (Default)
```typescript
<LanguageSelector variant="dropdown" />
```
- Full dropdown with language names and flags
- Best for headers and navigation bars

### Buttons Variant
```typescript
<LanguageSelector variant="buttons" />
```
- Horizontal buttons for each language
- Good for settings pages or dedicated language sections

### Compact Variant
```typescript
<LanguageSelector variant="compact" />
```
- Minimal design with just flag and abbreviated name
- Perfect for mobile or space-constrained areas

## 📝 Adding New Translations

### 1. Add to Message Files

Add your translation keys to all language files:

**en.json:**
```json
{
  "mySection": {
    "newKey": "New translation"
  }
}
```

**fr.json:**
```json
{
  "mySection": {
    "newKey": "Nouvelle traduction"
  }
}
```

**ar.json:**
```json
{
  "mySection": {
    "newKey": "ترجمة جديدة"
  }
}
```

### 2. Use in Components

```typescript
import { useTranslations } from 'next-intl'

function MyComponent() {
  const t = useTranslations('mySection')
  
  return <p>{t('newKey')}</p>
}
```

## 🔧 Configuration

### Supported Locales
```typescript
export const locales = ['en', 'fr', 'ar'] as const
export const defaultLocale: Locale = 'en'
```

### RTL Support
```typescript
export const rtlLocales: Locale[] = ['ar']
export const isRTL = (locale: Locale): boolean => rtlLocales.includes(locale)
```

### Locale Display Names
```typescript
export const localeNames: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
  ar: 'العربية'
}
```

### Locale Flags
```typescript
export const localeFlags: Record<Locale, string> = {
  en: '🇺🇸',
  fr: '🇫🇷',
  ar: '🇸🇦'
}
```

## 🛠️ Utility Functions

### Get Locale from Pathname
```typescript
import { getLocaleFromPathname } from '@/i18n/config'

const locale = getLocaleFromPathname('/fr/documents') // Returns 'fr'
```

### Remove Locale from Pathname
```typescript
import { removeLocaleFromPathname } from '@/i18n/config'

const path = removeLocaleFromPathname('/fr/documents') // Returns '/documents'
```

### Add Locale to Pathname
```typescript
import { addLocaleToPathname } from '@/i18n/config'

const path = addLocaleToPathname('/documents', 'fr') // Returns '/fr/documents'
```

### Check if Locale is RTL
```typescript
import { isRTL } from '@/i18n/config'

const isArabicRTL = isRTL('ar') // Returns true
```

## 🎯 Translation Namespaces

The application is organized into logical translation namespaces:

- **common** - Common UI elements (buttons, labels, etc.)
- **auth** - Authentication related text
- **navigation** - Navigation menu items
- **documents** - Document management
- **folders** - Folder management
- **users** - User management
- **roles** - Role management
- **groups** - Group management
- **search** - Search functionality
- **filingCategories** - Filing categories
- **metadataLists** - Metadata lists
- **errors** - Error messages
- **validation** - Form validation messages

## 🌐 URL Structure

The application uses locale-prefixed URLs:

- `/en/documents` - English documents page
- `/fr/documents` - French documents page
- `/ar/documents` - Arabic documents page

## 🔄 Language Switching

When a user changes language:

1. The URL is updated to include the new locale
2. The page re-renders with new translations
3. RTL/LTR direction is applied automatically
4. The user's preference is maintained across sessions

## 📱 Responsive Design

The language selector adapts to different screen sizes:

- **Desktop**: Full dropdown with names and flags
- **Tablet**: Compact dropdown with flags and abbreviated names
- **Mobile**: Minimal design with just flags

## 🎨 Styling

### RTL Support
Arabic language automatically applies RTL styling:

```css
/* Automatically applied for Arabic */
[dir="rtl"] {
  text-align: right;
}

[dir="rtl"] .flex {
  flex-direction: row-reverse;
}
```

### Language Selector Styling
The language selector uses Tailwind CSS classes and can be customized:

```typescript
<LanguageSelector 
  className="custom-class"
  variant="dropdown"
  showFlags={true}
  showNames={true}
/>
```

## 🧪 Testing

### Testing Translations
```typescript
import { render } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'

const messages = {
  common: {
    welcome: 'Welcome'
  }
}

function TestWrapper({ children }) {
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}

test('renders translated text', () => {
  render(<MyComponent />, { wrapper: TestWrapper })
  expect(screen.getByText('Welcome')).toBeInTheDocument()
})
```

## 🚀 Performance

### Message Loading
- Messages are loaded per locale
- Only the current locale's messages are loaded
- Messages are cached for better performance

### Bundle Size
- Translation files are split by locale
- Unused translations are tree-shaken
- Minimal impact on bundle size

## 🔧 Development

### Adding a New Language

1. **Add locale to config:**
```typescript
export const locales = ['en', 'fr', 'ar', 'es'] as const
```

2. **Create message file:**
```typescript
// src/messages/es.json
{
  "common": {
    "welcome": "Bienvenido"
  }
}
```

3. **Add locale metadata:**
```typescript
export const localeNames: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
  ar: 'العربية',
  es: 'Español'
}
```

4. **Update RTL support if needed:**
```typescript
export const rtlLocales: Locale[] = ['ar', 'he'] // Add Hebrew if needed
```

### Debugging Translations

Enable debug mode in development:

```typescript
// In next.config.js
const nextConfig = {
  env: {
    NEXT_INTL_DEBUG: process.env.NODE_ENV === 'development'
  }
}
```

## 📚 Best Practices

### 1. Translation Keys
- Use descriptive, hierarchical keys
- Group related translations in namespaces
- Use consistent naming conventions

### 2. Message Structure
- Keep messages concise and clear
- Use placeholders for dynamic content
- Avoid hardcoded strings in components

### 3. RTL Considerations
- Test Arabic translations thoroughly
- Consider text expansion in UI design
- Use flexible layouts for different text lengths

### 4. Performance
- Lazy load translation files when possible
- Use translation hooks for better tree-shaking
- Minimize the number of translation namespaces

## 🐛 Troubleshooting

### Common Issues

1. **Translation not found**
   - Check if the key exists in all language files
   - Verify the namespace is correct
   - Ensure the component is wrapped with NextIntlClientProvider

2. **Language selector not working**
   - Check if middleware is properly configured
   - Verify locale routing is set up correctly
   - Ensure the component has access to router

3. **RTL not working**
   - Check if the locale is in rtlLocales array
   - Verify the HTML dir attribute is set
   - Ensure CSS RTL rules are applied

4. **Messages not loading**
   - Check if message files exist and are valid JSON
   - Verify the locale is supported
   - Ensure NextIntlClientProvider is configured correctly

### Debug Mode

Enable debug mode to see detailed information:

```typescript
// In your component
import { useTranslations } from 'next-intl'

function MyComponent() {
  const t = useTranslations('common')
  
  // This will log available keys in development
  console.log('Available keys:', Object.keys(t.raw('common')))
  
  return <div>{t('welcome')}</div>
}
```

## 📖 Additional Resources

- [Next.js Internationalization](https://nextjs.org/docs/advanced-features/i18n)
- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [RTL Support Guide](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Writing_Modes)
- [Unicode Bidirectional Algorithm](https://unicode.org/reports/tr9/)

