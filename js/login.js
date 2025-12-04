        // ===== CLASE PRINCIPAL DE AUTENTICACIÓN =====
        class AnimatedAuth {
            constructor() {
                this.auth = firebase.auth();
                this.db = firebase.firestore();
                this.eyeAnimator = new EyeAnimator();
                this.particleSystem = new ParticleSystem();
                this.toastManager = new ToastManager();
                this.init();
            }

            init() {
                this.setupEventListeners();
                console.log('🎯 Sistema de autenticación inicializado');
            }

            setupEventListeners() {
                document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
                document.getElementById('resetPassword').addEventListener('click', (e) => this.handlePasswordReset(e));
                this.auth.onAuthStateChanged((user) => this.handleAuthStateChange(user));
            }

            async handleLogin(e) {
                e.preventDefault();
                
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                const loginBtn = document.getElementById('loginBtn');
                const loginBtnText = document.getElementById('loginBtnText');
                const loadingSpinner = document.getElementById('loadingSpinner');

                // Mostrar loading
                loginBtn.disabled = true;
                loginBtnText.style.display = 'none';
                loadingSpinner.style.display = 'block';
                this.eyeAnimator.closeEyes();

                try {
                    await this.auth.signInWithEmailAndPassword(email, password);
                } catch (error) {
                    console.error('❌ Error de autenticación:', error);
                    
                    const errorMessages = {
                        'auth/user-not-found': 'Usuario no encontrado',
                        'auth/wrong-password': 'Contraseña incorrecta',
                        'auth/invalid-email': 'Email inválido',
                        'auth/too-many-requests': 'Demasiados intentos. Espera un momento',
                        'auth/invalid-credential': 'Credenciales inválidas'
                    };
                    
                    this.toastManager.showError(errorMessages[error.code] || 'Error al iniciar sesión');
                    this.eyeAnimator.openEyes();
                } finally {
                    loginBtn.disabled = false;
                    loginBtnText.style.display = 'block';
                    loadingSpinner.style.display = 'none';
                }
            }

            async handleAuthStateChange(user) {
                if (user) {
                    try {
                        const userDoc = await this.db.collection('usuarios').doc(user.uid).get();
                        
                        if (userDoc.exists) {
                            const userData = userDoc.data();
                            const userName = userData.nombre || user.displayName || 'Usuario';
                            const userGender = userData.genero || 'M';
                            const greeting = userGender === 'F' ? 'Bienvenida' : 'Bienvenido';
                            
                            this.toastManager.showWelcome(`${greeting} ${userName}`);
                            this.eyeAnimator.openEyes();
                            this.eyeAnimator.lookAt('right');
                            
                            setTimeout(() => {
                                window.location.href = '../view/dashboard.html';
                            }, 3000);
                        } else {
                            this.toastManager.showError('Usuario no autorizado en el sistema');
                            await this.auth.signOut();
                        }
                    } catch (error) {
                        console.error('❌ Error al obtener datos del usuario:', error);
                        this.toastManager.showError('Error al cargar datos del usuario');
                    }
                } else {
                    this.eyeAnimator.openEyes();
                }
            }

            async handlePasswordReset(e) {
                e.preventDefault();
                
                const email = prompt('Ingresa tu email para recuperar tu contraseña:');
                if (!email) return;
                
                try {
                    await this.auth.sendPasswordResetEmail(email);
                    this.toastManager.showWelcome('✓ Email de recuperación enviado');
                } catch (error) {
                    const errorMessages = {
                        'auth/user-not-found': 'No existe cuenta con ese email',
                        'auth/invalid-email': 'Email inválido',
                        'auth/too-many-requests': 'Demasiados intentos. Espera un momento'
                    };
                    this.toastManager.showError(errorMessages[error.code] || 'Error al enviar email');
                }
            }
        }

        // ===== SISTEMA DE PARTÍCULAS =====
        class ParticleSystem {
            constructor() {
                this.createParticles();
            }

            createParticles() {
                const particlesContainer = document.getElementById('particles');
                const particleCount = window.innerWidth < 768 ? 30 : 50;
                
                for (let i = 0; i < particleCount; i++) {
                    const particle = document.createElement('div');
                    particle.className = 'particle';
                    particle.style.left = Math.random() * 100 + '%';
                    particle.style.top = Math.random() * 100 + '%';
                    particle.style.animationDelay = Math.random() * 6 + 's';
                    particle.style.animationDuration = (4 + Math.random() * 4) + 's';
                    particlesContainer.appendChild(particle);
                }
            }
        }

        // ===== ANIMADOR DE OJOS =====
        class EyeAnimator {
            constructor() {
                this.leftPupil = document.getElementById('leftPupil');
                this.rightPupil = document.getElementById('rightPupil');
                this.leftEye = document.getElementById('leftEye');
                this.rightEye = document.getElementById('rightEye');
                
                this.setupEyeAnimation();
                this.startBlinking();
            }

            setupEyeAnimation() {
                const emailInput = document.getElementById('email');
                const passwordInput = document.getElementById('password');

                document.addEventListener('mousemove', (e) => {
                    if (!emailInput.matches(':focus') && !passwordInput.matches(':focus')) {
                        const mouseX = e.clientX / window.innerWidth;
                        const mouseY = e.clientY / window.innerHeight;
                        const pupilX = (mouseX - 0.5) * 15;
                        const pupilY = (mouseY - 0.5) * 15;
                        this.movePupils(pupilX, pupilY);
                    }
                });

                emailInput.addEventListener('focus', () => {
                    this.centerPupils();
                    this.openEyes();
                });

                passwordInput.addEventListener('focus', () => this.closeEyes());
                passwordInput.addEventListener('blur', () => this.openEyes());
            }

            movePupils(x, y) {
                if (this.leftPupil && this.rightPupil) {
                    this.leftPupil.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
                    this.rightPupil.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
                }
            }

            centerPupils() {
                this.movePupils(0, 0);
            }

            lookAt(direction) {
                const offset = direction === 'right' ? 10 : direction === 'left' ? -10 : 0;
                this.movePupils(offset, 0);
            }

            closeEyes() {
                this.leftEye.classList.add('closed');
                this.rightEye.classList.add('closed');
            }

            openEyes() {
                this.leftEye.classList.remove('closed', 'blink');
                this.rightEye.classList.remove('closed', 'blink');
            }

            blink() {
                if (!this.leftEye.classList.contains('closed')) {
                    this.leftEye.classList.add('blink');
                    this.rightEye.classList.add('blink');
                    setTimeout(() => {
                        this.leftEye.classList.remove('blink');
                        this.rightEye.classList.remove('blink');
                    }, 200);
                }
            }

            startBlinking() {
                setInterval(() => {
                    if (Math.random() < 0.3) {
                        this.blink();
                    }
                }, 3000);
            }
        }

        // ===== MANAGER DE TOASTS =====
        class ToastManager {
            constructor() {
                this.welcomeToast = document.getElementById('welcomeToast');
                this.errorToast = document.getElementById('errorToast');
                this.welcomeMessage = document.getElementById('welcomeMessage');
                this.errorMessage = document.getElementById('errorMessage');
            }

            showWelcome(message) {
                this.hideError();
                this.welcomeMessage.textContent = message;
                this.welcomeToast.classList.add('show');
                setTimeout(() => this.hideWelcome(), 4000);
            }

            showError(message) {
                this.hideWelcome();
                this.errorMessage.textContent = message;
                this.errorToast.classList.add('show');
                setTimeout(() => this.hideError(), 4000);
            }

            hideWelcome() {
                this.welcomeToast.classList.remove('show');
            }

            hideError() {
                this.errorToast.classList.remove('show');
            }
        }

        // ===== INICIALIZACIÓN =====
        window.addEventListener('DOMContentLoaded', () => {
            window.animatedAuth = new AnimatedAuth();
        });