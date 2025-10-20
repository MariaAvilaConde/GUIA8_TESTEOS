# Imagen base ligera con Jenkins LTS
FROM jenkins/jenkins:lts-jdk17

# Cambiar a root para poder instalar dependencias
USER root

# Instalar Maven y utilidades necesarias
RUN apt-get update && apt-get install -y \
    maven \
    git \
    curl \
    wget \
    unzip \
    sudo \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Crear grupo y usuario para Codespace (VS Code)
RUN usermod -aG sudo jenkins && echo "jenkins ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers

# Configurar variables de entorno
ENV MAVEN_HOME=/usr/share/maven
ENV PATH=$MAVEN_HOME/bin:$PATH
ENV JAVA_HOME=/opt/java/openjdk

# Configurar Jenkins para arrancar automáticamente
EXPOSE 8080

# Volver al usuario Jenkins por seguridad
USER jenkins

# Arranque estándar de Jenkins
ENTRYPOINT ["/usr/bin/tini", "--", "/usr/local/bin/jenkins.sh"]


# --- Comandos útiles ---
# docker build -t jenkins-maven-jdk17 .
# docker run -d -p 8080:8080 --name jenkins-maven-jdk17 jenkins-maven-jdk17
# docker exec -it jenkins-maven-jdk17 cat /var/jenkins_home/secrets/initialAdminPassword
