import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import '../App.css';

const Support = () => {
  const [content, setContent] = useState('');

  useEffect(() => {
    fetch('/guide.md')
      .then((res) => res.text())
      .then((text) => setContent(text))
      .catch((err) => console.error("Erreur lors du chargement du guide: ", err));
  }, []);

  return (
    <div className="support-page">
      <div className="support-card">
        <h2>Guide &amp; Support</h2>
        <div className="markdown-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default Support;
