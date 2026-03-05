import React, { useState } from 'react';
import '../App.css';

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: 0,
    color: "#64748b",
    accent: "#f1f5f9",
    limit: 3,
    features: ["3 certifications / an", "Validation par email", "Support communauté", "Tableau de bord basique"],
    badge: null,
  },
  {
    id: "standard",
    name: "Standard",
    price: 49,
    color: "#2563eb",
    accent: "#eff6ff",
    limit: 50,
    features: ["50 certifications / an", "Validation double signature", "Support email prioritaire", "Historique complet", "Export CSV"],
    badge: "Populaire",
  },
  {
    id: "premium",
    name: "Premium",
    price: 199,
    color: "#7c3aed",
    accent: "#f5f3ff",
    limit: 500,
    features: ["500 certifications / an", "API REST incluse", "Intégration blockchain", "Support dédié 24/7", "Marque blanche", "Statistiques avancées"],
    badge: "Pro",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: null,
    color: "#0f172a",
    accent: "#f8fafc",
    limit: Infinity,
    features: ["Illimité", "Infrastructure dédiée", "SLA garanti 99.9%", "Onboarding personnalisé", "Contrat sur mesure", "Audit de sécurité"],
    badge: "Sur devis",
  },
];

const MOCK_SCHOOL = {
  name: "ESGI – École Supérieure de Génie Informatique",
  username: "esgi_paris",
  email: "admin@esgi.fr",
  rectorate_email: "validation@academie-paris.fr",
  address: "242 Rue du Faubourg Saint-Antoine, 75012 Paris",
  phone: "+33 1 43 46 00 01",
  created_at: "2024-09-01",
  current_plan: "standard",
  quota: { used: 2, limit: 50, remaining: 48 },
  status: "Vérifié ✅",
  siret: "123 456 789 00010",
  diplomas_validated: 2,
  diplomas_pending: 0,
  diplomas_rejected: 0,
};

const SchoolProfile = () => {
  const [school] = useState(MOCK_SCHOOL);
  const [activePlan, setActivePlan] = useState(school.current_plan);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: school.name,
    email: school.email,
    phone: school.phone,
    address: school.address,
    rectorate_email: school.rectorate_email,
  });
  const [saveMsg, setSaveMsg] = useState("");
  const [upgradeSuccess, setUpgradeSuccess] = useState("");

  const currentPlan = plans.find((p) => p.id === activePlan);
  const progressPct = currentPlan.limit === Infinity ? 10 : Math.min((school.quota.used / currentPlan.limit) * 100, 100);

  const handleUpgrade = (plan) => {
    setSelectedPlan(plan);
    setShowModal(true);
  };

  const confirmUpgrade = () => {
    setActivePlan(selectedPlan.id);
    setShowModal(false);
    setUpgradeSuccess("Abonnement " + selectedPlan.name + " activé avec succès !");
    setTimeout(() => setUpgradeSuccess(""), 4000);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setEditMode(false);
    setSaveMsg("Informations mises à jour avec succès !");
    setTimeout(() => setSaveMsg(""), 3000);
  };

  const styles = {
    page: {
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      background: "#f0f4ff",
      minHeight: "100vh",
    },
    header: {
      background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #1d4ed8 100%)",
      padding: "40px 5%",
      color: "white",
      position: "relative",
      overflow: "hidden",
    },
    headerInner: {
      maxWidth: 900,
      margin: "0 auto",
      display: "flex",
      alignItems: "flex-start",
      gap: 20,
      flexWrap: "wrap",
    },
    avatar: {
      width: 72, height: 72, borderRadius: 16,
      background: "rgba(255,255,255,0.15)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "2rem", border: "2px solid rgba(255,255,255,0.2)", flexShrink: 0,
    },
    tabBar: {
      display: "flex",
      gap: 4,
      background: "white",
      borderBottom: "1px solid #e2e8f0",
      padding: "0 5%",
      position: "sticky",
      top: 0,
      zIndex: 50,
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    },
    contentArea: {
      maxWidth: 900,
      margin: "0 auto",
      padding: "40px 20px 80px",
    },
    card: {
      background: "white",
      borderRadius: 16,
      padding: 32,
      marginBottom: 24,
      border: "1px solid #e2e8f0",
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    },
    sectionTitle: {
      fontSize: "0.85rem",
      fontWeight: 700,
      color: "#0f172a",
      marginBottom: 24,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    },
    infoGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
      gap: 20,
    },
    label: {
      display: "block",
      fontSize: "0.75rem",
      fontWeight: 600,
      color: "#94a3b8",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      marginBottom: 6,
    },
    value: {
      fontSize: "0.95rem",
      fontWeight: 500,
      color: "#1e293b",
    },
    inputField: {
      width: "100%",
      padding: "11px 14px",
      border: "1.5px solid #cbd5e1",
      borderRadius: 8,
      fontSize: "0.95rem",
      fontFamily: "inherit",
      color: "#1e293b",
      background: "#f8fafc",
    },
    btnPrimary: {
      background: "#2563eb",
      color: "white",
      border: "none",
      padding: "12px 24px",
      borderRadius: 10,
      fontFamily: "inherit",
      fontSize: "0.95rem",
      fontWeight: 700,
      cursor: "pointer",
    },
    btnGhost: {
      background: "transparent",
      color: "#64748b",
      border: "1.5px solid #e2e8f0",
      padding: "10px 20px",
      borderRadius: 10,
      fontFamily: "inherit",
      fontSize: "0.9rem",
      fontWeight: 600,
      cursor: "pointer",
    },
    modalOverlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(15,23,42,0.6)",
      zIndex: 999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    },
    modalBox: {
      background: "white",
      borderRadius: 20,
      padding: 40,
      maxWidth: 480,
      width: "100%",
      boxShadow: "0 25px 60px rgba(0,0,0,0.2)",
    },
    progressBg: {
      background: "#e2e8f0",
      borderRadius: 999,
      height: 10,
      overflow: "hidden",
      margin: "12px 0",
    },
    toast: {
      position: "fixed",
      bottom: 30,
      right: 30,
      background: "#15803d",
      color: "white",
      padding: "14px 22px",
      borderRadius: 12,
      fontWeight: 600,
      fontSize: "0.9rem",
      boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
      zIndex: 9999,
    },
  };

  const getTabStyle = (id) => ({
    padding: "16px 24px",
    border: "none",
    background: "transparent",
    fontFamily: "inherit",
    fontSize: "0.9rem",
    fontWeight: 600,
    color: activeTab === id ? "#2563eb" : "#64748b",
    cursor: "pointer",
    borderBottom: activeTab === id ? "3px solid #2563eb" : "3px solid transparent",
  });

  return (
    <div style={styles.page}>

      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.avatar}>🎓</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "white", margin: 0 }}>{school.name}</h1>
              <span style={{ background: "#10b981", color: "white", padding: "3px 12px", borderRadius: 999, fontSize: "0.75rem", fontWeight: 700 }}>
                {school.status}
              </span>
            </div>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.9rem", margin: 0 }}>
              @{school.username} · Membre depuis {new Date(school.created_at).toLocaleDateString("fr-FR", { year: "numeric", month: "long" })}
            </p>
            <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
              {[
                { label: "Plan actuel", value: currentPlan.name, icon: "⭐" },
                { label: "Certifications émises", value: school.quota.used, icon: "📜" },
                { label: "SIRET", value: school.siret, icon: "🏛️" },
              ].map((s, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 16px", border: "1px solid rgba(255,255,255,0.15)" }}>
                  <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.55)", fontWeight: 600, textTransform: "uppercase" }}>{s.icon} {s.label}</div>
                  <div style={{ color: "white", fontWeight: 700, fontSize: "1rem", marginTop: 2 }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* TAB BAR */}
      <div style={styles.tabBar}>
        {[
          { id: "profile", label: "📋 Informations" },
          { id: "quota", label: "📊 Quota & Usage" },
          { id: "plans", label: "🚀 Abonnement" },
        ].map((t) => (
          <button key={t.id} style={getTabStyle(t.id)} onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={styles.contentArea}>

        {/* ===== ONGLET INFORMATIONS ===== */}
        {activeTab === "profile" && (
          <>
            {saveMsg && (
              <div style={{ background: "#dcfce7", color: "#15803d", padding: "14px 18px", borderRadius: 10, marginBottom: 20, fontWeight: 600, border: "1px solid #bbf7d0" }}>
                ✅ {saveMsg}
              </div>
            )}
            <div style={styles.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div style={styles.sectionTitle}>Informations de l'établissement</div>
                <button style={styles.btnGhost} onClick={() => setEditMode(!editMode)}>
                  {editMode ? "Annuler" : "✏️ Modifier"}
                </button>
              </div>
              {editMode ? (
                <form onSubmit={handleSave}>
                  <div style={styles.infoGrid}>
                    {[
                      { label: "Nom de l'établissement", key: "name", type: "text" },
                      { label: "Email officiel", key: "email", type: "email" },
                      { label: "Téléphone", key: "phone", type: "tel" },
                      { label: "Email du Rectorat", key: "rectorate_email", type: "email" },
                    ].map((f) => (
                      <div key={f.key}>
                        <label style={styles.label}>{f.label}</label>
                        <input
                          style={styles.inputField}
                          type={f.type}
                          value={formData[f.key]}
                          onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                        />
                      </div>
                    ))}
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={styles.label}>Adresse</label>
                      <input style={styles.inputField} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                    <button type="submit" style={styles.btnPrimary}>Enregistrer</button>
                    <button type="button" style={styles.btnGhost} onClick={() => setEditMode(false)}>Annuler</button>
                  </div>
                </form>
              ) : (
                <div style={styles.infoGrid}>
                  {[
                    { label: "Nom complet", value: formData.name },
                    { label: "Email officiel", value: formData.email },
                    { label: "Téléphone", value: formData.phone },
                    { label: "SIRET", value: school.siret },
                    { label: "Adresse", value: formData.address },
                    { label: "Email Rectorat", value: formData.rectorate_email },
                  ].map((item, i) => (
                    <div key={i}>
                      <label style={styles.label}>{item.label}</label>
                      <div style={styles.value}>{item.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={styles.card}>
              <div style={styles.sectionTitle}>Statistiques de certifications</div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {[
                  { label: "Validés", count: school.diplomas_validated, color: "#10b981", bg: "#dcfce7", icon: "✅" },
                  { label: "En attente", count: school.diplomas_pending, color: "#f59e0b", bg: "#fef3c7", icon: "⏳" },
                  { label: "Refusés", count: school.diplomas_rejected, color: "#ef4444", bg: "#fee2e2", icon: "❌" },
                  { label: "Total émis", count: school.quota.used, color: "#2563eb", bg: "#dbeafe", icon: "📜" },
                ].map((s, i) => (
                  <div key={i} style={{ flex: "1 1 140px", background: s.bg, borderRadius: 12, padding: 20, border: "1px solid " + s.color + "22" }}>
                    <div style={{ fontSize: "1.8rem", marginBottom: 4 }}>{s.icon}</div>
                    <div style={{ fontSize: "2rem", fontWeight: 800, color: s.color }}>{s.count}</div>
                    <div style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ===== ONGLET QUOTA ===== */}
        {activeTab === "quota" && (
          <>
            <div style={styles.card}>
              <div style={styles.sectionTitle}>Utilisation du quota annuel</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontWeight: 700, color: "#334155" }}>Plan <span style={{ color: currentPlan.color }}>{currentPlan.name}</span></span>
                <span style={{ fontWeight: 700, fontSize: "1.1rem", color: progressPct >= 90 ? "#ef4444" : "#0f172a" }}>
                  {school.quota.used} / {currentPlan.limit === Infinity ? "∞" : currentPlan.limit}
                </span>
              </div>
              <div style={styles.progressBg}>
                <div style={{
                  width: progressPct + "%",
                  background: progressPct >= 90 ? "#ef4444" : progressPct >= 70 ? "#f59e0b" : currentPlan.color,
                  height: "100%", borderRadius: 999, transition: "width 0.6s ease"
                }} />
              </div>
              <p style={{ color: "#64748b", fontSize: "0.87rem", marginTop: 8 }}>
                {currentPlan.limit === Infinity ? "Illimité — aucune restriction." : "Il vous reste " + school.quota.remaining + " certification(s) disponibles cette année."}
              </p>
            </div>

            <div style={styles.card}>
              <div style={styles.sectionTitle}>Récapitulatif mensuel</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"].map((m, i) => {
                  const val = i < 2 ? (i === 0 ? 1 : 1) : 0;
                  return (
                    <div key={m} style={{ flex: "1 1 50px", textAlign: "center" }}>
                      <div style={{ height: Math.max(val * 24, 4) + "px", background: val > 0 ? currentPlan.color : "#e2e8f0", borderRadius: "4px 4px 0 0", margin: "0 auto", width: "80%", minHeight: 4 }} />
                      <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: 6, fontWeight: 600 }}>{m}</div>
                      <div style={{ fontSize: "0.8rem", fontWeight: 700, color: val > 0 ? currentPlan.color : "#cbd5e1" }}>{val}</div>
                    </div>
                  );
                })}
              </div>
              <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: 16, textAlign: "center" }}>Réinitialisation annuelle le 1er septembre</p>
            </div>

            <div style={{ ...styles.card, borderLeft: "4px solid " + currentPlan.color }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "1rem", color: "#0f172a" }}>Besoin de plus de certifications ?</div>
                  <p style={{ color: "#64748b", fontSize: "0.88rem", marginTop: 4, marginBottom: 0 }}>Passez à un plan supérieur dès maintenant.</p>
                </div>
                <button style={styles.btnPrimary} onClick={() => setActiveTab("plans")}>Voir les plans →</button>
              </div>
            </div>
          </>
        )}

        {/* ===== ONGLET ABONNEMENT ===== */}
        {activeTab === "plans" && (
          <>
            {upgradeSuccess && (
              <div style={{ background: "#dcfce7", color: "#15803d", padding: "14px 18px", borderRadius: 10, marginBottom: 20, fontWeight: 600, border: "1px solid #bbf7d0" }}>
                ✅ {upgradeSuccess}
              </div>
            )}
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a" }}>Choisissez votre plan</h2>
              <p style={{ color: "#64748b", marginTop: 8 }}>Changez d'abonnement à tout moment. Facturation annuelle sans engagement.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
              {plans.map((plan) => {
                const isCurrent = plan.id === activePlan;
                return (
                  <div key={plan.id} style={{
                    border: "2px solid " + (isCurrent ? plan.color : "#e2e8f0"),
                    borderRadius: 16,
                    padding: "28px 24px",
                    background: isCurrent ? plan.accent : "white",
                    position: "relative",
                    transition: "all 0.25s",
                  }}>
                    {plan.badge && (
                      <div style={{
                        position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                        background: plan.color, color: "white", padding: "3px 14px",
                        borderRadius: 999, fontSize: "0.72rem", fontWeight: 800, whiteSpace: "nowrap"
                      }}>
                        {plan.badge}
                      </div>
                    )}
                    {isCurrent && (
                      <div style={{
                        position: "absolute", top: 14, right: 14,
                        background: plan.color, color: "white", padding: "2px 10px",
                        borderRadius: 999, fontSize: "0.7rem", fontWeight: 800
                      }}>
                        Actuel
                      </div>
                    )}
                    <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#0f172a" }}>{plan.name}</div>
                    <div style={{ fontSize: "2rem", fontWeight: 800, color: plan.color, margin: "12px 0 4px" }}>
                      {plan.price === null ? "Contact" : plan.price === 0 ? "Gratuit" : plan.price + "€"}
                    </div>
                    {plan.price !== null && plan.price > 0 && (
                      <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginBottom: 16 }}>/ mois HT</div>
                    )}
                    <div style={{ marginTop: 16 }}>
                      {plan.features.map((f, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.88rem", color: "#334155", padding: "5px 0" }}>
                          <span style={{ color: plan.color, fontWeight: 700 }}>✓</span> {f}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => !isCurrent && handleUpgrade(plan)}
                      disabled={isCurrent}
                      style={{
                        width: "100%", padding: 11, borderRadius: 8,
                        fontFamily: "inherit", fontSize: "0.9rem", fontWeight: 700,
                        cursor: isCurrent ? "default" : "pointer",
                        marginTop: 20,
                        border: "2px solid " + plan.color,
                        background: isCurrent ? plan.color : "transparent",
                        color: isCurrent ? "white" : plan.color,
                      }}
                    >
                      {isCurrent ? "Plan actuel" : plan.price === null ? "Nous contacter" : "Choisir ce plan"}
                    </button>
                  </div>
                );
              })}
            </div>

            <div style={{ ...styles.card, marginTop: 32, background: "#fafafa" }}>
              <div style={styles.sectionTitle}>Questions fréquentes</div>
              {[
                { q: "Puis-je changer de plan à tout moment ?", a: "Oui, le changement est immédiat. La facturation est ajustée au prorata." },
                { q: "Que se passe-t-il si je dépasse mon quota ?", a: "Vous recevrez une alerte à 80% et ne pourrez plus émettre de certifications au-delà du plafond." },
                { q: "Les données sont-elles conservées si je dégrade ?", a: "Oui, toutes vos certifications historiques restent accessibles quel que soit le plan." },
              ].map((item, i) => (
                <div key={i} style={{ borderBottom: i < 2 ? "1px solid #f1f5f9" : "none", paddingBottom: i < 2 ? 16 : 0, marginBottom: i < 2 ? 16 : 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1e293b", marginBottom: 4 }}>❓ {item.q}</div>
                  <div style={{ fontSize: "0.88rem", color: "#64748b" }}>{item.a}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* MODAL CONFIRMATION UPGRADE */}
      {showModal && selectedPlan && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ fontSize: "3rem", marginBottom: 12 }}>🚀</div>
              <h2 style={{ fontWeight: 800, fontSize: "1.4rem", color: "#0f172a", marginBottom: 8 }}>
                Passer au plan {selectedPlan.name}
              </h2>
              <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
                Vous allez passer de <strong>{currentPlan.name}</strong> à <strong style={{ color: selectedPlan.color }}>{selectedPlan.name}</strong>.
                {selectedPlan.price !== null && selectedPlan.price > 0 && (
                  <> Nouveau tarif : <strong>{selectedPlan.price}€ / mois HT</strong>.</>
                )}
              </p>
            </div>
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, marginBottom: 24 }}>
              <div style={{ fontWeight: 700, color: "#334155", marginBottom: 10, fontSize: "0.9rem" }}>Ce plan inclut :</div>
              {selectedPlan.features.map((f, i) => (
                <div key={i} style={{ fontSize: "0.88rem", color: "#475569", padding: "4px 0", display: "flex", gap: 8 }}>
                  <span style={{ color: selectedPlan.color, fontWeight: 700 }}>✓</span> {f}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button style={{ ...styles.btnPrimary, flex: 1, background: selectedPlan.color }} onClick={confirmUpgrade}>
                Confirmer l'upgrade
              </button>
              <button style={styles.btnGhost} onClick={() => setShowModal(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST SUCCÈS */}
      {upgradeSuccess && (
        <div style={styles.toast}>✅ {upgradeSuccess}</div>
      )}

    </div>
  );
};

export default SchoolProfile;
