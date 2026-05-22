import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import '../App.css'; // Pour les classes communes s'il y en a

const Support = () => {
  const [content, setContent] = useState('');

  useEffect(() => {
    // On va chercher le fichier guide.md situé dans le dossier public
    fetch('/guide.md')
      .then((res) => res.text())
      .then((text) => setContent(text))
      .catch((err) => console.error("Erreur lors du chargement du guide: ", err));
  }, []);

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto 80px auto', padding: '0 20px' }}>
      <div style={{ background: 'var(--white)', padding: '3rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)', textAlign: 'left' }}>
        <h2 style={{ color: 'var(--primary)', marginBottom: '20px', textAlign: 'left' }}>Guide & Support</h2>
        <div className="markdown-body" style={{ lineHeight: '1.6', textAlign: 'left' }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default Support;
