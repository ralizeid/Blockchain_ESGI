import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="dashboard-container" style={{ maxWidth: '860px', margin: '40px auto', padding: '0 20px' }}>

      <button
        className="btn btn-secondary"
        style={{ marginBottom: '24px' }}
        onClick={() => navigate(-1)}
      >
        ← Retour
      </button>

      <div className="form-card">
        <div className="form-header">
          <h1>Politique de Confidentialité</h1>
          <p style={{ color: 'var(--gray)', marginTop: '6px' }}>
            Conformément au Règlement Général sur la Protection des Données (RGPD – UE 2016/679)
          </p>
        </div>

        <section style={{ marginTop: '28px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '10px', color: 'var(--dark)' }}>
            1. Responsable du traitement
          </h2>
          <p>
            CertiChain est responsable du traitement de vos données personnelles. Pour toute question
            relative à la protection de vos données, vous pouvez nous contacter à l'adresse :
            <strong> certichain2026@gmail.com</strong>.
          </p>
        </section>

        <hr style={{ margin: '20px 0', borderColor: '#e2e8f0' }} />

        <section>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '10px', color: 'var(--dark)' }}>
            2. Données collectées
          </h2>
          <p>Nous collectons les données suivantes afin de fournir le service CertiChain :</p>
          <ul style={{ listStyle: 'disc', paddingLeft: '24px', marginTop: '8px', lineHeight: '1.8' }}>
            <li>Identifiant de l'établissement (username) et mot de passe (haché)</li>
            <li>Adresse e-mail officielle de l'établissement</li>
            <li>Adresse e-mail du rectorat de rattachement</li>
            <li>Plan d'abonnement souscrit et date de souscription</li>
            <li>Date et heure du consentement RGPD</li>
            <li>Données des diplômes émis : nom, prénom de l'étudiant, intitulé de formation, date d'obtention</li>
            <li>Empreinte cryptographique (hash SHA-256) et référence blockchain des diplômes certifiés</li>
          </ul>
        </section>

        <hr style={{ margin: '20px 0', borderColor: '#e2e8f0' }} />

        <section>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '10px', color: 'var(--dark)' }}>
            3. Finalités du traitement
          </h2>
          <ul style={{ listStyle: 'disc', paddingLeft: '24px', lineHeight: '1.8' }}>
            <li>Gestion des comptes établissements et authentification</li>
            <li>Émission, validation et certification blockchain des diplômes</li>
            <li>Envoi d'e-mails de validation aux parties concernées</li>
            <li>Vérification publique de l'authenticité des diplômes</li>
            <li>Gestion des abonnements et du quota de diplômes</li>
          </ul>
        </section>

        <hr style={{ margin: '20px 0', borderColor: '#e2e8f0' }} />

        <section>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '10px', color: 'var(--dark)' }}>
            4. Base légale
          </h2>
          <p>
            Le traitement est fondé sur votre <strong>consentement explicite</strong> (Art. 6.1.a RGPD)
            recueilli lors de l'inscription, ainsi que sur l'exécution d'un contrat de service (Art. 6.1.b).
            La certification blockchain constitue un intérêt légitime au sens de l'Art. 6.1.f.
          </p>
        </section>

        <hr style={{ margin: '20px 0', borderColor: '#e2e8f0' }} />

        <section>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '10px', color: 'var(--dark)' }}>
            5. Durée de conservation
          </h2>
          <ul style={{ listStyle: 'disc', paddingLeft: '24px', lineHeight: '1.8' }}>
            <li>Données du compte : conservées jusqu'à la suppression du compte</li>
            <li>Diplômes en attente ou rejetés : supprimés lors de la suppression du compte</li>
            <li>
              Diplômes validés et certifiés : les données personnelles sont <strong>anonymisées</strong>{' '}
              lors de la suppression du compte ; la preuve blockchain (hash + identifiant de transaction)
              est maintenue à titre de preuve d'intégrité (Art. 17.3.b RGPD)
            </li>
          </ul>
        </section>

        <hr style={{ margin: '20px 0', borderColor: '#e2e8f0' }} />

        <section>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '10px', color: 'var(--dark)' }}>
            6. Certification blockchain et données personnelles
          </h2>
          <p>
            Lors de la validation d'un diplôme, CertiChain calcule une empreinte cryptographique
            (SHA-256) des données du diplôme. <strong>Seul ce hash est ancré sur la blockchain</strong>,
            jamais les données personnelles en clair. Cette approche garantit la vérifiabilité publique
            du diplôme tout en protégeant la vie privée de l'étudiant (Privacy by Design – Art. 25 RGPD).
          </p>
        </section>

        <hr style={{ margin: '20px 0', borderColor: '#e2e8f0' }} />

        <section>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '10px', color: 'var(--dark)' }}>
            7. Vos droits
          </h2>
          <p>Conformément au RGPD, vous disposez des droits suivants :</p>
          <ul style={{ listStyle: 'disc', paddingLeft: '24px', lineHeight: '1.8' }}>
            <li><strong>Droit d'accès</strong> (Art. 15) – exportez toutes vos données depuis votre profil</li>
            <li><strong>Droit à la portabilité</strong> (Art. 20) – données fournies en format JSON</li>
            <li><strong>Droit à l'effacement</strong> (Art. 17) – supprimez votre compte depuis votre profil</li>
            <li><strong>Droit de rectification</strong> (Art. 16) – contactez-nous à contact@certichain.fr</li>
            <li><strong>Droit d'opposition</strong> (Art. 21) – contactez-nous à contact@certichain.fr</li>
          </ul>
          <p style={{ marginTop: '12px' }}>
            Pour exercer vos droits, rendez-vous dans l'onglet <strong>Mes droits RGPD</strong> de votre
            espace ou contactez-nous directement.
          </p>
        </section>

        <hr style={{ margin: '20px 0', borderColor: '#e2e8f0' }} />

        <section>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '10px', color: 'var(--dark)' }}>
            8. Sécurité
          </h2>
          <p>
            Les mots de passe sont stockés sous forme hachée (PBKDF2). Les clés privées blockchain
            ne sont jamais stockées dans le code source et sont gérées via des variables d'environnement
            sécurisées. Les communications sont chiffrées en transit (HTTPS en production).
          </p>
        </section>

        <hr style={{ margin: '20px 0', borderColor: '#e2e8f0' }} />

        <p style={{ color: 'var(--gray)', fontSize: '0.85rem', marginTop: '8px' }}>
          Dernière mise à jour : juin 2025. Pour toute réclamation, vous pouvez contacter la
          CNIL : <a href="https://www.cnil.fr" target="_blank" rel="noreferrer">www.cnil.fr</a>.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
