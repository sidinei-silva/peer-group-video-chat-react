/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable react/no-array-index-key */
import {
  Box,
  Button,
  Center,
  Divider,
  Flex,
  FormControl,
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
  VStack,
  Container,
  useToast,
  Spacer,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionIcon,
  AccordionPanel,
} from '@chakra-ui/react';
import { useRouter } from 'next/dist/client/router';
import React, { useRef, useEffect, useState, useCallback } from 'react';

import ReactDOM from 'react-dom';

import { IoHandRightOutline, IoHandRightSharp, IoEarth } from 'react-icons/io5';
import {
  MdScreenShare,
  MdStopScreenShare,
  MdVideocam,
  MdVideocamOff,
} from 'react-icons/md';
import { AiOutlineAudioMuted, AiOutlineAudio } from 'react-icons/ai';
import getConnectionDetails from '../services/getConnectionsDetails';
import { getMyMediaScreen, getMyMediaWebCam } from '../services/navegatorMedia';
import {
  myPeerId,
  openPeer,
  peerCall,
  peerRemoveAllEvents,
  showPeer,
  subscribeCall,
  subscribeError,
} from '../services/webpeers';
import {
  handUp,
  sendDisableCam,
  sendMute,
  socketIoRemoveAllEvents,
  socketSendMessage,
  socketSendNotification,
  subscribeCreateMessage,
  subscribeCreateNotification,
  subscribeRemoveSharedScreen,
  subscribeToggleHandUp,
  subscribeToggleMute,
  subscribeUserConnect,
  subscribeUserDisconnect,
  subscribeToggleCam,
  userStartTransmitting,
  userStopTransmitting,
} from '../services/websocket';

const peers = {};

interface IChatMessage {
  position: 'right' | 'left';
  authorName: string;
  message: string;
}

interface IUser {
  id: string;
  name: string;
  isMuted: boolean;
  isHandUp: boolean;
  isDisableCam: boolean;
}

interface debugConnectionProps {
  id: string;
  name: string;
}

interface IConnectionCadidate {
  localAddress: string;
  hostTypeCadidate: string;
  remoteAddress: string;
  remoteTypeCadidate: string;
  remoteId: string;
  remoteName: string;
}

const RoomPage: React.FC = () => {
  const toast = useToast();
  const myVideoEl = useRef(null);
  const myVideoInitialEl = useRef(null);
  const myStreamScreen = useRef(null);
  const refRemoteStreamScreen = useRef(null);
  const gridVideoEl = useRef(null);
  const [inputMessage, setInputMessage] = useState('');
  const [name, setName] = useState('');
  const [modal, setModal] = useState(true);
  const [myHandUp, setMyHandup] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDisableCam, setIsDisableCam] = useState(false);

  const [permissionCam, setPermissionCam] = useState(true);
  const [permissionMicrophone, setPermissionMicrophone] = useState(true);

  const [chatMessages, setChatMessages] = useState<IChatMessage[]>([]);

  const [transmittingScreen, setTransmittingScreen] = useState(false);
  const [remoteTransmittingScreen, setRemoteTransmittingScreen] = useState(
    false,
  );

  const [connectionsCadidates, setConnectionsCadidates] = useState<
    IConnectionCadidate[]
  >([]);

  const [users, setUsers] = useState<IUser[]>([]);

  const videoClasses = 'object-cover h-full w-full relative';
  const router = useRouter();
  const { room } = router.query;

  const { onClose } = useDisclosure();

  const btnRefStatsCandidate = React.useRef();
  const refBodyDrawerStatsCandidate = React.useRef();

  const {
    isOpen: isOpenStatsCandidate,
    onOpen: onOpenStatsCandidate,
    onClose: onCloseStatsCandidate,
  } = useDisclosure();

  const enterRoom = () => {
    if (room && modal && name.length > 0) {
      setModal(false);
      openPeer({ room, name });
      toast.closeAll();
      toast({
        description: 'Bem vindx a sala!',
        duration: 3000,
        isClosable: true,
        status: 'success',
        position: 'bottom-left',
      });
    }
  };

  useEffect(() => {
    if (!myVideoEl) {
      return;
    }
    getMyMediaWebCam((err, stream) => {
      if (!stream.getVideoTracks().length) {
        handleIsDisableCam();
        setPermissionCam(false);
      }

      const videoInitial = myVideoInitialEl.current;
      videoInitial.srcObject = stream;
      videoInitial.play();
      videoInitial.muted = true;

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

    peerRemoveAllEvents();
    socketIoRemoveAllEvents();

    subscribeCall((err, call) => {
      if (err) {
        console.log(err);
        socketSendNotification(err.message);
      }

      const { type: typeCall } = call.metadata;

      if (typeCall === 'webcam') {
        getMyMediaWebCam((errWebCam, stream) => {
          call.answer(stream);
          console.log(call);
          const { user: userCalling }: { user: IUser } = call.metadata;

          const divElVideo = document.createElement('div');
          divElVideo.className += 'relative';
          divElVideo.id = call.peer;

          const hostVideo = document.createElement('video');
          hostVideo.id = `video-${call.peer}`;

          const videoStatusElement = createVideoStatusElement({
            userId: call.peer,
            userName: userCalling.name,
          });

          ReactDOM.render(videoStatusElement, divElVideo);

          divElVideo.appendChild(hostVideo);

          peers[call.peer] = call;

          call.on('stream', userVideoStream => {
            addVideoStream(divElVideo, hostVideo, userVideoStream);
          });

          addUser({
            id: userCalling.id,
            name: userCalling.name,
            isHandUp: userCalling.isHandUp,
            isMuted: userCalling.isMuted,
            isDisableCam: userCalling.isDisableCam,
          });

          hostVideo.onloadedmetadata = () => {
            debugConnection({
              id: userCalling.id,
              name: userCalling.name,
            });
            changeHandsUpElementRemote(userCalling.id, userCalling.isHandUp);
            changeMuteElementRemote(userCalling.id, userCalling.isMuted);
            changeCamElementRemote(userCalling.id, userCalling.isDisableCam);
          };
        });
      }

      if (typeCall === 'shared-screen') {
        call.answer();

        const divElementScreenShared = refRemoteStreamScreen.current;

        const videoScreenShared = document.createElement('video');
        videoScreenShared.id = `screen-shared-${call.peer}`;
        videoScreenShared.muted = true;

        divElementScreenShared.appendChild(videoScreenShared);

        call.on('stream', screenStream => {
          videoScreenShared.srcObject = screenStream;
          videoScreenShared.autoplay = true;
          videoScreenShared.onloadedmetadata = async () => {
            divElementScreenShared.style.display = 'block';
          };
        });

        peers[call.peer] = call;
        setRemoteTransmittingScreen(true);
      }
    });

    subscribeUserConnect((err, userId, userName) => {
      if (err) {
        console.log(err);
        socketSendNotification(err.message);
      }

      getMyMediaWebCam((errWebCam, stream) => {
        // @ts-ignore
        const call = peerCall(
          userId,
          stream,
          {
            isDisableCam,
            isHandUp: myHandUp,
            isMuted,
            name,
            id: myPeerId(),
          },
          'webcam',
        );

        const divElVideo = document.createElement('div');
        divElVideo.className += 'relative';
        divElVideo.id = userId;

        const newUserVideoElement = document.createElement('video');
        newUserVideoElement.id = `video-${userId}`;

        const videoStatusElement = createVideoStatusElement({
          userId,
          userName,
        });

        ReactDOM.render(videoStatusElement, divElVideo);

        divElVideo.appendChild(newUserVideoElement);

        call.on('stream', userVideoStream => {
          addVideoStream(divElVideo, newUserVideoElement, userVideoStream);
        });

        addUser({
          id: userId,
          name: userName,
          isHandUp: myHandUp,
          isMuted,
          isDisableCam,
        });

        newUserVideoElement.onloadedmetadata = () => {
          debugConnection({
            id: userId,
            name: userName,
          });

          const srcObjectRemove: any = newUserVideoElement.srcObject;
          if (!srcObjectRemove.getVideoTracks().length) {
            changeCamElementRemote(userId, true);
          }
        };

        const videoElementScreenShared: any = document.getElementById(
          `screen-shared-${myPeerId()}`,
        );

        if (videoElementScreenShared) {
          const streamSharedScreen = videoElementScreenShared.srcObject;
          peerCall(userId, streamSharedScreen, null, 'shared-screen');
        }

        peers[userId] = call;
      });
    });

    subscribeUserDisconnect((err, userId) => {
      if (peers[userId]) {
        peers[userId].close();
        const elementDisconnected = document.getElementById(userId);
        if (elementDisconnected) {
          elementDisconnected.remove();

          const newUsers = users.filter(user => user.id !== userId);
          setUsers(newUsers);

          const newConnectionsCadidates = connectionsCadidates.filter(
            connectionCandidate => connectionCandidate.remoteId !== userId,
          );

          setConnectionsCadidates(newConnectionsCadidates);
        }
      }
    });

    subscribeCreateMessage((err, authorName, message) => {
      addMessage({ authorName, message, position: 'left' });
    });

    subscribeToggleHandUp((err, userId, isHandUp) => {
      changeHandsUpElementRemote(userId, isHandUp);
    });

    subscribeToggleMute((err, userId, isMutedParamns) => {
      changeMuteElementRemote(userId, isMutedParamns);
    });

    subscribeToggleCam((err, userId, isDisableCamParams) => {
      changeCamElementRemote(userId, isDisableCamParams);
    });

    subscribeCreateNotification((err, notification) => {
      toast.closeAll();
      toast({
        description: notification,
        duration: 3000,
        isClosable: true,
        position: 'bottom-left',
      });
    });

    subscribeError((err, errorPeer) => {
      // alert(`Ocorreu um erro com o peer: ${name}`);
      console.log(errorPeer);
    });

    subscribeRemoveSharedScreen((err, userId) => {
      removeSharedVideoScreen(userId);
      if (peers[userId]) {
        peers[userId].close();
      }
      setRemoteTransmittingScreen(false);
    });
  }, [modal, isMuted, myHandUp, users, isDisableCam]);

  const debugConnection = async (user: debugConnectionProps) => {
    const peer = showPeer();
    const peerConnectionNewUser = peer.connections[user.id][0].peerConnection;
    const connectionDetails = await getConnectionDetails(peerConnectionNewUser);
    addConnectionCadidate({
      localAddress: connectionDetails.LocalAddress,
      hostTypeCadidate: connectionDetails.LocalCandidateType,
      remoteAddress: connectionDetails.RemoteAddress,
      remoteId: user.id,
      remoteName: user.name,
      remoteTypeCadidate: connectionDetails.RemoteCandidateType,
    });
  };

  useEffect(() => {
    scrollChatToBottom();
  }, [chatMessages]);

  const addMessage = useCallback(
    ({ authorName, message, position }: IChatMessage) => {
      setChatMessages(state => [...state, { authorName, message, position }]);
    },
    [],
  );

  const addUser = (user: IUser) => {
    setUsers(state => [...state, user]);
  };

  const addConnectionCadidate = ({
    localAddress,
    hostTypeCadidate,
    remoteId,
    remoteAddress: remoteIp,
    remoteName,
    remoteTypeCadidate,
  }: IConnectionCadidate) => {
    setConnectionsCadidates(state => [
      ...state,
      {
        localAddress,
        hostTypeCadidate,
        remoteId,
        remoteAddress: remoteIp,
        remoteName,
        remoteTypeCadidate,
      },
    ]);
  };

  const keyDownEnter = event => {
    if (event.which === 13) {
      handleSendMessage();
    }
  };

  const addVideoStream = async (divElVideo, videoElement, stream) => {
    videoElement.srcObject = stream;
    videoElement.className += videoClasses;
    videoElement.autoplay = true;

    const videoGridElement = gridVideoEl.current;
    videoGridElement.append(divElVideo);
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

  const handleIsMuted = () => {
    const myId = myPeerId();
    sendMute(myId, !isMuted);
    return isMuted ? setIsMuted(false) : setIsMuted(true);
  };

  const handleIsDisableCam = () => {
    const myId = myPeerId();
    sendDisableCam(myId, !isDisableCam);

    const myVideoElement = myVideoEl.current;
    const streamMyVideo = myVideoElement.srcObject;

    if (streamMyVideo) {
      const videoTracks = streamMyVideo.getVideoTracks();
      videoTracks[0].enabled = isDisableCam;
    }

    if (!isDisableCam) {
      myVideoElement.style.display = 'none';
    } else {
      myVideoElement.style.display = 'block';
    }

    if (modal) {
      const videoInitial = myVideoInitialEl.current;

      if (!isDisableCam) {
        videoInitial.style.display = 'none';
      } else {
        videoInitial.style.display = 'block';
      }
    }

    return isDisableCam ? setIsDisableCam(false) : setIsDisableCam(true);
  };

  const createVideoStatusElement = ({ userId, userName }) => {
    return (
      <>
        <Flex
          id={`avatar-${userId}`}
          justify="center"
          alignItems="center"
          width="100%"
          height="100%"
          display="none"
        >
          <img
            style={{ borderRadius: '50%' }}
            src={`https://icotar.com/initials/${userName}.svg`}
            alt=""
          />
        </Flex>
        <HStack
          width="100%"
          position="absolute"
          bottom={0}
          right={0}
          padding="0.5rem"
          zIndex={2}
        >
          <Box backgroundColor="white" padding="0.25rem" borderRadius="0.5rem">
            <Text fontWeight="bold" id={`name-${userId}`}>
              {userName}
            </Text>
          </Box>
          <Spacer />
          <Box backgroundColor="white" borderRadius="0.5rem">
            <Box
              id={`handle-${userId}`}
              display="none"
              padding="0.25rem"
              size="3rem"
              color="#3182ce"
              as={IoHandRightSharp}
            />
          </Box>
          <Box backgroundColor="white" borderRadius="0.5rem">
            <Box
              id={`microphone-${userId}`}
              display="none"
              padding="0.25rem"
              size="3rem"
              color="#E53E3E"
              as={AiOutlineAudioMuted}
            />
          </Box>
        </HStack>
      </>
    );
  };

  const changeMuteElementRemote = (userId, isMutedParamns) => {
    const myPeer = showPeer();

    const mediaConnection = myPeer.connections[userId][0];

    mediaConnection.remoteStream.getAudioTracks()[0].enabled = !isMutedParamns;

    const mutedUser = document.getElementById(`microphone-${userId}`);

    if (isMutedParamns) {
      mutedUser.style.display = 'block';
    } else {
      mutedUser.style.display = 'none';
    }
  };

  const changeCamElementRemote = (userId, isDisableCamParamns) => {
    const myPeer = showPeer();

    const mediaConnection = myPeer.connections[userId][0];

    const remoteVideoTrack = mediaConnection.remoteStream.getVideoTracks();

    if (remoteVideoTrack.length) {
      remoteVideoTrack[0].enabled = !isDisableCamParamns;
    }

    const videoElementRemote = document.getElementById(`video-${userId}`);
    const avatarElementRemote = document.getElementById(`avatar-${userId}`);

    if (isDisableCamParamns) {
      videoElementRemote.style.display = 'none';
      avatarElementRemote.style.display = 'flex';
    } else {
      videoElementRemote.style.display = 'block';
      avatarElementRemote.style.display = 'none';
    }
  };

  const changeHandsUpElementRemote = (userId, isHandUp) => {
    const handleUser = document.getElementById(`handle-${userId}`);
    if (isHandUp) {
      handleUser.style.display = 'block';
    } else {
      handleUser.style.display = 'none';
    }
  };

  const handleTransmittingScreen = () => {
    const peer = showPeer();
    const connections = Object.keys(peer.connections);

    const myScreen = myStreamScreen.current;
    if (!transmittingScreen) {
      getMyMediaScreen((err, stream) => {
        myScreen.style.display = 'flex';

        const divElementScreenShared = refRemoteStreamScreen.current;
        const videoScreenShared = document.createElement('video');
        videoScreenShared.id = `screen-shared-${peer.id}`;
        videoScreenShared.muted = true;
        videoScreenShared.srcObject = stream;
        divElementScreenShared.appendChild(videoScreenShared);

        connections.forEach(idConnection => {
          peerCall(idConnection, stream, null, 'shared-screen');
        });

        stream.getVideoTracks()[0].onended = function () {
          userStopTransmitting();
          setTransmittingScreen(false);
        };

        setTransmittingScreen(true);
        userStartTransmitting();
      });
    } else {
      userStopTransmitting();

      myScreen.style.display = 'none';
      setTransmittingScreen(false);
    }
  };

  const removeSharedVideoScreen = peerId => {
    const myScreen = myStreamScreen.current;
    myScreen.style.display = 'none';
    const divElementScreenShared = refRemoteStreamScreen.current;
    divElementScreenShared.style.display = 'none';

    const videoElementScreenShared: any = document.getElementById(
      `screen-shared-${peerId}`,
    );

    if (videoElementScreenShared) {
      const tracks = videoElementScreenShared.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoElementScreenShared.srcObject = null;
      videoElementScreenShared.remove();
    }
  };

  return (
    <>
      <Container
        maxWidth="100%"
        height="100vh"
        p={2}
        display={modal ? 'none' : 'block'}
      >
        <Flex height="100%">
          <Box flex={1}>
            <Flex direction="column" height="100%">
              <VStack
                padding={4}
                alignSelf="center"
                backgroundColor="black"
                ref={myStreamScreen}
                height="300px"
                alignItems="center"
                justifyContent="center"
                width="100%"
                spacing={4}
                display="none"
              >
                <VStack spacing={1}>
                  <Box
                    padding={2}
                    size="4rem"
                    marginX={1}
                    color="blue.500"
                    as={MdScreenShare}
                  />
                  <Heading size="md" color="white" textAlign="center">
                    Você esta transmitindo
                  </Heading>
                </VStack>

                <Button
                  onClick={handleTransmittingScreen}
                  type="button"
                  _hover={{
                    border: 'blue',
                  }}
                  _focus={{ boxShadow: 'sm', outline: 'none' }}
                >
                  <span>Parar Transmissão</span>
                  <Box
                    size="2rem"
                    marginX={1}
                    color="red.500"
                    as={MdStopScreenShare}
                  />
                </Button>
              </VStack>
              <Grid
                ref={gridVideoEl}
                flex={1}
                bgColor="black"
                gap={4}
                gridTemplateColumns="repeat(auto-fit, minmax(200px,1fr))"
                gridTemplateRows="repeat(auto-fit, minmax(200px,1fr))"
                gridAutoRows="200px"
                gridAutoColumns="200px"
              >
                <GridItem
                  colSpan={4}
                  rowSpan={3}
                  ref={refRemoteStreamScreen}
                  display="none"
                />
                <div className="relative">
                  <Flex
                    justify="center"
                    alignItems="center"
                    width="100%"
                    height="100%"
                    display={!isDisableCam ? 'none' : 'flex'}
                  >
                    <img
                      style={{ borderRadius: '50%' }}
                      src={`https://icotar.com/initials/${name}.svg`}
                      alt=""
                    />
                  </Flex>
                  <video className={videoClasses} ref={myVideoEl}>
                    <track kind="captions" srcLang="pt-BR" />
                  </video>
                  <HStack
                    width="100%"
                    position="absolute"
                    bottom={0}
                    right={0}
                    padding={2}
                  >
                    <Box
                      backgroundColor="white"
                      padding="0.25rem"
                      borderRadius="0.5rem"
                    >
                      <Text fontWeight="bold">Me</Text>
                    </Box>
                    <Spacer />
                    {myHandUp && (
                      <Box backgroundColor="white" borderRadius="lg">
                        <Box
                          padding={1}
                          size="3rem"
                          color="blue.500"
                          as={IoHandRightSharp}
                        />
                      </Box>
                    )}
                    {isMuted && (
                      <Box backgroundColor="white" borderRadius="lg">
                        <Box
                          padding={1}
                          size="3rem"
                          color="red.500"
                          as={AiOutlineAudioMuted}
                        />
                      </Box>
                    )}
                  </HStack>
                </div>
              </Grid>
              <HStack
                width="100%"
                p={2}
                backgroundColor="white"
                justify="center"
              >
                <Button
                  ref={btnRefStatsCandidate}
                  onClick={onOpenStatsCandidate}
                  type="button"
                  _hover={{
                    border: 'blue',
                  }}
                  _focus={{ boxShadow: 'sm', outline: 'none' }}
                >
                  <Box size="2rem" color="blue.500" as={IoEarth} />
                </Button>
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

                <Button
                  onClick={handleIsMuted}
                  type="button"
                  _hover={{
                    border: 'blue',
                  }}
                  _focus={{ boxShadow: 'sm', outline: 'none' }}
                  disabled={!permissionMicrophone}
                >
                  <Box
                    size="2rem"
                    color={isMuted ? 'red.500' : 'blue.500'}
                    as={isMuted ? AiOutlineAudioMuted : AiOutlineAudio}
                  />
                </Button>

                <Button
                  onClick={handleIsDisableCam}
                  type="button"
                  _hover={{
                    border: 'blue',
                  }}
                  _focus={{ boxShadow: 'sm', outline: 'none' }}
                  disabled={!permissionCam}
                >
                  <Box
                    size="2rem"
                    color={isDisableCam ? 'red.500' : 'blue.500'}
                    as={isDisableCam ? MdVideocamOff : MdVideocam}
                  />
                </Button>

                <Button
                  disabled={remoteTransmittingScreen}
                  onClick={handleTransmittingScreen}
                  type="button"
                  _hover={{
                    border: 'blue',
                  }}
                  _focus={{ boxShadow: 'sm', outline: 'none' }}
                >
                  <Box
                    size="2rem"
                    color={transmittingScreen ? 'red.500' : 'blue.500'}
                    as={transmittingScreen ? MdStopScreenShare : MdScreenShare}
                  />
                </Button>
              </HStack>
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
            <VStack>
              <FormControl>
                <Input
                  size="lg"
                  value={name}
                  placeholder="Insira seu nome"
                  onChange={e => setName(e.target.value)}
                />
              </FormControl>
              <Box>
                <Flex
                  justify="center"
                  alignItems="center"
                  width="100%"
                  height="100%"
                  display={!isDisableCam ? 'none' : 'flex'}
                >
                  <img
                    style={{ borderRadius: '50%' }}
                    src={`https://icotar.com/initials/${name}.svg`}
                    alt=""
                  />
                </Flex>
                <video className={videoClasses} ref={myVideoInitialEl}>
                  <track kind="captions" srcLang="pt-BR" />
                </video>
                <HStack width="100%" p={2} backgroundColor="white">
                  <Button
                    onClick={handleIsMuted}
                    type="button"
                    _hover={{
                      border: 'blue',
                    }}
                    _focus={{ boxShadow: 'sm', outline: 'none' }}
                    disabled={!permissionMicrophone}
                  >
                    <Box
                      size="2rem"
                      color={isMuted ? 'red.500' : 'blue.500'}
                      as={isMuted ? AiOutlineAudioMuted : AiOutlineAudio}
                    />
                  </Button>

                  <Button
                    onClick={handleIsDisableCam}
                    type="button"
                    _hover={{
                      border: 'blue',
                    }}
                    _focus={{ boxShadow: 'sm', outline: 'none' }}
                    disabled={!permissionCam}
                  >
                    <Box
                      size="2rem"
                      color={isDisableCam ? 'red.500' : 'blue.500'}
                      as={isDisableCam ? MdVideocamOff : MdVideocam}
                    />
                  </Button>
                </HStack>
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button onClick={enterRoom} colorScheme="green" mr={3}>
              Entrar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Drawer
        isOpen={isOpenStatsCandidate}
        placement="left"
        onClose={onCloseStatsCandidate}
        finalFocusRef={btnRefStatsCandidate}
      >
        <DrawerOverlay>
          <DrawerContent>
            <DrawerHeader>Log de Conexão Candidata</DrawerHeader>

            <DrawerBody ref={refBodyDrawerStatsCandidate}>
              <Divider />
              <Accordion defaultIndex={[0]} allowMultiple>
                {connectionsCadidates.map(candidate => (
                  <AccordionItem
                    key={`connection-candidate-${candidate.remoteId}`}
                  >
                    <AccordionButton>
                      <Box flex="1" textAlign="left">
                        <Text as="span">Conectado com: </Text>
                        <Text as="span" fontWeight="bold">
                          {candidate.remoteName}
                        </Text>
                        <Text as="span" color="blue.500">
                          {candidate.remoteTypeCadidate === 'prflx' ||
                            (candidate.remoteTypeCadidate === 'relay' &&
                              ' - (Turn)')}
                          {candidate.remoteTypeCadidate === 'srflx' &&
                            ' - (Stun)'}

                          {candidate.remoteTypeCadidate === 'host' &&
                            '- (Host)'}

                          {candidate.remoteTypeCadidate === 'local' &&
                            ' - (Local)'}
                        </Text>
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                      <UnorderedList styleType="none">
                        <ListItem>
                          <VStack align="start">
                            <Box fontSize="sm">
                              <Text fontWeight="bold">Seu Ip:</Text>
                              <Text as="span">{candidate.localAddress}</Text>
                            </Box>
                            <Box fontSize="sm">
                              <Text fontWeight="bold">
                                Seu tipo de conexão:
                              </Text>
                              <Text as="span">
                                {candidate.hostTypeCadidate}
                              </Text>
                            </Box>
                            <Box fontSize="sm">
                              <Text fontWeight="bold">Id do convidado:</Text>
                              <Text as="span">{candidate.remoteId}</Text>
                            </Box>
                            <Box fontSize="sm">
                              <Text fontWeight="bold">Ip do convidado:</Text>
                              <Text as="span">{candidate.remoteAddress}</Text>
                            </Box>
                            <Box fontSize="sm">
                              <Text fontWeight="bold">
                                Tipo de conexão do convidado:
                              </Text>
                              <Text as="span">
                                {candidate.remoteTypeCadidate}
                              </Text>
                            </Box>
                          </VStack>
                        </ListItem>
                      </UnorderedList>
                    </AccordionPanel>
                  </AccordionItem>
                ))}
              </Accordion>
            </DrawerBody>

            <DrawerFooter>
              <Button variant="outline" mr={3} onClick={onCloseStatsCandidate}>
                Fechar
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </DrawerOverlay>
      </Drawer>
    </>
  );
};

export default RoomPage;
