package fr.zepr.fb.game;

import java.util.List;
import java.util.Random;

import org.springframework.stereotype.Component;

import fr.zepr.fb.arena.Slot;
import fr.zepr.fb.player.Player;

@Component
public class GameManager {
	
	public enum Type { fb };
		
	public Game initGame(Type type, Slot slot) {
		// TODO : Integrer le type au slot
		// TODO : Passer game en interface, implementation FbGame
		
		Game game = new Game();

		// Name
		game.setName(slot.getTitle());
		
		// Players
		List<Player> players = slot.getPlayers();
		
		game.setPlayers(players);
		for (Player p : players) {
			p.setGame(game);
		}
		
		// Game-specific settings
		Random rand = new Random(System.currentTimeMillis());
		switch (type) {
			case fb:
				// Chain reaction
				game.setChainReaction(slot.isChainReaction());
				
				// First bubbles
				game.setCurrentBubble(rand.nextInt(8) + 1);
				game.setNextBubble(rand.nextInt(8) + 1);
				
				// pattern
				String[] pattern = new String[5];
				StringBuilder sb = new StringBuilder(8);
				
				for (int i = 0; i < pattern.length; i++) {
					for (int j = 0; j < 8 - (i & 1); j++) {
						sb.append(rand.nextInt(8) + 1);
					}
					pattern[i] = sb.toString();
					sb.setLength(0);
				}
				game.setPattern(pattern);
				
			break;
		}

		
		return game;		
	}	
}
