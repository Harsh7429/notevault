import Head from "next/head";
import "@/styles/globals.css";
// react-pdf canvas wrapper sizing — required for Page to fill its container correctly
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

export default function App({ Component, pageProps }) {
  return (
    <>
      {/* Global viewport meta — viewport-fit=cover enables safe-area-inset-* on iOS */}
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#f6f1e8" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
