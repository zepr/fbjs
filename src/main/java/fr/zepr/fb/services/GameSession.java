package fr.zepr.fb.services;

import java.util.List;

import org.springframework.web.socket.WebSocketSession;

import fr.zepr.fb.game.Game;
import fr.zepr.fb.player.Player;

public class GameSession {
	/** Session still open */
	private volatile boolean activeSession;
	/** Player associated to this arena */
	private Player player;
	/** Current game */
	private Game game;
	/** Declared opponents */
	private List<GameSession> opponents;
	/** Arena session of user */
	private WebSocketSession session;
	public boolean isActiveSession() {
		return activeSession;
	}
	public void setActiveSession(boolean activeSession) {
		this.activeSession = activeSession;
	}
	public Player getPlayer() {
		return player;
	}
	public void setPlayer(Player player) {
		this.player = player;
	}
	public Game getGame() {
		return game;
	}
	public void setGame(Game game) {
		this.game = game;
	}
	public List<GameSession> getOpponents() {
		return opponents;
	}
	public void setOpponents(List<GameSession> opponents) {
		this.opponents = opponents;
	}
	public WebSocketSession getSession() {
		return session;
	}
	public void setSession(WebSocketSession session) {
		this.session = session;
	}
	@Override
	public int hashCode() {
		final int prime = 31;
		int result = 1;
		result = prime * result + (activeSession ? 1231 : 1237);
		result = prime * result + ((opponents == null) ? 0 : opponents.hashCode());
		result = prime * result + ((player == null) ? 0 : player.hashCode());
		result = prime * result + ((session == null) ? 0 : session.getId().hashCode());
		return result;
	}
	@Override
	public boolean equals(Object obj) {
		if (this == obj)
			return true;
		if (obj == null)
			return false;
		if (getClass() != obj.getClass())
			return false;
		GameSession other = (GameSession) obj;
		if (activeSession != other.activeSession)
			return false;
		if (game == null) {
			if (other.game != null)
				return false;
		}
		if (opponents == null) {
			if (other.opponents != null)
				return false;
		} else if (!opponents.equals(other.opponents))
			return false;
		if (player == null) {
			if (other.player != null)
				return false;
		} else if (!player.equals(other.player))
			return false;
		if (session == null) {
			if (other.session != null)
				return false;
		} else if (!session.getId().equals(other.session.getId()))
			return false;
		return true;
	}
}
