package fr.zepr.fb.player;

import fr.zepr.fb.game.Game;
import fr.zepr.fb.services.ArenaSession;

public class Player {
	
	public enum Type { anon, auth, cpu, player, opponent }
	
	private String token;
	
	private String name;
	
	private Game game;
	
	private ArenaSession session;

	private Type type;
	
	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public Game getGame() {
		return game;
	}

	public void setGame(Game game) {
		this.game = game;
	}

	public String getToken() {
		return token;
	}

	public void setToken(String token) {
		this.token = token;
	}
	
	public boolean isCpu() {
		return Type.cpu.equals(type);
	}

	public void setCpu(boolean cpu) {
		if (cpu) {
			type = Type.cpu;
		} else {
			type = Type.anon;
		}
	}
	
	public ArenaSession getArena() {
		return session;
	}

	public void setArena(ArenaSession session) {
		this.session = session;
	}

	public Type getType() {
		return type;
	}

	public void setType(Type type) {
		this.type = type;
	}

	@Override
	public int hashCode() {
		final int prime = 31;
		int result = 1;
		result = prime * result + ((token == null) ? 0 : token.hashCode());
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
		Player other = (Player) obj;
		if (token == null) {
			if (other.token != null)
				return false;
		} else if (!token.equals(other.token))
			return false;
		return true;
	}
}
