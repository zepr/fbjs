package fr.zepr.fb.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

import fr.zepr.fb.services.ArenaHandler;
import fr.zepr.fb.services.GameHandler;

@Configuration
@EnableWebSocket
public class WebSocketConfig  implements WebSocketConfigurer {
	
	@Autowired private ArenaHandler arenaHandler;
	@Autowired private GameHandler gameHandler;
	
	public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
		registry.addHandler(arenaHandler, "/fb/multi/websocket/arena");
		registry.addHandler(gameHandler, "/fb/multi/websocket/game");
	}
}
