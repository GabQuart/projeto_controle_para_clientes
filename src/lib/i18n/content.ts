import type { AppLocale } from '@/lib/i18n/messages'
import { compactText, normalizeText } from '@/lib/utils/format'

type LocaleMap = Partial<Record<AppLocale, string>>

const COLOR_TRANSLATIONS: Record<string, LocaleMap> = {
  branco: { en: 'White', es: 'Blanco', 'zh-CN': '白色', ar: 'أبيض' },
  preto: { en: 'Black', es: 'Negro', 'zh-CN': '黑色', ar: 'أسود' },
  azul: { en: 'Blue', es: 'Azul', 'zh-CN': '蓝色', ar: 'أزرق' },
  'azul claro': { en: 'Light blue', es: 'Azul claro', 'zh-CN': '浅蓝色', ar: 'أزرق فاتح' },
  'azul marinho': { en: 'Navy blue', es: 'Azul marino', 'zh-CN': '海军蓝', ar: 'أزرق كحلي' },
  'azul royal': { en: 'Royal blue', es: 'Azul rey', 'zh-CN': '宝蓝色', ar: 'أزرق ملكي' },
  vermelho: { en: 'Red', es: 'Rojo', 'zh-CN': '红色', ar: 'أحمر' },
  verde: { en: 'Green', es: 'Verde', 'zh-CN': '绿色', ar: 'أخضر' },
  'verde militar': { en: 'Olive green', es: 'Verde militar', 'zh-CN': '军绿色', ar: 'أخضر زيتي' },
  amarelo: { en: 'Yellow', es: 'Amarillo', 'zh-CN': '黄色', ar: 'أصفر' },
  laranja: { en: 'Orange', es: 'Naranja', 'zh-CN': '橙色', ar: 'برتقالي' },
  rosa: { en: 'Pink', es: 'Rosa', 'zh-CN': '粉色', ar: 'وردي' },
  pink: { en: 'Hot pink', es: 'Fucsia', 'zh-CN': '亮粉色', ar: 'فوشيا' },
  roxo: { en: 'Purple', es: 'Morado', 'zh-CN': '紫色', ar: 'بنفسجي' },
  lilas: { en: 'Lilac', es: 'Lila', 'zh-CN': '淡紫色', ar: 'ليلكي' },
  vinho: { en: 'Wine', es: 'Vino', 'zh-CN': '酒红色', ar: 'خمري' },
  bordo: { en: 'Burgundy', es: 'Burdeos', 'zh-CN': '勃艮第红', ar: 'عنابي' },
  bege: { en: 'Beige', es: 'Beige', 'zh-CN': '米色', ar: 'بيج' },
  nude: { en: 'Nude', es: 'Nude', 'zh-CN': '裸色', ar: 'نيود' },
  marrom: { en: 'Brown', es: 'Marrón', 'zh-CN': '棕色', ar: 'بني' },
  caramelo: { en: 'Caramel', es: 'Caramelo', 'zh-CN': '焦糖色', ar: 'كراميل' },
  cinza: { en: 'Gray', es: 'Gris', 'zh-CN': '灰色', ar: 'رمادي' },
  grafite: { en: 'Graphite', es: 'Grafito', 'zh-CN': '石墨灰', ar: 'رمادي غرافيتي' },
  prata: { en: 'Silver', es: 'Plata', 'zh-CN': '银色', ar: 'فضي' },
  dourado: { en: 'Gold', es: 'Dorado', 'zh-CN': '金色', ar: 'ذهبي' },
  coral: { en: 'Coral', es: 'Coral', 'zh-CN': '珊瑚色', ar: 'مرجاني' },
  turquesa: { en: 'Turquoise', es: 'Turquesa', 'zh-CN': '绿松石色', ar: 'فيروزي' },
  'off white': { en: 'Off-white', es: 'Blanco roto', 'zh-CN': '米白色', ar: 'أوف وايت' },
}

const TERM_TRANSLATIONS: Record<string, LocaleMap> = {
  floral: { en: 'Floral', es: 'Floral', 'zh-CN': '花卉', ar: 'زهري' },
  listrado: { en: 'Striped', es: 'Rayado', 'zh-CN': '条纹', ar: 'مخطط' },
  xadrez: { en: 'Plaid', es: 'Cuadros', 'zh-CN': '格纹', ar: 'مربعات' },
  poa: { en: 'Polka dot', es: 'Lunares', 'zh-CN': '波点', ar: 'منقط' },
  'poa grande': { en: 'Large polka dot', es: 'Lunares grandes', 'zh-CN': '大波点', ar: 'منقط كبير' },
  'tie dye': { en: 'Tie-dye', es: 'Tie-dye', 'zh-CN': '扎染', ar: 'تاي داي' },
  camuflado: { en: 'Camouflage', es: 'Camuflaje', 'zh-CN': '迷彩', ar: 'تمويه' },
  oncinha: { en: 'Leopard print', es: 'Estampado de leopardo', 'zh-CN': '豹纹', ar: 'نقشة فهد' },
  'animal print': { en: 'Animal print', es: 'Animal print', 'zh-CN': '动物纹', ar: 'نقشة حيوانات' },
  estrelas: { en: 'Stars', es: 'Estrellas', 'zh-CN': '星星', ar: 'نجوم' },
  coracoes: { en: 'Hearts', es: 'Corazones', 'zh-CN': '爱心', ar: 'قلوب' },
  lacos: { en: 'Bows', es: 'Lazos', 'zh-CN': '蝴蝶结', ar: 'فيونات' },
  borboletas: { en: 'Butterflies', es: 'Mariposas', 'zh-CN': '蝴蝶', ar: 'فراشات' },
  safari: { en: 'Safari', es: 'Safari', 'zh-CN': '野生动物', ar: 'سفاري' },
  carros: { en: 'Cars', es: 'Coches', 'zh-CN': '汽车', ar: 'سيارات' },
  dinossauro: { en: 'Dinosaur', es: 'Dinosaurio', 'zh-CN': '恐龙', ar: 'ديناصور' },
  dinossauros: { en: 'Dinosaurs', es: 'Dinosaurios', 'zh-CN': '恐龙', ar: 'ديناصورات' },
  unicornio: { en: 'Unicorn', es: 'Unicornio', 'zh-CN': '独角兽', ar: 'يونيكورن' },
  boneca: { en: 'Doll', es: 'Muñeca', 'zh-CN': '娃娃', ar: 'دمية' },
  bonecas: { en: 'Dolls', es: 'Muñecas', 'zh-CN': '娃娃', ar: 'دمى' },
  'casinha de bonecas': { en: 'Dollhouse', es: 'Casita de muñecas', 'zh-CN': '娃娃屋', ar: 'بيت الدمى' },
  princesa: { en: 'Princess', es: 'Princesa', 'zh-CN': '公主', ar: 'أميرة' },
  princesas: { en: 'Princesses', es: 'Princesas', 'zh-CN': '公主', ar: 'أميرات' },
  frutas: { en: 'Fruits', es: 'Frutas', 'zh-CN': '水果', ar: 'فواكه' },
  coracao: { en: 'Heart', es: 'Corazón', 'zh-CN': '爱心', ar: 'قلب' },
}

const DETAIL_LABELS: Record<string, LocaleMap> = {
  tamanhos: { en: 'Sizes', es: 'Tallas', 'zh-CN': '尺码', ar: 'المقاسات' },
  cores: { en: 'Colors', es: 'Colores', 'zh-CN': '颜色', ar: 'الألوان' },
  estampas: { en: 'Prints', es: 'Estampas', 'zh-CN': '印花', ar: 'النقشات' },
  variados: { en: 'Variants', es: 'Variados', 'zh-CN': '多款版本', ar: 'المتغيرات' },
  material: { en: 'Material', es: 'Material', 'zh-CN': '材质', ar: 'الخامة' },
  'solicitacao de novo produto registrada.': {
    en: 'New product request registered.',
    es: 'Solicitud de nuevo producto registrada.',
    'zh-CN': '新产品申请已登记。',
    ar: 'تم تسجيل طلب المنتج الجديد.',
  },
}

function translateExact(normalizedValue: string, locale: AppLocale, dictionary: Record<string, LocaleMap>) {
  if (locale === 'pt-BR') {
    return ''
  }

  return dictionary[normalizedValue]?.[locale] ?? ''
}

function translateCommaList(
  value: string,
  locale: AppLocale,
  translator: (item: string, locale: AppLocale) => string,
) {
  return value
    .split(/\s*,\s*/)
    .map((item) => translator(item, locale))
    .join(', ')
}

function translateWithSeparators(
  value: string,
  locale: AppLocale,
  translator: (item: string, locale: AppLocale) => string,
) {
  return value
    .split(/(\s*\/\s*)/)
    .map((item) => (item.includes('/') ? item : translator(item, locale)))
    .join('')
}

function translatePhrase(value: string, locale: AppLocale) {
  const normalized = normalizeText(value)
  const exactTerm = translateExact(normalized, locale, TERM_TRANSLATIONS)

  if (exactTerm) {
    return exactTerm
  }

  const exactColor = translateExact(normalized, locale, COLOR_TRANSLATIONS)
  if (exactColor) {
    return exactColor
  }

  if (value.includes('/')) {
    return translateWithSeparators(value, locale, translatePhrase)
  }

  return compactText(value)
}

export function translateColorLabel(value: string, locale: AppLocale) {
  const compact = compactText(value)

  if (!compact || locale === 'pt-BR') {
    return compact
  }

  const normalized = normalizeText(compact)
  const exact = translateExact(normalized, locale, COLOR_TRANSLATIONS)

  if (exact) {
    return exact
  }

  if (compact.includes('/')) {
    return translateWithSeparators(compact, locale, translateColorLabel)
  }

  return compact
}

export function translateVariationValue(value: string, locale: AppLocale) {
  const compact = compactText(value)

  if (!compact || locale === 'pt-BR') {
    return compact
  }

  if (compact.includes(',')) {
    return translateCommaList(compact, locale, translateVariationValue)
  }

  return translatePhrase(compact, locale)
}

export function translateProductRequestDetail(detail: string, locale: AppLocale) {
  const compact = compactText(detail)

  if (!compact || locale === 'pt-BR') {
    return compact
  }

  const normalizedWhole = normalizeText(compact)
  const fullMessage = DETAIL_LABELS[normalizedWhole]?.[locale]

  if (fullMessage) {
    return fullMessage
  }

  const sections = compact.split(' | ').map((section) => compactText(section)).filter(Boolean)

  return sections
    .map((section) => {
      const separatorIndex = section.indexOf(':')

      if (separatorIndex === -1) {
        return translateVariationValue(section, locale)
      }

      const rawLabel = compactText(section.slice(0, separatorIndex))
      const rawValue = compactText(section.slice(separatorIndex + 1))
      const normalizedLabel = normalizeText(rawLabel)
      const translatedLabel = DETAIL_LABELS[normalizedLabel]?.[locale] ?? rawLabel

      if (normalizedLabel === 'cores') {
        return `${translatedLabel}: ${translateCommaList(rawValue, locale, translateColorLabel)}`
      }

      if (normalizedLabel === 'estampas' || normalizedLabel === 'variados') {
        return `${translatedLabel}: ${translateCommaList(rawValue, locale, translateVariationValue)}`
      }

      return `${translatedLabel}: ${rawValue}`
    })
    .join(' | ')
}
