import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DiscussionService } from './discussion.service';
import { UseGuards } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class DiscussionGateway {
  @WebSocketServer()
  server: Server;

  constructor(private discussionService: DiscussionService) {}

  @SubscribeMessage('joinInventory')
  handleJoinInventory(
    @MessageBody() data: { inventoryId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`inventory:${data.inventoryId}`);
    return { event: 'joined', data: { inventoryId: data.inventoryId } };
  }

  @SubscribeMessage('leaveInventory')
  handleLeaveInventory(
    @MessageBody() data: { inventoryId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`inventory:${data.inventoryId}`);
    return { event: 'left', data: { inventoryId: data.inventoryId } };
  }

  broadcastNewPost(inventoryId: string, post: any) {
    this.server.to(`inventory:${inventoryId}`).emit('newPost', post);
  }
}
