import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Amaterasu — Static Analysis & Edge-Case Detection',
  description: 'Bringing absolute diagnostic clarity to complex state spaces',
  keywords: 'static analysis, code linter, DSA debugger, compiler trace, edge case finder',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('theme') || 'dark';
                  document.documentElement.setAttribute('data-theme', savedTheme);
                } catch (e) {
                  document.documentElement.setAttribute('data-theme', 'dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
