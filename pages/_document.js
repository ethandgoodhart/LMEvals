import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html>
      <Head>
        {/* <link rel="icon" href="/favicon.ico" /> */}
        <link rel="icon" type="image/png" href="/logo2.png" />
        <meta property="og:title" content="LMEvals" />
        <meta property="og:description" content="LMEvals" />
        <meta property="og:image" content="/logocard.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
