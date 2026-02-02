import type { Metadata } from "next";
import "./globals.css";
import Provider from "@/components/providers/Provider";
import ConditionalLayout from "@/components/layout/ConditionalLayout";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { NotificationContainer } from "@/components/notifications";
import NotificationApiProvider from "@/components/providers/NotificationApiProvider";
import TokenManagerInitializer from "@/components/providers/TokenManagerInitializer";
import { LicenseProvider } from "@/contexts/LicenseContext";
import { LicenseActivationModal } from "@/components/license/LicenseActivationModal";

export const metadata: Metadata = {
  title: 'Gi doc - Document Management System',
  description: 'Modern document management system for efficient file organization',
};

// Force dynamic rendering to ensure runtime environment variables (CLIENT_API_URL) 
// are read correctly from the Docker container, preventing static optimization 
// from baking in the build-time default.
export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased">
      <head>
        {/* Runtime config - CLIENT_API_URL is read at runtime (not baked at build like NEXT_PUBLIC_*) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = { API_URL: "${process.env.CLIENT_API_URL || 'http://localhost:8080'}" };`
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <Provider>
          <TokenManagerInitializer />
          <LicenseProvider>
            <LanguageProvider>
              <NotificationProvider>
                <NotificationApiProvider>
                  <ConditionalLayout>
                    {children}
                  </ConditionalLayout>
                  <NotificationContainer />
                  <LicenseActivationModal />
                </NotificationApiProvider>
              </NotificationProvider>
            </LanguageProvider>
          </LicenseProvider>
        </Provider>
      </body>
    </html>
  );
}
