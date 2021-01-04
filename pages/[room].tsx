/* eslint-disable react/no-array-index-key */
import {
  Box,
  Button,
  Center,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Heading,
  Input,
  ListItem,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  UnorderedList,
  useDisclosure,
  Text,
  HStack,
  outline,
  VStack,
  Container,
} from '@chakra-ui/react';
import { useRouter } from 'next/dist/client/router';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { IoHandRightOutline, IoHandRightSharp } from 'react-icons/io5';
import { getMyMediaWebCam } from '../services/navegatorMedia';
import {
  myPeerId,
  openPeer,
  peerCall,
  showPeer,
  subscribeCall,
} from '../services/webpeers';
import {
  handUp,
  socketSendMessage,
  subcribeCreateMessage,
  subcribeToggleHandUp,
  subcribeUserConnect,
  subcribeUserDisconnect,
} from '../services/websocket';

const peers = {};

const svgHand = `<svg
stroke="currentColor"
fill="currentColor"
strokeWidth="0"
viewBox="0 0 512 512"
className="text-blue-500"
xmlns="http://www.w3.org/2000/svg"
>
<path d="M82.42 209.08c15.06-6.62 32.38 1.31 38.5 17.62L156 312h11.27V80c0-17.6 13.3-32 29.55-32 16.26 0 29.55 14.4 29.55 32v151.75l14.78.25V32c0-17.6 13.3-32 29.55-32 16.3 0 29.55 14.4 29.55 32v199.75L315 232V64c0-17.6 13.3-32 29.55-32 16.26 0 29.55 14.4 29.55 32v183.75l14.78.25V128c0-17.6 13.3-32 29.55-32C434.7 96 448 110.4 448 128v216c0 75.8-37.13 168-169 168-40.8 0-79.42-7-100.66-21a121.41 121.41 0 01-33.72-33.31 138 138 0 01-16-31.78L66.16 250.77c-6.11-16.31 1.2-35.06 16.26-41.69z" />
</svg>`;

interface IChatMessage {
  position: 'right' | 'left';
  authorName: string;
  message: string;
}

const RoomPage: React.FC = () => {
  const myVideoEl = useRef(null);
  const gridVideoEl = useRef(null);
  const [gridCol, setGridCol] = useState(1);
  const [inputMessage, setInputMessage] = useState('');
  const [name, setName] = useState('');
  const [modal, setModal] = useState(true);
  const [myHandUp, setMyHandup] = useState(false);
  const [chatMessages, setChatMessages] = useState<IChatMessage[]>([]);

  const videoClasses = 'object-cover h-full w-full relative';
  const router = useRouter();
  const { room } = router.query;

  const { onClose } = useDisclosure();

  const enterRoom = () => {
    if (room && modal && name.length > 0) {
      setModal(false);
      openPeer({ room, name });
    }
  };

  useEffect(() => {
    if (!myVideoEl) {
      return;
    }
    getMyMediaWebCam((err, stream) => {
      const video = myVideoEl.current;
      video.srcObject = stream;
      video.play();
      video.muted = true;
    });
  }, [myVideoEl]);

  useEffect(() => {
    if (modal) {
      return;
    }
    subscribeCall((err, call) => {
      getMyMediaWebCam((errWebCam, stream) => {
        call.answer(stream);

        const divElVideo = document.createElement('div');
        divElVideo.className += 'relative';
        divElVideo.id = call.peer;

        const hostVideo = document.createElement('video');

        divElVideo.appendChild(hostVideo);

        const containerHand = document.createElement('div');
        containerHand.className +=
          'rounded-lg bg-white p-1 w-12 absolute bottom-0 right-0';

        containerHand.id = `handle-${call.peer}`;
        containerHand.style.display = 'none';

        const hand = document.createElement('div');

        hand.innerHTML += svgHand;

        hand.className += 'text-blue-500 h-10 w-10';
        containerHand.appendChild(hand);

        divElVideo.appendChild(containerHand);

        peers[call.peer] = call;

        call.on('stream', userVideoStream => {
          addVideoStream(divElVideo, hostVideo, userVideoStream);
        });
      });
    });

    subcribeUserConnect((err, userId) => {
      getMyMediaWebCam((errWebCam, stream) => {
        const call = peerCall(userId, stream);

        const divElVideo = document.createElement('div');
        divElVideo.className += 'relative';
        divElVideo.id = userId;

        const newUserVideoElement = document.createElement('video');

        divElVideo.appendChild(newUserVideoElement);

        const containerHand = document.createElement('div');
        containerHand.className +=
          'rounded-lg bg-white p-1 w-12 absolute bottom-0 right-0';

        containerHand.id = `handle-${userId}`;
        containerHand.style.display = 'none';

        const hand = document.createElement('div');

        hand.innerHTML += svgHand;

        hand.className += 'text-blue-500 h-10 w-10';

        containerHand.appendChild(hand);

        divElVideo.appendChild(containerHand);

        call.on('stream', userVideoStream => {
          addVideoStream(divElVideo, newUserVideoElement, userVideoStream);
        });
        peers[userId] = call;
      });
    });

    subcribeUserDisconnect((err, userId) => {
      if (peers[userId]) {
        peers[userId].close();
        const elementDisconnected = document.getElementById(userId);
        if (elementDisconnected) {
          elementDisconnected.remove();
          if (gridCol < 3) {
            setGridCol(gridCol - 1);
          }
        }
      }
    });

    subcribeCreateMessage((err, authorName, message) => {
      addMessage({ authorName, message, position: 'left' });
    });

    subcribeToggleHandUp((err, userId, isHandUp) => {
      const handleUser = document.getElementById(`handle-${userId}`);
      if (isHandUp) {
        handleUser.style.display = 'block';
      } else {
        handleUser.style.display = 'none';
      }
    });
  }, [modal]);

  useEffect(() => {
    scrollChatToBottom();
  }, [chatMessages]);

  useEffect(() => {
    const gridVideo = gridVideoEl.current;
    switch (gridVideo.children.length) {
      case 0:
        setGridCol(0);
        break;
      case 1:
        setGridCol(1);
        break;
      case 2:
        setGridCol(2);
        break;

      default:
        setGridCol(3);
        break;
    }
  });

  const addMessage = useCallback(
    ({ authorName, message, position }: IChatMessage) => {
      setChatMessages(state => [...state, { authorName, message, position }]);
    },
    [],
  );

  const keyDownEnter = event => {
    if (event.which === 13) {
      handleSendMessage();
    }
  };

  const addVideoStream = (divElVideo, videoElement, stream) => {
    videoElement.srcObject = stream;
    videoElement.className += videoClasses;

    videoElement.addEventListener('loadedmetadata', async () => {
      await videoElement.play();
      const videoGridElement = gridVideoEl.current;

      videoGridElement.append(divElVideo);

      if (gridCol < 3) {
        setGridCol(gridCol + 1);
      }
    });
  };

  const handleSendMessage = () => {
    if (inputMessage.length > 0) {
      setChatMessages([
        ...chatMessages,
        { authorName: '', message: inputMessage, position: 'right' },
      ]);

      socketSendMessage(name, inputMessage);
      setInputMessage('');
    }
  };

  const scrollChatToBottom = () => {
    const windowsChat = document.getElementById('windows-chat');
    windowsChat.scrollTop = windowsChat.scrollHeight;
  };

  const handleMyHand = () => {
    const myId = myPeerId();
    handUp(myId, !myHandUp);
    return myHandUp ? setMyHandup(false) : setMyHandup(true);
  };

  return (
    <>
      <Container maxWidth="100%" height="100vh" p={2}>
        <Flex height="100%">
          <Box flex={1}>
            <Flex direction="column" height="100%">
              <Grid
                ref={gridVideoEl}
                flex={1}
                bgColor="black"
                gap={4}
                templateColumns={`repeat(${gridCol}, 1fr)`}
              >
                <div className="relative">
                  <video className={videoClasses} ref={myVideoEl}>
                    <track kind="captions" srcLang="pt-BR" />
                  </video>
                  {myHandUp && (
                    <div className="rounded-lg opacity-1 bg-white p-1 w-12 absolute bottom-0 right-0">
                      <svg
                        stroke="currentColor"
                        fill="currentColor"
                        strokeWidth="0"
                        viewBox="0 0 512 512"
                        className="text-blue-500"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M82.42 209.08c15.06-6.62 32.38 1.31 38.5 17.62L156 312h11.27V80c0-17.6 13.3-32 29.55-32 16.26 0 29.55 14.4 29.55 32v151.75l14.78.25V32c0-17.6 13.3-32 29.55-32 16.3 0 29.55 14.4 29.55 32v199.75L315 232V64c0-17.6 13.3-32 29.55-32 16.26 0 29.55 14.4 29.55 32v183.75l14.78.25V128c0-17.6 13.3-32 29.55-32C434.7 96 448 110.4 448 128v216c0 75.8-37.13 168-169 168-40.8 0-79.42-7-100.66-21a121.41 121.41 0 01-33.72-33.31 138 138 0 01-16-31.78L66.16 250.77c-6.11-16.31 1.2-35.06 16.26-41.69z" />
                      </svg>
                    </div>
                  )}
                </div>
              </Grid>
              <Flex width="100%" p={2} backgroundColor="white" justify="center">
                <Button
                  onClick={handleMyHand}
                  type="button"
                  _hover={{
                    border: 'blue',
                  }}
                  _focus={{ boxShadow: 'sm', outline: 'none' }}
                >
                  <Box
                    size="2rem"
                    color="blue.500"
                    as={myHandUp ? IoHandRightSharp : IoHandRightOutline}
                  />
                </Button>
              </Flex>
            </Flex>
          </Box>
          <Box width="20rem">
            <Flex direction="column" height="100%">
              <Center paddingY={2}>
                <Heading size="md" textAlign="center">
                  Chat
                </Heading>
              </Center>
              <Divider marginX={2} />
              <Box id="windows-chat" flex={1} overflowY="auto">
                <UnorderedList
                  marginLeft={0}
                  id="chat-list"
                  listStyleType="none"
                >
                  {chatMessages.map((chat, index) => (
                    <ListItem
                      key={index}
                      paddingX={3}
                      marginY={2}
                      textAlign={chat.position}
                    >
                      <Text as="p" fontSize="xs" fontWeight="bold">
                        {chat.authorName}
                      </Text>
                      <Text as="p">{chat.message}</Text>
                    </ListItem>
                  ))}
                </UnorderedList>
              </Box>
              <HStack spacing={0} alignContent="stretch">
                <Input
                  onKeyDown={keyDownEnter}
                  value={inputMessage}
                  textAlign="left"
                  fontSize="sm"
                  onChange={event => setInputMessage(event.target.value)}
                  placeholder="Escreva uma mensagem para todos"
                  boxShadow="md"
                  borderLeftRadius={0}
                  borderRightRadius={0}
                  size="lg"
                  _focus={{ boxShadow: 'sm' }}
                />
                <Button
                  size="lg"
                  boxShadow="md"
                  borderRightRadius={0}
                  borderLeftRadius={0}
                  colorScheme="blue"
                  onClick={handleSendMessage}
                  type="button"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-6 w-6 transform rotate-90"
                  >
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </Button>
              </HStack>
            </Flex>
          </Box>
        </Flex>
      </Container>
      <Modal
        isCentered
        closeOnOverlayClick={false}
        isOpen={modal}
        onClose={onClose}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Necessário nome de usuário</ModalHeader>
          <ModalBody pb={6}>
            <FormControl>
              <Input
                size="lg"
                value={name}
                placeholder="Insira seu nome"
                onChange={e => setName(e.target.value)}
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button onClick={enterRoom} colorScheme="green" mr={3}>
              Entrar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default RoomPage;
