package com.example.demo.services;

import com.example.demo.models.GameState;
import com.example.demo.models.MoveRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;


@Service
public class RoomService {
    public final Map<String, GameState> rooms = new ConcurrentHashMap<>();
    public final Map<String, List<String>> players = new ConcurrentHashMap<>();

    public synchronized GameState createRoom() {
        String id = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        GameState gs = new GameState(id);
        rooms.put(id, gs);
        players.put(id, new ArrayList<>());
        return gs;
    }
    public Optional<GameState> get (String roomId) {
        return Optional.ofNullable(rooms.get(roomId));
    }

    public synchronized String join(String roomId) {
        var list = players.get(roomId);
        if (list == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found");
        if (list.size() >= 2) throw new ResponseStatusException(HttpStatus.CONFLICT, "Room full");
        String role = list.isEmpty() ? "X" : "O";
        list.add(role);
        return role;
    }

    public synchronized GameState applyMove(MoveRequest m) {
        GameState gs = rooms.get(m.getRoomId());
        if (gs == null) throw new IllegalArgumentException("Room not found");
        if (gs.isOver()) return gs;
        if (!Objects.equals(gs.getNext(), m.getPlayer())) throw new IllegalStateException("Not your turn");
        if (m.getIndex() < 0 || m.getIndex() > 8 || gs.getSquares()[m.getIndex()] != null)
            throw new IllegalStateException("Invalid cell");

        gs.getSquares()[m.getIndex()] = m.getPlayer();
        int[][] lines = {{0,1,2},{3,4,5},{6,7,8},{0,3,6},{1,4,7},{2,5,8},{0,4,8},{2,4,6}};
        for (int[] L : lines) {
            String a = gs.getSquares()[L[0]], b = gs.getSquares()[L[1]], c = gs.getSquares()[L[2]];
            if (a != null && a.equals(b) && a.equals(c)) {
                gs.setOver(true); gs.setLine(L); gs.setNext(null);
                return gs;
            }
        }

        boolean full = Arrays.stream(gs.getSquares()).allMatch(Objects::nonNull);
        if (full) { gs.setOver(true); gs.setNext(null); return gs; }

        gs.setNext("X".equals(m.getPlayer()) ? "O" : "X");
        return gs;
    }

}
