import React, { useState, useEffect } from 'react';
import { Plus, X, Check, Trash2 } from 'lucide-react';
import api from '../services/api';

export default function PollTab({ group, currentUser }) {
  const [polls,      setPolls]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);

  const blankForm = { question: '', options: ['', ''] };
  const [form, setForm] = useState(blankForm);

  useEffect(() => { fetchPolls(); }, [group.id]);

  const fetchPolls = async () => {
    try {
      const { data } = await api.get(`/polls?groupId=${group.id}`);
      setPolls(data);
    } catch (e) { console.error(e); }
    finally     { setLoading(false); }
  };

  /* ── add / remove option inputs ── */
  const addOption   = () => setForm(p => ({ ...p, options: [...p.options, ''] }));
  const removeOption = (i) => setForm(p => ({ ...p, options: p.options.filter((_, idx) => idx !== i) }));
  const setOption   = (i, val) => setForm(p => { const o = [...p.options]; o[i] = val; return { ...p, options: o }; });

  /* ── create poll ── */
  const handleCreate = async (e) => {
    e.preventDefault();
    const validOptions = form.options.filter(o => o.trim());
    if (validOptions.length < 2) return alert('Add at least 2 options');
    try {
      await api.post('/polls', { groupId: group.id, question: form.question, options: validOptions });
      await fetchPolls();
      setShowModal(false);
      setForm(blankForm);
    } catch (err) { alert(err.response?.data?.error || 'Failed to create poll'); }
  };

  /* ── vote ── */
  const handleVote = async (pollId, optionIndex) => {
    try {
      await api.post(`/polls/${pollId}/vote`, { optionIndex });
      await fetchPolls();
    } catch (err) { console.error(err); }
  };

  /* ── delete ── */
  const handleDelete = async (id) => {
    if (!confirm('Delete this poll?')) return;
    try {
      await api.delete(`/polls/${id}`);
      setPolls(prev => prev.filter(p => p.id !== id));
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  if (loading) return <div className="text-center py-8 text-gray-500">Loading polls…</div>;

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-800">Group Polls</h3>
        <button onClick={() => { setForm(blankForm); setShowModal(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700">
          <Plus size={16}/> New Poll
        </button>
      </div>

      {/* poll cards */}
      {polls.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No polls yet. Create one to help the group decide!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {polls.map(poll => {
            const options  = poll.options || [];
            const votes    = poll.votes   || [];
            const totalVotes = votes.reduce((s, v) => s + (v || 0), 0);
            const myVote   = poll.myVote;  // index or null – server should return this

            return (
              <div key={poll.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-semibold text-gray-800">{poll.question}</h4>
                  <button onClick={() => handleDelete(poll.id)} className="text-gray-300 hover:text-red-500">
                    <Trash2 size={16}/>
                  </button>
                </div>

                <div className="space-y-2">
                  {options.map((opt, i) => {
                    const optionText = typeof opt === 'string' ? opt : opt.text;
                    const voteCount = votes[i] || 0;
                    const pct       = totalVotes ? Math.round((voteCount / totalVotes) * 100) : 0;
                    const isMyVote  = myVote === i;
                    return (
                      <div key={i}>
                        <button onClick={() => handleVote(poll.id, i)}
                          className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                            isMyVote ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 bg-gray-50'
                          }`}>
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-2 text-sm text-gray-700">
                              {isMyVote && <Check size={14} className="text-indigo-600"/>}
                              {optionText}
                            </span>
                            <span className="text-xs text-gray-400">{voteCount} vote{voteCount !== 1 ? 's' : ''}</span>
                          </div>
                        </button>
                        {/* progress bar */}
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${pct}%` }}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-400 mt-2">{totalVotes} total vote{totalVotes !== 1 ? 's' : ''}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* ── create poll modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">New Poll</h3>
              <button onClick={() => setShowModal(false)}><X size={22} className="text-gray-400 hover:text-gray-600"/></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Question *</label>
                <input required type="text" value={form.question}
                  onChange={e => setForm(p => ({...p, question: e.target.value}))}
                  placeholder="e.g. What restaurant should we go to?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent"/>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Options *</label>
                <div className="space-y-2">
                  {form.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="text" value={opt} onChange={e => setOption(i, e.target.value)}
                        placeholder={`Option ${i + 1}`}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent"/>
                      {form.options.length > 2 && (
                        <button type="button" onClick={() => removeOption(i)} className="text-gray-400 hover:text-red-500">
                          <X size={18}/>
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={addOption}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold">+ Add option</button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-300">Cancel</button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700">Create Poll</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}