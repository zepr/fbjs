package fr.zepr.fb;

import java.net.URI;

import org.assertj.core.api.Assertions;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.boot.context.embedded.LocalServerPort;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.test.context.junit4.SpringRunner;

import com.google.gson.Gson;

import fr.zepr.fb.arena.msg.ArenaAck;
import fr.zepr.fb.services.ArenaHandler.ArenaCommand;

@RunWith(SpringRunner.class)
@SpringBootTest(classes = FrozenBubble.class, webEnvironment = WebEnvironment.RANDOM_PORT)
public class TestArenaService {
	
	private final static long DEFAULT_TIMEOUT = 5000;
	
	@LocalServerPort
	private int port;
		
	@Test
	public void endpoint() throws Exception {
		
		Gson json = new Gson();
		TestClient client = new TestClient(
				new URI("ws://localhost:" + this.port + "/fb/multi/websocket/arena"));
		
		client.connect();

		// Connexion au service
		client.sendMessage("{\"cmd\":\"connect\",\"name\":\"Test\"}");
		ArenaAck connResponse = json.fromJson(client.readMessage(DEFAULT_TIMEOUT), ArenaAck.class);
		Assertions.assertThat(connResponse.getCommand()).isEqualTo(ArenaCommand.connect);
		Assertions.assertThat(connResponse.isSuccess()).isEqualTo(true);
		//String token = connResponse.getMessage();
		
		// Configuration d'une partie
		// La partie n'est pas encore creee => echec
		client.sendMessage("{\"cmd\":\"set\",\"title\":\"Partie de test\",\"color\":\"green\",\"chain\":true,\"robot\":true}");
		ArenaAck failConfigResponse = json.fromJson(client.readMessage(DEFAULT_TIMEOUT), ArenaAck.class);
		Assertions.assertThat(failConfigResponse.isSuccess()).isEqualTo(false);
				
		// Creation d'une partie (confirmation + update)
		client.sendMessage("{\"cmd\":\"own\",\"idx\":\"0\"}");
		ArenaAck ownResponse = json.fromJson(client.readMessage(DEFAULT_TIMEOUT), ArenaAck.class);
		Assertions.assertThat(ownResponse.getCommand()).isEqualTo(ArenaCommand.own);
		Assertions.assertThat(ownResponse.isSuccess()).isEqualTo(true);
				
		// En cas de succes, envoi de l'info globale de mise a jour
		String configResponse = client.readMessage(DEFAULT_TIMEOUT);
		Assertions.assertThat(configResponse).containsOnlyOnce("\"update\""); // Commande
		Assertions.assertThat(configResponse).containsOnlyOnce("\"config\""); // Partie a l'etat config
		Assertions.assertThat(configResponse).containsOnlyOnce("\"Test\""); // Nom du joueur
		
		// Configuration d'une partie (confirmation + update)
		client.sendMessage("{\"cmd\":\"set\",\"title\":\"Partie de test\",\"color\":\"green\",\"chain\":true,\"robot\":true}");
		ArenaAck setResponse = json.fromJson(client.readMessage(DEFAULT_TIMEOUT), ArenaAck.class);
		Assertions.assertThat(setResponse.getCommand()).isEqualTo(ArenaCommand.set);
		Assertions.assertThat(setResponse.isSuccess()).isEqualTo(true);
		
		// En cas de succes, envoi de l'info globale de mise a jour
		String updateResponse = client.readMessage(DEFAULT_TIMEOUT);
		Assertions.assertThat(updateResponse).containsOnlyOnce("\"update\""); // Commande
		Assertions.assertThat(updateResponse).containsOnlyOnce("\"join\""); // Partie a l'etat join
		Assertions.assertThat(updateResponse).containsOnlyOnce("\"Partie de test\""); // Titre
		Assertions.assertThat(updateResponse).containsOnlyOnce("\"Test\""); // Nom du joueur
				
		// Liste des parties 
		client.sendMessage("{\"cmd\":\"list\"}");
		String listResponse = client.readMessage(DEFAULT_TIMEOUT);
		Assertions.assertThat(listResponse).containsOnlyOnce("\"list\""); // Commande
		Assertions.assertThat(listResponse).containsOnlyOnce("\"join\""); // Partie a l'etat join
		Assertions.assertThat(listResponse).containsOnlyOnce("\"Partie de test\""); // Titre
		Assertions.assertThat(listResponse).containsOnlyOnce("\"Test\""); // Nom du joueur

		// Sortie (confirmation + update)
		client.sendMessage("{\"cmd\":\"dismiss\"}");
		ArenaAck dismissResponse = json.fromJson(client.readMessage(DEFAULT_TIMEOUT), ArenaAck.class);		
		Assertions.assertThat(dismissResponse.getCommand()).isEqualTo(ArenaCommand.dismiss);
		Assertions.assertThat(dismissResponse.isSuccess()).isEqualTo(true);
		
		// En cas de succes, envoi de l'info globale de mise a jour
		String update2Response = client.readMessage(DEFAULT_TIMEOUT);
		Assertions.assertThat(update2Response).containsOnlyOnce("\"update\""); // Commande
		Assertions.assertThat(update2Response).containsOnlyOnce("\"empty\""); // Partie a l'etat empty
		Assertions.assertThat(update2Response).doesNotContain("\"Partie de test\""); // Titre
		Assertions.assertThat(update2Response).doesNotContain("\"Test\""); // Nom du joueur
		
		
		// Liste des parties
		client.sendMessage("{\"cmd\":\"list\"}");
		String list2Response = client.readMessage(DEFAULT_TIMEOUT);
		Assertions.assertThat(list2Response).containsOnlyOnce("\"list\""); // Commande
		Assertions.assertThat(list2Response).doesNotContain("\"join\""); // Partie a l'etat join
		Assertions.assertThat(list2Response).doesNotContain("\"Partie de test\""); // Titre
		Assertions.assertThat(list2Response).doesNotContain("\"Test\""); // Nom du joueur		
	}	
}
