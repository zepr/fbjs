package fr.zepr.fb.game.msg;

import com.google.gson.annotations.SerializedName;

import fr.zepr.fb.services.GameHandler.GameCommand;

public class GameRequest {
	private String type;
	@SerializedName("cmd")
	private GameCommand command;
	private String token;
	
	public String getType() {
		return type;
	}
	public void setType(String type) {
		this.type = type;
	}
	public GameCommand getCommand() {
		return command;
	}
	public void setCommand(GameCommand command) {
		this.command = command;
	}
	public String getToken() {
		return token;
	}
	public void setToken(String token) {
		this.token = token;
	}
}
