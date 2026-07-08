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
                  <li>Machine virtuelle <strong>Debian</strong> sur hyperviseur <strong>Proxmox</strong></li>
                  <li>Backend <strong>Django</strong> (API REST) · Frontend <strong>React</strong> (SPA)</li>
                  <li>Stockage des fichiers hors chaîne, côté serveur</li>
                  <li>Blockchain : nœud EVM compatible <strong>Polygon</strong> (nœud Hardhat en développement/démonstration)</li>
                </ul>
                <p className="legal-p" style={{ marginTop: 10 }}>
                  Aucun hébergeur cloud tiers (AWS, GCP, Azure) n'est utilisé. L'application
                  s'appuie sur deux sous-traitants : <strong>Resend</strong> (envoi d'e-mails)
                  et <strong>Cloudflare</strong> (tunnel d'accès public).
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
                  CertiChain permet aux établissements d'émettre des diplômes sous forme
                  d'<strong>empreintes cryptographiques</strong> ancrées dans un registre
                  non-transférable sur une blockchain (compatible <strong>Polygon</strong>),
                  et aux recruteurs de les vérifier via un <strong>QR code</strong> ou un
                  identifiant UUID.
                </p>
              </div>

              <div className="legal-article">
                <h3 className="legal-h3">2. Responsabilités de l'École (Émetteur)</h3>
                <p className="legal-p">
                  L'établissement garantit l'exactitude des informations saisies. La
                  certification repose sur une <strong>double co-signature cryptographique</strong>{' '}
                  (école et rectorat).
                </p>
                <div className="legal-callout legal-callout--warn">
                  L'école est <strong>seule responsable</strong> de la sécurité de sa clé privée
                  (wallet MetaMask) ; en cas de perte ou de compromission, CertiChain ne peut
                  restaurer l'accès.
                </div>
                <ul className="legal-list" style={{ marginTop: 12 }}>
                  <li>Conservez votre clé privée dans un gestionnaire de mots de passe sécurisé.</li>
                  <li>Ne la partagez jamais, même avec l'équipe CertiChain.</li>
                  <li>Chaque diplôme certifié donne lieu à un ancrage on-chain irréversible.</li>
                </ul>
              </div>

              <div className="legal-article">
                <h3 className="legal-h3">3. Responsabilités du Recruteur (Vérificateur)</h3>
                <p className="legal-p">
                  Le service de vérification est fourni à titre informatif. CertiChain garantit
                  l'<strong>intégrité cryptographique</strong> du document par rapport à son
                  ancrage on-chain, mais n'est pas responsable des décisions de recrutement.
                </p>
                <p className="legal-p">
                  La vérification ne nécessite ni compte, ni wallet, ni installation.
                </p>
              </div>

              <div className="legal-article">
                <h3 className="legal-h3">4. Disponibilité</h3>
                <p className="legal-p">
                  Projet académique : l'équipe s'efforce d'assurer la disponibilité du service
                  mais ne garantit pas la continuité en cas de maintenance ou de force majeure.
                  La preuve cryptographique est ancrée on-chain de manière immuable.
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
                <h3 className="legal-h3">1. Séparation des données</h3>
                <p className="legal-p">
                  Dans une démarche de <strong>Privacy by Design</strong>, CertiChain sépare le
                  stockage des données pour concilier technologie blockchain et respect du RGPD :
                </p>
                <div className="legal-arch-grid">
                  <div className="legal-arch-card">
                    <div className="legal-arch-card__label">Off-Chain · Stockage privé</div>
                    <div className="legal-arch-card__title">Stockage serveur privé</div>
                    <ul className="legal-arch-card__items">
                      <li>Nom &amp; Prénom de l'étudiant</li>
                      <li>Mention / intitulé de formation</li>
                      <li>Visuel du diplôme (PDF / image)</li>
                      <li>Photo d'identité</li>
                      <li>Email de l'étudiant</li>
                    </ul>
                  </div>
                  <div className="legal-arch-card">
                    <div className="legal-arch-card__label">On-Chain · Blockchain publique</div>
                    <div className="legal-arch-card__title">Nœud Hardhat, compatible Polygon</div>
                    <ul className="legal-arch-card__items">
                      <li>Hash SHA-256 (empreinte anonyme)</li>
                      <li>Adresses des wallets co-signataires (école et rectorat)</li>
                      <li>Date d'ancrage (timestamp)</li>
                    </ul>
                  </div>
                </div>
                <p className="legal-p">
                  <strong>Aucune donnée personnelle n'est stockée sur la blockchain.</strong>{' '}
                  Seule l'empreinte y est inscrite de manière immuable.
                </p>
              </div>

              <div className="legal-article">
                <h3 className="legal-h3">2. Données collectées</h3>
                <p className="legal-p">
                  Pour les comptes établissements, CertiChain collecte les données suivantes :
                </p>
                <ul className="legal-list">
                  <li>Identifiant et mot de passe haché (PBKDF2)</li>
                  <li>E-mail de l'établissement et du rectorat</li>
                  <li>Adresses de portefeuilles Ethereum (publiques par nature)</li>
                  <li>Plan d'abonnement et date de souscription</li>
                  <li>Date et heure du consentement RGPD</li>
                  <li>Données des diplômes (off-chain)</li>
                </ul>
              </div>

              <div className="legal-article">
                <h3 className="legal-h3">3. Vos droits — Droit à l'effacement</h3>
                <p className="legal-p">
                  Conformément au RGPD, tout diplômé peut exercer son droit de rectification
                  ou d'effacement. Sur simple demande :
                </p>
                <ul className="legal-list">
                  <li>Le visuel et les données nominatives sont <strong>supprimés de notre serveur</strong>.</li>
                  <li>
                    L'empreinte sur la blockchain <strong>devient orpheline et non ré-identifiable</strong>
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
                  <li>Mots de passe hachés (PBKDF2)</li>
                  <li>Clé privée blockchain jamais dans le code source (variable d'environnement)</li>
                  <li>HTTPS en production</li>
                  <li>Double validation cryptographique (école + rectorat)</li>
                </ul>
              </div>

              <div className="legal-article">
                <h3 className="legal-h3">6. Sous-traitants</h3>
                <p className="legal-p">
                  <strong>Resend</strong> (e-mails transactionnels) et <strong>Cloudflare</strong>{' '}
                  (tunnel d'accès public). Ces services pouvant traiter des données hors UE, les
                  transferts sont encadrés par les garanties du RGPD (clauses contractuelles types).
                </p>
                <p className="legal-p" style={{ marginTop: 10 }}>
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
                <h3 className="legal-h3">1. Un seul cookie, strictement technique</h3>
                <p className="legal-p">
                  CertiChain n'utilise qu'un seul cookie, strictement technique : le{' '}
                  <strong>cookie de protection CSRF</strong> (<code>csrftoken</code>) déposé
                  par Django pour sécuriser les requêtes contre les attaques cross-site. Aucun
                  cookie de session, publicitaire, analytique ou de traçage n'est utilisé.
                </p>
                <p className="legal-p" style={{ marginTop: 10 }}>
                  L'état de connexion à l'espace École est conservé côté navigateur{' '}
                  (<code>sessionStorage</code> / <code>localStorage</code>), et la durée de
                  session (12 h) est contrôlée par l'application — <strong>non par un cookie</strong>.
                </p>
                <p className="legal-p" style={{ marginTop: 10 }}>
                  Conformément aux directives de la CNIL, ces mécanismes strictement nécessaires
                  ne requièrent pas de consentement préalable (Art. 82 de la Loi Informatique
                  &amp; Libertés).
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
