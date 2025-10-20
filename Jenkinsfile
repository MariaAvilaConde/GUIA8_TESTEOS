pipeline {
    agent any

    environment {
        // 🔐 Token configurado en Jenkins (Manage Jenkins → Credentials)
        SONAR_TOKEN = credentials('SONAR_TOKEN')

        // 🔑 Claves específicas de tu proyecto SonarCloud
        SONAR_PROJECT_KEY = 'MariaAvilaConde_GUIA8_TESTEOS'
        SONAR_ORG = 'MariaAvilaConde'
    }

    tools {
        jdk 'jdk17'
        maven 'Maven3'
    }

    stages {
        stage('Checkout') {
            steps {
                echo '📥 Clonando el repositorio...'
                checkout scm
            }
        }

        stage('Compile') {
            steps {
                echo '⚙️ Compilando el proyecto...'
                sh 'mvn clean compile'
            }
        }

        stage('Test & Coverage') {
            steps {
                echo '🧪 Ejecutando pruebas unitarias y generando cobertura...'
                sh 'mvn test jacoco:report'
            }
            post {
                always {
                    junit '**/target/surefire-reports/*.xml'
                }
            }
        }

        stage('SonarCloud Analysis') {
            steps {
                echo '🔍 Enviando análisis a SonarCloud...'
                withSonarQubeEnv('SonarCloud') {
                    sh """
                    mvn sonar:sonar \
                        -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                        -Dsonar.organization=${SONAR_ORG} \
                        -Dsonar.host.url=https://sonarcloud.io \
                        -Dsonar.login=${SONAR_TOKEN}
                    """
                }
            }
        }

        stage('Package') {
            steps {
                echo '📦 Empaquetando la aplicación...'
                sh 'mvn package -DskipTests'
            }
            post {
                success {
                    archiveArtifacts artifacts: 'target/*.jar', fingerprint: true
                }
            }
        }
    }

    post {
        always {
            echo '✅ Pipeline finalizado.'
        }
        success {
            echo '🎉 Build completado exitosamente.'
        }
        failure {
            echo '❌ Build fallido. Revisa los logs.'
        }
    }
}
