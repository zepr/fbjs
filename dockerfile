# A partir d'une image officielle Maven
FROM maven:3.5.3-jdk-8-slim

# installation des dependances
RUN apt-get update \
    && apt-get install -y --no-install-recommends wget unzip \
    && rm -rf /var/lib/apt/lists/*

# Recuperation du package frozen bubble
RUN wget -q https://github.com/zepr/fbjs/archive/master.zip -O /tmp/fbjs.zip \
    && unzip /tmp/fbjs.zip -d /tmp
    
# Generation du package
RUN cd /tmp/fbjs-master/ \
    && mvn clean package

# Positionnement
RUN mkdir /opt/fbjs \
    && mv /tmp/fbjs-master/target/*.jar /opt/fbjs/fbjs.jar

# Nettoyage
RUN rm -f /tmp/fbjs.zip \
    && rm -rf /tmp/fbjs

# Expose port
EXPOSE 8080

# Execution de fbjs
CMD java -jar /opt/fbjs/fbjs.jar
