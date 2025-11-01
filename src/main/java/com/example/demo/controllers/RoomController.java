package com.example.demo.controllers;

import com.example.demo.models.GameState;
import com.example.demo.services.RoomService;
import lombok.Data;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {
    private final RoomService roomService;
    public RoomController(RoomService rs){ this.roomService = rs; }

    @PostMapping
    public GameState create(){ return roomService.createRoom(); }

    @PostMapping("/{roomId}/join")
    public JoinResponse join(@PathVariable String roomId){
        if (roomId == null || roomId.isBlank() || "null".equalsIgnoreCase(roomId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "roomId inválido");
        }
        String role = roomService.join(roomId);
        return new JoinResponse(roomId, role);
    }

    @Data
    static class JoinResponse { private final String roomId; private final String role; }
}
