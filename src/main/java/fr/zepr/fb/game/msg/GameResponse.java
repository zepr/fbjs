package fr.zepr.fb.game.msg;

import java.util.List;

import com.google.gson.annotations.SerializedName;

import fr.zepr.fb.player.Player;
import fr.zepr.fb.services.GameHandler.GameCommand;

public class GameResponse {
	@SerializedName("cmd")
	private GameCommand command;
	@SerializedName("chain")
	private boolean chainReaction;
	private List<Player> players;
	private int currentBall;
	private int nextBall;
	private String[] pattern;
	
	private String token;
	
	public GameCommand getCommand() {
		return command;
	}
	public void setCommand(GameCommand command) {
		this.command = command;
	}
	public boolean isChainReaction() {
		return chainReaction;
	}
	public void setChainReaction(boolean chainReaction) {
		this.chainReaction = chainReaction;
	}
	public List<Player> getPlayers() {
		return players;
	}
	public void setPlayers(List<Player> players) {
		this.players = players;
	}
	public int getCurrentBall() {
		return currentBall;
	}
	public void setCurrentBall(int currentBall) {
		this.currentBall = currentBall;
	}
	public int getNextBall() {
		return nextBall;
	}
	public void setNextBall(int nextBall) {
		this.nextBall = nextBall;
	}
	public String[] getPattern() {
		return pattern;
	}
	public void setPattern(String[] pattern) {
		this.pattern = pattern;
	}
	public String getToken() {
		return token;
	}
	public void setToken(String token) {
		this.token = token;
	}
}
