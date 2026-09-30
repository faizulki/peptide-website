// One-off migration: fills in Swedish translations for existing products
// and FAQs, matched by (stable) English name/question text. Safe to
// re-run — it only ever sets the *Sv columns, never touches English content.
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = process.env.DB_PATH || 'database.sqlite';

const STANDARD_USAGE_SV =
  'Endast för laboratorieforskning. Rekonstituera med den medföljande bakteriostatiska vattnet enligt standardprotokoll för laboratorier.';
const EXTENDED_USAGE_SV =
  STANDARD_USAGE_SV +
  ' Skaka inte flaskan efter rekonstituering, se videon "Så rekonstituerar du" för instruktioner.';
const STORAGE_SV =
  'Förvara den frystorkade flaskan fryst vid -20°C. Efter rekonstituering, förvara kylt vid 2-8°C.';
const WARNINGS_SV = [
  'Endast för laboratorieforskning',
  'Ej för användning på människor eller djur',
  'Ej godkänd för konsumtion av människor',
];

const products = [
  {
    name: 'Retatrutide 1mg Research Kit',
    nameSv: 'Retatrutide 1mg Forskningskit',
    shortDescriptionSv: 'Trippel-agonist peptidkit — 1 mg flaska, bakteriostatiskt vatten, 1 spruta',
    descriptionSv:
      'Retatrutide är en trippel-agonistpeptid (GLP-1/GIP/glukagonreceptor) som omnämns i metabol forskningslitteratur. Detta kit innehåller en 1 mg-flaska, en tillhörande flaska bakteriostatiskt vatten för rekonstituering samt en spruta.',
    specificationsSv: [
      'Peptid: Retatrutide',
      'Flaskstorlek: 1 mg',
      'Kitet innehåller: 1x flaska bakteriostatiskt vatten, 1x spruta',
      'Renhet: se Certificate of Analysis',
    ],
    usageSv: STANDARD_USAGE_SV,
    storageSv: STORAGE_SV,
    warningsSv: WARNINGS_SV,
  },
  {
    name: 'Retatrutide 10mg Research Kit',
    nameSv: 'Retatrutide 10mg Forskningskit',
    shortDescriptionSv: 'Trippel-agonist peptidkit — 10 mg flaska, bakteriostatiskt vatten, 3 sprutor',
    descriptionSv:
      'Retatrutide är en trippel-agonistpeptid (GLP-1/GIP/glukagonreceptor) som omnämns i metabol forskningslitteratur. Detta kit innehåller en 10 mg-flaska, en tillhörande flaska bakteriostatiskt vatten för rekonstituering samt 3 sprutor.',
    specificationsSv: [
      'Peptid: Retatrutide',
      'Flaskstorlek: 10 mg',
      'Kitet innehåller: 1x flaska bakteriostatiskt vatten, 3x sprutor',
      'Renhet: se Certificate of Analysis',
    ],
    usageSv: STANDARD_USAGE_SV,
    storageSv: STORAGE_SV,
    warningsSv: WARNINGS_SV,
  },
  {
    name: 'Tirzepatide 10mg Research Kit',
    nameSv: 'Tirzepatide 10mg Forskningskit',
    shortDescriptionSv: 'Dubbel GIP/GLP-1-agonistkit — 10 mg flaska, bakteriostatiskt vatten, 3 sprutor',
    descriptionSv:
      'Tirzepatide är en dubbel GIP/GLP-1-receptoragonistpeptid som omnämns i metabol forskningslitteratur. Detta kit innehåller en 10 mg-flaska, en tillhörande flaska bakteriostatiskt vatten för rekonstituering samt 3 sprutor.',
    specificationsSv: [
      'Peptid: Tirzepatide',
      'Flaskstorlek: 10 mg',
      'Kitet innehåller: 1x flaska bakteriostatiskt vatten, 3x sprutor',
      'Renhet: se Certificate of Analysis',
    ],
    usageSv: STANDARD_USAGE_SV,
    storageSv: STORAGE_SV,
    warningsSv: WARNINGS_SV,
  },
  {
    name: 'Semaglutide (Ozempic) 10mg Research Kit',
    nameSv: 'Semaglutide (Ozempic) 10mg Forskningskit',
    shortDescriptionSv: 'GLP-1-agonist peptidkit — 10 mg flaska, bakteriostatiskt vatten, 3 sprutor',
    descriptionSv:
      'Semaglutide är en GLP-1-receptoragonistpeptid som ofta omnämns i metabol forskningslitteratur. Detta kit innehåller en 10 mg-flaska, en tillhörande flaska bakteriostatiskt vatten för rekonstituering samt 3 sprutor.',
    specificationsSv: [
      'Peptid: Semaglutide',
      'Flaskstorlek: 10 mg',
      'Kitet innehåller: 1x flaska bakteriostatiskt vatten, 3x sprutor',
      'Renhet: se Certificate of Analysis',
    ],
    usageSv: STANDARD_USAGE_SV,
    storageSv: STORAGE_SV,
    warningsSv: WARNINGS_SV,
  },
  {
    name: 'Glow Peptide 70mg Blend Kit',
    nameSv: 'Glow Peptide 70mg Blandningskit',
    shortDescriptionSv: 'Multi-peptid forskningsblandning — 70 mg flaska, bakteriostatiskt vatten, 5 sprutor',
    descriptionSv:
      'Glow är en multi-peptidblandning som omnämns inom kosmetisk forskning och forskning om vävnadsstöd. Detta kit innehåller en 70 mg-flaska, en tillhörande flaska bakteriostatiskt vatten för rekonstituering samt 5 sprutor.',
    specificationsSv: [
      'Blandning: Glow',
      'Flaskstorlek: 70 mg',
      'Kitet innehåller: 1x flaska bakteriostatiskt vatten, 5x sprutor samt en 70 mg Glow-flaska (GHK-CU/BPC157/TB500 50mg/10mg/10mg)',
      'Renhet: se Certificate of Analysis',
    ],
    usageSv: STANDARD_USAGE_SV,
    storageSv: STORAGE_SV,
    warningsSv: WARNINGS_SV,
  },
  {
    name: 'Klow Peptide 70mg Blend Kit',
    nameSv: 'Klow Peptide 70mg Blandningskit',
    shortDescriptionSv: 'Multi-peptid forskningsblandning — 70 mg flaska, bakteriostatiskt vatten, 5 sprutor',
    descriptionSv:
      'Klow är en multi-peptidblandning som omnämns inom kosmetisk forskning och forskning om pigmenteringsvägar. Detta kit innehåller en 70 mg-flaska, en tillhörande flaska bakteriostatiskt vatten för rekonstituering samt 5 sprutor.',
    specificationsSv: [
      'Blandning: Klow',
      'Flaskstorlek: 70 mg',
      'Kitet innehåller: 1x flaska bakteriostatiskt vatten, 5x sprutor',
      'Renhet: se Certificate of Analysis',
    ],
    usageSv: STANDARD_USAGE_SV,
    storageSv: STORAGE_SV,
    warningsSv: WARNINGS_SV,
  },
  {
    name: 'Klow Peptide 80mg Blend Kit',
    nameSv: 'Klow Peptide 80mg Blandningskit',
    shortDescriptionSv: 'Multi-peptid forskningsblandning — 80 mg flaska, bakteriostatiskt vatten, 5 sprutor',
    descriptionSv:
      'Klow är en multi-peptidblandning som omnämns inom kosmetisk forskning och forskning om pigmenteringsvägar. Detta kit innehåller en 80 mg-flaska, en tillhörande flaska bakteriostatiskt vatten för rekonstituering samt 5 sprutor.',
    specificationsSv: [
      'Blandning: Klow',
      'Flaskstorlek: 80 mg',
      'Kitet innehåller: 1x flaska bakteriostatiskt vatten, 5x sprutor samt en 80 mg Klow-flaska (GHK-CU/BPC157/TB500/KPV 50mg/10mg/10mg/10mg)',
      'Renhet: se Certificate of Analysis',
    ],
    usageSv: STANDARD_USAGE_SV,
    storageSv: STORAGE_SV,
    warningsSv: WARNINGS_SV,
  },
  {
    name: 'TEST - $1 Payment Check',
    nameSv: 'TEST - $1 betalningskontroll',
    shortDescriptionSv: 'Internt testobjekt, $1, endast för betalningstestning',
    descriptionSv:
      'Intern testprodukt som används för att verifiera betalningsflödet från start till slut. Ingen riktig produkt – kan raderas säkert efter testning.',
    specificationsSv: [],
    usageSv: '',
    storageSv: '',
    warningsSv: ['Intern testprodukt - ej för försäljning'],
  },
  {
    name: 'Retatrutide package 5 x 1mg Research Kit',
    nameSv: 'Retatrutide-paket 5 x 1mg Forskningskit',
    shortDescriptionSv: 'Trippel-agonist peptidkit — 5 x 1 mg flaska, bakteriostatiskt vatten, 2 sprutor',
    descriptionSv:
      'Retatrutide är en trippel-agonistpeptid (GLP-1/GIP/glukagonreceptor) som omnämns i metabol forskningslitteratur. Detta kit innehåller 5 x 1 mg-flaskor, en tillhörande flaska bakteriostatiskt vatten för rekonstituering samt 2 sprutor.',
    specificationsSv: [
      'Peptid: Retatrutide',
      'Flaskstorlek: 5 x 1 mg',
      'Kitet innehåller: 1 x flaska bakteriostatiskt vatten, 2 x sprutor, 5 x 1 mg Retatrutide-flaskor',
      'Renhet: se Certificate of Analysis',
    ],
    usageSv: STANDARD_USAGE_SV,
    storageSv: STORAGE_SV,
    warningsSv: WARNINGS_SV,
  },
  {
    name: 'Retatrutide 10 x 1mg Research Kit',
    nameSv: 'Retatrutide 10 x 1mg Forskningskit',
    shortDescriptionSv: 'Trippel-agonist peptidkit — 10 x 1 mg flaska, 2 x bakteriostatiskt vatten, 3 sprutor',
    descriptionSv:
      'Retatrutide är en trippel-agonistpeptid (GLP-1/GIP/glukagonreceptor) som omnämns i metabol forskningslitteratur. Detta kit innehåller 10 x 1 mg-flaskor, 2 x tillhörande flaskor bakteriostatiskt vatten för rekonstituering samt 2 sprutor.',
    specificationsSv: [
      'Peptid: Retatrutide',
      'Flaskstorlek: 1 mg',
      'Kitet innehåller: 1x flaska bakteriostatiskt vatten, 1x spruta, 10 x 1 mg Retatrutide-flaskor',
      'Renhet: se Certificate of Analysis',
    ],
    usageSv: STANDARD_USAGE_SV,
    storageSv: STORAGE_SV,
    warningsSv: WARNINGS_SV,
  },
  {
    name: 'Retatrutide 10 mg Research Kit',
    nameSv: 'Retatrutide 10 mg Forskningskit',
    shortDescriptionSv: 'Trippel-agonist peptidkit — 10 mg flaska, bakteriostatiskt vatten, 3 sprutor',
    descriptionSv:
      'Retatrutide är en trippel-agonistpeptid (GLP-1/GIP/glukagonreceptor) som omnämns i metabol forskningslitteratur. Detta kit innehåller en 10 mg-flaska, en tillhörande flaska bakteriostatiskt vatten för rekonstituering samt 3x sprutor.',
    specificationsSv: [
      'Peptid: Retatrutide',
      'Flaskstorlek: 10 mg',
      'Kitet innehåller: flaska bakteriostatiskt vatten, 3x sprutor, 10 mg Retatrutide-flaska',
      'Renhet: se Certificate of Analysis',
    ],
    usageSv: STANDARD_USAGE_SV,
    storageSv: STORAGE_SV,
    warningsSv: WARNINGS_SV,
  },
  {
    name: 'Semaglutide 1mg Research Kit',
    nameSv: 'Semaglutide 1mg Forskningskit',
    shortDescriptionSv: 'GLP-1-agonist peptidkit — 1 mg flaska, bakteriostatiskt vatten, 1 spruta',
    descriptionSv:
      'Semaglutide är en GLP-1-receptoragonistpeptid som ofta omnämns i metabol forskningslitteratur. Detta kit innehåller en 1 mg-flaska, en tillhörande flaska bakteriostatiskt vatten för rekonstituering samt en spruta.',
    specificationsSv: [
      'Peptid: Semaglutide',
      'Flaskstorlek: 1 mg',
      'Kitet innehåller: 1x flaska bakteriostatiskt vatten, 1x spruta, 1x Semaglutide-flaska',
      'Renhet: se Certificate of Analysis',
    ],
    usageSv: EXTENDED_USAGE_SV,
    storageSv: STORAGE_SV,
    warningsSv: WARNINGS_SV,
  },
  {
    name: 'Semaglutide (Ozempic) 5 x 1mg Research Kit',
    nameSv: 'Semaglutide (Ozempic) 5 x 1mg Forskningskit',
    shortDescriptionSv: 'GLP-1-agonist peptidkit — 5 x 1 mg flaskor, bakteriostatiskt vatten, 2 sprutor',
    descriptionSv:
      'Semaglutide är en GLP-1-receptoragonistpeptid som ofta omnämns i metabol forskningslitteratur. Detta kit innehåller 5 x 1 mg-flaskor, en tillhörande flaska bakteriostatiskt vatten för rekonstituering samt 2 sprutor.',
    specificationsSv: [
      'Peptid: Semaglutide',
      'Flaskstorlek: 1 mg',
      'Kitet innehåller: 1x flaska bakteriostatiskt vatten, 2x sprutor och 5 x 1 mg Semaglutide-flaskor.',
      'Renhet: se Certificate of Analysis',
    ],
    usageSv: EXTENDED_USAGE_SV,
    storageSv: STORAGE_SV,
    warningsSv: WARNINGS_SV,
  },
  {
    name: 'Semaglutide (Ozempic) 10 x 1mg Research Kit',
    nameSv: 'Semaglutide (Ozempic) 10 x 1mg Forskningskit',
    shortDescriptionSv: 'GLP-1-agonist peptidkit — 10 x 1 mg flaskor, 2x bakteriostatiskt vatten, 3x sprutor.',
    descriptionSv:
      'Semaglutide är en GLP-1-receptoragonistpeptid som ofta omnämns i metabol forskningslitteratur. Detta kit innehåller 10 x 1 mg-flaskor, 2x tillhörande flaskor bakteriostatiskt vatten för rekonstituering samt 3x sprutor.',
    specificationsSv: [
      'Peptid: Semaglutide',
      'Flaskstorlek: 1 mg',
      'Kitet innehåller: 2x flaska bakteriostatiskt vatten, 3x sprutor och 10 x 1 mg Semaglutide-flaskor.',
      'Renhet: se Certificate of Analysis',
    ],
    usageSv: EXTENDED_USAGE_SV,
    storageSv: STORAGE_SV,
    warningsSv: WARNINGS_SV,
  },
  {
    name: 'Tirzepatide 1mg Research Kit',
    nameSv: 'Tirzepatide 1mg Forskningskit',
    shortDescriptionSv: 'Dubbel GIP/GLP-1-agonistkit — 1 mg flaska, bakteriostatiskt vatten, en spruta',
    descriptionSv:
      'Tirzepatide är en dubbel GIP/GLP-1-receptoragonistpeptid som omnämns i metabol forskningslitteratur. Detta kit innehåller en 1 mg-flaska, en tillhörande flaska bakteriostatiskt vatten för rekonstituering samt en spruta.',
    specificationsSv: [
      'Peptid: Tirzepatide',
      'Flaskstorlek: 1 mg',
      'Kitet innehåller: 1x flaska bakteriostatiskt vatten, 1x spruta och 1x Tirzepatide 1 mg-flaska',
      'Renhet: se Certificate of Analysis',
    ],
    usageSv: EXTENDED_USAGE_SV,
    storageSv: STORAGE_SV,
    warningsSv: WARNINGS_SV,
  },
  {
    name: 'Tirzepatide 5 x 1mg Research Kit',
    nameSv: 'Tirzepatide 5 x 1mg Forskningskit',
    shortDescriptionSv: 'Dubbel GIP/GLP-1-agonistkit — 5 x 1 mg flaska, bakteriostatiskt vatten, 2x sprutor',
    descriptionSv:
      'Tirzepatide är en dubbel GIP/GLP-1-receptoragonistpeptid som omnämns i metabol forskningslitteratur. Detta kit innehåller 5 x 1 mg-flaskor, en tillhörande flaska bakteriostatiskt vatten för rekonstituering samt 2x sprutor.',
    specificationsSv: [
      'Peptid: Tirzepatide',
      'Flaskstorlek: 1 mg',
      'Kitet innehåller: 1x flaska bakteriostatiskt vatten, 2x sprutor och 5x Tirzepatide 1 mg-flaskor',
      'Renhet: se Certificate of Analysis',
    ],
    usageSv: EXTENDED_USAGE_SV,
    storageSv: STORAGE_SV,
    warningsSv: WARNINGS_SV,
  },
  {
    name: 'Tirzepatide 10 x 1mg Research Kit',
    nameSv: 'Tirzepatide 10 x 1mg Forskningskit',
    shortDescriptionSv: 'Dubbel GIP/GLP-1-agonistkit — 10 x 1 mg flaskor, 2x bakteriostatiskt vatten, 3x sprutor',
    descriptionSv:
      'Tirzepatide är en dubbel GIP/GLP-1-receptoragonistpeptid som omnämns i metabol forskningslitteratur. Detta kit innehåller 10 x 1 mg-flaskor, 2x tillhörande flaskor bakteriostatiskt vatten för rekonstituering samt 3x sprutor.',
    specificationsSv: [
      'Peptid: Tirzepatide',
      'Flaskstorlek: 1 mg',
      'Kitet innehåller: 2x flaska bakteriostatiskt vatten, 3x sprutor och 10x Tirzepatide 1 mg-flaskor',
      'Renhet: se Certificate of Analysis',
    ],
    usageSv: EXTENDED_USAGE_SV,
    storageSv: STORAGE_SV,
    warningsSv: WARNINGS_SV,
  },
];

const faqs = [
  {
    question: 'What are peptides?',
    questionSv: 'Vad är peptider?',
    answerSv:
      'Peptider är korta kedjor av aminosyror som spelar olika roller i biologiska processer. De används inom forskning och har potentiella tillämpningar inom hälsa och välbefinnande.',
  },
  {
    question: 'Are your products safe?',
    questionSv: 'Är era produkter säkra?',
    answerSv:
      'Alla våra produkter tillverkas i certifierade anläggningar och genomgår rigorös kvalitetskontroll. Våra produkter är dock endast avsedda för forskningsändamål och inte för konsumtion av människor om det inte godkänts av relevanta myndigheter.',
  },
  {
    question: 'How do I store peptides?',
    questionSv: 'Hur förvarar jag peptider?',
    answerSv:
      'De flesta peptider bör förvaras i frys vid -20°C. Följ alltid de specifika förvaringsinstruktionerna som medföljer varje produkt. Skydda mot ljus och fukt.',
  },
  {
    question: 'What payment methods do you accept?',
    questionSv: 'Vilka betalningsmetoder accepterar ni?',
    answerSv:
      'Vi tar emot betalningar via vår säkra betalningslösning, som stöder kortbetalningar (inklusive lokala alternativ som Klarna) samt direkta kryptobetalningar.',
  },
  {
    question: 'How long does shipping take?',
    questionSv: 'Hur lång tid tar leveransen?',
    answerSv:
      'Leveranstiden varierar beroende på var du befinner dig. Vanligtvis behandlas beställningar inom 1-2 arbetsdagar, och leveransen tar 3-7 arbetsdagar för inrikes beställningar.',
  },
  {
    question: 'Can I return or refund my order?',
    questionSv: 'Kan jag returnera eller få återbetalning för min beställning?',
    answerSv:
      'Vi accepterar returer inom 30 dagar från köpet för oöppnade produkter i originalförpackning. Kontakta vårt supportteam för att påbörja en retur.',
  },
  {
    question: 'Do you ship internationally?',
    questionSv: 'Levererar ni internationellt?',
    answerSv:
      'Ja, vi levererar till många länder världen över. Fraktkostnader och leveranstider varierar beroende på plats. Kontrollera vid kassan vilka leveransalternativ som finns till ditt land.',
  },
  {
    question: 'Is my personal information secure?',
    questionSv: 'Är min personliga information säker?',
    answerSv:
      'Ja, vi tar datasäkerhet på stort allvar. All personlig information krypteras och lagras säkert. Vi delar aldrig din information med tredje part förutom när det är nödvändigt för att fullfölja din beställning.',
  },
  {
    question: 'Do I need an account to make a purchase?',
    questionSv: 'Behöver jag ett konto för att handla?',
    answerSv:
      'Nej, du kan handla som gäst. Genom att skapa ett konto kan du dock spåra beställningar, spara din information för snabbare utcheckning och komma åt din orderhistorik.',
  },
  {
    question: 'How do I track my order?',
    questionSv: 'Hur spårar jag min beställning?',
    answerSv:
      'När din beställning har skickats får du ett spårningsnummer via e-post. Du kan använda detta nummer för att spåra ditt paket via fraktbolagets webbplats.',
  },
];

const db = new sqlite3.Database(DB_PATH);

function run(sql, params) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
  });
}

async function main() {
  let productsUpdated = 0;
  for (const p of products) {
    const changes = await run(
      'UPDATE products SET nameSv = ?, descriptionSv = ?, shortDescriptionSv = ?, specificationsSv = ?, usageSv = ?, storageSv = ?, warningsSv = ? WHERE name = ?',
      [
        p.nameSv,
        p.descriptionSv,
        p.shortDescriptionSv,
        JSON.stringify(p.specificationsSv),
        p.usageSv,
        p.storageSv,
        JSON.stringify(p.warningsSv),
        p.name,
      ],
    );
    if (changes === 0) {
      console.log(`  (no match) ${p.name}`);
    } else {
      productsUpdated += changes;
      console.log(`  updated: ${p.name}`);
    }
  }

  let faqsUpdated = 0;
  for (const f of faqs) {
    const changes = await run('UPDATE faqs SET questionSv = ?, answerSv = ? WHERE question = ?', [
      f.questionSv,
      f.answerSv,
      f.question,
    ]);
    if (changes === 0) {
      console.log(`  (no match) FAQ: ${f.question}`);
    } else {
      faqsUpdated += changes;
      console.log(`  updated FAQ: ${f.question}`);
    }
  }

  console.log(`\nDone. Products updated: ${productsUpdated}/${products.length}. FAQs updated: ${faqsUpdated}/${faqs.length}.`);
  db.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
