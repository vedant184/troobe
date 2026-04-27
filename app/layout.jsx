import "./globals.css";

export const metadata = {
  title: "Troobe — ChatGPT + Gemini style chatbot",
  description:
    "Troobe is a smart chatbot that combines the best of ChatGPT and Gemini, powered by Anthropic Claude. Visit troobe.com",
  metadataBase: new URL("https://troobe.com"),
  openGraph: {
    title: "Troobe — ChatGPT + Gemini style chatbot",
    description:
      "A smart chatbot that combines the best of ChatGPT and Gemini.",
    url: "https://troobe.com",
    siteName: "Troobe",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
