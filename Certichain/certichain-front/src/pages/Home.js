import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

const Home = () => {
  // Gestion des blocs étirables
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const faqData = [
    {
      title: "🏫 Comment certifier un diplôme ?",
      content: "Les établissements s'inscrivent sur la plateforme. Une fois validés, ils peuvent uploader les informations de l'étudiant et le fichier du diplôme. Une empreinte numérique unique (Hash) est générée et ancrée."
    },
    {
      title: "🔍 Comment vérifier un candidat ?",
      content: "Le recruteur n'a besoin que du nom du candidat ou de l'ID du diplôme. Le système interroge la base de données (et demain la blockchain) pour garantir que le document n'a pas été falsifié."
    },
    {
      title: "🛡️ Pourquoi est-ce sécurisé ?",
      content: "Nous utilisons un système hybride. Les données sensibles restent privées, tandis que la preuve d'existence est rendue immuable. Impossible pour un étudiant de Photoshopper ses notes."
    }
  ];

  return (
    <div className="hero-container">
      <h1 className="hero-title">Fiabilité. Transparence. <span style={{color: 'var(--primary)'}}>CertiChain.</span></h1>
      <h2 className="hero-subtitle">La solution standard pour la certification académique numérique.</h2>

      {/* BLOCS EXPLICATIFS (Accordéons) */}
      <div style={{maxWidth: '800px', width: '100%', margin: '40px auto', textAlign: 'left'}}>
        {faqData.map((item, index) => (
          <div key={index} className={`accordion-item ${activeIndex === index ? 'active' : ''}`}>
            <div className="accordion-header" onClick={() => toggleAccordion(index)}>
              {item.title}
              <span className="icon-rotate">▼</span>
            </div>
            <div className="accordion-content">
              {item.content}
            </div>
          </div>
        ))}
      </div>

      <div className="cards-grid">
        <div className="card">
          <h3>Établissements</h3>
          <p>Gérez vos promotions et émettez des certifications infalsifiables.</p>
          <Link to="/login" style={{width: '100%'}}>
            <button className="btn btn-primary">Accéder à l'espace École</button>
          </Link>
        </div>
        <div className="card">
          <h3>Recruteurs</h3>
          <p>Vérifiez instantanément l'authenticité d'un CV.</p>
          <Link to="/verify" style={{width: '100%'}}>
            <button className="btn btn-secondary">Vérifier un candidat</button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;