# fbjs 0.2 beta
---

Version javascript de [Frozen Bubble v2.2.0](http://www.frozen-bubble.org/).
Cette version est directement jouable [en ligne](https://zepr.fr/fb/). 
* Note : Il est conseillé d'avoir l'accélération matérielle activée dans le navigateur

## Notes de version
---

Poursuite de la réécriture. Cette version est maintenant très différente de la précédente version. La version alpha était utilisée pour tester différents concepts, elle n'embarquait que très peu de bibliothèques (Log4j et JUnit). Cette version utilise désormais Spring Boot, mais doit être considérée comme "Work in progress" :
* L'intégration avec Spring Boot n'est pas encore complète
* La gestion des mécanismes de synchronisation est à revoir entièrement
* Le refactoring des tests est incomplet, le package ne sera pas mis en ligne pour le moment

## Qu'est-ce que c'est?
---

Frozen Bubble est un jeu de "match 3" : L'objectif est de regrouper 3 bulles ou plus de même couleur afin de les éliminer. 
Cette version propose différents modes

### Jeu solo

100 niveaux de difficulté progressive pour apprendre à maîtriser le jeu 

![Mode Solo](src/main/resources/static/fb_solo.jpg?raw=true "Mode Solo")

### Jeu local

A deux sur le même clavier ou seul contre l'ordinateur 

![Mode Local](src/main/resources/static/fb_local.jpg?raw=true "Mode Local")

### Jeu réseau

Le mode ultime, jusqu'à 5 joueurs en réseau

![Mode Réseau](src/main/resources/static/fb_multi.jpg?raw=true "Mode Réseau")

## Utilisation
---
Le serveur peut être démarré avec la commande Maven
```
mvn spring-boot:run
```
Le jeu est alors accessible à l'adresse [http://localhost:8080](http://localhost:8080/).

## Auteurs
---

|         |            |
| ------------- | -----:|
| Guillaume Cottenceau       | Concept, développement Perl/SDL |
| Alexis Younes              |                Design graphique |
| Matthias le Bidan (Matths) |                 Sons et musique |
| Amaury Amblard-Ladurantie  |                Design graphique |
| Caroline Vic               |            Logo "Gorfou badass" |
| Glenn Sanson               |        Développement JavaScript |
