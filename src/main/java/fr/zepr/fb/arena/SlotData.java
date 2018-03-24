package fr.zepr.fb.arena;

import java.util.List;

import fr.zepr.fb.arena.Slot.SlotState;

public class SlotData {
	private int id;
	private SlotState state;
	private String title;
	private String color;
	private List<String> players;
	
	public int getId() {
		return id;
	}
	public void setId(int id) {
		this.id = id;
	}
	public SlotState getState() {
		return state;
	}
	public void setState(SlotState state) {
		this.state = state;
	}
	public String getTitle() {
		return title;
	}
	public void setTitle(String title) {
		this.title = title;
	}
	public String getColor() {
		return color;
	}
	public void setColor(String color) {
		this.color = color;
	}
	public List<String> getPlayers() {
		return players;
	}
	public void setPlayers(List<String> players) {
		this.players = players;
	}
}
