import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        {/* Global Header */}
        <header className="border-b bg-white">
          <div className="mx-auto flex h-14 max-w-md items-center justify-center px-4">
            <span className="text-sm font-semibold">
              소셜 플랫폼
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="mx-auto max-w-md px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
