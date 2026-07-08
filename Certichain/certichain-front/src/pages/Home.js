import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

/* ── Icône + aux coins des bento cards (pattern 21st.dev RuixenBentoCards) ── */
const PlusCorner = ({ pos }) => (
  <svg
    className={`bento-plus bento-plus-${pos}`}
    width="22" height="22" viewBox="0 0 22 22" fill="none"
    aria-hidden="true"
  >
    <path d="M11 3V19M3 11H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

/* ── Types d'établissements compatibles (génériques, honnêtes) ── */
const INSTITUTIONS = [
  'Universités',
  'Grandes Écoles',
  'BTS & IUT',
  'Lycées Professionnels',
  'Écoles d\'Ingénieurs',
  'MBA & Masters',
  'Instituts Supérieurs',
  'Centres de Formation',
  'Universités',
  'Grandes Écoles',
  'BTS & IUT',
  'Lycées Professionnels',
  'Écoles d\'Ingénieurs',
  'MBA & Masters',
  'Instituts Supérieurs',
  'Centres de Formation',
];

const Home = () => {
  // ─── Logique métier de l'accordéon — PRÉSERVÉE INTÉGRALEMENT ───
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const faqData = [
    {
      title: "Comment certifier un diplôme ?",
      content: "Les établissements s'inscrivent sur la plateforme. Une fois validés, ils peuvent uploader les informations de l'étudiant et le fichier du diplôme. Une empreinte numérique unique (Hash) est générée et ancrée."
    },
    {
      title: "Comment vérifier un candidat ?",
      content: "Le recruteur n'a besoin que du nom du candidat ou de l'ID du diplôme. Le système interroge la base de données (et demain la blockchain) pour garantir que le document n'a pas été falsifié."
    },
    {
      title: "Pourquoi est-ce sécurisé ?",
      content: "Nous utilisons un système hybride. Les données sensibles restent privées, tandis que la preuve d'existence est rendue immuable. Impossible pour un étudiant de falsifier ses notes."
    }
  ];
  // ────────────────────────────────────────────────────────────────

  /* Mouse-tracking ambient gradient — purement visuel (21st.dev pattern) */
  const handleHeroMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mx', `${x}px`);
    e.currentTarget.style.setProperty('--my', `${y}px`);
  };

  return (
    <div className="home-page">

      {/* ══════════════════════════════════════════════════
          HERO — Split layout premium
          • Floating pill shapes (21st.dev ElegantShape)
          • Mouse-tracking ambient spotlight
          • Mockup certificat décoratif
      ══════════════════════════════════════════════════ */}
      <section
        className="hero-section"
        onMouseMove={handleHeroMouseMove}
      >
        {/* Floating pill shapes (pattern 21st.dev HeroGeometric) */}
        <div className="hero-pill hero-pill-1" aria-hidden="true" />
        <div className="hero-pill hero-pill-2" aria-hidden="true" />
        <div className="hero-pill hero-pill-3" aria-hidden="true" />
        <div className="hero-pill hero-pill-4" aria-hidden="true" />

        {/* Anneaux concentriques (pattern 21st.dev Hero115) */}
        <div className="hero-rings" aria-hidden="true">
          {[200,380,560,740,920].map((s, i) => (
            <div key={i} className="hero-ring"
              style={{ width: s, height: s, marginLeft: -s / 2, marginTop: -s / 2 }} />
          ))}
        </div>

        <div className="hero-grid">

          {/* ── Gauche : contenu éditorial ── */}
          <div className="hero-left">

            <div className="hero-brand" aria-label="CertiChain">
              <div className="hero-brand-mark" aria-hidden="true">
                <img
                  className="hero-brand-image"
                  src={`${process.env.PUBLIC_URL}/images/logo-full.png`}
                  alt="CertiChain"
                />
              </div>
              <div className="hero-brand-copy">
                <span className="hero-brand-kicker">Plateforme de certification</span>
                <span className="hero-brand-name">CertiChain</span>
              </div>
            </div>

            <div className="hero-badge">
              <span className="hero-badge-dot" aria-hidden="true" />
              <span>Certification académique · Ancrage blockchain</span>
            </div>

            <h1 className="hero-title">
              Diplômes<br />
              <span className="hero-title-line">certifiés.</span><br />
              Fraude{' '}
              <span className="hero-title-accent">impossible.</span>
            </h1>

            <p className="hero-subtitle">
              CertiChain ancre l'authenticité de chaque diplôme sur la blockchain, via une empreinte cryptographique immuable.
              Vérification en moins de 3 secondes par QR code, sans compte, conforme RGPD.
            </p>

            <div className="hero-actions">
              <Link to="/login">
                <button className="btn-hero-primary">
                  Espace École
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75"
                      strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </Link>
              <Link to="/verify">
                <button className="btn-hero-ghost">Vérifier un diplôme</button>
              </Link>
            </div>

            <div className="hero-trust">
              {[
                { val: '< 3s',   label: 'Vérification'     },
                { val: 'RGPD',   label: 'Conforme'          },
                { val: 'QR code',label: 'Sans compte requis'},
                { val: '100 %',  label: 'Infalsifiable'     },
              ].map((s, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <div className="hero-trust-div" aria-hidden="true" />}
                  <div className="hero-trust-item">
                    <span className="hero-trust-val">{s.val}</span>
                    <span className="hero-trust-lbl">{s.label}</span>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* ── Droite : mockup certificat (purement décoratif) ── */}
          <div className="hero-right" aria-hidden="true">
            <div className="cert-wrap">
              <div className="cert-halo" />

              <div className="cert-card">
                <div className="cert-card-header">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M9 1.5L2.25 4.875v5.25c0 4.875 2.925 9.45 6.75 10.5 3.825-1.05 6.75-5.625 6.75-10.5V4.875L9 1.5z" fill="rgba(255,255,255,0.2)"/>
                    <path d="M5.625 9L7.875 11.25L12.375 6.75" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Diplôme vérifié · Blockchain</span>
                </div>

                <div className="cert-card-body">
                  <div className="cert-avatar">JM</div>
                  <div className="cert-name">Jean MARTIN</div>
                  <div className="cert-degree">Master Informatique</div>

                  <div className="cert-divider" />

                  {[
                    { l: 'Établissement', v: 'Université Paris-Saclay' },
                    { l: 'Promotion',     v: '2024 – 2025'            },
                    { l: 'Mention',       v: 'Très Bien'              },
                  ].map((r, i) => (
                    <div key={i} className="cert-row">
                      <span className="cert-lbl">{r.l}</span>
                      <span className="cert-val">{r.v}</span>
                    </div>
                  ))}

                  <div className="cert-hash-wrap">
                    <span className="cert-hash-label">Hash blockchain</span>
                    <code className="cert-hash">0x8f3a2b1c9d4e7f...</code>
                  </div>
                </div>
              </div>

              <div className="cert-badge-float">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="7" fill="#10B981"/>
                  <path d="M4 7l2.5 2.5L10 4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Authentique
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          VALUE BAND — 3 bénéfices clés, une audience par colonne
      ══════════════════════════════════════════════════ */}
      <section className="value-band" aria-label="Bénéfices">
        <div className="value-inner">

          <div className="value-item">
            <div className="value-icon value-icon-indigo" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M11 2L3 6V11C3 15.42 6.58 19.17 11 20C15.42 19.17 19 15.42 19 11V6L11 2Z"
                  stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7.5 11L10 13.5L14.5 9" stroke="currentColor" strokeWidth="1.6"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="value-title">Diplôme infalsifiable</div>
            <p className="value-desc">Ancré sur la blockchain. Personne ne peut le modifier.</p>
          </div>

          <div className="value-item">
            <div className="value-icon value-icon-blue" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M19 19l-4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                <path d="M7.5 10l2 2 3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="value-title">Vérification sans compte</div>
            <p className="value-desc">Un QR code suffit. Aucun wallet, aucune inscription.</p>
          </div>

          <div className="value-item">
            <div className="value-icon value-icon-green" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <rect x="3" y="11" width="16" height="9" rx="2" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M7 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="value-title">Données privées, conforme RGPD</div>
            <p className="value-desc">Les informations personnelles ne vont jamais sur la blockchain.</p>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          LOGOS MARQUEE — Institutions partenaires
          Pattern : Logos3 infinite marquee de 21st.dev
      ══════════════════════════════════════════════════ */}
      <section className="logos-section" aria-label="Institutions partenaires">
        <p className="logos-label">Compatible avec tout type d'établissement d'enseignement supérieur</p>
        <div className="logos-marquee">
          <div className="logos-track" aria-hidden="true">
            {INSTITUTIONS.map((name, i) => (
              <React.Fragment key={i}>
                <span className="logo-name">{name}</span>
                <span className="logo-separator" aria-hidden="true" />
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          PROCESS — Section sombre, 3 étapes connectées
      ══════════════════════════════════════════════════ */}
      <section className="process-section">
        <div className="process-inner">
          <div className="process-header">
            <div className="process-eyebrow">Comment ça marche</div>
            <h2 className="process-title">Simple. Rapide. Immuable.</h2>
          </div>

          <div className="process-steps">
            {[
              {
                n: '01',
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7L12 2z"
                      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.75"
                      strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: "L’école émet",
                desc: "L’établissement upload le diplôme et les données de l’étudiant sur la plateforme sécurisée.",
              },
              {
                n: '02',
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.75"/>
                    <path d="M16 7V5a4 4 0 0 0-8 0v2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
                    <circle cx="12" cy="14" r="2" fill="currentColor"/>
                  </svg>
                ),
                title: 'Ancrage sur la blockchain',
                desc: "L'empreinte SHA-256 du diplôme est ancrée sur la blockchain ; le visuel reste stocké côté serveur. Immuable.",
              },
              {
                n: '03',
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.75"/>
                    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
                    <path d="M8 11l2 2 4-4" stroke="currentColor" strokeWidth="1.75"
                      strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: "Le recruteur vérifie",
                desc: "En moins de 3 secondes et sans wallet, n'importe qui peut confirmer l'authenticité d'un diplôme via QR code.",
              },
            ].map((step, i) => (
              <React.Fragment key={i}>
                <div className="process-step">
                  <div className="process-step-num">{step.n}</div>
                  <div className="process-step-icon">{step.icon}</div>
                  <h3 className="process-step-title">{step.title}</h3>
                  <p className="process-step-desc">{step.desc}</p>
                </div>
                {i < 2 && <div className="process-connector" aria-hidden="true" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          BENTO FEATURES — Cards avec corner + icons
          Pattern : RuixenBentoCards de 21st.dev
      ══════════════════════════════════════════════════ */}
      <section className="features-section">
        <div className="features-inner">
          <div className="section-eyebrow">Pourquoi CertiChain</div>

          <div className="bento-grid">

            {/* Card sombre — Établissements (grande, span 2) */}
            <div className="bento-card bento-card-dark">
              <PlusCorner pos="tl"/><PlusCorner pos="tr"/>
              <PlusCorner pos="bl"/><PlusCorner pos="br"/>
              <div className="bento-icon bento-icon-white">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M3 21V9L12 3L21 9V21H15V15H9V21H3Z"
                    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="bento-title">Établissements</h3>
              <p className="bento-desc">Émettez des certifications académiques infalsifiables. Gérez vos promotions et suivez chaque diplôme en temps réel.</p>
              <Link to="/login" className="bento-cta bento-cta-white">
                Accéder à l'espace École
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>

            {/* Card claire — Recruteurs */}
            <div className="bento-card bento-card-light">
              <PlusCorner pos="tl"/><PlusCorner pos="tr"/>
              <PlusCorner pos="bl"/><PlusCorner pos="br"/>
              <div className="bento-icon bento-icon-indigo">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="7.5" stroke="currentColor" strokeWidth="1.75"/>
                  <path d="M21 21L16.5 16.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
                  <path d="M8 11l2.5 2.5 4-4" stroke="currentColor" strokeWidth="1.75"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="bento-title">Recruteurs</h3>
              <p className="bento-desc">Vérifiez l'authenticité d'un diplôme en quelques secondes. Sans compte requis.</p>
              <Link to="/verify" className="bento-cta bento-cta-primary">
                Vérifier maintenant
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>

            {/* Card stat — Chiffre clé avec fond pointillé */}
            <div className="bento-card bento-card-stat">
              <PlusCorner pos="tl"/><PlusCorner pos="tr"/>
              <PlusCorner pos="bl"/><PlusCorner pos="br"/>
              <div className="bento-dots" aria-hidden="true" />
              <div className="bento-stat-number">100<span>%</span></div>
              <div className="bento-stat-label">Infalsifiable</div>
            </div>

            {/* Card verte — Sécurité (grande, span 2) */}
            <div className="bento-card bento-card-green">
              <PlusCorner pos="tl"/><PlusCorner pos="tr"/>
              <PlusCorner pos="bl"/><PlusCorner pos="br"/>
              <div className="bento-icon bento-icon-green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L4 6V12C4 16.42 7.58 20.17 12 21C16.42 20.17 20 16.42 20 12V6L12 2Z"
                    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8.5 12L11 14.5L15.5 9.5" stroke="currentColor" strokeWidth="1.75"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="bento-title">Sécurisé par conception</h3>
              <p className="bento-desc">Stockage serveur sécurisé, ancrage de l'empreinte sur la blockchain (registre non-transférable). Les données privées restent hors chaîne — seule la preuve cryptographique (hash) est publique.</p>
              <Link to="/support" className="bento-cta bento-cta-green">
                En savoir plus
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FAQ — Accordéon avec gradient actif
          Pattern : 21st.dev FAQ gradient indigo
      ══════════════════════════════════════════════════ */}
      <section className="faq-section">
        <div className="faq-inner">
          <div className="faq-header">
            <div className="section-eyebrow" style={{ justifyContent: 'center' }}>FAQ</div>
            <h2 className="faq-title">Questions fréquentes</h2>
            <p className="faq-subtitle">Tout ce que vous devez savoir sur CertiChain.</p>
          </div>

          <div className="faq-list">
            {faqData.map((item, index) => (
              <div
                key={index}
                className={`accordion-item ${activeIndex === index ? 'active' : ''}`}
              >
                <div
                  className="accordion-header"
                  onClick={() => toggleAccordion(index)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={activeIndex === index}
                  onKeyDown={(e) => e.key === 'Enter' && toggleAccordion(index)}
                >
                  <span className="accordion-title">{item.title}</span>
                  <span className="accordion-chevron icon-rotate" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M4.5 6.75L9 11.25L13.5 6.75"
                        stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                </div>
                <div className="accordion-content">{item.content}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          CTA STRIP FINAL — Gradient mesh premium
      ══════════════════════════════════════════════════ */}
      <section className="cta-strip">
        <div className="cta-strip-inner">
          <h2 className="cta-strip-title">Prêt à certifier vos diplômes ?</h2>
          <p className="cta-strip-sub">Rejoignez les établissements qui font confiance à CertiChain.</p>
          <div className="cta-strip-actions">
            <Link to="/login">
              <button className="btn-hero-primary">Créer un compte École</button>
            </Link>
            <Link to="/verify">
              <button className="cta-strip-ghost">Vérifier un diplôme</button>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FOOTER LÉGAL
      ══════════════════════════════════════════════════ */}
      <footer className="site-footer">
        <div className="site-footer__inner">
          <div className="site-footer__brand">
            <svg width="18" height="18" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 2L27 9V21L15 28L3 21V9L15 2Z" fill="url(#hexFootGrad)"/>
              <path d="M10.5 15L13.5 18L19.5 12" stroke="white" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="hexFootGrad" x1="3" y1="2" x2="27" y2="28" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#4338CA"/>
                  <stop offset="1" stopColor="#6366F1"/>
                </linearGradient>
              </defs>
            </svg>
            <span>CertiChain</span>
          </div>
          <div className="site-footer__links">
            <Link to="/legal">Mentions légales</Link>
            <span className="site-footer__dot" aria-hidden="true">·</span>
            <Link to="/legal#cgu">CGU</Link>
            <span className="site-footer__dot" aria-hidden="true">·</span>
            <Link to="/legal#confidentialite">Confidentialité</Link>
            <span className="site-footer__dot" aria-hidden="true">·</span>
            <Link to="/legal#cookies">Cookies</Link>
            <span className="site-footer__dot" aria-hidden="true">·</span>
            <Link to="/support">Support</Link>
          </div>
          <p className="site-footer__copy">
            © 2025–2026 CertiChain — Projet académique ESGI · Filière Sécurité Informatique
          </p>
        </div>
      </footer>

    </div>
  );
};

export default Home;
