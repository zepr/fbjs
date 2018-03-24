package fr.zepr.fb.arena;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.socket.TextMessage;

import fr.zepr.fb.player.Player;
import fr.zepr.fb.services.ArenaHandler;
import fr.zepr.fb.services.ArenaSession;

public class Slot {
	
	private static final Logger logger = LoggerFactory.getLogger(Slot.class);
	
	protected static final String[] FAMOUS_ROBOTS = {
		"Bender", "KITT", "ED-209", "T-800", "Gort", 
		"Johnny 5", "Robby", "Astro", "Bishop 341-B", "T-1000", 
		"HAL 9000", "Data", "Optimus Prime", "Megatron", "Gigolo Joe", 
		"Wall-E", "R2-D2", "C-3PO", "Mega Man", "Clank",
		"Marvin", "Maria", "GLaDOS", "Skynet", "SHODAN", "WOPR"
	};

	protected static final String[] ROBOTS_UNIVERSE = {
		"Futurama", "K2000", "RoboCop", "Terminator", "Le jour ou la Terre s'arreta",
		"Short-Circuit", "La planete interdite", "Astro le robot", "Alien", "Terminator 2",
		"2001 l'Odyssee de l'espace", "Star Trek", "Transformers", "Transformers", "A.I.",
		"Wall-E", "Star Wars", "Star Wars", "Mega Man", "Ratchet & Clank",
		"H2G2", "Metropolis", "Portal", "Terminator", "System Shock", "War Games"
	};
	
	/** Max number of players in a slot*/
	public static final int MAX_PLAYERS = 5;
	
	/** Slot id */ 
	private int id;
	
	/** Current state */
	private SlotState state;
	
	/** Current title */
	private String title;
	
	/** Current color */
	private String color;
	
	/** Chain reaction enabled */
	private boolean chain;
		
	/** Id of owner */
	private String owner;

	private List<ArenaSession> users;	
	
	/** Name of the robot */
	private String robot;
	
	
	public enum SlotState {
		empty, config, join, full, run
	}
	
	
	public Slot(int id) {
		this.id = id;
		state = SlotState.empty;
		users = new ArrayList<>();		
	}
	
	// XXX : Objet data nécessaire?
	// Voir pour compléter cet objet au fil de l'eau
	public synchronized SlotData getSlotData() {
		SlotData data = new SlotData();
		
		data.setId(id);
		data.setState(state);
		data.setTitle(title);
		if (SlotState.join.equals(state) || SlotState.full.equals(state) || SlotState.run.equals(state)) {
			data.setColor(color);
		}
		List<String> players = new ArrayList<>();
		synchronized (users) {
			for (ArenaSession user : users) {
				players.add(user.getPlayer().getName());
			}
		}
		if (robot != null) {
			players.add(1, robot); // Robot inserted at second position
		}
		data.setPlayers(players);
		
		return data;
	}
	
	
	public synchronized void takeOwnership(ArenaSession user) throws OpException {
		if (!SlotState.empty.equals(state)) {
			throw new OpException("Already taken");
		}
		
		state = SlotState.config;
		users.add(user);
		owner = user.getPlayer().getToken();
	}
	
	public synchronized void configure(String title, String color, boolean chain, boolean robot, ArenaSession user) throws OpException {
		if (!user.getPlayer().getToken().equals(owner)) {
			throw new OpException("Not owner");
		}
		
		if (SlotState.run.equals(state)) {
			throw new OpException("Can't configure a runnning game");
		}
		
		if (!SlotState.full.equals(state)) {
			state = SlotState.join;
		}		
				
		this.title = title;
		this.color = color;
		this.chain = chain;
		
		if (robot) {
			Random rand = new Random(System.currentTimeMillis());
			this.robot = FAMOUS_ROBOTS[rand.nextInt(FAMOUS_ROBOTS.length)];
		}
	}
	
	public synchronized void dismiss(ArenaSession user, boolean force) throws OpException {
		
		if (SlotState.run.equals(state) && !force) {
			throw new OpException("Can't leave running game");
		}
		
		if (user.getPlayer().getToken().equals(owner)) {
			state = SlotState.empty;
			this.title = null;
			this.owner = null;
			
			this.chain = false;
			this.robot = null;
			
			for (ArenaSession rem : users) {
				rem.setUserSlot(ArenaHandler.DEFAULT_USER_SLOT);
			}
			
			users.clear();
		} else {
			user.setUserSlot(ArenaHandler.DEFAULT_USER_SLOT);
			users.remove(user);
		}
	}
	
	
	public synchronized void join(ArenaSession user) throws OpException {
		if (user.getUserSlot() != -1) {
			throw new OpException("Connected to another slot");
		}
		
		if (SlotState.empty.equals(state) || SlotState.config.equals(state)) {
			throw new OpException("Can't join undefined slot");
		}
		
		if (SlotState.full.equals(state)) {
			throw new OpException("Full slot");
		}
		
		if (SlotState.run.equals(state)) {
			throw new OpException("Can't join a runnning game");
		}
		
		users.add(user);
		if (users.size() == MAX_PLAYERS || 
				(robot != null && users.size() == MAX_PLAYERS - 1)) {
			state = SlotState.full;
		}
	}
	
	public synchronized void start(ArenaSession user) throws OpException {
		if (!user.getPlayer().getToken().equals(owner)) {
			throw new OpException("Not owner");
		}
		
		if (!SlotState.join.equals(state) && !SlotState.full.equals(state)) {
			throw new OpException("Invalid state");
		}
		
		if (users.isEmpty() || (robot == null && users.size() < 2)) {
			throw new OpException("Not enough players");
		}
		
		state = SlotState.run;
	}
	
	
	public synchronized List<Player> getPlayers() {
		List<Player> gamePlayers = new ArrayList<>();
		
		for (ArenaSession c : users) {
			gamePlayers.add(c.getPlayer());
		}
		
		if (robot != null) {
			Player robotPlayer = new Player();
			robotPlayer.setCpu(true);
			robotPlayer.setName(robot);
			
			gamePlayers.add(1, robotPlayer);
		}
		
		return gamePlayers;
	}	
	
	
	/**
	 * Send message to everyone in slot
	 * @param message
	 * @param source
	 */
	public synchronized void broadcastMessage(String message) {
		broadcastMessage(message, null);
	}

	/**
	 * Send message to everyone in slot
	 * @param message
	 * @param source
	 */
	public synchronized void broadcastMessage(TextMessage message) {
		broadcastMessage(message, null);
	}
	
	
	/**
	 * Send message to everyone in slot except source (if set)
	 * @param message
	 * @param source
	 */
	public synchronized void broadcastMessage(String message, ArenaSession source) {
		broadcastMessage(new TextMessage(message), source);		
	}

	public synchronized void broadcastMessage(TextMessage message, ArenaSession source) {
				
		for (ArenaSession user : users) {
			if (user.isActiveSession() 
					&& (source == null || !user.equals(source))) {
				try {					
					user.getSession().sendMessage(message);
				} catch (Exception ioe) {
					logger.warn("Impossible de contacter le client [id={}]", user.getSession().getId(), ioe);
				}
			}
		}
	}
	
	
	
	// Accessors
	
	public String getTitle() {
		return title;
	}

	public boolean isChainReaction() {
		return chain;
	}
}
