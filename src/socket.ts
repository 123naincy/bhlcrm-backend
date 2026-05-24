import { Server, Socket } from "socket.io";

let io: Server;

const onlineUsers: Record<
  string,
  string
> = {};

export const initSocket = (
  server: any
) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
      ],
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log(
      "Socket connected:",
      socket.id
    );

    socket.on(
      "register_user",
      (userId: string) => {
        onlineUsers[userId] =
          socket.id;

        console.log(
          "Registered user:",
          userId
        );
      }
    );

    socket.on("disconnect", () => {
      for (const userId in onlineUsers) {
        if (
          onlineUsers[userId] ===
          socket.id
        ) {
          delete onlineUsers[userId];
          break;
        }
      }

      console.log(
        "Socket disconnected:",
        socket.id
      );
    });
  });

  return io;
};

export const getIO = () => io;

export const getUserSocket = (
  userId: string
) => {
  return onlineUsers[userId];
};