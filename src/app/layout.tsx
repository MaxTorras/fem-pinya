import "./globals.css";
import AdminKeyButton from "@/components/AdminKeyButton";

export const metadata = {
  title: "Fem Pinya",
  description: "Colla Castellera Edinburgh Attendance App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="relative min-h-screen bg-gray-50 text-gray-900">
        <AdminKeyButton />
        {children}
      </body>
    </html>
  );
}
