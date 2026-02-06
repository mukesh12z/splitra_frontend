import React, { useState, useEffect, useCallback } from 'react';
import { Plus, X, DollarSign, Users, TrendingUp, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../services/api';

/* ────────────────────────────────────────────
   CONSTANTS
   ──────────────────────────────────────────── */
const SPLIT_EQUAL      = 'equal';
const SPLIT_PERCENTAGE = 'percentage';
const SPLIT_CUSTOM     = 'custom';

const CATEGORIES = ['Food', 'Transport', 'Accommodation', 'Activities', 'Shopping', 'Other'];

/* ────────────────────────────────────────────
   HELPER – greedy settlement algorithm
   ──────────────────────────────────────────── */
function computeSettlements(expenses, members) {
  const balances = {};
  members.forEach(m => { balances[m.id] = 0; });

  expenses.forEach(exp => {
    (exp.ExpenseSplits || []).forEach(split => {
      if (split.userId !== exp.paidBy) {
        balances[split.userId] = (balances[split.userId] || 0) - split.amount;
        balances[exp.paidBy]    = (balances[exp.paidBy]    || 0) + split.amount;
      }
    });
  });

  const debtors   = [];
  const creditors = [];
  Object.entries(balances).forEach(([id, bal]) => {
    if (bal < -0.01)  debtors.push  ({ userId: id, amount: Math.abs(bal) });
    else if (bal > 0.01) creditors.push({ userId: id, amount: bal });
  });

  const out = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amt = Math.min(debtors[i].amount, creditors[j].amount);
    if (amt > 0.01) out.push({ from: debtors[i].userId, to: creditors[j].userId, amount: amt });
    debtors[i].amount   -= amt;
    creditors[j].amount -= amt;
    if (debtors[i].amount   < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }
  return out;
}

/* ════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════ */
export default function ExpensesTab({ group, currentUser }) {
  /* ── state ── */
  const [expenses,    setExpenses]    = useState([]);
  const [members,     setMembers]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [settlements, setSettlements] = useState([]);
  const [showModal,   setShowModal]   = useState(false);
  const [expandedId,  setExpandedId]  = useState(null);

  /* ── form state ── */
  const blankForm = useCallback(() => ({
    description : '',
    amount      : '',
    category    : 'Food',
    paidBy      : currentUser.id,
    splitType   : SPLIT_EQUAL,
    equalMembers: [],   // equal mode only
    pctMap      : {},   // percentage mode only
    customMap   : {}    // custom $ mode only
  }), [currentUser.id]);

  const [form, setForm] = useState(blankForm);

  /* ── fetch ── */
  useEffect(() => { fetchExpenses(); fetchMembers(); }, [group.id]);

  useEffect(() => {
    if (members.length > 0) setSettlements(computeSettlements(expenses, members));
  }, [expenses, members]);

  const fetchExpenses = async () => {
    try {
      const { data } = await api.get(`/expenses/group/${group.id}`);
      setExpenses(data);
    } catch (e) { console.error(e); }
    finally     { setLoading(false); }
  };

  const fetchMembers = async () => {
    try {
      const { data } = await api.get(`/groups/${group.id}`);
      const raw  = data.GroupMembers || data.members || [];
      const list = raw.map(m => m.user || m.User || m);
      setMembers(list);
    } catch (e) { console.error(e); }
  };

  /* ── helpers ── */
  const getMemberName = id => {
    const m = members.find(m => m.id === id);
    return m?.name || m?.email || 'Unknown';
  };

  /* ── modal open — NOTHING checked, splitType defaults to equal but list stays empty ── */
  const openModal = () => {
    setForm({
      ...blankForm(),
      equalMembers: [],
      pctMap      : {},
      customMap   : {}
    });
    setShowModal(true);
  };

  /* ── SWITCH SPLIT TYPE ──
     Rules:
       • Clicking 50/50      → auto-check ALL members; clear pct & custom
       • Clicking By %       → seed fair-share for ALL; clear equal & custom
       • Clicking Custom $   → seed empty entries (none active); clear equal & pct
     Only the ACTIVE tab's data survives. The other two are wiped.
  */
  const switchSplitType = (newType) => {
    setForm(prev => {
      const count = members.length || 1;
      const fair  = parseFloat((100 / count).toFixed(2));

      let equalMembers = [];
      let pctMap       = {};
      let customMap    = {};

      if (newType === SPLIT_EQUAL) {
        equalMembers = members.map(m => m.id);   // auto-check all
      } else if (newType === SPLIT_PERCENTAGE) {
        members.forEach(m => { pctMap[m.id] = fair; });
      } else {
        // custom — all members appear but none are active (value = '')
        members.forEach(m => { customMap[m.id] = ''; });
      }

      return { ...prev, splitType: newType, equalMembers, pctMap, customMap };
    });
  };

  /* ── EQUAL: toggle one member ── */
  const toggleEqualMember = (id) => {
    setForm(prev => ({
      ...prev,
      equalMembers: prev.equalMembers.includes(id)
        ? prev.equalMembers.filter(x => x !== id)
        : [...prev.equalMembers, id]
    }));
  };

  /* ── PERCENTAGE: toggle in/out — redistributes fair share ── */
  const togglePctMember = (id) => {
    setForm(prev => {
      const isActive    = (prev.pctMap[id] || 0) > 0;
      const otherActive = Object.keys(prev.pctMap).filter(uid => uid !== id && prev.pctMap[uid] > 0);
      const newActive   = isActive ? otherActive : [...otherActive, id];
      const count       = newActive.length || 1;
      const fair        = parseFloat((100 / count).toFixed(2));
      const pctM        = {};
      members.forEach(m => { pctM[m.id] = newActive.includes(m.id) ? fair : 0; });
      return { ...prev, pctMap: pctM };
    });
  };

  /* ── PERCENTAGE: edit one value — remainder goes evenly to others ── */
  const setPctValue = (id, rawVal) => {
    const val = Math.max(0, Math.min(100, parseFloat(rawVal) || 0));
    setForm(prev => {
      const others    = Object.keys(prev.pctMap).filter(uid => uid !== id && prev.pctMap[uid] > 0);
      const remaining = Math.max(0, 100 - val);
      const perOther  = others.length ? parseFloat((remaining / others.length).toFixed(2)) : 0;
      const pctM      = { ...prev.pctMap, [id]: val };
      others.forEach(uid => { pctM[uid] = perOther; });
      return { ...prev, pctMap: pctM };
    });
  };

  /* ── CUSTOM $: toggle active / inactive ── */
  const toggleCustomMember = (id) => {
    setForm(prev => {
      const cusM     = { ...prev.customMap };
      const isActive = cusM[id] !== '' && cusM[id] !== undefined;
      cusM[id] = isActive ? '' : '0';   // '' = inactive slot; '0' = active, zero dollars
      return { ...prev, customMap: cusM };
    });
  };

  /* ── CUSTOM $: update dollar value ── */
  const setCustomValue = (id, value) => {
    setForm(prev => ({ ...prev, customMap: { ...prev.customMap, [id]: value } }));
  };

  /* ── validation ── */
  const totalAmount = parseFloat(form.amount) || 0;

  const pctTotal         = Object.values(form.pctMap).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const isPctValid       = Math.abs(pctTotal - 100) < 0.1 && Object.values(form.pctMap).some(v => v > 0);
  const activePctMembers = Object.entries(form.pctMap).filter(([, v]) => v > 0);

  const activeCustomEntries = Object.entries(form.customMap).filter(([, v]) => v !== '' && v !== undefined);
  const customTotal         = activeCustomEntries.reduce((s, [, v]) => s + (parseFloat(v) || 0), 0);
  const isCustomValid       = totalAmount > 0
    && Math.abs(customTotal - totalAmount) < 0.01
    && activeCustomEntries.some(([, v]) => parseFloat(v) > 0);

  const formValid =
    form.description && totalAmount > 0 && (
      (form.splitType === SPLIT_EQUAL      && form.equalMembers.length > 0)  ||
      (form.splitType === SPLIT_PERCENTAGE && isPctValid)                     ||
      (form.splitType === SPLIT_CUSTOM     && isCustomValid)
    );

  /* ── submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formValid) return;

    try {
      const payload = {
        groupId     : group.id,
        description : form.description,
        amount      : totalAmount,
        category    : form.category,
        paidBy      : form.paidBy,
        splitType   : form.splitType
      };

      if (form.splitType === SPLIT_EQUAL) {
        payload.splitWith = form.equalMembers;
      } else if (form.splitType === SPLIT_PERCENTAGE) {
        payload.customSplits = activePctMembers.map(([uid, pct]) => ({
          userId    : uid,
          percentage : parseFloat(pct),
          amount     : parseFloat(((totalAmount * parseFloat(pct)) / 100).toFixed(2))
        }));
      } else {
        payload.customSplits = activeCustomEntries
          .filter(([, v]) => parseFloat(v) > 0)
          .map(([uid, amt]) => ({
            userId    : uid,
            amount     : parseFloat(amt),
            percentage : parseFloat(((parseFloat(amt) / totalAmount) * 100).toFixed(2))
          }));
      }

      await api.post('/expenses', payload);
      await fetchExpenses();
      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to add expense');
    }
  };

  /* ── delete ── */
  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      setExpenses(prev => prev.filter(e => e.id !== id));
    } catch (err) { alert(err.response?.data?.error || 'Failed to delete'); }
  };

  /* ── totals ── */
  const totalExpenses = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);

  /* ════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════ */
  if (loading) return <div className="text-center py-8 text-gray-500">Loading expenses…</div>;

  return (
    <div className="space-y-6">

      {/* ── summary cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard color="green"  icon={<DollarSign size={24}/>}  label="Total Expenses"  value={`$${totalExpenses.toFixed(2)}`} />
        <SummaryCard color="blue"   icon={<Users size={24}/>}       label="Per Person"      value={`$${members.length ? (totalExpenses/members.length).toFixed(2) : '0.00'}`} />
        <SummaryCard color="purple" icon={<TrendingUp size={24}/>}  label="Transactions"    value={expenses.length} />
      </div>

      {/* ── settlement bar ── */}
      {settlements.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-5">
          <h3 className="text-lg font-bold text-gray-800 mb-3">💸 Settlement Summary</h3>
          <div className="space-y-2">
            {settlements.map((s, i) => (
              <div key={i} className="flex items-center gap-3 bg-white px-4 py-3 rounded-lg shadow-sm">
                <span className="font-semibold text-gray-700 flex-1">{getMemberName(s.from)}</span>
                <span className="text-gray-400 text-sm">owes</span>
                <span className="font-semibold text-gray-700 flex-1 text-right">{getMemberName(s.to)}</span>
                <span className="text-xl font-bold text-green-600 ml-2">${s.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── list header ── */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800">All Expenses</h3>
        <button onClick={openModal} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          <Plus size={20}/> Add Expense
        </button>
      </div>

      {/* ── expense cards ── */}
      {expenses.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <DollarSign size={48} className="mx-auto text-gray-300 mb-3"/>
          <p className="text-gray-500">No expenses yet. Add your first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {expenses.map(exp => {
            const splits   = exp.ExpenseSplits || [];
            const expanded = expandedId === exp.id;
            return (
              <div key={exp.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">{exp.category}</span>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold capitalize">{exp.splitType} split</span>
                      <h4 className="font-semibold text-gray-800">{exp.description}</h4>
                    </div>
                    <p className="text-sm text-gray-500">
                      Paid by <span className="font-semibold text-gray-700">{getMemberName(exp.paidBy)}</span>
                      {' • '}{new Date(exp.date).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-start gap-3 ml-4 shrink-0">
                    <div className="text-right">
                      <div className="text-xl font-bold text-green-600">${parseFloat(exp.amount).toFixed(2)}</div>
                      {splits.length > 0 && (
                        <div className="text-xs text-gray-400">{splits.length} person{splits.length > 1 ? 's' : ''}</div>
                      )}
                    </div>
                    {splits.length > 0 && (
                      <button onClick={() => setExpandedId(expanded ? null : exp.id)} className="text-gray-400 hover:text-indigo-600 mt-0.5">
                        {expanded ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                      </button>
                    )}
                    <button onClick={() => handleDelete(exp.id)} className="text-gray-300 hover:text-red-500 mt-0.5">
                      <Trash2 size={18}/>
                    </button>
                  </div>
                </div>

                {expanded && splits.length > 0 && (
                  <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 space-y-1.5">
                    {splits.map((s, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 font-medium">{getMemberName(s.userId)}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-gray-400">{parseFloat(s.percentage).toFixed(1)}%</span>
                          <span className="font-semibold text-gray-800 w-20 text-right">${parseFloat(s.amount).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ════════════════════════════════════════
          ADD-EXPENSE MODAL
          ════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">

            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-gray-800">Add Expense</h3>
              <button onClick={() => setShowModal(false)}><X size={22} className="text-gray-400 hover:text-gray-600"/></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* description */}
              <Field label="Description *">
                <input required type="text" value={form.description}
                  onChange={e => setForm(p => ({...p, description: e.target.value}))}
                  placeholder="What was this expense for?"
                  className={INPUT}/>
              </Field>

              {/* amount + category */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Amount *">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
                    <input required type="number" step="0.01" min="0" value={form.amount}
                      onChange={e => setForm(p => ({...p, amount: e.target.value}))}
                      placeholder="0.00"
                      className={`${INPUT} pl-7`}/>
                  </div>
                </Field>
                <Field label="Category">
                  <select value={form.category} onChange={e => setForm(p => ({...p, category: e.target.value}))} className={INPUT}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
              </div>

              {/* paid by */}
              <Field label="Paid By">
                <select value={form.paidBy} onChange={e => setForm(p => ({...p, paidBy: e.target.value}))} className={INPUT}>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name || m.email}</option>)}
                </select>
              </Field>

              {/* ── SPLIT TYPE SELECTOR ── */}
              <Field label="Split Type">
                <div className="flex gap-2">
                  {[
                    [SPLIT_EQUAL,      '50/50'],
                    [SPLIT_PERCENTAGE, 'By %'],
                    [SPLIT_CUSTOM,     'Custom $']
                  ].map(([val, label]) => (
                    <button key={val} type="button"
                      onClick={() => switchSplitType(val)}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                        form.splitType === val
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </Field>

              {/* ────── EQUAL (50/50) ────── */}
              {form.splitType === SPLIT_EQUAL && (
                <Field label="Split With">
                  <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                    {members.map(m => (
                      <label key={m.id} className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={form.equalMembers.includes(m.id)}
                            onChange={() => toggleEqualMember(m.id)}
                            className="w-4 h-4 accent-indigo-600"/>
                          <span className="text-sm text-gray-700">{m.name || m.email}</span>
                        </div>
                        {form.equalMembers.includes(m.id) && form.amount && (
                          <span className="text-xs text-gray-400">${(totalAmount / form.equalMembers.length).toFixed(2)}</span>
                        )}
                      </label>
                    ))}
                  </div>
                </Field>
              )}

              {/* ────── PERCENTAGE ────── */}
              {form.splitType === SPLIT_PERCENTAGE && (
                <Field label={
                  <span>Split By Percentage
                    <span className={`ml-2 text-xs font-semibold ${isPctValid ? 'text-green-600' : 'text-red-500'}`}>
                      {pctTotal.toFixed(1)}% / 100%
                    </span>
                  </span>
                }>
                  <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                    {members.map(m => {
                      const pct    = form.pctMap[m.id] || 0;
                      const active = pct > 0;
                      return (
                        <div key={m.id} className="flex items-center gap-3 px-3 py-2">
                          <label className="flex items-center gap-2 flex-1 cursor-pointer">
                            <input type="checkbox" checked={active}
                              onChange={() => togglePctMember(m.id)}
                              className="w-4 h-4 accent-indigo-600"/>
                            <span className="text-sm text-gray-700">{m.name || m.email}</span>
                          </label>
                          {active && (
                            <>
                              <div className="flex items-center gap-1 w-28">
                                <input type="number" min="0" max="100" step="0.1"
                                  value={pct}
                                  onChange={e => setPctValue(m.id, e.target.value)}
                                  className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-right focus:ring-2 focus:ring-indigo-400 focus:border-transparent"/>
                                <span className="text-gray-500 text-sm">%</span>
                              </div>
                              {form.amount && (
                                <span className="text-xs text-gray-400 w-16 text-right">
                                  ${((totalAmount * pct) / 100).toFixed(2)}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Field>
              )}

              {/* ────── CUSTOM AMOUNT ────── */}
              {form.splitType === SPLIT_CUSTOM && (
                <Field label={
                  <span>Custom Amounts
                    <span className={`ml-2 text-xs font-semibold ${isCustomValid ? 'text-green-600' : 'text-red-500'}`}>
                      ${customTotal.toFixed(2)} / ${totalAmount.toFixed(2)}
                    </span>
                  </span>
                }>
                  <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                    {members.map(m => {
                      const isActive = form.customMap[m.id] !== '' && form.customMap[m.id] !== undefined;
                      return (
                        <div key={m.id} className="flex items-center gap-3 px-3 py-2">
                          <label className="flex items-center gap-2 flex-1 cursor-pointer">
                            <input type="checkbox" checked={isActive}
                              onChange={() => toggleCustomMember(m.id)}
                              className="w-4 h-4 accent-indigo-600"/>
                            <span className="text-sm text-gray-700">{m.name || m.email}</span>
                          </label>
                          {isActive && (
                            <div className="flex items-center gap-1 w-28">
                              <span className="text-gray-500 text-sm">$</span>
                              <input type="number" min="0" step="0.01"
                                value={form.customMap[m.id]}
                                onChange={e => setCustomValue(m.id, e.target.value)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right focus:ring-2 focus:ring-indigo-400 focus:border-transparent"/>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Field>
              )}

              {/* ── action buttons ── */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300">
                  Cancel
                </button>
                <button type="submit" disabled={!formValid}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed">
                  Add Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── tiny reusable pieces ── */
const INPUT = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent';

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function SummaryCard({ color, icon, label, value }) {
  const bg = { green: 'from-green-50 to-green-100', blue: 'from-blue-50 to-blue-100', purple: 'from-purple-50 to-purple-100' };
  const tc = { green: 'text-green-600', blue: 'text-blue-600', purple: 'text-purple-600' };
  return (
    <div className={`bg-gradient-to-br ${bg[color]} p-5 rounded-lg`}>
      <div className={`flex items-center gap-2 mb-1 ${tc[color]}`}>{icon}<span className="font-semibold text-gray-700">{label}</span></div>
      <p className={`text-3xl font-bold ${tc[color]}`}>{value}</p>
    </div>
  );
}