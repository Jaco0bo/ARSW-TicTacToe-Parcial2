package com.example.demo.controllers;

import com.example.demo.models.MoveRequest;
import com.example.demo.services.RoomService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class GameWsController {
    private final RoomService roomService;
    private final SimpMessagingTemplate broker;

    public GameWsController(RoomService rs, SimpMessagingTemplate tmpl){
        this.roomService = rs;
        this.broker = tmpl;
    }

    @MessageMapping("/move")
    public void onMove(MoveRequest move){
        var state = roomService.applyMove(move);
        broker.convertAndSend("/topic/rooms/" + state.getRoomId(), state);
    }

}
