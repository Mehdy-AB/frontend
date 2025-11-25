import type { Metadata } from "next";
import "./globals.css";
import Provider from "@/components/providers/Provider";
import ConditionalLayout from "@/components/layout/ConditionalLayout";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { NotificationContainer } from "@/components/notifications";
import NotificationApiProvider from "@/components/providers/NotificationApiProvider";
import TokenManagerInitializer from "@/components/providers/TokenManagerInitializer";

export const metadata: Metadata = {
  title: 'Gi doc - Document Management System',
  description: 'Modern document management system for efficient file organization',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased">
      <body className="font-sans antialiased">
        <Provider>
          <TokenManagerInitializer />
          <LanguageProvider>
            <NotificationProvider>
              <NotificationApiProvider>
                <ConditionalLayout>
                  {children}
                </ConditionalLayout>
                <NotificationContainer />
              </NotificationApiProvider>
            </NotificationProvider>
          </LanguageProvider>
        </Provider>
      </body>
    </html>
  );
}
