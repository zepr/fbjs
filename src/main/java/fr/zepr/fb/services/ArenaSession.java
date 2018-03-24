package fr.zepr.fb.services;

import org.springframework.web.socket.WebSocketSession;

import fr.zepr.fb.player.Player;

public class ArenaSession {
	/** Session still open */
	private volatile boolean activeSession;
	/** Player associated to this arena */
	private Player player;
	/** Current slot (-1 if not set) */
	private volatile int userSlot;
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
	public int getUserSlot() {
		return userSlot;
	}
	public void setUserSlot(int userSlot) {
		this.userSlot = userSlot;
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
		result = prime * result + ((player == null) ? 0 : player.hashCode());
		result = prime * result + ((session == null) ? 0 : session.getId().hashCode());
		result = prime * result + userSlot;
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
		ArenaSession other = (ArenaSession) obj;
		if (activeSession != other.activeSession)
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
		if (userSlot != other.userSlot)
			return false;
		return true;
	}
}
