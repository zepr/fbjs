package fr.zepr.fb.services;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

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
import fr.zepr.fb.arena.OpException;
import fr.zepr.fb.arena.Slot;
import fr.zepr.fb.arena.msg.ArenaAck;
import fr.zepr.fb.arena.msg.ArenaRequest;
import fr.zepr.fb.arena.msg.ArenaResponse;
import fr.zepr.fb.game.GameManager;
import fr.zepr.fb.player.Player;

@Component
public class ArenaHandler extends TextWebSocketHandler {

	public static final String DEFAULT_USERNAME = "Anonymous";
	public static final int DEFAULT_USER_SLOT = -1;
		
	public static final String DEFAULT_TITLE = "Pas d'inspiration";
	
	private static final Logger logger = LoggerFactory.getLogger(ArenaHandler.class);
	
	public enum ArenaCommand {
		connect, auth, list, own, set, dismiss, join, update, start
	}
	
	/** Thread-safe Json mapper */
	private Gson gson;
	
	/** Arena instance */
	@Autowired private Arena arena;
	/** Manager instance */
	@Autowired private GameManager manager;
	/** Sessions managed by handler */
	Map<String, ArenaSession> sessions;
	
	
	public ArenaHandler() {
		gson = new Gson();		
		sessions = new HashMap<>();
	}
	
	@Override
	public void handleTextMessage(WebSocketSession session, TextMessage message)
			throws InterruptedException, IOException {
		
		ArenaSession arenaSession = sessions.get(session.getId());
		String payload = message.getPayload();
		
		logger.debug("[aid={}] Message >> {}", session.getId(), payload);
		    	
    	ArenaRequest json = gson.fromJson(payload, ArenaRequest.class);
    	
    	// Analyse
		switch (json.getCommand()) {
			case connect:
				onConnect(arenaSession, json.getUsername());
			break;
			case auth:
				onAuth(arenaSession, json.getUsername(),
						json.getPassword(),
						json.isAnonymous());
				onList();
			break;
			case list:
				onList();
			break;
			case own:
				onOwn(arenaSession, (String) json.getIndex());
			break;
			case set:
				onSet(arenaSession, json);
			break;
			case dismiss:
				onDismiss(arenaSession);
			break;
			case join:
				onJoin(arenaSession, json.getIndex());
			break;
			case start:
				onStart(arenaSession);
			break;
			case update:
				logger.error("[aid={}] Commande invalide [update]", session.getId());
			break;
		}
	}

	@Override
	public void afterConnectionEstablished(WebSocketSession session) throws Exception {

		ArenaSession arenaSession = new ArenaSession();
		sessions.put(session.getId(), arenaSession);
		
		arenaSession.setSession(session);
		
        Player player = new Player();
        player.setToken(UUID.randomUUID().toString());
        player.setArena(arenaSession);
        player.setName(DEFAULT_USERNAME);
        player.setType(Player.Type.anon);
        arenaSession.setPlayer(player);
        
        arenaSession.setActiveSession(true);
        arenaSession.setUserSlot(DEFAULT_USER_SLOT);
	}
	
	@Override
	public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
		
		logger.debug("[aid={}] Deconnexion", session.getId());
		
		ArenaSession arenaSession = sessions.remove(session.getId());
		
		arenaSession.setActiveSession(false);    	
    	arena.remove(arenaSession.getPlayer().getToken());
    	if (arenaSession.getUserSlot() != DEFAULT_USER_SLOT) {
    		onDismiss(arenaSession, true);
    	}
	}
	
	// TODO : Verifier comportement
	
	@Override
	public void handleTransportError(WebSocketSession session, Throwable exception) {
		
		// Correspond a un cas de deconnexion
		logger.error("[aid={}] Echec de communication", session.getId(), exception);
		
		try {
			session.close();
		} catch (Exception e) {
			// No action
			logger.info("[aid={}] Probleme rencontre a la fermeture du WebSocket", session.getId(), e);
		} 
	}
	
	
    private void onAuth(ArenaSession session, String username, String password, boolean anonymous) {
    	try {    		
    		if (username == null || username.length() < 2) {
    			throw new OpException("Aucun nom renseigné");
    		}
    		
    		if (!anonymous && !"password".equals(password)) {
    			throw new OpException("Echec de connexion");
    		}

    		session.getPlayer().setName(username);
    		sendAck(session, ArenaCommand.auth);
    		
    		// TODO Multicast si l'utilisateur est deja associe a une partie (Mise a jour des infos) 
    		
    	} catch (OpException oe) {
    		sendAck(session, ArenaCommand.auth, oe);
    	}
    }
    
    
    
    private void onList() {
    	arena.broadcastMessage(getResponse(ArenaCommand.list, arena.getArenaData()));
    }
    
    private void onConnect(ArenaSession session, String user) {
    	session.getPlayer().setName(user);
    	session.getPlayer().setType(Player.Type.anon);
    	
    	session.setUserSlot(DEFAULT_USER_SLOT);
    	
    	logger.info("[aid={}] Connexion de {}", session.getSession().getId(), user);
    	
   		arena.connect(session);
   		
   		sendAck(session, ArenaCommand.connect, true, session.getPlayer().getToken());
    }   
    
    private void onOwn(ArenaSession session, String id) {
    	
    	int slotId = -1;
    	
    	try {
    		slotId = Integer.parseInt(id);
    		Slot slot = arena.getSlot(slotId);
    		
    		slot.takeOwnership(session);
    		session.setUserSlot(slotId);
    		
    		sendAck(session, ArenaCommand.own);
    		
    		arena.broadcastMessage(getResponse(ArenaCommand.update, slot.getSlotData()));
    	} catch (OpException oe) {
    		logger.warn("[aid={}] Erreur lors de la prise de possession de {}", session.getSession().getId(), slotId, oe);
    		sendAck(session, ArenaCommand.own, oe);
    	} catch (NumberFormatException nfe) {
    		logger.error("[aid={}] Numero de slot invalide [{}]", session.getSession().getId(), id);
    	}
    }

    private void onSet(ArenaSession session, ArenaRequest request) {
    	
    	int slotId = session.getUserSlot();
    	
    	try {
	    	if (slotId == -1) {
	    		throw new OpException("Must join a slot");
	    	}
	    	
	    	if (request.getTitle() == null || "".equals(request.getTitle().trim())) {
	    		request.setTitle(DEFAULT_TITLE);
	    	}
	    	
	    	Slot slot = arena.getSlot(slotId);
	    	slot.configure(request.getTitle(), request.getColor(), request.isChain(), request.isRobot(), session);
	    	
	    	sendAck(session, ArenaCommand.set);
	    	
	    	arena.broadcastMessage(getResponse(ArenaCommand.update, slot.getSlotData()));
    	} catch (OpException oe) {
    		logger.warn("[aid={}] Erreur lors de la configuration du slot {}", session.getSession().getId(), slotId, oe);
    		sendAck(session, ArenaCommand.set, oe);
    	}
    }

    
    public void onDismiss(ArenaSession session) {
    	onDismiss(session, false);
    }
    
    public void onDismiss(ArenaSession session, boolean force) {
    	    	
    	int slotId = session.getUserSlot();
    			
		logger.info("[aid={}] Sortie du slot {}", session.getSession().getId(), slotId);
    	
    	try {
    		if (slotId == -1) {
	    		throw new OpException("Must join a slot");
	    	}
    		
    		Slot slot = arena.getSlot(slotId);
    		slot.dismiss(session, force);
	    	
    		if (session.isActiveSession()) {
    			sendAck(session, ArenaCommand.dismiss);
    		}

    		arena.broadcastMessage(getResponse(ArenaCommand.update, slot.getSlotData()));
    	} catch (OpException oe) {
    		logger.warn("[aid={}] Echec de sortie du slot {}", session.getSession().getId(), slotId, oe);
    		
    		if (session.isActiveSession()) {
    			sendAck(session, ArenaCommand.dismiss, oe);
    		}
    	}
    }
    
    public void onJoin(ArenaSession session, String id) {
    	
    	logger.info("[aid={}] Ajout au slot {}", session.getSession().getId(), id);
    	
    	try {
    		int slotId = Integer.parseInt(id);
    		
    		Slot slot = arena.getSlot(slotId);
    		slot.join(session);
    		session.setUserSlot(slotId);
	    	
	    	sendAck(session, ArenaCommand.join);
	    	
	    	arena.broadcastMessage(getResponse(ArenaCommand.update, slot.getSlotData()));
    	} catch (Exception e) {
    		logger.warn("[aid={}] Echec de l'ajout au slot {}", session.getSession().getId(), id, e);    		
    		sendAck(session, ArenaCommand.join, e);    		
    	}
    }
    
    public void onStart(ArenaSession session) {
    	int slotId = session.getUserSlot();
    	
    	logger.info("[aid={}] Lancement de la partie du slot {}", session.getSession().getId(), slotId);
    	
    	try {
    		Slot slot = arena.getSlot(slotId);
    		slot.start(session);
    		
    		manager.initGame(GameManager.Type.fb, slot);
    		
    		slot.broadcastMessage(getAck(ArenaCommand.start, true, null));
    		arena.broadcastMessage(getResponse(ArenaCommand.update, slot.getSlotData()));
    	} catch (Exception e) {
    		logger.warn("[aid={}] Echec de lancement de partie du slot {}", session.getSession().getId(), slotId, e);
    		sendAck(session, ArenaCommand.start, e);
    	}
    }
    
    
    
    public TextMessage getAck(ArenaCommand action, boolean success, String message) {
    	ArenaAck ack = new ArenaAck();
    	ack.setCommand(action);
    	ack.setSuccess(success);
    	ack.setMessage(message);

    	return new TextMessage(gson.toJson(ack));
    }
    
    public TextMessage getResponse(ArenaCommand action, Object payload) {
    	ArenaResponse response = new ArenaResponse();
    	response.setCommand(action);
    	response.setPayload(payload);
    	
    	return new TextMessage(gson.toJson(response));
    }
    
    public void sendAck(ArenaSession session, ArenaCommand action) {
    	sendAck(session, action, true, null);
    }
    
    public void sendAck(ArenaSession session, ArenaCommand action, Exception e) {
    	sendAck(session, action, false, e.getMessage());
    }
    
    public void sendAck(ArenaSession session, ArenaCommand action, boolean success, String message) {
    	ArenaAck ack = new ArenaAck();
    	ack.setCommand(action);
    	ack.setSuccess(success);
    	ack.setMessage(message);
    	
    	sendMessage(session, getAck(action, success, message));
    }
    
    public void sendMessage(ArenaSession session, TextMessage message) {
    	try {
    		synchronized (session) {
    			if (session.isActiveSession()) {
    				if (logger.isDebugEnabled()) {
    					logger.debug("[aid={}] Envoi du message >> {}", session.getSession().getId(), message.getPayload());
    				}
    				session.getSession().sendMessage(message);
	    		}
	    	}
    	} catch (IOException ioe) {
    		// Correspond a une deconnexion
    		logger.error("[aid={}] Echec de l'envoi de message", session.getSession().getId(), ioe);
    	}    	
    }
}
