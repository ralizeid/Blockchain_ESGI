import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../App.css';

/* ─── Navigation ────────────────────────────────────────── */
const SECTIONS = [
  { id: 'mentions',        label: 'Mentions Légales',             num: '01' },
  { id: 'cgu',             label: "CGU",                          num: '02' },
  { id: 'confidentialite', label: 'Politique de Confidentialité', num: '03' },
  { id: 'cookies',         label: 'Politique des Cookies',        num: '04' },
];

/* ─── Équipe ─────────────────────────────────────────────── */
const TEAM = [
  'Julien ATTARD',
  'Mohammed KADDOURI',
  'Ayman GAYES',
  'Rayan ALIZEID',
  'Aurélien LOGEAIS',
];

const CONTACT_EMAIL = 'certichain2026@gmail.com';

/* ─── Composant principal ────────────────────────────────── */
const LegalPage = () => {
  const [activeId, setActiveId] = useState('mentions');
  const observerRef = useRef(null);
  const location = useLocation();

  const scrollTo = useCallback((id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Scroll vers l'ancre hash au chargement (ex : /legal#cgu depuis le footer)
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash && SECTIONS.some((s) => s.id === hash)) {
      const t = setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setActiveId(hash);
        }
      }, 120);
      return () => clearTimeout(t);
    }
  }, [location.hash]);

  // IntersectionObserver pour suivi de section active au scroll
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
    );

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observerRef.current.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="legal-page">

      {/* ── En-tête de page ── */}
      <header className="legal-page-header">
        <p className="legal-page-header__eyebrow">CertiChain · ESGI 2025–2026</p>
        <h1 className="legal-page-header__title">Informations légales</h1>
        <p className="legal-page-header__sub">
          Mentions légales, conditions générales d'utilisation, politique de confidentialité
          et politique des cookies de la plateforme CertiChain.
        </p>
        <span className="legal-page-header__date">Dernière mise à jour : juin 2025</span>
      </header>

      {/* ── Layout 2 colonnes ── */}
      <div className="legal-layout">

        {/* ── Sidebar sticky ── */}
        <aside className="legal-sidebar" aria-label="Navigation des sections">
          <span className="legal-sidebar__label">Sommaire</span>

          {SECTIONS.map(({ id, label, num }) => (
            <button
              key={id}
              className={`legal-nav-link${activeId === id ? ' active' : ''}`}
              onClick={() => scrollTo(id)}
              aria-current={activeId === id ? 'true' : undefined}
            >
              <span className="legal-nav-link__num">{num}</span>
              <span>{label}</span>
            </button>
          ))}

          <div className="legal-sidebar__divider" />

          <Link to="/" className="legal-nav-link legal-nav-link--back">
            <svg
              className="legal-nav-link__back-icon"
              width="14" height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M8.75 2.625L4.375 7L8.75 11.375"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Retour accueil</span>
          </Link>
        </aside>

        {/* ── Contenu principal ── */}
        <main className="legal-content">

          {/* ════════════════════════════════
              01 · MENTIONS LÉGALES
              ════════════════════════════════ */}
          <section id="mentions" className="legal-section">
            <div className="legal-section__header">
              <span className="legal-section__num">01</span>
              <div>
                <h2 className="legal-section__title">Mentions Légales</h2>
                <span className="legal-section__ref">Art. L.111-1 LCEN</span>
              </div>
            </div>
            <div className="legal-section__body">

              <div className="legal-article">
                <h3 className="legal-h3">Éditeur du site</h3>
                <p className="legal-p">
                  Le site <strong>CertiChain</strong> est un projet académique de fin d'études réalisé
                  par des étudiants de l'<strong>ESGI</strong> (Filière Sécurité Informatique, 5ème année).
                </p>
                <p className="legal-p">Équipe projet :</p>
                <p className="legal-team-names">{TEAM.join(' · ')}</p>
                <div className="legal-callout">
                  Contact :{' '}
                  <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>
                    {CONTACT_EMAIL}
                  </a>
                </div>
              </div>

              <div className="legal-article">
                <h3 className="legal-h3">Hébergement</h3>
                <p className="legal-p">
                  L'application CertiChain est hébergée <strong>on-premise</strong> sur notre propre
                  infrastructure afin de garantir la maîtrise complète des données.
                </p>
                <ul className="legal-list">
                  <li>Machine Virtuelle <strong>Debian</strong> sur hyperviseur <strong>Proxmox</strong></li>
                  <li>Backend <strong>Django</strong> (API REST)</li>
                  <li>Frontend <strong>React</strong> (application SPA)</li>
                  <li>Nœud <strong>IPFS</strong> privé pour le stockage off-chain</li>
                  <li>Réseau blockchain : <strong>Polygon</strong></li>
                </ul>
                <p className="legal-p" style={{ marginTop: 10 }}>
                  Aucune donnée n'est transmise à des services cloud tiers (AWS, GCP, Azure).
                  Notre infrastructure est entièrement sous contrôle de l'équipe projet.
                </p>
              </div>

              <div className="legal-article">
                <h3 className="legal-h3">Propriété intellectuelle</h3>
                <p className="legal-p">
                  CertiChain est un projet académique. Le code source, les maquettes et la
                  documentation sont la propriété de l'équipe. Toute reproduction ou utilisation
                  commerciale sans autorisation explicite est interdite.
                </p>
              </div>

            </div>
          </section>

          {/* ════════════════════════════════
              02 · CGU
              ════════════════════════════════ */}
          <section id="cgu" className="legal-section">
            <div className="legal-section__header">
              <span className="legal-section__num">02</span>
              <div>
                <h2 className="legal-section__title">Conditions Générales d'Utilisation</h2>
                <span className="legal-section__ref">Version 1.0 · juin 2025</span>
              </div>
            </div>
            <div className="legal-section__body">

              <div className="legal-article">
                <h3 className="legal-h3">1. Objet</h3>
                <p className="legal-p">
                  CertiChain fournit une interface permettant aux établissements d'enseignement
                  d'émettre des diplômes sous forme de <strong>Soulbound Tokens (SBT)</strong> sur
                  le réseau <strong>Polygon</strong>, et aux recruteurs de vérifier ces diplômes via
                  un <strong>QR code</strong> ou un identifiant UUID.
                </p>
              </div>

              <div className="legal-article">
                <h3 className="legal-h3">2. Responsabilités de l'École (Émetteur)</h3>
                <p className="legal-p">
                  L'établissement garantit l'exactitude des informations saisies (nom, prénom,
                  mention, visuel du diplôme).
                </p>
                <div className="legal-callout legal-callout--warn">
                  La certification nécessite une signature cryptographique stricte. L'école est
                  l'<strong>unique responsable</strong> de la sécurité de sa clé privée (wallet
                  MetaMask). En cas de perte ou de compromission, CertiChain ne pourra pas
                  restaurer l'accès.
                </div>
                <ul className="legal-list" style={{ marginTop: 12 }}>
                  <li>Conservez votre clé privée MetaMask dans un gestionnaire de mots de passe sécurisé.</li>
                  <li>Ne partagez jamais votre clé privée, même avec l'équipe CertiChain.</li>
                  <li>Chaque signature de diplôme génère une transaction on-chain irréversible.</li>
                </ul>
              </div>

              <div className="legal-article">
                <h3 className="legal-h3">3. Responsabilités du Recruteur (Vérificateur)</h3>
                <p className="legal-p">
                  Le service de vérification est fourni à titre informatif. CertiChain garantit
                  l'<strong>intégrité cryptographique</strong> du document présenté par rapport à
                  son ancrage sur la blockchain, mais n'est pas responsable des décisions de
                  recrutement qui en découlent.
                </p>
                <p className="legal-p">
                  La vérification publique ne nécessite ni compte, ni wallet, ni installation.
                  Un simple scan du QR code ou la saisie de l'UUID suffit.
                </p>
              </div>

              <div className="legal-article">
                <h3 className="legal-h3">4. Disponibilité du service</h3>
                <p className="legal-p">
                  CertiChain est un projet académique. L'équipe s'efforce d'assurer la disponibilité
                  du service mais ne peut garantir une continuité en cas de maintenance ou de force
                  majeure. La preuve on-chain sur le réseau Polygon reste accessible indépendamment
                  de notre infrastructure.
                </p>
              </div>

            </div>
          </section>

          {/* ════════════════════════════════
              03 · POLITIQUE DE CONFIDENTIALITÉ
              ════════════════════════════════ */}
          <section id="confidentialite" className="legal-section">
            <div className="legal-section__header">
              <span className="legal-section__num">03</span>
              <div>
                <h2 className="legal-section__title">Politique de Confidentialité</h2>
                <span className="legal-section__ref">RGPD — UE 2016/679 · Privacy by Design (Art. 25)</span>
              </div>
            </div>
            <div className="legal-section__body">

              <div className="legal-article">
                <h3 className="legal-h3">1. Architecture et séparation des données</h3>
                <p className="legal-p">
                  Dans une démarche de <strong>Privacy by Design</strong>, CertiChain sépare le
                  stockage des données pour concilier technologie blockchain et respect du RGPD :
                </p>
                <div className="legal-arch-grid">
                  <div className="legal-arch-card">
                    <div className="legal-arch-card__label">Off-Chain · Stockage privé</div>
                    <div className="legal-arch-card__title">Nœud IPFS privé</div>
                    <ul className="legal-arch-card__items">
                      <li>Nom &amp; Prénom de l'étudiant</li>
                      <li>Mention / intitulé de formation</li>
                      <li>Visuel du diplôme (PDF / image)</li>
                      <li>Photo d'identité (anti-usurpation)</li>
                      <li>Email de l'étudiant</li>
                    </ul>
                  </div>
                  <div className="legal-arch-card">
                    <div className="legal-arch-card__label">On-Chain · Blockchain publique</div>
                    <div className="legal-arch-card__title">Réseau Polygon</div>
                    <ul className="legal-arch-card__items">
                      <li>Hash SHA-256 (empreinte anonyme)</li>
                      <li>CID IPFS du document</li>
                      <li>Adresse wallet de l'école</li>
                      <li>Date d'ancrage (timestamp)</li>
                    </ul>
                  </div>
                </div>
                <p className="legal-p">
                  <strong>Aucune donnée à caractère personnel n'est stockée sur la blockchain.</strong>{' '}
                  Seule l'empreinte cryptographique (hash) est inscrite de manière immuable sur Polygon.
                </p>
              </div>

              <div className="legal-article">
                <h3 className="legal-h3">2. Données collectées</h3>
                <p className="legal-p">
                  Pour les comptes établissements, CertiChain collecte les données suivantes :
                </p>
                <ul className="legal-list">
                  <li>Identifiant (username) et mot de passe haché (PBKDF2)</li>
                  <li>Adresse e-mail officielle de l'établissement et du rectorat</li>
                  <li>Adresses de portefeuilles Ethereum (MetaMask) — publiques par nature</li>
                  <li>Plan d'abonnement souscrit et date de souscription</li>
                  <li>Date et heure du consentement RGPD recueilli lors de l'inscription</li>
                  <li>Données des diplômes émis (stockées off-chain, cf. architecture ci-dessus)</li>
                </ul>
              </div>

              <div className="legal-article">
                <h3 className="legal-h3">3. Vos droits — Droit à l'effacement</h3>
                <p className="legal-p">
                  Conformément au RGPD, tout diplômé peut exercer son droit de rectification
                  ou d'effacement. Sur simple demande :
                </p>
                <ul className="legal-list">
                  <li>Le visuel et les données nominatives sont <strong>supprimés de notre nœud IPFS</strong>.</li>
                  <li>
                    L'empreinte sur la blockchain <strong>devient orpheline et indéchiffrable</strong>
                    — garantissant le droit à l'oubli conformément à l'Art. 17.3.b du RGPD.
                  </li>
                </ul>
                <div className="legal-callout">
                  Cette procédure est directement intégrée dans la plateforme. Le titulaire peut
                  l'exercer via son lien de vérification privé, après confirmation par code OTP
                  envoyé par email.
                </div>
                <p className="legal-p" style={{ marginTop: 12 }}>
                  Vous disposez également des droits suivants :
                </p>
                <ul className="legal-list">
                  <li><strong>Droit d'accès</strong> (Art. 15) — exportez toutes vos données depuis votre profil</li>
                  <li><strong>Droit à la portabilité</strong> (Art. 20) — données fournies en format JSON</li>
                  <li><strong>Droit de rectification</strong> (Art. 16) — contactez-nous à{' '}
                    <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: 'var(--primary)' }}>{CONTACT_EMAIL}</a>
                  </li>
                  <li><strong>Droit d'opposition</strong> (Art. 21) — contactez-nous à{' '}
                    <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: 'var(--primary)' }}>{CONTACT_EMAIL}</a>
                  </li>
                </ul>
              </div>

              <div className="legal-article">
                <h3 className="legal-h3">4. Base légale &amp; durée de conservation</h3>
                <p className="legal-p">
                  Le traitement est fondé sur le <strong>consentement explicite</strong> (Art. 6.1.a RGPD)
                  recueilli lors de l'inscription, et sur l'exécution d'un contrat de service (Art. 6.1.b).
                </p>
                <ul className="legal-list">
                  <li>Données du compte : conservées jusqu'à la suppression du compte</li>
                  <li>Diplômes en attente ou rejetés : supprimés lors de la suppression du compte</li>
                  <li>
                    Diplômes validés : données personnelles <strong>anonymisées</strong> à la suppression ;
                    la preuve blockchain (hash + tx) est maintenue (Art. 17.3.b RGPD)
                  </li>
                </ul>
              </div>

              <div className="legal-article">
                <h3 className="legal-h3">5. Sécurité</h3>
                <ul className="legal-list">
                  <li>Mots de passe stockés sous forme hachée (PBKDF2)</li>
                  <li>Clés privées blockchain jamais stockées dans le code source (variables d'environnement)</li>
                  <li>Communications chiffrées en transit (HTTPS en production)</li>
                  <li>Double validation cryptographique : signature école + signature rectorat</li>
                </ul>
                <p className="legal-p" style={{ marginTop: 12 }}>
                  Pour toute réclamation, vous pouvez contacter la CNIL :{' '}
                  <a href="https://www.cnil.fr" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>
                    www.cnil.fr
                  </a>
                </p>
              </div>

            </div>
          </section>

          {/* ════════════════════════════════
              04 · POLITIQUE DES COOKIES
              ════════════════════════════════ */}
          <section id="cookies" className="legal-section">
            <div className="legal-section__header">
              <span className="legal-section__num">04</span>
              <div>
                <h2 className="legal-section__title">Politique des Cookies</h2>
                <span className="legal-section__ref">Directive ePrivacy · Recommandations CNIL</span>
              </div>
            </div>
            <div className="legal-section__body">

              <div className="legal-article">
                <h3 className="legal-h3">1. Cookies techniques strictement nécessaires</h3>
                <p className="legal-p">
                  L'application CertiChain utilise exclusivement des cookies techniques nécessaires
                  au bon fonctionnement du site :
                </p>
                <ul className="legal-list">
                  <li>
                    <strong>Gestion des sessions</strong> — maintien de la connexion au tableau
                    de bord École (sessionStorage navigateur, durée : 12 heures)
                  </li>
                  <li>
                    <strong>Protection CSRF</strong> — cookie de sécurité généré par le backend
                    Django pour protéger les requêtes POST contre les attaques cross-site
                  </li>
                </ul>
                <p className="legal-p" style={{ marginTop: 10 }}>
                  Conformément aux directives de la CNIL, ces cookies fonctionnels ne requièrent
                  pas de consentement préalable (Art. 82 de la Loi Informatique &amp; Libertés).
                </p>
              </div>

              <div className="legal-article">
                <h3 className="legal-h3">2. Traceurs et marketing</h3>
                <p className="legal-p">
                  CertiChain ne collecte, ne traite et ne transmet aucune donnée à des fins
                  publicitaires ou analytiques :
                </p>
                <ul className="legal-list">
                  <li>Aucun cookie publicitaire (Google Ads, Facebook Pixel…)</li>
                  <li>Aucun traceur de réseaux sociaux (Twitter, LinkedIn, Instagram…)</li>
                  <li>Aucun outil d'analyse comportementale (Google Analytics, Matomo…)</li>
                  <li>Aucune donnée revendue à des tiers</li>
                </ul>
                <p className="legal-p" style={{ marginTop: 10 }}>
                  Aucune bannière de consentement aux cookies n'est affichée car aucun traceur
                  non-essentiel n'est utilisé. Votre navigation est entièrement privée.
                </p>
              </div>

              <div className="legal-article">
                <h3 className="legal-h3">3. Gestion et suppression</h3>
                <p className="legal-p">
                  Les cookies techniques peuvent être supprimés via les paramètres de votre
                  navigateur. La suppression des cookies de session entraînera simplement
                  la déconnexion de votre espace École, sans impact sur vos données ou diplômes.
                </p>
                <p className="legal-p">
                  Pour toute question sur la politique des cookies :{' '}
                  <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>
                    {CONTACT_EMAIL}
                  </a>
                </p>
              </div>

            </div>
          </section>

          {/* ── Note de bas de page ── */}
          <div className="legal-end-note">
            CertiChain est un <strong>projet académique ESGI 2025–2026</strong>.{' '}
            Questions légales :{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>
              {CONTACT_EMAIL}
            </a>
            {' '}·{' '}
            <a href="https://www.cnil.fr" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>
              CNIL
            </a>
          </div>

        </main>
      </div>
    </div>
  );
};

export default LegalPage;
