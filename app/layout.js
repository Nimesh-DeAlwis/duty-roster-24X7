import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-grotesk",
  display: "swap",
});

export const metadata = {
  title: "Duty Roster",
  description: "Weekly duty roster generator",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${grotesk.variable}`}>
      <body>{children}</body>
    </html>
  );
}
