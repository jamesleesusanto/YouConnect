import { Inter, Playfair_Display, Bricolage_Grotesque, Schibsted_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../../contexts/AuthContext";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"] });

// Distinctive type system used by the redesigned homepage
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const hanken = Schibsted_Grotesk({ variable: "--font-hanken", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const spaceMono = Space_Mono({ variable: "--font-space-mono", subsets: ["latin"], weight: ["400", "700"] });

export const metadata = {
  title: "YouConnect by YouDemonia",
  description: "Connecting students with nonprofits, workshops, and community events",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} ${bricolage.variable} ${hanken.variable} ${spaceMono.variable} antialiased min-h-screen flex flex-col bg-background font-[var(--font-inter)]`}>
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
