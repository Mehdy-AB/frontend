// app/folders/layout.tsx
'use client';

import { SessionProvider } from '../../contexts/SessionContext';

export default function FoldersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}
