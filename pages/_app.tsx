import React from 'react';
import '../styles/globals.css';
import { AppProps } from 'next/app';
import Head from 'next/head';
import { ChakraProvider, theme } from '@chakra-ui/react';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <script src="https://unpkg.com/peerjs@1.3.1/dist/peerjs.js" />
      </Head>
      <ChakraProvider theme={theme}>
        <Component {...pageProps} />
      </ChakraProvider>
    </>
  );
}

export default MyApp;
