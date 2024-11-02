import localFont from "next/font/local";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "VALENCIA SOS - APLICACION",
  description: "Esta plataforma permite gestionar y coordinar eficientemente las ayudas humanitarias en situaciones de emergencia causadas por catástrofes naturales, como la reciente DANA en Valencia. Diseñada para facilitar la respuesta rápida y organizada, la aplicación permite a los usuarios solicitar asistencia y registrar necesidades urgentes, mientras los equipos de ayuda gestionan y priorizan los recursos en tiempo real.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
