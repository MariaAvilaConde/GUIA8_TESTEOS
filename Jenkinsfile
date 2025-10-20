pipeline {
    agent any

    environment {
        // 🔐 Token configurado en Jenkins (Manage Jenkins → Credentials → Secret text con ID: SONAR_TOKEN)
        SONAR_TOKEN = credentials('SONAR_TOKEN')

        // 🔑 Claves exactas de tu proyecto SonarCloud
        SONAR_PROJECT_KEY = 'MariaAvilaConde_GUIA8_TESTEOS'
        SONAR_ORG = 'mariaavilaconde'  // ⚠️ En minúsculas, como aparece en tu URL de SonarCloud
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
                sh 'mvn -B clean compile'
            }
        }

        stage('Test & Coverage') {
            steps {
                echo '🧪 Ejecutando pruebas unitarias y generando cobertura...'
                sh 'mvn -B test jacoco:report'
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
                // ⚙️ "SonarCloud" debe coincidir con el nombre configurado en Jenkins > Manage Jenkins > Configure System > SonarQube servers
                withSonarQubeEnv('SonarCloud') {
                    sh """
                        mvn -B verify sonar:sonar \
                            -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                            -Dsonar.organization=${SONAR_ORG} \
                            -Dsonar.host.url=https://sonarcloud.io \
                            -Dsonar.login=${SONAR_TOKEN}
                    """
                }
            }
        }

        stage('Package') {
            when {
                expression { currentBuild.currentResult == 'SUCCESS' }
            }
            steps {
                echo '📦 Empaquetando la aplicación...'
                sh 'mvn -B package -DskipTests'
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
            echo '❌ Build fallido. Revisa los logs de SonarCloud o Maven.'
        }
    }
}
