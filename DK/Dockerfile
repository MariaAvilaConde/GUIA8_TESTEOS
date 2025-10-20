FROM jenkins/jenkins:lts-jdk17

USER root

RUN apt-get update && apt-get install -y maven && apt-get clean && rm -rf /var/lib/apt/lists/*

USER jenkins

EXPOSE 8080

ENTRYPOINT ["/usr/bin/tini", "--", "/usr/local/bin/jenkins.sh"]



#docker build -t jenkins-maven-jdk17 .
#docker run -d -p 8080:8080 --name jenkins-maven-jdk17 jenkins-maven-jdk17
#docker exec -it jenkins-maven-jdk17 cat /var/jenkins_home/secrets/initialAdminPassword
