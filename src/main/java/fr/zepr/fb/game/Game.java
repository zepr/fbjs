package fr.zepr.fb.game;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import fr.zepr.fb.player.Player;
import fr.zepr.fb.services.GameSession;

public class Game {
	
	// XXX Ajout id?
	
	private String name;
	
	/** All players */
	private List<Player> players;
	/** Players still connected (cpu is never connected) */
	private Map<Player, GameSession> connected;
	/** Players still playing */
	private List<Player> remainingPlayers;
	
	private int currentBubble;
	private int nextBubble;
	private String[] pattern;
	
	private boolean started;
	private boolean chainReaction;
	
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	public List<Player> getPlayers() {
		return players;
	}
	public void setPlayers(List<Player> players) {
		this.players = players;
		this.remainingPlayers = new ArrayList<>(players);
	}
	public Map<Player, GameSession> getConnected() {
		return connected;
	}
	public void setConnected(Map<Player, GameSession> connected) {
		this.connected = connected;
	}
	
	public Player getOwner() {
		Player owner = null;
		if (players != null) {
			owner = players.get(0);
		}
		
		return owner;
	}
	
	public int getCurrentBubble() {
		return currentBubble;
	}
	public void setCurrentBubble(int currentBubble) {
		this.currentBubble = currentBubble;
	}
	public int getNextBubble() {
		return nextBubble;
	}
	public void setNextBubble(int nextBubble) {
		this.nextBubble = nextBubble;
	}
	public String[] getPattern() {
		return pattern;
	}
	public void setPattern(String[] pattern) {
		this.pattern = pattern;
	}
	public boolean isStarted() {
		return started;
	}
	public void setStarted(boolean started) {
		this.started = started;
	}		
	public List<Player> getRemainingPlayers() {
		return remainingPlayers;
	}
	public boolean isChainReaction() {
		return chainReaction;
	}
	public void setChainReaction(boolean chainReaction) {
		this.chainReaction = chainReaction;
	}
}
