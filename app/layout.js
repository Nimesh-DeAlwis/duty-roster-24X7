import "./globals.css";

export const metadata = {
  title: "Duty Roster",
  description: "Weekly duty roster generator",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
