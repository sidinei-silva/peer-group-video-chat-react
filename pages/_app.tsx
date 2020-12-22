import React from 'react';
import '../styles/globals.css';
import { AppProps } from 'next/app';
import Head from 'next/head';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <script src="https://unpkg.com/peerjs@1.3.1/dist/peerjs.min.js" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
