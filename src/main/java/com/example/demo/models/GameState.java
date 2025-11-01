package com.example.demo.models;

import lombok.Data;

import java.util.Arrays;

@Data
public class GameState {

    private String roomId;
    private final String[] squares = new String[9];
    private String next = "X";
    private boolean over = false;
    private int[] line = null;

    public GameState(String roomId){
        this.roomId = roomId;
        Arrays.fill(squares, null);
    }
}


