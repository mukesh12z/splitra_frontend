import React, { useState } from 'react';
import { BookOpen, Copy, Check } from 'lucide-react';

/* common travel phrases + multilingual support */
const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
  { code: 'it', name: 'Italian' },
  { code: 'de', name: 'German' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ko', name: 'Korean' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ar', name: 'Arabic' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'th', name: 'Thai' }
];

const PHRASES = {
  en: [
    { category: 'Greetings',   english: 'Hello',                    phrase: 'Hello' },
    { category: 'Greetings',   english: 'Thank you',               phrase: 'Thank you' },
    { category: 'Greetings',   english: 'Goodbye',                 phrase: 'Goodbye' },
    { category: 'Food',        english: 'Where is the restaurant?',phrase: 'Where is the restaurant?' },
    { category: 'Food',        english: 'How much does this cost?', phrase: 'How much does this cost?' },
    { category: 'Food',        english: 'I am vegetarian',         phrase: 'I am vegetarian' },
    { category: 'Transport',   english: 'Where is the station?',   phrase: 'Where is the station?' },
    { category: 'Transport',   english: 'Please take me to…',     phrase: 'Please take me to…' },
    { category: 'Emergency',   english: 'I need help',             phrase: 'I need help' },
    { category: 'Emergency',   english: 'Call an ambulance',       phrase: 'Call an ambulance' },
    { category: 'Emergency',   english: 'I am lost',               phrase: 'I am lost' }
  ],
  fr: [
    { category: 'Greetings',   english: 'Hello',                    phrase: 'Bonjour' },
    { category: 'Greetings',   english: 'Thank you',               phrase: 'Merci' },
    { category: 'Greetings',   english: 'Goodbye',                 phrase: 'Au revoir' },
    { category: 'Food',        english: 'Where is the restaurant?',phrase: 'Où est le restaurant ?' },
    { category: 'Food',        english: 'How much does this cost?', phrase: 'Combien ça coûte ?' },
    { category: 'Food',        english: 'I am vegetarian',         phrase: 'Je suis végétarien(ne)' },
    { category: 'Transport',   english: 'Where is the station?',   phrase: 'Où est la gare ?' },
    { category: 'Transport',   english: 'Please take me to…',     phrase: 'Veuillez me conduire à…' },
    { category: 'Emergency',   english: 'I need help',             phrase: 'J\'ai besoin d\'aide' },
    { category: 'Emergency',   english: 'Call an ambulance',       phrase: 'Appelez une ambulance' },
    { category: 'Emergency',   english: 'I am lost',               phrase: 'Je suis perdu(e)' }
  ],
  es: [
    { category: 'Greetings',   english: 'Hello',                    phrase: 'Hola' },
    { category: 'Greetings',   english: 'Thank you',               phrase: 'Gracias' },
    { category: 'Greetings',   english: 'Goodbye',                 phrase: 'Adiós' },
    { category: 'Food',        english: 'Where is the restaurant?',phrase: '¿Dónde está el restaurante?' },
    { category: 'Food',        english: 'How much does this cost?', phrase: '¿Cuánto cuesta esto?' },
    { category: 'Food',        english: 'I am vegetarian',         phrase: 'Soy vegetariano/a' },
    { category: 'Transport',   english: 'Where is the station?',   phrase: '¿Dónde está la estación?' },
    { category: 'Transport',   english: 'Please take me to…',     phrase: 'Por favor, llévame a…' },
    { category: 'Emergency',   english: 'I need help',             phrase: 'Necesito ayuda' },
    { category: 'Emergency',   english: 'Call an ambulance',       phrase: 'Llame a una ambulancia' },
    { category: 'Emergency',   english: 'I am lost',               phrase: 'Estoy perdido/a' }
  ],
  it: [
    { category: 'Greetings',   english: 'Hello',                    phrase: 'Ciao' },
    { category: 'Greetings',   english: 'Thank you',               phrase: 'Grazie' },
    { category: 'Greetings',   english: 'Goodbye',                 phrase: 'Arrivederci' },
    { category: 'Food',        english: 'Where is the restaurant?',phrase: 'Dove è il ristorante?' },
    { category: 'Food',        english: 'How much does this cost?', phrase: 'Quanto costa?' },
    { category: 'Food',        english: 'I am vegetarian',         phrase: 'Sono vegetariano/a' },
    { category: 'Transport',   english: 'Where is the station?',   phrase: 'Dove è la stazione?' },
    { category: 'Transport',   english: 'Please take me to…',     phrase: 'Per favore portami a…' },
    { category: 'Emergency',   english: 'I need help',             phrase: 'Ho bisogno di aiuto' },
    { category: 'Emergency',   english: 'Call an ambulance',       phrase: 'Chiamate un\'ambulanza' },
    { category: 'Emergency',   english: 'I am lost',               phrase: 'Sono perso/a' }
  ],
  hi: [
    { category: 'Greetings',   english: 'Hello',                    phrase: 'नमस्ते' },
    { category: 'Greetings',   english: 'Thank you',               phrase: 'धन्यवाद' },
    { category: 'Greetings',   english: 'Goodbye',                 phrase: 'अलविदा' },
    { category: 'Food',        english: 'Where is the restaurant?',phrase: 'रेस्तरेँ कहाँ है?' },
    { category: 'Food',        english: 'How much does this cost?', phrase: 'यह कितने में मिलेगा?' },
    { category: 'Food',        english: 'I am vegetarian',         phrase: 'मैं शाकाहारी हूँ' },
    { category: 'Transport',   english: 'Where is the station?',   phrase: 'स्टेशन कहाँ है?' },
    { category: 'Transport',   english: 'Please take me to…',     phrase: 'कृपया मुझे … पर पहुँचा दें' },
    { category: 'Emergency',   english: 'I need help',             phrase: 'मुझे मदद चाहिए' },
    { category: 'Emergency',   english: 'Call an ambulance',       phrase: 'एम्बुलेंस बुलाइए' },
    { category: 'Emergency',   english: 'I am lost',               phrase: 'मैं खो गया/गई हूँ' }
  ]
};

// fallback for languages without hardcoded phrases
const FALLBACK = [
  { category: 'Greetings',   english: 'Hello',                    phrase: '—' },
  { category: 'Greetings',   english: 'Thank you',               phrase: '—' },
  { category: 'Greetings',   english: 'Goodbye',                 phrase: '—' },
  { category: 'Food',        english: 'Where is the restaurant?',phrase: '—' },
  { category: 'Food',        english: 'How much does this cost?', phrase: '—' },
  { category: 'Emergency',   english: 'I need help',             phrase: '—' },
  { category: 'Emergency',   english: 'Call an ambulance',       phrase: '—' },
  { category: 'Emergency',   english: 'I am lost',               phrase: '—' }
];

export default function LanguagePhrases() {
  const [lang,     setLang]     = useState('fr');
  const [copiedId, setCopiedId] = useState(null);

  const phrases = PHRASES[lang] || FALLBACK;
  const categories = [...new Set(phrases.map(p => p.category))];

  const copyPhrase = (phrase, idx) => {
    navigator.clipboard?.writeText(phrase);
    setCopiedId(idx);
    setTimeout(() => setCopiedId(null), 1200);
  };

  const catColors = { Greetings: 'indigo', Food: 'green', Transport: 'blue', Emergency: 'red' };
  const catBg = { indigo: 'bg-indigo-50 border-indigo-200', green: 'bg-green-50 border-green-200', blue: 'bg-blue-50 border-blue-200', red: 'bg-red-50 border-red-200' };
  const catText = { indigo: 'text-indigo-700', green: 'text-green-700', blue: 'text-blue-700', red: 'text-red-700' };

  return (
    <div className="space-y-5">
      {/* language selector */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Select Language</label>
        <select value={lang} onChange={e => setLang(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent">
          {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
        </select>
      </div>

      {/* phrases grouped by category */}
      {categories.map(cat => {
        const col = catColors[cat] || 'indigo';
        return (
          <div key={cat}>
            <h4 className={`text-sm font-bold uppercase tracking-wide mb-2 ${catText[col]}`}>{cat}</h4>
            <div className="space-y-2">
              {phrases.filter(p => p.category === cat).map((p, i) => {
                const uid = `${cat}-${i}`;
                return (
                  <div key={uid} className={`border rounded-lg p-3 ${catBg[col]}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs text-gray-500">{p.english}</p>
                        <p className={`text-base font-semibold ${catText[col]}`}>{p.phrase}</p>
                      </div>
                      <button onClick={() => copyPhrase(p.phrase, uid)}
                        className="text-gray-400 hover:text-indigo-600 transition-colors flex-shrink-0 ml-2">
                        {copiedId === uid ? <Check size={16} className="text-green-600"/> : <Copy size={16}/>}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}