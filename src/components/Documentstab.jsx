import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Upload, Trash2, FileText, Calendar, Eye } from 'lucide-react';
import api from '../services/api';

const DOC_TYPES = ['Passport', 'Visa', 'Insurance', 'Booking Confirmation', 'ID Card', 'Other'];

export default function DocumentsTab({ group, currentUser }) {
  const [docs,       setDocs]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const fileRef                     = useRef(null);

  const blankForm = { name: '', type: 'Passport', number: '', expiryDate: '', notes: '', file: null, fileName: '' };
  const [form, setForm] = useState(blankForm);

  /* ── fetch ── */
  useEffect(() => { fetchDocs(); }, [group.id]);

  const fetchDocs = async () => {
    try {
      const { data } = await api.get(`/documents?groupId=${group.id}`);
      setDocs(data);
    } catch (e) { console.error(e); }
    finally     { setLoading(false); }
  };

  /* ── file picker ── */
  const handleFilePick = (e) => {
    const file = e.target.files?.[0];
    if (file) setForm(p => ({ ...p, file, fileName: file.name }));
  };

  /* ── submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append('groupId',    group.id);
      fd.append('name',       form.name);
      fd.append('type',       form.type);
      if (form.number)     fd.append('number',     form.number);
      if (form.expiryDate) fd.append('expiryDate', form.expiryDate);
      if (form.notes)      fd.append('notes',      form.notes);
      if (form.file)       fd.append('file',       form.file);

      await api.post('/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await fetchDocs();
      setShowModal(false);
      setForm(blankForm);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to upload document');
    }
  };

  /* ── delete ── */
  const handleDelete = async (id) => {
    if (!confirm('Delete this document?')) return;
    try {
      await api.delete(`/documents/${id}`);
      setDocs(prev => prev.filter(d => d.id !== id));
    } catch (err) { alert(err.response?.data?.error || 'Failed to delete'); }
  };

  /* ── render ── */
  if (loading) return <div className="text-center py-8 text-gray-500">Loading documents…</div>;

  const typeColors = {
    Passport: 'bg-blue-100 text-blue-700',
    Visa: 'bg-purple-100 text-purple-700',
    Insurance: 'bg-green-100 text-green-700',
    'Booking Confirmation': 'bg-orange-100 text-orange-700',
    'ID Card': 'bg-pink-100 text-pink-700',
    Other: 'bg-gray-100 text-gray-700'
  };

  return (
    <div className="space-y-6">

      {/* header */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800">Documents</h3>
        <button onClick={() => { setForm(blankForm); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <Plus size={20}/> Upload Document
        </button>
      </div>

      {/* info note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
        <Eye size={16} className="text-blue-600 mt-0.5 flex-shrink-0"/>
        <p className="text-xs text-blue-700">Documents are private — only you can see your uploads.</p>
      </div>

      {/* doc grid */}
      {docs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText size={48} className="mx-auto text-gray-300 mb-3"/>
          <p className="text-gray-500">No documents yet. Upload your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {docs.map(doc => (
            <div key={doc.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <FileText size={20} className="text-indigo-500"/>
                  <h4 className="font-semibold text-gray-800">{doc.name}</h4>
                </div>
                <button onClick={() => handleDelete(doc.id)} className="text-gray-300 hover:text-red-500">
                  <Trash2 size={17}/>
                </button>
              </div>

              <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${typeColors[doc.type] || typeColors.Other}`}>
                {doc.type}
              </span>

              {doc.number && (
                <p className="text-sm text-gray-600 mt-2">
                  <span className="font-medium">Number:</span> {doc.number}
                </p>
              )}

              {doc.expiryDate && (
                <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1.5">
                  <Calendar size={14}/>
                  Expires: {new Date(doc.expiryDate).toLocaleDateString()}
                </div>
              )}

              {doc.notes && (
                <p className="text-xs text-gray-500 mt-2 italic">{doc.notes}</p>
              )}

              {doc.fileUrl && (
                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline mt-2">
                  <Upload size={12}/> View uploaded file
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════
          UPLOAD MODAL
          ════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">

            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-gray-800">Upload Document</h3>
              <button onClick={() => setShowModal(false)}><X size={22} className="text-gray-400 hover:text-gray-600"/></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="hidden" name="groupId" value={group.id}/>

              {/* file drop zone */}
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-400 transition-colors">
                <Upload size={28} className="mx-auto text-gray-400 mb-2"/>
                {form.fileName ? (
                  <p className="text-sm text-indigo-700 font-semibold">{form.fileName}</p>
                ) : (
                  <p className="text-sm text-gray-500">Click to select a file <span className="text-gray-400">(PDF, JPG, PNG – max 10MB)</span></p>
                )}
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFilePick} className="hidden"/>
              </div>

              {/* document name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Document Name *</label>
                <input required type="text" value={form.name}
                  onChange={e => setForm(p => ({...p, name: e.target.value}))}
                  placeholder="e.g. John's Passport"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent"/>
              </div>

              {/* type + number */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Type *</label>
                  <select required value={form.type} onChange={e => setForm(p => ({...p, type: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent">
                    {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Number</label>
                  <input type="text" value={form.number}
                    onChange={e => setForm(p => ({...p, number: e.target.value}))}
                    placeholder="e.g. AB1234567"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent"/>
                </div>
              </div>

              {/* expiry */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Expiry Date</label>
                <input type="date" value={form.expiryDate}
                  onChange={e => setForm(p => ({...p, expiryDate: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent"/>
              </div>

              {/* notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes</label>
                <textarea value={form.notes} rows={2}
                  onChange={e => setForm(p => ({...p, notes: e.target.value}))}
                  placeholder="Any additional info…"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent"/>
              </div>

              {/* buttons */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-300">Cancel</button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700">Upload</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}