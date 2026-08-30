import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "trsl",
  description: "Say what you mean. Send what you should.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          background: "#111",
          color: "#eee",
          minHeight: "100vh",
        }}
      >
        {children}
      </body>
    </html>
  );
}
