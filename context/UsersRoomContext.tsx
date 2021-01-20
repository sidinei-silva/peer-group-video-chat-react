import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

interface User {
  id: string;
  name: string;
}

interface Room {
  id: string | string[];
  users: User[];
}

interface addUserInRoomProps {
  roomId: string | string[];
  user: User;
}

interface removeUserInRoomProps {
  roomId: string | string[];
  userId: string;
}

interface getUsersByRoomProps {
  roomId: string | string[];
}

interface UsersRoomContextData {
  rooms: Room[];
  addUserInRoom(addUserInRoomParams: addUserInRoomProps): void;
  removeUserInRoom(removeUserInRoomParams: removeUserInRoomProps): void;
  getUsersByRoom(room: getUsersByRoomProps): User[] | [];
}

const UsersRoomContext = createContext<UsersRoomContextData>(
  {} as UsersRoomContextData,
);

const UsersRoomProvider: React.FC = ({ children }) => {
  const [rooms, setRooms] = useState<Room[]>([]);

  const addUserInRoom = useCallback(
    ({ roomId, user }: addUserInRoomProps) => {
      const roomExists = rooms.find(room => roomId === room.id);

      if (roomExists) {
        const userExists = roomExists.users.find(
          userCheck => user.id === userCheck.id,
        );

        if (!userExists) {
          setRooms(
            rooms.map(room =>
              roomId === room.id
                ? { id: room.id, users: [...room.users, user] }
                : room,
            ),
          );
        }
      } else {
        setRooms([...rooms, { id: roomId, users: [user] }]);
      }
    },
    [rooms],
  );

  const removeUserInRoom = useCallback(
    ({ roomId, userId }: removeUserInRoomProps) => {
      const roomExists = rooms.find(room => roomId === room.id);
      if (roomExists) {
        const userExistsIndex = roomExists.users.findIndex(
          userCheck => userId === userCheck.id,
        );

        roomExists.users.splice(userExistsIndex, 1);

        setRooms(rooms.map(room => (roomId === room.id ? roomExists : room)));
      }
    },
    [rooms],
  );

  const getUsersByRoom = useCallback(
    ({ roomId }: getUsersByRoomProps) => {
      const roomExists = rooms.find(room => roomId === room.id);

      return roomExists.users || [];
    },
    [rooms],
  );

  const value = useMemo(
    () => ({ rooms, addUserInRoom, removeUserInRoom, getUsersByRoom }),
    [rooms, addUserInRoom, removeUserInRoom, getUsersByRoom],
  );

  return (
    <UsersRoomContext.Provider value={value}>
      {children}
    </UsersRoomContext.Provider>
  );
};

function useUsersRoom(): UsersRoomContextData {
  const context = useContext(UsersRoomContext);

  if (!context) {
    throw new Error(`useUsersRoom must be used within a UsersRoomProvider`);
  }

  return context;
}

export { UsersRoomProvider, useUsersRoom };
