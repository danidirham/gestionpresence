import { Link } from 'react-router-dom'
import '../styles/home.scss'

const Index = () => {
  return (
    <div className="home-page">
      <header>
        <div className="logo">
          <img src="/placeholder.svg" alt="Logo" />
          <h1>Gestion de Présence Intelligente</h1>
        </div>
        <nav>
          <ul>
            <li><a href="#features">Fonctionnalités</a></li>
            <li><a href="#how-it-works">Comment ça marche</a></li>
            <li><Link to="/login" className="login-btn">Connexion</Link></li>
          </ul>
        </nav>
      </header>

      <main>
        <section className="hero-section">
          <h2>Optimisez la gestion des présences avec reconnaissance faciale et alertes SMS en temps réel</h2>
          <p>
            Notre solution innovante utilise la reconnaissance faciale pour automatiser le suivi des présences et envoyer des alertes SMS en temps réel aux parents.
          </p>
          <div className="hero-buttons">
            <Link to="/login" className="primary-btn">Commencer</Link>
            <a href="#features" className="secondary-btn">En savoir plus</a>
          </div>
        </section>

        <section id="features" className="features-section">
          <div className="container">
            <h2>Fonctionnalités principales</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="icon-wrapper">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3>Reconnaissance faciale</h3>
                <p>Identifiez automatiquement les élèves et enregistrez leur présence en temps réel.</p>
              </div>

              <div className="feature-card">
                <div className="icon-wrapper">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3>Alertes SMS</h3>
                <p>Envoyez des notifications automatiques aux parents en cas d'absence.</p>
              </div>

              <div className="feature-card">
                <div className="icon-wrapper">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3>Statistiques détaillées</h3>
                <p>Analysez les tendances de présence avec des tableaux de bord intuitifs.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="how-it-works-section">
          <div className="container">
            <h2>Comment ça marche</h2>
            <div className="steps">
              <div className="step-item">
                <div className="step-number">1</div>
                <h3>Enregistrez les étudiants</h3>
                <p>Ajoutez les informations des étudiants et capturez leur visage pour la reconnaissance faciale.</p>
              </div>
              <div className="step-item">
                <div className="step-number">2</div>
                <h3>Configurez le système</h3>
                <p>Paramétrez les classes, les horaires et les règles de notification selon vos besoins.</p>
              </div>
              <div className="step-item">
                <div className="step-number">3</div>
                <h3>Utilisez la reconnaissance faciale</h3>
                <p>Identifiez automatiquement les étudiants à leur arrivée et enregistrez leur présence.</p>
              </div>
              <div className="step-item">
                <div className="step-number">4</div>
                <h3>Suivez les statistiques</h3>
                <p>Consultez les rapports détaillés et analysez les tendances de présence.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="cta-section">
          <div className="container">
            <h2>Prêt à transformer votre gestion des présences ?</h2>
            <p>
              Rejoignez les écoles qui utilisent notre solution pour simplifier leur quotidien et améliorer la communication avec les parents.
            </p>
            <Link to="/login" className="cta-button">Commencer maintenant</Link>
          </div>
        </section>
      </main>

      <footer>
        <div className="footer-content">
          <div className="footer-column">
            <h3>Gestion de Présence</h3>
            <p>Solution innovante pour la gestion des présences scolaires.</p>
          </div>
          <div className="footer-column">
            <h4>Liens rapides</h4>
            <ul>
              <li><a href="#">Accueil</a></li>
              <li><a href="#features">Fonctionnalités</a></li>
              <li><a href="#how-it-works">Comment ça marche</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>Légal</h4>
            <ul>
              <li><a href="#">Conditions d'utilisation</a></li>
              <li><a href="#">Politique de confidentialité</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>Contact</h4>
            <p>info@gestion-presence.com</p>
            <p>+33 1 23 45 67 89</p>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="copyright">
            <p>&copy; {new Date().getFullYear()} Gestion de Présence Intelligente. Tous droits réservés.</p>
          </div>
          <div className="social-links">
            <a href="#" aria-label="Facebook">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
              </svg>
            </a>
            <a href="#" aria-label="Twitter">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
              </svg>
            </a>
            <a href="#" aria-label="LinkedIn">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                <rect x="2" y="9" width="4" height="12"></rect>
                <circle cx="4" cy="4" r="2"></circle>
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Index
