import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flat Search — compromise, not conflict",
  description:
    "Riya, Meera & Kavita each set their constraints privately, then compare candidate flats side by side.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="shell">{children}</div>
      </body>
    </html>
  );
}
