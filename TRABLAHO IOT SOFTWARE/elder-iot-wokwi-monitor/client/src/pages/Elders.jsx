import { useEffect, useState } from "react";
import { Bell, Mail, Plus, Save, UserRound } from "lucide-react";
import { api } from "../api/apiClient";
import { formatDateTime, statusMeta } from "../constants/monitoring";

const emptyForm = {
  name: "",
  age: "",
  responsibleName: "",
  responsibleEmail: "",
  emailNotificationsEnabled: true,
  responsiblePhone: "",
  emergencyContact: "",
  medicalNotes: ""
};

function formFromElder(elder) {
  return {
    name: elder.name || "",
    age: elder.age || "",
    responsibleName: elder.responsibleName || "",
    responsibleEmail: elder.responsibleEmail || "",
    emailNotificationsEnabled: elder.emailNotificationsEnabled !== false,
    responsiblePhone: elder.responsiblePhone || "",
    emergencyContact: elder.emergencyContact || "",
    medicalNotes: elder.medicalNotes || ""
  };
}

export default function Elders({ elders, setElders }) {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!editingId && elders[0]) {
      setForm(formFromElder(elders[0]));
      setEditingId(elders[0].id);
    }
  }, [elders, editingId]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function editElder(elder) {
    setEditingId(elder.id);
    setForm(formFromElder(elder));
    setMessage("");
  }

  async function submit(event) {
    event.preventDefault();
    const response = editingId
      ? await api.updateElder(editingId, form)
      : await api.createElder(form);

    const saved = response.data;
    setElders((current) => {
      const exists = current.some((elder) => elder.id === saved.id);
      return exists
        ? current.map((elder) => (elder.id === saved.id ? saved : elder))
        : [...current, saved];
    });
    setEditingId(saved.id);
    setMessage("Cadastro salvo.");
  }

  return (
    <div className="dashboard-grid top-grid elders-page">
      <section className="card page-card">
        <div className="section-heading">
          <div>
            <h2>Pacientes</h2>
            <span>{elders.length} cadastros ativos</span>
          </div>
          <button className="button button-small" onClick={() => { setForm(emptyForm); setEditingId(null); setMessage(""); }}>
            <Plus size={15} />
            Novo
          </button>
        </div>
        <div className="compact-list">
          {elders.map((elder) => {
            const status = statusMeta(elder.currentStatus);
            return (
              <button key={elder.id} className={`list-button patient-list-button ${editingId === elder.id ? "active" : ""}`} onClick={() => editElder(elder)}>
                <span className={`avatar avatar-small avatar-${status.tone}`}>{elder.name?.slice(0, 2).toUpperCase() || "ID"}</span>
                <div>
                  <strong>{elder.name}</strong>
                  <span>{elder.age || "--"} anos | {status.label}</span>
                  <span><Mail size={13} /> {elder.responsibleEmail || "E-mail nao cadastrado"}</span>
                </div>
              </button>
            );
          })}
          {!elders.length ? <p className="empty-state">Nenhum paciente cadastrado.</p> : null}
        </div>
      </section>

      <section className="card page-card">
        <div className="section-heading">
          <div>
            <h2>{editingId ? "Editar paciente" : "Novo paciente"}</h2>
            <span>{message || "Dados do responsavel e notificacoes"}</span>
          </div>
        </div>
        <form className="form-grid" onSubmit={submit}>
          <label>Nome<input value={form.name} onChange={(e) => updateField("name", e.target.value)} required /></label>
          <label>Idade<input type="number" value={form.age} onChange={(e) => updateField("age", e.target.value)} /></label>
          <label>Responsavel<input value={form.responsibleName} onChange={(e) => updateField("responsibleName", e.target.value)} /></label>
          <label>E-mail do responsavel<input type="email" value={form.responsibleEmail} onChange={(e) => updateField("responsibleEmail", e.target.value)} /></label>
          <label>Telefone responsavel<input value={form.responsiblePhone} onChange={(e) => updateField("responsiblePhone", e.target.value)} /></label>
          <label>Contato emergencia<input value={form.emergencyContact} onChange={(e) => updateField("emergencyContact", e.target.value)} /></label>
          <label className="span-two toggle-row">
            <input
              type="checkbox"
              checked={form.emailNotificationsEnabled}
              onChange={(e) => updateField("emailNotificationsEnabled", e.target.checked)}
            />
            <span><Bell size={16} /> Notificacoes automaticas por e-mail</span>
          </label>
          <label className="span-two">Observacoes medicas<textarea value={form.medicalNotes} onChange={(e) => updateField("medicalNotes", e.target.value)} rows="4" /></label>
          <div className="form-footer span-two">
            <span><UserRound size={15} /> Ultima atualizacao: {formatDateTime(elders.find((elder) => elder.id === editingId)?.updatedAt)}</span>
            <button className="button" type="submit">
              <Save size={17} />
              Salvar cadastro
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
