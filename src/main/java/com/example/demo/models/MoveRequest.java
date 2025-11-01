package com.example.demo.models;

import lombok.Data;

@Data
public class MoveRequest {
    private String roomId;
    private int index;
    private String player;
}
