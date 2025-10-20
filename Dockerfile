# Build and Runtime stage
FROM maven:3.8.7-eclipse-temurin-17 AS builder
WORKDIR /build

# Cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Build with minimal memory usage
COPY src ./src
RUN mvn clean package -DskipTests -B -Dmaven.test.skip=true -Dspring.profiles.active=prod

# Runtime stage
FROM eclipse-temurin:17.0.7_7-jre-alpine
WORKDIR /app

COPY --from=builder /build/target/*.jar app.jar

# More appropriate JVM settings for Spring Boot application
ENV JAVA_OPTS="\
-Xms64m \
-Xmx256m \
-XX:MaxMetaspaceSize=128m \
-XX:CompressedClassSpaceSize=32m \
-Xss512k \
-XX:MaxDirectMemorySize=32m \
-XX:+UseG1GC \
-XX:MaxGCPauseMillis=200 \
-XX:+UnlockExperimentalVMOptions \
-XX:+DisableExplicitGC \
-Djava.awt.headless=true \
-XX:TieredStopAtLevel=1"

EXPOSE 8087

# Un solo CMD usando JSON syntax
CMD ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]