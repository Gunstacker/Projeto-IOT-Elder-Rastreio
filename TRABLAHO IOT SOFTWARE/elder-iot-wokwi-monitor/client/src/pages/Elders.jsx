import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { api } from "../api/apiClient";

const emptyForm = {
  name: "",
  age: "",
  responsibleName: "",
  responsiblePhone: "",
  emergencyContact: "",
  medicalNotes: ""
};

export default function Elders({ elders, setElders }) {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!editingId && elders[0]) {
      setForm({
        name: elders[0].name || "",
        age: elders[0].age || "",
        responsibleName: elders[0].responsibleName || "",
        responsiblePhone: elders[0].responsiblePhone || "",
        emergencyContact: elders[0].emergencyContact || "",
        medicalNotes: elders[0].medicalNotes || ""
      });
      setEditingId(elders[0].id);
    }
  }, [elders, editingId]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function editElder(elder) {
    setEditingId(elder.id);
    setForm({
      name: elder.name || "",
      age: elder.age || "",
      responsibleName: elder.responsibleName || "",
      responsiblePhone: elder.responsiblePhone || "",
      emergencyContact: elder.emergencyContact || "",
      medicalNotes: elder.medicalNotes || ""
    });
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
    <div className="dashboard-grid top-grid">
      <section className="card page-card">
        <div className="section-heading">
          <h2>Idosos</h2>
          <button className="button button-small" onClick={() => { setForm(emptyForm); setEditingId(null); }}>
            Novo
          </button>
        </div>
        <div className="compact-list">
          {elders.map((elder) => (
            <button key={elder.id} className="list-button" onClick={() => editElder(elder)}>
              <strong>{elder.name}</strong>
              <span>{elder.age} anos | {elder.currentStatus}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="card page-card">
        <div className="section-heading">
          <h2>{editingId ? "Editar idoso" : "Novo idoso"}</h2>
          <span>{message}</span>
        </div>
        <form className="form-grid" onSubmit={submit}>
          <label>Nome<input value={form.name} onChange={(e) => updateField("name", e.target.value)} required /></label>
          <label>Idade<input type="number" value={form.age} onChange={(e) => updateField("age", e.target.value)} /></label>
          <label>Responsavel<input value={form.responsibleName} onChange={(e) => updateField("responsibleName", e.target.value)} /></label>
          <label>Telefone responsavel<input value={form.responsiblePhone} onChange={(e) => updateField("responsiblePhone", e.target.value)} /></label>
          <label>Contato emergencia<input value={form.emergencyContact} onChange={(e) => updateField("emergencyContact", e.target.value)} /></label>
          <label className="span-two">Observacoes medicas<textarea value={form.medicalNotes} onChange={(e) => updateField("medicalNotes", e.target.value)} rows="4" /></label>
          <button className="button" type="submit">
            <Save size={17} />
            Salvar cadastro
          </button>
        </form>
      </section>
    </div>
  );
}
