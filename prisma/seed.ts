import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type Lang = "ar" | "de" | "en";
type I18n = Record<Lang, string>;

const categories: {
  key: string;
  icon: string;
  color: string;
  label: I18n;
}[] = [
  { key: "cat_makeup", icon: "💄", color: "#B5677A", label: { en: "Makeup", de: "Make-up", ar: "المكياج" } },
  { key: "cat_skincare", icon: "🧴", color: "#4F8C8C", label: { en: "Skincare", de: "Hautpflege", ar: "العناية بالبشرة" } },
  { key: "cat_haircare", icon: "💇", color: "#7C5F9E", label: { en: "Hair Care", de: "Haarpflege", ar: "العناية بالشعر" } },
  { key: "cat_supplements", icon: "💊", color: "#4F7C68", label: { en: "Supplements & Vitamins", de: "Nahrungsergänzung", ar: "مكملات غذائية" } },
  { key: "cat_food", icon: "🍫", color: "#6B4028", label: { en: "German Food & Drinks", de: "Lebensmittel & Getränke", ar: "أغذية ومشروبات ألمانية" } },
  { key: "cat_kidssnacks", icon: "🍪", color: "#C08A4A", label: { en: "Kids' Snacks", de: "Kindersnacks", ar: "سناكات للأطفال" } },
  { key: "cat_personalcare", icon: "🧼", color: "#3F6E7C", label: { en: "Personal Care", de: "Körperpflege", ar: "العناية الشخصية" } },
];

// Attribute rows shown on the product page, keyed by category then language.
const attributesByCategory: Record<string, Record<Lang, { label: string; value: string }[]>> = {
  cat_makeup: {
    ar: [{ label: "النوع", value: "مكياج" }, { label: "المنطقة", value: "الوجه" }, { label: "نوع البشرة", value: "جميع أنواع البشرة" }],
    en: [{ label: "Type", value: "Makeup" }, { label: "Area", value: "Face" }, { label: "Skin Type", value: "All skin types" }],
    de: [{ label: "Typ", value: "Make-up" }, { label: "Bereich", value: "Gesicht" }, { label: "Hauttyp", value: "Alle Hauttypen" }],
  },
  cat_skincare: {
    ar: [{ label: "نوع البشرة", value: "جميع أنواع البشرة" }, { label: "المنطقة", value: "الوجه" }, { label: "النوع", value: "عناية بالبشرة" }],
    en: [{ label: "Skin Type", value: "All skin types" }, { label: "Area", value: "Face" }, { label: "Type", value: "Skincare" }],
    de: [{ label: "Hauttyp", value: "Alle Hauttypen" }, { label: "Bereich", value: "Gesicht" }, { label: "Typ", value: "Hautpflege" }],
  },
  cat_haircare: {
    ar: [{ label: "نوع الشعر", value: "جميع أنواع الشعر" }, { label: "الاستخدام", value: "يومي" }, { label: "النوع", value: "عناية بالشعر" }],
    en: [{ label: "Hair Type", value: "All hair types" }, { label: "Usage", value: "Daily" }, { label: "Type", value: "Hair care" }],
    de: [{ label: "Haartyp", value: "Alle Haartypen" }, { label: "Anwendung", value: "Täglich" }, { label: "Typ", value: "Haarpflege" }],
  },
  cat_supplements: {
    ar: [{ label: "الفئة", value: "مكملات غذائية" }, { label: "الجرعة", value: "كبسولة/قرص يوميًا" }, { label: "النوع", value: "مكمل غذائي" }],
    en: [{ label: "Category", value: "Supplements" }, { label: "Serving", value: "1 capsule/tablet daily" }, { label: "Type", value: "Dietary supplement" }],
    de: [{ label: "Kategorie", value: "Nahrungsergänzung" }, { label: "Dosierung", value: "1 Kapsel/Tablette täglich" }, { label: "Typ", value: "Nahrungsergänzungsmittel" }],
  },
  cat_food: {
    ar: [{ label: "الفئة", value: "أغذية ومشروبات" }, { label: "المنشأ", value: "ألمانيا" }, { label: "النوع", value: "غذائي" }],
    en: [{ label: "Category", value: "Food & drinks" }, { label: "Origin", value: "Germany" }, { label: "Type", value: "Food" }],
    de: [{ label: "Kategorie", value: "Lebensmittel & Getränke" }, { label: "Herkunft", value: "Deutschland" }, { label: "Typ", value: "Lebensmittel" }],
  },
  cat_kidssnacks: {
    ar: [{ label: "الفئة العمرية", value: "للأطفال" }, { label: "المنشأ", value: "ألمانيا" }, { label: "النوع", value: "سناك" }],
    en: [{ label: "Age Group", value: "Kids" }, { label: "Origin", value: "Germany" }, { label: "Type", value: "Snack" }],
    de: [{ label: "Altersgruppe", value: "Kinder" }, { label: "Herkunft", value: "Deutschland" }, { label: "Typ", value: "Snack" }],
  },
  cat_personalcare: {
    ar: [{ label: "نوع البشرة", value: "جميع أنواع البشرة" }, { label: "المنطقة", value: "الجسم" }, { label: "النوع", value: "عناية شخصية" }],
    en: [{ label: "Skin Type", value: "All skin types" }, { label: "Area", value: "Body" }, { label: "Type", value: "Personal care" }],
    de: [{ label: "Hauttyp", value: "Alle Hauttypen" }, { label: "Bereich", value: "Körper" }, { label: "Typ", value: "Körperpflege" }],
  },
};

const products: {
  id: string;
  cat: string;
  brand: string;
  price: number;
  icon: string;
  name: I18n;
  desc?: I18n;
}[] = [
  { id: "m1", cat: "cat_makeup", brand: "Aurelis", price: 14, icon: "pencil", name: { en: "Waterproof Precision Eyeliner", de: "Wasserfester Präzisions-Eyeliner", ar: "آيلاينر دقيق مقاوم للماء" } },
  { id: "m2", cat: "cat_makeup", brand: "Aurelis", price: 19, icon: "mascara", name: { en: "Volumizing Mascara, Black", de: "Volumen-Mascara, Schwarz", ar: "ماسكارا مكثفة للرموش، أسود" } },
  { id: "m3", cat: "cat_makeup", brand: "Nordlicht", price: 23, icon: "bottle", name: { en: "Long-wear Matte Foundation 30ml", de: "Langhaftende Matt-Foundation 30ml", ar: "كريم أساس مطفي ثابت ٣٠مل" } },
  { id: "m4", cat: "cat_makeup", brand: "Nordlicht", price: 17, icon: "palette", name: { en: "Nude Tones Eyeshadow Palette", de: "Nude-Lidschatten-Palette", ar: "باليت ظلال عيون بدرجات نود" } },
  { id: "s1", cat: "cat_skincare", brand: "Alpenrein", price: 22, icon: "jar", name: { en: "Alpine Herbal Face Cream 50ml", de: "Alpen-Kräuter-Gesichtscreme 50ml", ar: "كريم وجه بالأعشاب الألبية ٥٠مل" } },
  { id: "s2", cat: "cat_skincare", brand: "Alpenrein", price: 28, icon: "dropper", name: { en: "Pharmacy-Grade Vitamin C Serum", de: "Apotheken-Vitamin-C-Serum", ar: "سيروم فيتامين سي صيدلاني" } },
  { id: "s3", cat: "cat_skincare", brand: "Thermalis", price: 15, icon: "spray", name: { en: "Thermal Water Face Mist 150ml", de: "Thermalwasser-Gesichtsspray 150ml", ar: "بخاخ مياه حرارية للوجه ١٥٠مل" } },
  { id: "s4", cat: "cat_skincare", brand: "Thermalis", price: 31, icon: "jar", name: { en: "Anti-Aging Retinol Night Cream", de: "Anti-Aging Retinol-Nachtcreme", ar: "كريم ليلي بالريتينول لمكافحة التجاعيد" } },
  { id: "s5", cat: "cat_skincare", brand: "Alpenrein", price: 18, icon: "dropper", name: { en: "Natural Beard & Skin Oil 30ml", de: "Natürliches Bart- & Hautöl 30ml", ar: "زيت طبيعي للحية والبشرة ٣٠مل" } },
  {
    id: "s6", cat: "cat_skincare", brand: "Balea", price: 9, icon: "spray",
    name: { en: "Island Breeze Parfum Body Spray, 200ml", de: "Island Breeze Parfum Bodyspray, 200ml", ar: "بخاخ عطري للجسم آيلاند بريز، ٢٠٠مل" },
    desc: {
      en: "• Perfume body spray\n• Summery scent\n• A pleasant, fresh feeling on the skin\n• Light texture\n• Skin compatibility dermatologically confirmed\n\nBalea's Island Breeze Body Spray takes the senses on a journey with a summery scent reminiscent of golden sand and the sea.",
      de: "• Parfüm-Bodyspray\n• Mit sommerlichem Duft\n• Für ein angenehmes und frisches Gefühl auf der Haut\n• Leichte Textur\n• Hautverträglichkeit dermatologisch bestätigt\n\nDas Balea Bodyspray Island Breeze entführt die Sinne mit einem sommerlichen Duft, der an goldenen Sand und das Meer erinnert.",
      ar: "• بخاخ عطري للجسم\n• برائحة صيفية\n• إحساس لطيف ومنعش على البشرة\n• قوام خفيف\n• تحمّل البشرة له مؤكَّد من قبل أطباء الجلدية\n\nبخاخ Balea آيلاند بريز للجسم يأخذ حواسك في رحلة مع رائحة صيفية تذكّرك بالرمال الذهبية والبحر.",
    },
  },
  { id: "h1", cat: "cat_haircare", brand: "Kraftwurz", price: 13, icon: "bottle", name: { en: "Repair Shampoo, Damaged Hair 400ml", de: "Repair-Shampoo, strapaziertes Haar 400ml", ar: "شامبو إصلاح للشعر التالف ٤٠٠مل" } },
  { id: "h2", cat: "cat_haircare", brand: "Kraftwurz", price: 16, icon: "jar", name: { en: "Intensive Hair Mask 300ml", de: "Intensiv-Haarmaske 300ml", ar: "ماسك مكثف للشعر ٣٠٠مل" } },
  { id: "h3", cat: "cat_haircare", brand: "Nordlicht", price: 21, icon: "dropper", name: { en: "Anti-Hairloss Scalp Serum", de: "Anti-Haarausfall-Kopfhautserum", ar: "سيروم لفروة الرأس ضد تساقط الشعر" } },
  { id: "v1", cat: "cat_supplements", brand: "VitaNord", price: 19, icon: "pillbottle", name: { en: "Multivitamin Complex, 60 caps", de: "Multivitamin-Komplex, 60 Kaps.", ar: "مكمل فيتامينات متعدد، ٦٠ كبسولة" } },
  { id: "v2", cat: "cat_supplements", brand: "VitaNord", price: 24, icon: "capsule", name: { en: "Omega-3 Fish Oil, 120 softgels", de: "Omega-3-Fischöl, 120 Kapseln", ar: "أوميغا ٣ زيت السمك، ١٢٠ كبسولة" } },
  { id: "v3", cat: "cat_supplements", brand: "VitaNord", price: 16, icon: "pillbottle", name: { en: "Magnesium Citrate, 90 tablets", de: "Magnesiumcitrat, 90 Tabletten", ar: "سترات المغنيسيوم، ٩٠ قرص" } },
  { id: "v4", cat: "cat_supplements", brand: "Kraftwurz", price: 29, icon: "jar", name: { en: "Collagen Peptides Powder 300g", de: "Kollagenpeptid-Pulver 300g", ar: "بودرة كولاجين ببتيد ٣٠٠غ" } },
  { id: "v5", cat: "cat_supplements", brand: "VitaNord", price: 12, icon: "dropper", name: { en: "Vitamin D3 + K2 Drops 30ml", de: "Vitamin D3 + K2 Tropfen 30ml", ar: "نقط فيتامين د٣ + ك٢ ٣٠مل" } },
  { id: "f1", cat: "cat_food", brand: "Waldheim", price: 16, icon: "box", name: { en: "Black Forest Chocolate Box 500g", de: "Schwarzwälder Schokoladenbox 500g", ar: "علبة شوكولاتة الغابة السوداء ٥٠٠غ" } },
  { id: "f2", cat: "cat_food", brand: "Waldheim", price: 14, icon: "bag", name: { en: "Bavarian Pretzel Mix, 12 pcs", de: "Bayerische Brezel-Mischung, 12 Stk.", ar: "خليط بريتزل بافاري، ١٢ قطعة" } },
  { id: "f3", cat: "cat_food", brand: "Waldheim", price: 11, icon: "bread", name: { en: "Rye Bread, Vacuum-Packed 500g", de: "Roggenbrot, vakuumverpackt 500g", ar: "خبز الجاودار، معبأ بالفراغ ٥٠٠غ" } },
  { id: "f4", cat: "cat_food", brand: "Waldheim", price: 13, icon: "box", name: { en: "Spiced Gingerbread Tin 400g", de: "Lebkuchendose 400g", ar: "علبة خبز الزنجبيل ٤٠٠غ" } },
  { id: "pc1", cat: "cat_personalcare", brand: "Reinbad", price: 6, icon: "bottle", name: { en: "Roll-on Deodorant, Sensitive Skin", de: "Roll-on-Deo, empfindliche Haut", ar: "مزيل عرق رول أون للبشرة الحساسة" } },
  { id: "pc2", cat: "cat_personalcare", brand: "Reinbad", price: 9, icon: "bottle", name: { en: "Shea Butter Body Lotion 400ml", de: "Sheabutter-Körperlotion 400ml", ar: "لوشن للجسم بزبدة الشيا ٤٠٠مل" } },
  { id: "pc3", cat: "cat_personalcare", brand: "Reinbad", price: 5, icon: "bottle", name: { en: "Aloe Vera Shower Gel 300ml", de: "Aloe-Vera-Duschgel 300ml", ar: "جل استحمام بالصبار ٣٠٠مل" } },
  { id: "pc4", cat: "cat_personalcare", brand: "Reinbad", price: 7, icon: "jar", name: { en: "Intensive Repair Hand Cream", de: "Intensiv-Reparatur-Handcreme", ar: "كريم يدين للإصلاح المكثف" } },
  { id: "ks1", cat: "cat_kidssnacks", brand: "Kinderland", price: 9, icon: "bag", name: { en: "Fruit Purée Pouches, 12-pack", de: "Fruchtpüree-Beutel, 12er-Pack", ar: "أكياس هريس فواكه للأطفال، ١٢ قطعة" } },
  { id: "ks2", cat: "cat_kidssnacks", brand: "Kinderland", price: 7, icon: "bag", name: { en: "Organic Fruit Gummies, no added sugar", de: "Bio-Fruchtgummis, ohne Zuckerzusatz", ar: "حلوى فواكه عضوية للأطفال بدون سكر مضاف" } },
  { id: "ks3", cat: "cat_kidssnacks", brand: "Kinderland", price: 8, icon: "box", name: { en: "Whole Grain Oat Bars for Kids", de: "Vollkorn-Haferriegel für Kinder", ar: "ألواح شوفان كاملة للأطفال" } },
];

function slugify(name: string, id: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${base}-${id}`;
}

async function main() {
  for (const [sortOrder, cat] of categories.entries()) {
    await prisma.category.upsert({
      where: { key: cat.key },
      update: { label: cat.label, icon: cat.icon, color: cat.color, origin: "de", sortOrder },
      create: { key: cat.key, label: cat.label, icon: cat.icon, color: cat.color, origin: "de", sortOrder },
    });
  }

  for (const [index, p] of products.entries()) {
    const slug = slugify(p.name.en, p.id);
    await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        brand: p.brand,
        name: p.name,
        ...(p.desc ? { description: p.desc } : {}),
        ...(attributesByCategory[p.cat] ? { attributes: attributesByCategory[p.cat] } : {}),
        priceCents: Math.round(p.price * 100),
        currency: "EUR",
        icon: p.icon,
        origin: "de",
        categoryKey: p.cat,
        featured: index < 6,
      },
    });
  }

  console.log(`Seeded ${categories.length} categories and ${products.length} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
