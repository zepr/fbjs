package fr.zepr.fb.arena.msg;

import com.google.gson.annotations.SerializedName;

import fr.zepr.fb.services.ArenaHandler.ArenaCommand;

public class ArenaRequest {
	
	@SerializedName("cmd")
	private ArenaCommand command;
	@SerializedName("name")
	private String username;
	@SerializedName("pass")
	private String password;
	@SerializedName("anon")
	private boolean anonymous;
	@SerializedName("idx")
	private String index;
	private String title;
	private String color;
	private boolean chain;
	private boolean robot;
	
	public ArenaCommand getCommand() {
		return command;
	}
	public void setCommand(ArenaCommand command) {
		this.command = command;
	}
	public String getUsername() {
		return username;
	}
	public void setUsername(String username) {
		this.username = username;
	}
	public String getPassword() {
		return password;
	}
	public void setPassword(String password) {
		this.password = password;
	}
	public boolean isAnonymous() {
		return anonymous;
	}
	public void setAnonymous(boolean anonymous) {
		this.anonymous = anonymous;
	}
	public String getIndex() {
		return index;
	}
	public void setIndex(String index) {
		this.index = index;
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
	public boolean isChain() {
		return chain;
	}
	public void setChain(boolean chain) {
		this.chain = chain;
	}
	public boolean isRobot() {
		return robot;
	}
	public void setRobot(boolean robot) {
		this.robot = robot;
	}	
}
