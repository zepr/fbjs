package fr.zepr.fb.arena;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;

import fr.zepr.fb.services.ArenaSession;

@Component 
public class Arena {
		
	private static final Logger logger = LoggerFactory.getLogger(Arena.class);
	
	private static final int NB_SLOTS = 12;
	
	private Map<String, ArenaSession> main;
	
	private Slot[] slots;
	
	// XXX : Temporaire, une seule instance avec nb de slots en dur
	public Arena() {
		main = new ConcurrentHashMap<>();
		
		slots = new Slot[NB_SLOTS];
		for (int i = 0; i < NB_SLOTS; i++) {
			slots[i] = new Slot(i);
		}
	}	
	
	public void connect(ArenaSession client) {
		main.put(client.getPlayer().getToken(), client);
	}
		
	public ArenaSession get(String id) {
		return main.get(id);
	}
	
	public void remove(String id) {
		main.remove(id);
	}
		
	public void broadcastMessage(TextMessage message) {
				
		for (ArenaSession client : main.values()) {
			if (client.isActiveSession()) {
				try {				
					client.getSession().sendMessage(message);
				} catch (IOException ioe) {
					logger.warn("Impossible de contacter le client [id={}]", client.getSession().getId(), ioe);
				}
			}					
		}
	}
		
	public List<SlotData> getArenaData() {
		List<SlotData> data = new ArrayList<>();
		for (Slot slot : slots) {
			data.add(slot.getSlotData());
		}
		return data;
	}
		
	public Slot getSlot(int id) {
		Slot slot = null;
		if (id >= 0 && id < slots.length) {
			slot = slots[id];
		} 
		return slot;
	}	
}
