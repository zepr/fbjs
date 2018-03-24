package fr.zepr.fb.arena.msg;

import com.google.gson.annotations.SerializedName;

import fr.zepr.fb.services.ArenaHandler.ArenaCommand;

public class ArenaResponse {
	
	@SerializedName("cmd")
	private ArenaCommand command;
	private Object payload;

	public ArenaCommand getCommand() {
		return command;
	}
	public void setCommand(ArenaCommand command) {
		this.command = command;
	}
	public Object getPayload() {
		return payload;
	}
	public void setPayload(Object payload) {
		this.payload = payload;
	}
}
