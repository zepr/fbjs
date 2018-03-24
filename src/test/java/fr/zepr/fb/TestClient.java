package fr.zepr.fb;

import java.io.IOException;
import java.net.URI;
import java.util.ArrayList;
import java.util.List;

import javax.websocket.ClientEndpoint;
import javax.websocket.CloseReason;
import javax.websocket.ContainerProvider;
import javax.websocket.DeploymentException;
import javax.websocket.OnClose;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.WebSocketContainer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@ClientEndpoint
public class TestClient {
	
	private static final Logger logger = LoggerFactory.getLogger(TestClient.class);
	
	/** URI du serveur a tester */
	private URI uri;
	/** Session associee au client de test */
    private Session session;
    /** Messages en attente de lecture */
    private List<String> messages;
    
    public TestClient(URI uri) {
    	this.uri = uri;
    	messages = new ArrayList<String>();
    }
    
    public void connect() throws IOException, DeploymentException {
        WebSocketContainer container = ContainerProvider.getWebSocketContainer();
        container.connectToServer(this, uri);    	
    }
    
    @OnOpen
    public void onOpen(final Session session){
    	logger.debug("Connexion au serveur");
    	
        this.session = session;
    }
    
    @OnMessage
    public void onMessage(String message) {
    	
    	logger.debug("Reception du message : {}", message);
    	synchronized (session) {
    		messages.add(message);
    		session.notifyAll();
    	}
    }
    
    @OnClose
    public void onClose(Session userSession, CloseReason reason) {
    	logger.debug("Deconnexion du serveur");
    	
        this.session = null;
    }
    
    public void sendMessage(String message) {
    	logger.debug("Envoi du message : {}", message);
        session.getAsyncRemote().sendText(message);
    }
    
    
    
    public String readMessage(long timeout) throws InterruptedException, IOException {
    	
    	String message = null;
    	
    	synchronized (session) {
    		if (messages.size() == 0) {
    			session.wait(timeout);
    			
    			// TODO : A corriger, possibilite d'echec en cas de spurious wakeup
    			if (messages.size() == 0) {
    				logger.warn("Erreur de lecture de message");
    				throw new IOException("Aucun message recu dans le temps imparti");
    			}
    		}
    		
			message = messages.remove(0);
    	}
    	
    	return message;
    }
    
    
    public String[] readMessages(int size, long timeout) throws InterruptedException, IOException {
    	String[] output = new String[size];
    	int index = 0;
    	
    	while (index < output.length) {
    		output[index] = readMessage(timeout);
   			index++;
    	}
    	
    	return output;
    }
}
