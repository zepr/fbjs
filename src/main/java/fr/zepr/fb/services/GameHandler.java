package fr.zepr.fb.services;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.google.gson.Gson;

import fr.zepr.fb.arena.Arena;
import fr.zepr.fb.game.Game;
import fr.zepr.fb.game.msg.GameRequest;
import fr.zepr.fb.game.msg.GameResponse;
import fr.zepr.fb.player.Player;

@Component
public class GameHandler extends TextWebSocketHandler {

	private static final String SERVER_COMMAND = "srv::";
	
	private static final Logger logger = LoggerFactory.getLogger(GameHandler.class);
	
	public enum GameCommand {
		connect, config, start, disconnected, lost, victory
	}
	
	/** Thread-safe Json mapper */
	private Gson gson;	
	
	/** Arena instance */
	@Autowired
	private Arena arena;
	@Autowired
	private ArenaHandler arenaHandler;
	
	/** Sessions managed by handler */
	private Map<String, GameSession> sessions;
	

	public GameHandler() {
		gson = new Gson();
		sessions = new HashMap<>();
	}
	
	
	@Override
	public void handleTextMessage(WebSocketSession session, TextMessage message)
			throws InterruptedException, IOException {
		
		GameSession gameSession = sessions.get(session.getId()); 
		String payload = message.getPayload();
				
		logger.debug("[id={}] Reception du message >> {}", session.getId(), payload);

    	GameRequest request = null;
    	
    	// First level of filter
    	if (payload.contains(SERVER_COMMAND)) {
    		request = gson.fromJson(payload, GameRequest.class);
    	}
    	
    	// Real filtering
    	if (request != null && SERVER_COMMAND.equals(request.getType())) {
    		handleServerCommand(session, gameSession, request.getCommand(), request.getToken());
    	} else {
    		// Direct transfer
    		handleGameCommand(session, gameSession, message);
    	}
	}
	
	public void handleServerCommand(WebSocketSession session, GameSession gameSession, 
			GameCommand command, String token) {
		logger.debug("[id={}] Commande serveur ({})", session.getId(), command);
		
		switch (command) {
		case connect:
			onConnect(gameSession, token);
			break;
		case lost:
			onLost(gameSession, token);
			break;
		default:
			logger.error("[id={}] Commande serveur invalide ({}) - ignoree", session.getId(), command);
		}    			
	}
	
	public void handleGameCommand(WebSocketSession session, GameSession gameSession, TextMessage message) {
		logger.debug("[id={}] Envoi direct aux adversaires", session.getId());
		
		if (gameSession.getOpponents() == null) {
			
			Game game = gameSession.getGame();
			
			logger.debug("[id={}] Pas d'adversaire defini", session.getId());
			
    		synchronized (game) {
    			if (game.isStarted()) {
    				gameSession.setOpponents(new ArrayList<>());
        			for (GameSession user : game.getConnected().values()) {
        				if (user != gameSession) {
        					gameSession.getOpponents().add(user);
        				}
        			}
    			} else {
    				logger.error("[id={}] Game non demarre, message arrive trop tot", session.getId());
    			}
    		}
		} 
		
		if (gameSession.getOpponents() != null) {    			
			logger.debug("[id={}] {} adversaires definis", session.getId(), gameSession.getOpponents().size());    			
			for (GameSession user : gameSession.getOpponents()) {
				logger.debug("[id={}] Message envoye a {}", session.getId(), user.getPlayer().getName());
				sendMessage(user, message);
			}
		} 		
	}
	
	
	
	@Override
	public void afterConnectionEstablished(WebSocketSession session) throws Exception {
		GameSession gameSession = new GameSession();
		sessions.put(session.getId(), gameSession);
		
		gameSession.setSession(session);
		gameSession.setActiveSession(true);
	}
	
	@Override
	public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
		
		GameSession gameSession = sessions.remove(session.getId());
		
		Player player = gameSession.getPlayer();
		Game game = gameSession.getGame();
		
		logger.info("[id={}] Session fermee pour {}", session.getId(), player.getName());
    	
    	gameSession.setActiveSession(false);

    	// TODO : Supprimer les references a la partie en cours (Eviter fuite memoire)
    	if (game != null) {
	    	synchronized (game) {
	    		game.getConnected().remove(player);
	    		player.setGame(null);
	    	}
    	}
	}
	
	@Override
	public void handleTransportError(WebSocketSession session, Throwable exception) {
				
		logger.error("[id={}] Erreur de transport", session.getId(), exception);
		
		GameSession gameSession = sessions.get(session.getId());
		Player player = gameSession.getPlayer();
		Game game = gameSession.getGame();

		logger.info("[id={}] Joueur {} deconnecte", session.getId(), player.getName());
    	
    	// Player disconnected from game
    	
    	// Update game
    	if (player.equals(game.getOwner())) {
    		
    		logger.info("[id={}] Fin de partie (proprietaire deconnecte)", session.getId());
    		// Owner disconnected
    		// Close all sessions
   			for (GameSession user : game.getConnected().values()) {
   				try {
   					user.getSession().close();
   				} catch (IOException ioe) {
   					logger.info("[id={}] Erreur lors de la deconnexion (Peut etre normal)", user.getSession().getId(), ioe);
   				}
   			}
    	} else {
    		// Update status for remaining players
    		logger.info("id={}] Mise a jour du statut (perdu) pour les autres joueurs ({} connectes)", session.getId(), game.getConnected().size());
    		onLost(gameSession, getGameToken(player, game));
    		    		
    		GameResponse disconnectMsg = new GameResponse();
    		disconnectMsg.setCommand(GameCommand.disconnected);
    		disconnectMsg.setToken(player.getToken());
    		broadcastMessage(game.getConnected().values(), disconnectMsg);

   			try {
   				session.close();
   			} catch (IOException ioe) {
   				logger.info("[id={}] Erreur lors de la deconnexion (Peut etre normal)", session.getId(), ioe);
   			}
    	}
		
		
	}
	
	
	
    public void onConnect(GameSession session, String token) {
    	
    	Player player = arena.get(token).getPlayer();
    	session.setPlayer(player);
    	
    	if (player == null) {
    		logger.error("[id={}] Token {} inconnu", session.getSession().getId(), token);
    		return;
    	}
    	
    	logger.debug("[id={}] Connexion de {} (token {})", session.getSession().getId(), player.getName(), player.getToken());
    	
    	Game game = player.getGame();
    	session.setGame(game);

    	logger.debug("[id={}] Partie {}", session.getSession().getId(), game.getName());
    	    	
    	boolean complete;
    	
    	synchronized (game) {
    		
    		Map<Player, GameSession> connected = game.getConnected();
    		if (connected == null) {	
    			connected = new HashMap<>();
    			game.setConnected(connected);
    		}
    		
    		if (connected.containsKey(player)) {
    			logger.error("[id={}] Utilisateur {} deja connecte", session.getSession().getId(), player.getName());
    		} else {
    			connected.put(player, session);
    		}

    		int nbPlayers = 0;
    		// XXX Normalement, pas besoin de synchro sur players
    		for (Player p : game.getPlayers()) {
    			if (!p.isCpu()) {
    				nbPlayers++;
    			}
    		}
    		
    		complete = connected.size() == nbPlayers;
    	}
    	
    	// Game config
    	
    	GameResponse response = new GameResponse();
    	response.setCommand(GameCommand.config);
    	response.setChainReaction(game.isChainReaction());
    	response.setCurrentBall(game.getCurrentBubble());
    	response.setNextBall(game.getNextBubble());
    	response.setPattern(game.getPattern());
    	
    	List<Player> players = new ArrayList<>();
    	response.setPlayers(players);
    	
    	int idx = 1;
    	for (Player playerIn : game.getPlayers()) {
    		Player playerOut = new Player();
    		players.add(playerOut);
    		playerOut.setName(playerIn.getName());
    		playerOut.setToken("p" + Integer.valueOf(idx));
    		if (playerIn.equals(player)) {
    			playerOut.setType(Player.Type.player);
    		} else if (player.equals(game.getOwner()) && playerIn.isCpu()) {
    			playerOut.setType(Player.Type.cpu);
    		} else {
    			playerOut.setType(Player.Type.opponent);
    		}
    		idx++;
    	}
    	
    	sendMessage(session, response);
    	
    	if (complete) {
    		// Dispatch start message
    		GameResponse startMsg = new GameResponse();
    		startMsg.setCommand(GameCommand.start);
    		    		
    		synchronized (game) {
    			game.setStarted(true);
    			broadcastMessage(game.getConnected().values(), startMsg);
    		}
    	}
    	
    }
	
    /**
     * 
     * @param gameToken Token associated to a player in a specific game
     * @return player or null if token not found
     */
    private Player getPlayer(String gameToken, Game game) {
    	int idx = -1;
    	try {
    		idx = Integer.parseInt(gameToken.substring(1));
    		idx--;
    	} catch (Exception e) {
    		logger.error("Format de token invalide : {}", gameToken, e);
    	}
    	
    	List<Player> players = game.getPlayers();
    	if (idx >= 0 && players.size() > idx) {
    		return players.get(idx);
    	}
    	
    	return null;
    }    
    
    /**
     * 
     * @param player Player
     * @return game token associated with player or null if player not found
     */
    private String getGameToken(Player player, Game game) {
    	int idx = game.getPlayers().indexOf(player);
    	
    	if (idx > -1) {
    		return "p" + (idx + 1);
    	}
    	
    	return null;
    }
    
    public void onLost(GameSession session, String token) {
    	
    	boolean endOfGame = false;
    	Game game = session.getGame();
    	
    	synchronized (game) {
    		List<Player> remaining = game.getRemainingPlayers();
    		if (remaining.size() > 1) {
    			Player toRemove = getPlayer(token, game);
    			if (toRemove != null) {
    				remaining.remove(toRemove);
    			} else {
    	    		logger.error("[id={}] Token {} non trouve", session.getSession().getId(), token);    				
    			}
    			    			
    			endOfGame = remaining.size() == 1;
    		}
    		
    		// TODO : Voir pour sortir de la section synchronisee?
    		if (endOfGame) {
    			    			
    			GameResponse victoryMsg = new GameResponse();
    			victoryMsg.setCommand(GameCommand.victory);
    			victoryMsg.setToken(getGameToken(remaining.get(0), game));
    			broadcastMessage(game.getConnected().values(), victoryMsg);
    			
       			// Close slot
       			try {
       				ArenaSession arenaSession = game.getOwner().getArena();       				
       				arenaHandler.onDismiss(arenaSession, true);       				
       			} catch (Exception e) {
       				logger.error("[id={}] Echec de la fermeture du slot", session.getSession().getId(), e);
       			}
       			
       			// TODO : Operations de nettoyage
       			// Fermer slot, nettoyer ref / joueurs, ...
    		}
    	}    	
    }

    
    public void broadcastMessage(Collection<GameSession> sessions, GameResponse response) {
    	TextMessage message = new TextMessage(gson.toJson(response));
    	for (GameSession session : sessions) {
    		sendMessage(session, message);
    	}
    }
    
    
    public void sendMessage(GameSession session, GameResponse response) {
    	sendMessage(session, new TextMessage(gson.toJson(response)));
    }
    
	
    public void sendMessage(GameSession session, TextMessage message) {
    	
    	logger.debug("[id={}] Envoi du message {}", session.getSession().getId(), message.getPayload());
    	
    	try {
    		if (session.isActiveSession()) {
    			session.getSession().sendMessage(message);
	    	}
    	} catch (IOException ioe) {
    		// Correspond a un cas de deconnexion
    		logger.error("[id={}] Echec de l'envoi du message", session.getSession().getId(), ioe);
    	}    	
    }

}
