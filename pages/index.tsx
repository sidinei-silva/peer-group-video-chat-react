import React, { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import {
  Container,
  VStack,
  Heading,
  Text,
  HStack,
  Box,
  Button,
  Flex,
} from '@chakra-ui/react';
import { getMyMediaWebCam } from '../services/navegatorMedia';

export default function Home() {
  const myVideoEl = useRef(null);
  const [pageUrl, setPageUrl] = useState('');
  const [disableButton, setDisableButton] = useState(false);
  const [myCodeRoom, setMyCodeRoomUrlRoom] = useState('');
  const urlRoom = `${pageUrl}/${myCodeRoom}`;

  const [containCam, setContainCam] = useState(true);

  useEffect(() => {
    const uuid = uuidv4();
    setMyCodeRoomUrlRoom(uuid);
  }, []);

  useEffect(() => {
    const fullUrl = `${window.location.protocol}//${window.location.hostname}${
      window.location.port ? `:${window.location.port}` : ''
    }`;
    setPageUrl(fullUrl);
  }, []);

  useEffect(() => {
    if (!myVideoEl) {
      return;
    }

    getMyMediaWebCam((err, stream) => {
      if (stream) {
        if (!stream.getVideoTracks().length) {
          setContainCam(false);
        }

        const video = myVideoEl.current;
        video.srcObject = stream;
        video.play();
        video.muted = true;
      } else {
        setDisableButton(true);
      }
    });
  }, [myVideoEl]);

  return (
    <Container
      maxW="7xl"
      mx="auto"
      centerContent
      height="100vh"
      justifyContent="center"
    >
      <VStack spacing={8}>
        <Heading as="h1" size="3xl" fontWeight="400" textAlign="center">
          Bem vindx ao
          <Text as="a" color="blue.400">
            {' '}
            Beet!
          </Text>
        </Heading>

        <HStack spacing={8}>
          <VStack spacing={5} align="stretch">
            <Text textAlign="center" fontSize="1.5rem">
              Entre na sala ou digite o código
            </Text>
            <Box bgColor="gray.100" padding={3} borderRadius={4}>
              {urlRoom}
            </Box>

            {!disableButton && (
              <a href={urlRoom}>
                <Button boxShadow="md" py="2rem" colorScheme="blue" size="lg">
                  Entrar na sala
                </Button>
              </a>
            )}

            {disableButton && (
              <Button disabled boxShadow="md" py="2rem" size="lg">
                Necessário permissão de camera ou microfone
              </Button>
            )}
          </VStack>
          <Flex
            justify="center"
            alignItems="center"
            width="25%"
            height="100%"
            display={containCam ? 'none' : 'flex'}
            border="1px red solid"
          >
            <Text textAlign="center" fontSize="1.2rem" color="red.500">
              Não há camera disponível
            </Text>
          </Flex>
          <Box display={containCam ? 'block' : 'none'}>
            <video ref={myVideoEl}>
              <track kind="captions" srcLang="pt-BR" />
            </video>
          </Box>
        </HStack>
      </VStack>
    </Container>
  );
}
