import type { ReactNode } from "react";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-neutral-950 text-neutral-100 min-h-dvh">
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
