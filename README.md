# fbjs 0.2 beta

Version javascript de [Frozen Bubble v2.2.0](http://www.frozen-bubble.org/).
Cette version est directement jouable [en ligne](https://zepr.fr/fb/). 
* Note : Il est conseillé d'avoir l'accélération matérielle activée dans le navigateur

## Notes de version

Poursuite de la réécriture. Cette version est maintenant très différente de la précédente version. La version alpha était utilisée pour tester différents concepts, elle n'embarquait que très peu de bibliothèques (Log4j et JUnit). Cette version utilise désormais Spring Boot, mais doit être considérée comme "Work in progress" :
* L'intégration avec Spring Boot n'est pas encore complète
* La gestion des mécanismes de synchronisation est à revoir entièrement
* Le refactoring des tests est incomplet, le package ne sera pas mis en ligne pour le moment

## Qu'est-ce que c'est?

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

Le serveur peut être démarré de plusieurs façons. Dans chaque cas, le jeu est accessible à l'adresse [http://localhost:8080](http://localhost:8080/).

### Maven - direct

Dans le répertoire du projet, exécuter

``` shell
mvn spring-boot:run
```

### Maven - fat jar

#### Construction du fat jar

Dans le répertoire du projet, exécuter

``` shell
mvn clean package
```

Cette commande permet de générer un jar `fbjs-<version>.jar` dans le répertoire de sortie

#### Exécution

Il suffit alors d'exécuter ce jar

``` shell
java -jar fbjs-<version>.jar
```

### Docker

Un fichier dockerfile est présent à la racine du projet. Il reconstruit le serveur à partir des sources [github.com](https://github.com/zepr/fbjs).

#### Construction de l'image

Dans le répertoire du projet, exécuter

``` shell
docker build -t fbjs .
```

#### Exécution

``` shell
docker run -t -i -p 8080:8080 fbjs
```

## Auteurs

| Auteur                     |                    Contribution |
| :------------------------- | -------------------------------:|
| Guillaume Cottenceau       | Concept, développement Perl/SDL |
| Alexis Younes              |                Design graphique |
| Matthias le Bidan (Matths) |                 Sons et musique |
| Amaury Amblard-Ladurantie  |                Design graphique |
| Caroline Vic               |            Logo "Gorfou badass" |
| Glenn Sanson               |        Développement JavaScript |
