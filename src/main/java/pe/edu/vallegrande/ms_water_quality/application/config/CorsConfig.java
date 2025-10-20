package pe.edu.vallegrande.ms_water_quality.application.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

/**
 * Configuración global de CORS para el microservicio de calidad de agua
 */
@Configuration
public class CorsConfig {

     @Bean
     public CorsWebFilter corsWebFilter() {
          CorsConfiguration corsConfiguration = new CorsConfiguration();

          // Permitir todos los orígenes
          corsConfiguration.setAllowedOriginPatterns(Arrays.asList("*"));

          // Permitir todos los métodos HTTP
          corsConfiguration.setAllowedMethods(Arrays.asList(
                    "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"));

          // Permitir todos los headers
          corsConfiguration.setAllowedHeaders(Arrays.asList("*"));

          // Permitir credenciales
          corsConfiguration.setAllowCredentials(true);

          // Tiempo de cache para preflight requests
          corsConfiguration.setMaxAge(3600L);

          UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
          source.registerCorsConfiguration("/**", corsConfiguration);

          return new CorsWebFilter(source);
     }
}
