// Translations for the special-request tags on the booking form.
// Tags are stored and sent in English (so admin and emails stay consistent); guests see them in their language.
// A tag typed in admin that is not listed here is shown exactly as typed.
const L = (en, it, es, fr, pt, cs, ru) => ({ en, it, es, fr, pt, cs, ru });

const TAGS = {
  'private chef':       L('Private Chef', 'Chef privato', 'Chef privado', 'Chef privé', 'Chef privado', 'Soukromý kuchař', 'Личный шеф-повар'),
  'truffle hunting':    L('Truffle Hunting', 'Ricerca del tartufo', 'Búsqueda de trufas', 'Chasse aux truffes', 'Caça às trufas', 'Hledání lanýžů', 'Охота за трюфелями'),
  'regular cleaning':   L('Regular Cleaning', 'Pulizia regolare', 'Limpieza regular', 'Ménage régulier', 'Limpeza regular', 'Pravidelný úklid', 'Регулярная уборка'),
  'wine tasting':       L('Wine Tasting', 'Degustazione di vini', 'Cata de vinos', 'Dégustation de vins', 'Prova de vinhos', 'Degustace vín', 'Дегустация вин'),
  'olive oil tour':     L('Olive Oil Tour', 'Tour dell\'olio d\'oliva', 'Tour del aceite de oliva', 'Visite de l\'huile d\'olive', 'Visita ao azeite', 'Prohlídka olivového oleje', 'Тур по оливковому маслу'),
  'airport transfer':   L('Airport Transfer', 'Transfer aeroportuale', 'Traslado al aeropuerto', 'Transfert aéroport', 'Transfer do aeroporto', 'Transfer z letiště', 'Трансфер из аэропорта'),
  'yoga sessions':      L('Yoga Sessions', 'Lezioni di yoga', 'Sesiones de yoga', 'Séances de yoga', 'Sessões de ioga', 'Lekce jógy', 'Занятия йогой'),
  'cooking class':      L('Cooking Class', 'Corso di cucina', 'Clase de cocina', 'Cours de cuisine', 'Aula de culinária', 'Kurz vaření', 'Кулинарный мастер-класс'),
  'massage':            L('Massage', 'Massaggio', 'Masaje', 'Massage', 'Massagem', 'Masáž', 'Массаж'),
  'babysitting':        L('Babysitting', 'Babysitter', 'Canguro', 'Baby-sitting', 'Babysitting', 'Hlídání dětí', 'Няня'),
  'grocery delivery':   L('Grocery Delivery', 'Consegna della spesa', 'Entrega de compras', 'Livraison de courses', 'Entrega de compras', 'Donáška nákupu', 'Доставка продуктов'),
  'car hire':           L('Car Hire', 'Noleggio auto', 'Alquiler de coche', 'Location de voiture', 'Aluguer de carro', 'Půjčení auta', 'Аренда автомобиля'),
  'birthday celebration': L('Birthday Celebration', 'Festa di compleanno', 'Celebración de cumpleaños', 'Fête d\'anniversaire', 'Festa de aniversário', 'Oslava narozenin', 'Празднование дня рождения'),
  'cycling':            L('Cycling', 'Ciclismo', 'Ciclismo', 'Vélo', 'Ciclismo', 'Cyklistika', 'Велопрогулки'),
  'horse riding':       L('Horse Riding', 'Equitazione', 'Equitación', 'Équitation', 'Equitação', 'Jízda na koni', 'Верховая езда'),
};

export function tagLabel(tag, lang = 'en') {
  const entry = TAGS[String(tag).trim().toLowerCase()];
  return (entry && entry[lang]) || tag;
}
