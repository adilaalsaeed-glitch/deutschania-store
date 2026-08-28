import type { Locale } from "@/i18n/config";

export type SubcategoryGroup = { title?: string; items: string[] };

export const subCategories: Record<Locale, Record<string, SubcategoryGroup[]>> = {
  en: {
    cat_makeup: [
      { title: "Face", items: ["Foundation", "Concealer", "Powder", "BB & CC Cream", "Primer", "Highlighter"] },
      { title: "Eyebrows", items: ["Eyebrow Pencils", "Eyebrow Gel", "Eyebrow Mascara", "Eyebrow Kits"] },
      { title: "Eyes", items: ["Mascara", "Eyeliner", "Eyeshadow"] },
      { title: "Lips", items: ["Lipstick", "Liquid Lipstick", "Lip Gloss", "Lip Liner", "Lip Balm"] },
      { title: "Makeup Tools & Brushes", items: ["Face Brushes", "Eye Brushes", "Makeup Sponges", "Brush Sets"] },
    ],
    cat_skincare: [
      { title: "Face", items: ["Face Cleansers", "Toner", "Serum", "Moisturizers", "Eye Care", "Face Masks"] },
      { title: "Sun Protection", items: ["Sunscreen", "Tanning", "After-Sun Care"] },
      { title: "Care Sets", items: ["Routine Sets", "Travel Sets"] },
    ],
    cat_haircare: [
      { title: "Shampoo & Conditioner", items: ["Shampoo", "Conditioner", "Dry Shampoo"] },
      { title: "Hair Treatments", items: ["Hair Masks", "Hair Oils", "Hair Serums", "Scalp Care"] },
      { title: "Hair Stylers", items: ["Styling", "Hair Spray", "Styling Foam", "Heat Protectant"] },
      { title: "Hair Sets", items: ["Hair Care Sets", "Daily Care Sets", "Travel Sets"] },
    ],
    cat_supplements: [{ items: ["Vitamins", "Omega-3", "Collagen", "Magnesium"] }],
    cat_food: [{ items: ["Chocolate", "Bread & Bakery", "Sweets", "Beverages"] }],
    cat_kidssnacks: [{ items: ["Fruit Pouches", "Healthy Sweets", "Oat Bars"] }],
    cat_personalcare: [
      { title: "Body Care", items: ["Body Lotion", "Body Cream", "Body Butter", "Body Scrub"] },
      { title: "Bath Essentials", items: ["Shower Gel", "Body Wash", "Soap", "Bath Tools"] },
      { title: "Hand & Foot Care", items: ["Hand Cream", "Foot Cream", "Foot Care"] },
      { title: "Personal Care", items: ["Deodorant", "Shaving & Hair Removal", "Oral Care", "Women's Care"] },
      { title: "Sets & Gifts", items: ["Bath Sets", "Body Care Sets", "Travel Sets"] },
    ],
    cat_bags: [{ items: ["Handbags", "Backpacks", "Wallets", "Travel Bags", "Crossbody & Shoulder Bags"] }],
  },
  de: {
    cat_makeup: [
      { title: "Gesicht", items: ["Foundation", "Concealer", "Puder", "BB- & CC-Creme", "Primer", "Highlighter"] },
      { title: "Augenbrauen", items: ["Augenbrauenstifte", "Augenbrauen-Gel", "Augenbrauen-Mascara", "Augenbrauen-Sets"] },
      { title: "Augen", items: ["Mascara", "Eyeliner", "Lidschatten"] },
      { title: "Lippen", items: ["Lippenstift", "Flüssiger Lippenstift", "Lipgloss", "Lippenkonturenstift", "Lippenbalsam"] },
      { title: "Make-up-Werkzeuge & Pinsel", items: ["Gesichtspinsel", "Augenpinsel", "Make-up-Schwämme", "Pinsel-Sets"] },
    ],
    cat_skincare: [
      { title: "Gesicht", items: ["Gesichtsreiniger", "Toner", "Serum", "Feuchtigkeitscremes", "Augenpflege", "Gesichtsmasken"] },
      { title: "Sonnenschutz", items: ["Sonnencreme", "Bräunung", "After-Sun-Pflege"] },
      { title: "Pflegesets", items: ["Routine-Sets", "Reisesets"] },
    ],
    cat_haircare: [
      { title: "Shampoo & Conditioner", items: ["Shampoo", "Conditioner", "Trockenshampoo"] },
      { title: "Haarbehandlungen", items: ["Haarmasken", "Haaröle", "Haarserum", "Kopfhautpflege"] },
      { title: "Styling", items: ["Styling", "Haarspray", "Stylingschaum", "Hitzeschutz"] },
      { title: "Haar-Sets", items: ["Haarpflege-Sets", "Tägliche Pflegesets", "Reisesets"] },
    ],
    cat_supplements: [{ items: ["Vitamine", "Omega-3", "Kollagen", "Magnesium"] }],
    cat_food: [{ items: ["Schokolade", "Brot & Gebäck", "Süßigkeiten", "Getränke"] }],
    cat_kidssnacks: [{ items: ["Fruchtbeutel", "Gesunde Süßigkeiten", "Haferriegel"] }],
    cat_personalcare: [
      { title: "Körperpflege", items: ["Körperlotion", "Körpercreme", "Körperbutter", "Körperpeeling"] },
      { title: "Badezubehör", items: ["Duschgel", "Körperwaschgel", "Seife", "Badezubehör"] },
      { title: "Hand- & Fußpflege", items: ["Handcreme", "Fußcreme", "Fußpflege"] },
      { title: "Persönliche Pflege", items: ["Deodorant", "Rasur & Haarentfernung", "Mundpflege", "Damenpflege"] },
      { title: "Sets & Geschenke", items: ["Badesets", "Körperpflegesets", "Reisesets"] },
    ],
    cat_bags: [{ items: ["Handtaschen", "Rucksäcke", "Geldbörsen", "Reisetaschen", "Umhängetaschen"] }],
  },
  ar: {
    cat_makeup: [
      { title: "الوجه", items: ["كريم أساس", "مصحح عيوب", "بودرة", "كريم بي بي وسي سي", "برايمر", "هايلايتر"] },
      { title: "الحواجب", items: ["أقلام حواجب", "جل حواجب", "ماسكارا الحواجب", "مجموعة حواجب"] },
      { title: "العيون", items: ["ماسكرا", "كحل", "ظلال عيون"] },
      { title: "الشفاه", items: ["أحمر شفاه", "أحمر شفاه سائل", "ملمع شفاه", "محدد شفاه", "مرطب شفاه"] },
      { title: "أدوات وفرش المكياج", items: ["فرش وجه", "فرش عيون", "اسفنج مكياج", "مجموعة فرش مكياج"] },
    ],
    cat_skincare: [
      { title: "الوجه", items: ["غسولات الوجه", "تونر", "سيروم", "مرطبات", "العناية بالعين", "ماسكات الوجه"] },
      { title: "الوقاية من الشمس", items: ["واقي الشمس", "تان / التسمير", "العناية بعد الشمس"] },
      { title: "مجموعات العناية", items: ["مجموعات روتين العناية", "مجموعات السفر"] },
    ],
    cat_haircare: [
      { title: "الشامبو والبلسم", items: ["شامبو", "بلسم", "شامبو جاف"] },
      { title: "معالجات الشعر", items: ["ماسكات شعر", "زيوت شعر", "سيرومات الشعر", "عناية فروة الرأس"] },
      { title: "مصففات الشعر", items: ["تصفيف الشعر", "مثبت الشعر", "رغوة تصفيف", "واقي حرارة"] },
      { title: "مجموعات الشعر", items: ["مجموعات عناية الشعر", "مجموعات العناية اليومية", "مجموعات السفر"] },
    ],
    cat_supplements: [{ items: ["فيتامينات", "أوميغا ٣", "كولاجين", "مغنيسيوم"] }],
    cat_food: [{ items: ["شوكولاتة", "خبز ومخبوزات", "حلويات", "مشروبات"] }],
    cat_kidssnacks: [{ items: ["أكياس فواكه", "حلويات صحية", "ألواح شوفان"] }],
    cat_personalcare: [
      { title: "العناية بالجسم", items: ["لوشن للجسم", "كريم للجسم", "زبدة للجسم", "سكراب للجسم"] },
      { title: "أدوات الاستحمام", items: ["سائل استحمام", "غسول للجسم", "صابون", "أدوات الاستحمام"] },
      { title: "العناية باليدين والقدم", items: ["كريم اليدين", "كريم القدمين", "العناية بالقدمين"] },
      { title: "العناية الشخصية", items: ["مزيل العرق", "أدوات الحلاقة وإزالة الشعر", "العناية بالفم", "عناية المرأة"] },
      { title: "المجموعات والهدايا", items: ["مجموعات الاستحمام", "مجموعات العناية بالجسم", "مجموعات السفر"] },
    ],
    cat_bags: [{ items: ["شنط يد", "شنط ظهر", "محافظ", "حقائب سفر", "شنط كروس/كتف"] }],
  },
};
