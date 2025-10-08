import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Provider from "@/components/providers/Provider";
import ConditionalLayout from "@/components/layout/ConditionalLayout";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { NotificationContainer } from "@/components/notifications";
import NotificationApiProvider from "@/components/providers/NotificationApiProvider";
import TokenManagerInitializer from "@/components/providers/TokenManagerInitializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'AeB DMS - Document Management System',
  description: 'Modern document management system for efficient file organization',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
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
