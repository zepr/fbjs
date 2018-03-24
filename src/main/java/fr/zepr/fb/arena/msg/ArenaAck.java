package fr.zepr.fb.arena.msg;

import com.google.gson.annotations.SerializedName;

import fr.zepr.fb.services.ArenaHandler.ArenaCommand;

public class ArenaAck {
	
	@SerializedName("cmd")
	private ArenaCommand command;
	private boolean success;
	private String message;
	
	public ArenaCommand getCommand() {
		return command;
	}
	public void setCommand(ArenaCommand command) {
		this.command = command;
	}
	public boolean isSuccess() {
		return success;
	}
	public void setSuccess(boolean success) {
		this.success = success;
	}
	public String getMessage() {
		return message;
	}
	public void setMessage(String message) {
		this.message = message;
	}
}
