# Build context is the backend/ folder (see render.yaml).

FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
# Dependencies first, so source-only changes reuse the cached layer.
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src ./src
RUN mvn -B -q -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd --system --create-home appuser
COPY --from=build /app/target/*.jar app.jar
USER appuser

# Tuned for a small (512 MB) instance. Override with the JAVA_OPTS environment variable.
ENV JAVA_OPTS="-Xmx320m -XX:+UseSerialGC -XX:TieredStopAtLevel=1"
# Render sets PORT; the app reads it through server.port.
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
