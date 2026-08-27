export type CategoryId =
  | 'all'
  | 'manicure'
  | 'dogsitter'
  | 'confeitaria'
  | 'faxina'
  | 'helper'
  | 'movers'
  | 'massage'
  | 'makeup'
  | 'cabeleleiro'

export interface Service {
  name: string
  price?: string
}

export function serviceName(s: string | Service): string {
  return typeof s === 'string' ? s : s.name
}

export function servicePrice(s: string | Service): string | undefined {
  return typeof s === 'string' ? undefined : s.price
}

export interface Review {
  id: number
  author: string
  avatarId: string
  rating: number
  date: string
  text: string
  textEn?: string
}

export interface Provider {
  id: number
  name: string
  category: Exclude<CategoryId, 'all'>
  categoryLabel: string
  categoryLabelEn?: string
  nationality: string
  rating: number
  reviews: number
  price: string
  priceEn?: string
  location: string
  state: string
  city: string
  country?: string
  description: string
  descriptionEn?: string
  bio: string
  bioEn?: string
  photoId: string
  portfolioIds: string[]
  reviewsList: Review[]
  verified: boolean
  badge?: string
  badgeEn?: string
  availability: string
  availabilityEn?: string
  availableNow: boolean
  deliveryInfo: string
  deliveryInfoEn?: string
  services: Array<string | Service>
  servicesEn?: Array<string | Service>
  completedServices?: number
}

export const VERIFIED_MIN_SERVICES = 10

export function isProviderVerified(provider: { reviews?: number; completedServices?: number; verified?: boolean }): boolean {
  const count = provider.completedServices ?? provider.reviews ?? 0
  return count >= VERIFIED_MIN_SERVICES
}

export function getLocalizedDescription(p: Provider, lang: string): string {
  if (lang === 'en' && p.descriptionEn) return p.descriptionEn
  return p.description
}

export function getLocalizedBio(p: Provider, lang: string): string {
  if (lang === 'en' && p.bioEn) return p.bioEn
  return p.bio
}

export function getLocalizedServices(p: Provider, lang: string): Array<string | Service> {
  if (lang === 'en' && p.servicesEn && p.servicesEn.length > 0) return p.servicesEn
  return p.services
}

export function getLocalizedAvailability(p: Provider, lang: string): string {
  if (lang === 'en' && p.availabilityEn) return p.availabilityEn
  return p.availability
}

export function getLocalizedDeliveryInfo(p: Provider, lang: string): string {
  if (lang === 'en' && p.deliveryInfoEn) return p.deliveryInfoEn
  return p.deliveryInfo
}

export function getLocalizedPrice(p: Provider, lang: string): string {
  if (lang === 'en' && p.priceEn) return p.priceEn
  return p.price
}

export function getLocalizedBadge(p: Provider, lang: string): string | undefined {
  if (lang === 'en' && p.badgeEn) return p.badgeEn
  return p.badge
}

export function getLocalizedReviewText(r: Review, lang: string): string {
  if (lang === 'en' && r.textEn) return r.textEn
  return r.text
}

export const DEFAULT_PHOTO_URL =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=480&h=320&fit=crop&auto=format&q=80'

export function getPhotoUrl(photoIdOrUrl?: string, width = 480, height = 320): string {
  if (!photoIdOrUrl || typeof photoIdOrUrl !== 'string' || !photoIdOrUrl.trim()) {
    return `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=${width}&h=${height}&fit=crop&auto=format&q=80`
  }
  const clean = photoIdOrUrl.trim()
  if (
    clean.startsWith('http://') ||
    clean.startsWith('https://') ||
    clean.startsWith('data:') ||
    clean.startsWith('/')
  ) {
    return clean
  }
  return `https://images.unsplash.com/${clean}?w=${width}&h=${height}&fit=crop&auto=format&q=80`
}

export const CATEGORIES: { id: CategoryId; label: string; emoji: string }[] = [
  { id: 'all', label: 'Todos', emoji: '✨' },
  { id: 'manicure', label: 'Manicure', emoji: '💅' },
  { id: 'dogsitter', label: 'Dog Sitter', emoji: '🐕' },
  { id: 'confeitaria', label: 'Bolos & Salgados', emoji: '🎂' },
  { id: 'faxina', label: 'Faxina', emoji: '🧹' },
  { id: 'helper', label: 'Helpers', emoji: '🔧' },
  { id: 'movers', label: 'Movers', emoji: '📦' },
  { id: 'massage', label: 'Massagem', emoji: '💆' },
  { id: 'makeup', label: 'Makeup', emoji: '💄' },
  { id: 'cabeleleiro', label: 'Cabeleireiro', emoji: '✂️' },
]

export const CATEGORY_STYLE: Record<string, { pill: string }> = {
  manicure: { pill: 'bg-rose-50 text-rose-700' },
  dogsitter: { pill: 'bg-amber-50 text-amber-700' },
  confeitaria: { pill: 'bg-orange-50 text-orange-700' },
  faxina: { pill: 'bg-teal-50 text-teal-700' },
  helper: { pill: 'bg-blue-50 text-blue-700' },
  movers: { pill: 'bg-indigo-50 text-indigo-700' },
  massage: { pill: 'bg-emerald-50 text-emerald-700' },
  makeup: { pill: 'bg-pink-50 text-pink-700' },
  cabeleleiro: { pill: 'bg-purple-50 text-purple-700' },
}

export const PROVIDERS: Provider[] = [
  {
    id: 1,
    name: 'Juliana Ferreira',
    category: 'manicure',
    categoryLabel: 'Manicure',
    categoryLabelEn: 'Manicure',
    nationality: 'BR',
    rating: 4.9,
    reviews: 127,
    price: 'R$ 40 / sessão',
    priceEn: 'R$ 40 / session',
    location: 'Pinheiros, SP',
    state: 'SP',
    city: 'Pinheiros',
    description: 'Especialista em nail art e unhas em gel. Atendo em domicílio com materiais esterilizados.',
    descriptionEn: 'Specialist in nail art and gel nail extensions. At-home service with sanitized materials.',
    bio: 'Olá! Sou manicure há 8 anos e me especializei em nail art e unhas em gel. Atendo em domicílio com kit completo de materiais esterilizados e descartáveis. Trabalho com as melhores marcas do mercado e ofereço um atendimento exclusivo e personalizado para cada cliente.',
    bioEn: 'Hello! I have been a nail artist for 8 years, specialized in nail art and gel extensions. I provide home service with a complete kit of sanitized, single-use materials. I work with top brands and provide customized care.',
    photoId: 'photo-1534528741775-53994a69daeb',
    portfolioIds: [
      'photo-1604654894610-df63bc536371',
      'photo-1632345031435-8727f6897d53',
      'photo-1562322140-8baeececf3df',
      'photo-1607779097040-26e80aa78e66',
      'photo-1609587312208-cea54be969e7',
      'photo-1586363104862-3a5e2ab60d99',
    ],
    services: ['Manicure simples', 'Pedicure', 'Unhas em gel', 'Nail art', 'Blindagem', 'Esmaltação em gel'],
    servicesEn: ['Classic Manicure', 'Pedicure', 'Gel Extensions', 'Nail Art', 'Nail Shielding', 'Gel Polish'],
    reviewsList: [
      {
        id: 1,
        author: 'Beatriz Lima',
        avatarId: 'photo-1531746020798-e6953c6e8e04',
        rating: 5,
        date: '10 ago 2026',
        text: 'Juliana é incrível! Fiz nail art pela primeira vez e ficou exatamente como eu queria. Super caprichosa e atenciosa. Já marquei a próxima sessão!',
        textEn: 'Juliana is incredible! I got nail art for the first time and it turned out exactly as I wanted. Very attentive and meticulous. Already booked the next visit!',
      },
      {
        id: 2,
        author: 'Amanda Santos',
        avatarId: 'photo-1438761681033-6461ffad8d80',
        rating: 5,
        date: '28 jul 2026',
        text: 'Pontual, organizada e muito talentosa. Minhas unhas nunca ficaram tão lindas. Recomendo demais!',
        textEn: 'Punctual, organized, and very talented. My nails have never looked so beautiful. Highly recommended!',
      },
      {
        id: 3,
        author: 'Rafaela Duarte',
        avatarId: 'photo-1489424731084-a5d8b219a5bb',
        rating: 4,
        date: '15 jul 2026',
        text: 'Ótimo atendimento em domicílio. Produto de qualidade e muito cuidado com a higiene. Voltarei com certeza.',
        textEn: 'Great at-home service. High quality products and excellent hygiene. Will definitely book again.',
      },
    ],
    verified: true,
    badge: 'Top Prestadora',
    badgeEn: 'Top Provider',
    availability: 'Disponível hoje',
    availabilityEn: 'Available today',
    availableNow: true,
    deliveryInfo: 'Atendimento em domicílio. Local e horário a combinar via chat.',
    deliveryInfoEn: 'At-home service. Location and time arranged via chat.',
  },
  {
    id: 2,
    name: 'Marcos Andrade',
    category: 'dogsitter',
    categoryLabel: 'Dog Sitter',
    categoryLabelEn: 'Dog Sitter',
    nationality: 'BR',
    rating: 4.8,
    reviews: 89,
    price: 'R$ 60 / dia',
    priceEn: 'R$ 60 / day',
    location: 'Vila Madalena, SP',
    state: 'SP',
    city: 'Vila Madalena',
    description: 'Cuido do seu pet com amor. Tenho espaço seguro com jardim. Atendo até 3 cachorros.',
    descriptionEn: 'I care for your pet with love. Safe fenced yard with garden. Max 3 dogs at a time.',
    bio: 'Sou apaixonado por animais desde criança. Tenho uma casa ampla em Vila Madalena com jardim cercado e seguro. Ofereço hospedagem, passeios diários e acompanhamento com fotos enviadas para os tutores. Atendo cães de todos os portes.',
    bioEn: 'Animal lover since childhood. I have a spacious house in Vila Madalena with a secure fenced garden. I offer dog boarding, daily walks, and live photo updates to pet parents.',
    photoId: 'photo-1507003211169-0a1dd7228f2d',
    portfolioIds: [
      'photo-1587300003388-59208cc962cb',
      'photo-1548199973-03cce0bbc87b',
      'photo-1561037404-61cd46aa615b',
      'photo-1537151625747-768eb6cf92b2',
      'photo-1518717758536-85ae29035b6d',
      'photo-1477884213360-7e9d7dcc1e48',
    ],
    services: ['Hospedagem', 'Passeios diários', 'Visita ao pet', 'Banho & tosa', 'Adestramento básico', 'Transporte pet'],
    servicesEn: ['Pet Boarding', 'Daily Walks', 'Drop-in Visit', 'Bath & Grooming', 'Basic Training', 'Pet Taxi'],
    reviewsList: [
      {
        id: 1,
        author: 'Carolina Melo',
        avatarId: 'photo-1580489944761-15a19d654956',
        rating: 5,
        date: '5 ago 2026',
        text: 'Minha cachorra Mel ficou 5 dias com o Marcos e foi incrível. Recebi fotos e atualizações todos os dias. Ela voltou super feliz!',
        textEn: 'My dog Mel stayed 5 days with Marcos and it was amazing. Received daily photo updates. She returned very happy!',
      },
      {
        id: 2,
        author: 'Rodrigo Farias',
        avatarId: 'photo-1500648767791-00dcc994a43e',
        rating: 5,
        date: '20 jul 2026',
        text: 'Profissional e muito carinhoso com os pets. Meu Golden ficou ótimo, bem cuidado e alimentado certinho.',
        textEn: 'Professional and very loving with pets. My Golden Retriever was well cared for and fed on schedule.',
      },
      {
        id: 3,
        author: 'Isabela Costa',
        avatarId: 'photo-1494790108377-be9c29b29330',
        rating: 4,
        date: '8 jul 2026',
        text: 'Tudo ocorreu bem, comunicação ótima. Só senti falta de um relatório mais detalhado das atividades.',
        textEn: 'Everything went well, great communication and responsive host.',
      },
    ],
    verified: true,
    badge: 'Super Host',
    badgeEn: 'Super Host',
    availability: 'Disponível amanhã',
    availabilityEn: 'Available tomorrow',
    availableNow: false,
    deliveryInfo: 'Retirada e entrega do pet a combinar. Área de atendimento: SP capital.',
    deliveryInfoEn: 'Pet pickup and drop-off arranged via chat. Service area: SP capital.',
  },
  {
    id: 3,
    name: 'Carla Mendes',
    category: 'confeitaria',
    categoryLabel: 'Confeitaria',
    categoryLabelEn: 'Bakery & Pastry',
    nationality: 'PT',
    country: 'PT',
    rating: 5.0,
    reviews: 204,
    price: '€ 35 / bolo',
    priceEn: '€ 35 / cake',
    location: 'Chiado, Lisboa',
    state: 'Lisboa',
    city: 'Lisboa',
    description: 'Confeiteira profissional. Bolos personalizados, doces finos e salgados para eventos.',
    descriptionEn: 'Professional pastry chef. Customized cakes, gourmet sweets, and party pastries.',
    bio: 'Formada em gastronomia e especializada em confeitaria francesa. Trabalho com ingredientes premium e faço bolos 100% personalizados. Cada encomenda é tratada com cuidado artesanal. Atendo festas, casamentos e eventos corporativos.',
    bioEn: 'Culinary arts graduate specialized in French pastry. I use premium ingredients and make 100% customized cakes with artisanal care for weddings, birthdays, and events.',
    photoId: 'photo-1580489944761-15a19d654956',
    portfolioIds: [
      'photo-1578985545062-69928b1d9587',
      'photo-1464349095431-e9a21285b5f3',
      'photo-1488477181946-6428a0291777',
      'photo-1550617931-e17a7b70dce2',
      'photo-1499636136210-6f4ee915583e',
      'photo-1563729784474-d77dbb933a9e',
    ],
    services: ['Bolos personalizados', 'Naked cake', 'Cupcakes', 'Doces finos', 'Salgados', 'Mesas de doces'],
    servicesEn: ['Custom Cakes', 'Naked Cake', 'Cupcakes', 'Gourmet Sweets', 'Savory Bites', 'Dessert Table Setup'],
    reviewsList: [
      {
        id: 1,
        author: 'Mariana Vaz',
        avatarId: 'photo-1508214751196-bcfd4ca60f91',
        rating: 5,
        date: '9 ago 2026',
        text: 'O bolo da Carla salvou minha festa! Ficou lindo, gostoso e todo mundo perguntou quem fez. Contratarei de novo com certeza absoluta.',
        textEn: "Carla's cake was the star of our party! Beautiful, delicious, and everyone asked for the baker. Will definitely hire again!",
      },
      {
        id: 2,
        author: 'Priscila Torres',
        avatarId: 'photo-1438761681033-6461ffad8d80',
        rating: 5,
        date: '1 ago 2026',
        text: 'Perfeita em todos os aspectos. Cumpriu o prazo, entregou lindo e o sabor foi incrível. Melhor confeiteira que já contratei!',
        textEn: 'Perfect in every way. On time, beautiful presentation, and incredible taste. Best baker I have hired!',
      },
      {
        id: 3,
        author: 'Camila Ramos',
        avatarId: 'photo-1534528741775-53994a69daeb',
        rating: 5,
        date: '22 jul 2026',
        text: 'Fiz encomenda de salgados para 80 pessoas e foi um sucesso. Todos elogiaram. Super recomendo!',
        textEn: 'Ordered savory snacks for 80 guests and it was a huge hit. Highly recommend!',
      },
    ],
    verified: true,
    badge: 'Mais Pedido',
    badgeEn: 'Best Seller',
    availability: 'Encomendas abertas',
    availabilityEn: 'Orders open',
    availableNow: true,
    deliveryInfo: 'Entrega ou retirada em Moema. Frete para outros bairros a combinar. Prazo mínimo: 5 dias úteis.',
    deliveryInfoEn: 'Delivery or pickup in Moema/Lisbon. Delivery fees arranged per area.',
  },
  {
    id: 4,
    name: 'Renata Oliveira',
    category: 'faxina',
    categoryLabel: 'Faxina',
    categoryLabelEn: 'Cleaning',
    nationality: 'BR',
    rating: 4.7,
    reviews: 63,
    price: 'R$ 150 / diária',
    priceEn: 'R$ 150 / day',
    location: 'Itaim Bibi, SP',
    state: 'SP',
    city: 'Itaim Bibi',
    description: 'Faxina completa com produtos de qualidade. Pontual, organizada e de confiança.',
    descriptionEn: 'Full residential cleaning with quality products. Punctual, organized, and trustworthy.',
    bio: 'Ofereço serviços de limpeza doméstica há 6 anos. Sou pontual, organizada e trabalho com produtos de qualidade que não agridem superfícies ou animais de estimação. Tenho referências disponíveis e carteira de trabalho.',
    bioEn: 'Professional residential cleaning services for 6 years. Punctual, thorough, and careful with pet-friendly, non-abrasive products.',
    photoId: 'photo-1494790108377-be9c29b29330',
    portfolioIds: [
      'photo-1558618666-fcd25c85cd64',
      'photo-1581578731548-c64695cc6952',
      'photo-1556909114-f6e7ad7d3136',
      'photo-1527515545081-5db817172677',
      'photo-1563453392212-326f5e854473',
      'photo-1596462502278-27bfdc403348',
    ],
    services: ['Faxina completa', 'Limpeza pós-obra', 'Organização de ambientes', 'Passadeira', 'Lavagem de janelas', 'Limpeza de estofados'],
    servicesEn: ['Deep Cleaning', 'Post-Renovation Cleaning', 'Home Organization', 'Ironing Service', 'Window Washing', 'Upholstery Cleaning'],
    reviewsList: [
      {
        id: 1,
        author: 'Luciana Prado',
        avatarId: 'photo-1580489944761-15a19d654956',
        rating: 5,
        date: '7 ago 2026',
        text: 'Renata é maravilhosa. Casa impecável, cheirosa e ela ainda organizou os armários sem eu pedir. Super recomendo!',
        textEn: 'Renata is wonderful. House left spotless, fresh, and closets organized. Highly recommend!',
      },
      {
        id: 2,
        author: 'Fernanda Alves',
        avatarId: 'photo-1531746020798-e6953c6e8e04',
        rating: 4,
        date: '25 jul 2026',
        text: 'Bom serviço, pontual e prestativa. Minha casa ficou limpa e organizada. Voltarei a contratar.',
        textEn: 'Good service, punctual, and helpful. House clean and orderly.',
      },
      {
        id: 3,
        author: 'Diego Castro',
        avatarId: 'photo-1492562080023-ab3db95bfbce',
        rating: 5,
        date: '14 jul 2026',
        text: 'Excelente faxineira. Fez limpeza pós-obra no meu apartamento e ficou impecável. Muito cuidadosa e honesta.',
        textEn: 'Excellent cleaner. Handled post-renovation cleanup flawlessly. Very careful and honest.',
      },
    ],
    verified: true,
    availability: 'Disponível esta semana',
    availabilityEn: 'Available this week',
    availableNow: false,
    deliveryInfo: 'Atendimento presencial. Zona Sul e Centro de SP. Deslocamento a combinar.',
    deliveryInfoEn: 'In-person service across South and Central zones.',
  },
  {
    id: 5,
    name: 'Paulo Souza',
    category: 'helper',
    categoryLabel: 'Helper',
    categoryLabelEn: 'Handyman & Helper',
    nationality: 'AR',
    country: 'AR',
    rating: 4.9,
    reviews: 41,
    price: '$ 25.000 / hora',
    priceEn: '$ 25,000 / hour',
    location: 'Palermo, Buenos Aires',
    state: 'Buenos Aires',
    city: 'Palermo',
    description: 'Montagem de móveis, instalações simples, pintura e reparos em geral. Orçamento grátis.',
    descriptionEn: 'Furniture assembly, light electrical, painting, and general home repairs. Free quote.',
    bio: 'Técnico em edificações com 12 anos de experiência. Faço desde pequenos reparos até reformas completas. Pontual, limpo e honesto. Orçamento sem compromisso e garantia de serviço por 90 dias.',
    bioEn: 'Building technician with 12 years of experience in handyman repairs, assembly, painting, and home improvement with 90-day warranty.',
    photoId: 'photo-1500648767791-00dcc994a43e',
    portfolioIds: [
      'photo-1504148455328-c376907d081c',
      'photo-1581244277943-fe4a9c777189',
      'photo-1572981779307-38b8cabb2407',
      'photo-1603796846097-bee99e4a601f',
      'photo-1562259949-e8e7689d7828',
      'photo-1581578731548-c64695cc6952',
    ],
    services: ['Montagem de móveis', 'Instalação elétrica simples', 'Pintura', 'Reparos gerais', 'Instalação de ar-condicionado', 'Reforma de banheiro'],
    servicesEn: ['Furniture Assembly', 'Light Electrical', 'Painting', 'General Repairs', 'A/C Installation', 'Bathroom Fixes'],
    reviewsList: [
      {
        id: 1,
        author: 'Thiago Gomes',
        avatarId: 'photo-1507003211169-0a1dd7228f2d',
        rating: 5,
        date: '11 ago 2026',
        text: 'Paulo montou minha cozinha completa e ficou perfeita. Rápido, limpo e preço justo. Já indiquei para 3 amigos!',
        textEn: 'Paulo assembled my entire kitchen cabinetry. Fast, tidy, and fair pricing. Already referred to 3 friends!',
      },
      {
        id: 2,
        author: 'Juliana Reis',
        avatarId: 'photo-1534528741775-53994a69daeb',
        rating: 5,
        date: '2 ago 2026',
        text: 'Fez a instalação elétrica do meu escritório home office. Sem gambiarras, tudo certinho e com nota fiscal. Excelente!',
        textEn: 'Did electrical setup for my home office. Very professional and clean work. Excellent!',
      },
      {
        id: 3,
        author: 'André Moura',
        avatarId: 'photo-1500648767791-00dcc994a43e',
        rating: 4,
        date: '19 jul 2026',
        text: 'Bom profissional, cumpriu o prazo e deixou o local limpo. Pintura ficou ótima. Recomendo.',
        textEn: 'Good handyman, on time and left the workspace clean. Painting looks great.',
      },
    ],
    verified: false,
    availability: 'Disponível hoje',
    availabilityEn: 'Available today',
    availableNow: true,
    deliveryInfo: 'Atendimento em Buenos Aires e Grande BA. Deslocamento incluído até 15km.',
    deliveryInfoEn: 'Service in Buenos Aires area. Travel included up to 15km.',
  },
  {
    id: 6,
    name: 'Tatiane Costa',
    category: 'manicure',
    categoryLabel: 'Manicure',
    categoryLabelEn: 'Manicure',
    nationality: 'BR',
    country: 'BR',
    rating: 4.6,
    reviews: 58,
    price: 'R$ 35 / sessão',
    priceEn: 'R$ 35 / session',
    location: 'Santana, SP',
    state: 'SP',
    city: 'Santana',
    description: 'Manicure e pedicure a domicílio. Zona Norte. Materiais próprios e descartáveis.',
    descriptionEn: 'At-home manicure and pedicure. North Zone. Single-use sterile materials.',
    bio: 'Manicure há 5 anos, atendo toda a Zona Norte de São Paulo. Trabalho com kit completo de materiais descartáveis e esterilizados para garantir a segurança de cada cliente. Especialidade em esmaltação em gel e alongamento.',
    bioEn: 'Manicurist for 5 years across São Paulo North Zone. I work with single-use sterile tools ensuring safety and hygiene. Gel polish and extension specialist.',
    photoId: 'photo-1438761681033-6461ffad8d80',
    portfolioIds: [
      'photo-1604654894610-df63bc536371',
      'photo-1562322140-8baeececf3df',
      'photo-1609587312208-cea54be969e7',
      'photo-1632345031435-8727f6897d53',
      'photo-1586363104862-3a5e2ab60d99',
      'photo-1607779097040-26e80aa78e66',
    ],
    services: ['Manicure simples', 'Pedicure', 'Gel', 'Alongamento', 'Francesinha', 'Esmaltação em gel'],
    servicesEn: ['Express Manicure', 'Pedicure', 'Gel Nails', 'Extensions', 'French Tips', 'Gel Polish'],
    reviewsList: [
      {
        id: 1,
        author: 'Vanessa Lopes',
        avatarId: 'photo-1489424731084-a5d8b219a5bb',
        rating: 5,
        date: '8 ago 2026',
        text: 'Tatiane é pontual e muito caprichosa. Minhas unhas ficaram perfeitas. Preço ótimo para a qualidade do serviço!',
        textEn: 'Tatiane is punctual and meticulous. My nails look perfect. Great value for quality service!',
      },
      {
        id: 2,
        author: 'Simone Barbosa',
        avatarId: 'photo-1494790108377-be9c29b29330',
        rating: 4,
        date: '30 jul 2026',
        text: 'Boa atendimento e produto de qualidade. Atendeu no horário combinado e deixou tudo limpo.',
        textEn: 'Good customer service and quality products. Arrived on time.',
      },
    ],
    verified: true,
    availability: 'Disponível amanhã',
    availabilityEn: 'Available tomorrow',
    availableNow: false,
    deliveryInfo: 'Atendimento em domicílio. Zona Norte (Santana, Tucuruvi, Vila Guilherme). Horários a combinar.',
    deliveryInfoEn: 'At-home service in North Zone (Santana, Tucuruvi). Flexible scheduling.',
  },
  {
    id: 7,
    name: 'Diego Lima',
    category: 'dogsitter',
    categoryLabel: 'Dog Sitter',
    categoryLabelEn: 'Dog Sitter',
    nationality: 'CO',
    country: 'CO',
    rating: 4.7,
    reviews: 36,
    price: '$ 45.000 / passeio',
    priceEn: '$ 45,000 / walk',
    location: 'Chapinero, Bogotá',
    state: 'Cundinamarca',
    city: 'Bogotá',
    description: 'Passeios diários e hospedagem. Formado em comportamento animal. Relatórios diários.',
    descriptionEn: 'Daily walks and dog boarding. Animal behavior specialist. Daily photo reports.',
    bio: 'Formado em comportamento animal e apaixonado por cães. Ofereço passeios individualizados e com atenção total para cada pet. Envio relatórios fotográficos diários para os tutores. Experiência com cães de todas as raças e temperamentos.',
    bioEn: 'Degree in animal behavior and dog care. I offer individualized walks with full attention and daily photo reports for pet parents.',
    photoId: 'photo-1492562080023-ab3db95bfbce',
    portfolioIds: [
      'photo-1561037404-61cd46aa615b',
      'photo-1587300003388-59208cc962cb',
      'photo-1477884213360-7e9d7dcc1e48',
      'photo-1548199973-03cce0bbc87b',
      'photo-1537151625747-768eb6cf92b2',
      'photo-1518717758536-85ae29035b6d',
    ],
    services: ['Passeios diários', 'Hospedagem', 'Visita domiciliar', 'Adestramento básico', 'Socialização', 'Transporte pet'],
    servicesEn: ['Daily Walks', 'Dog Boarding', 'Home Visit', 'Basic Training', 'Socialization', 'Pet Transport'],
    reviewsList: [
      {
        id: 1,
        author: 'Natália Freitas',
        avatarId: 'photo-1580489944761-15a19d654956',
        rating: 5,
        date: '6 ago 2026',
        text: 'Diego é ótimo! Meu Labrador adora os passeios com ele. As fotos e vídeos diários me deixam tranquila enquanto trabalho.',
        textEn: 'Diego is great! My Labrador loves walking with him. The daily photos keep me at ease while at work.',
      },
      {
        id: 2,
        author: 'Gustavo Araujo',
        avatarId: 'photo-1507003211169-0a1dd7228f2d',
        rating: 4,
        date: '24 jul 2026',
        text: 'Bom profissional, pontual e meu cachorro voltou cansado de tanto passear! Recomendo para quem busca qualidade.',
        textEn: 'Very professional, punctual, and my dog had a great workout.',
      },
    ],
    verified: false,
    availability: 'Disponível hoje',
    availabilityEn: 'Available today',
    availableNow: true,
    deliveryInfo: 'Retirada e entrega do pet em casa. Raio de 5km de Perdizes. Horários flexíveis a combinar.',
    deliveryInfoEn: 'Pet pickup and drop-off within 5km radius. Flexible hours.',
  },
  {
    id: 8,
    name: 'Fernanda Rocha',
    category: 'confeitaria',
    categoryLabel: 'Confeitaria',
    categoryLabelEn: 'Bakery & Pastry',
    nationality: 'BR',
    rating: 4.8,
    reviews: 97,
    price: 'R$ 8 / un (salgados)',
    priceEn: 'R$ 8 / unit (savories)',
    location: 'Lapa, SP',
    state: 'SP',
    city: 'Lapa',
    description: 'Salgados fritos e assados, coxinhas e quibes para festas. Entrega em toda São Paulo.',
    descriptionEn: 'Fried and baked savory pastries, coxinhas, and quibes for parties. Delivery across SP.',
    bio: 'Confeiteira e salgadeira artesanal há 7 anos. Trabalho com ingredientes frescos e sem conservantes. Meus salgados são referência na Lapa. Atendo festas de todos os tamanhos, de 50 a 5.000 unidades. Entrego em toda São Paulo.',
    bioEn: 'Artisanal baker and pastry chef for 7 years. Fresh preservative-free ingredients. Catering for events of all sizes from 50 to 5,000 units with delivery across SP.',
    photoId: 'photo-1489424731084-a5d8b219a5bb',
    portfolioIds: [
      'photo-1550617931-e17a7b70dce2',
      'photo-1578985545062-69928b1d9587',
      'photo-1488477181946-6428a0291777',
      'photo-1499636136210-6f4ee915583e',
      'photo-1464349095431-e9a21285b5f3',
      'photo-1563729784474-d77dbb933a9e',
    ],
    services: ['Coxinha', 'Quibe', 'Esfiha', 'Enroladinho', 'Bolinha de queijo', 'Mini sanduíche'],
    servicesEn: ['Chicken Coxinha', 'Quibe', 'Baked Esfiha', 'Puff Pastry Roll', 'Cheese Balls', 'Party Sandwiches'],
    reviewsList: [
      {
        id: 1,
        author: 'Larissa Nunes',
        avatarId: 'photo-1508214751196-bcfd4ca60f91',
        rating: 5,
        date: '10 ago 2026',
        text: 'Salgados deliciosos! Pedi 300 unidades para meu aniversário e acabaram em 20 minutos. Entrega no horário combinado.',
        textEn: 'Delicious pastries! Ordered 300 units for my birthday and they disappeared in 20 minutes. Delivered right on schedule.',
      },
      {
        id: 2,
        author: 'Felipe Cardoso',
        avatarId: 'photo-1492562080023-ab3db95bfbce',
        rating: 5,
        date: '3 ago 2026',
        text: 'A melhor coxinha que já comi! Pedido para evento corporativo, 500 unidades. Tudo perfeito.',
        textEn: 'The best coxinha I have tasted! Corporate order for 500 units was flawless.',
      },
      {
        id: 3,
        author: 'Monica Silveira',
        avatarId: 'photo-1438761681033-6461ffad8d80',
        rating: 4,
        date: '21 jul 2026',
        text: 'Ótima qualidade e preço justo. Entrega um pouco atrasada mas avisou com antecedência. Voltarei a pedir!',
        textEn: 'Great quality and fair price. Will definitely order again.',
      },
    ],
    verified: true,
    badge: 'Entrega Rápida',
    badgeEn: 'Fast Delivery',
    availability: 'Encomendas abertas',
    availabilityEn: 'Orders open',
    availableNow: true,
    deliveryInfo: 'Entrega em toda São Paulo. Frete grátis acima de 200 unidades. Prazo mínimo: 3 dias úteis.',
    deliveryInfoEn: 'Delivery across all São Paulo. Free shipping over 200 units. Min notice: 3 days.',
  },
  {
    id: 9,
    name: 'Luciana Pires',
    category: 'faxina',
    categoryLabel: 'Faxina',
    categoryLabelEn: 'Cleaning',
    nationality: 'UY',
    rating: 4.9,
    reviews: 112,
    price: 'R$ 180 / diária',
    priceEn: 'R$ 180 / day',
    location: 'Jardins, SP',
    state: 'SP',
    city: 'Jardins',
    description: 'Limpeza profissional pós-obra e organização de ambientes. 10 anos de experiência.',
    descriptionEn: 'Professional post-construction cleaning and home organization. 10 years experience.',
    bio: 'Profissional de limpeza com 10 anos de experiência em residências e estabelecimentos comerciais. Especialista em limpeza pós-obra e organização de ambientes. Trabalho com equipe própria quando necessário para entregas mais rápidas.',
    bioEn: 'Cleaning professional with 10 years experience in luxury residences and commercial spaces. Post-renovation and organizational specialist.',
    photoId: 'photo-1508214751196-bcfd4ca60f91',
    portfolioIds: [
      'photo-1581578731548-c64695cc6952',
      'photo-1558618666-fcd25c85cd64',
      'photo-1527515545081-5db817172677',
      'photo-1556909114-f6e7ad7d3136',
      'photo-1563453392212-326f5e854473',
      'photo-1596462502278-27bfdc403348',
    ],
    services: ['Faxina completa', 'Limpeza pós-obra', 'Organização Marie Kondo', 'Lavagem de janelas', 'Limpeza de estofados', 'Higienização de colchões'],
    servicesEn: ['Full House Cleaning', 'Post-Construction Cleanup', 'Decluttering & Organizing', 'Window Washing', 'Upholstery Washing', 'Mattress Sanitizing'],
    reviewsList: [
      {
        id: 1,
        author: 'Débora Mendes',
        avatarId: 'photo-1580489944761-15a19d654956',
        rating: 5,
        date: '12 ago 2026',
        text: 'Luciana transformou meu apartamento pós-reforma. Tudo brilhando! Organização impecável. Vale cada centavo.',
        textEn: 'Luciana transformed my post-renovation apartment. Sparkling clean and perfectly organized. Worth every penny.',
      },
      {
        id: 2,
        author: 'Roberto Campos',
        avatarId: 'photo-1500648767791-00dcc994a43e',
        rating: 5,
        date: '4 ago 2026',
        text: 'Melhor serviço de limpeza que já contratei. Cuidado com cada detalhe, até o interior dos armários.',
        textEn: 'Best cleaning service I have hired. Meticulous with every detail.',
      },
      {
        id: 3,
        author: 'Sandra Lima',
        avatarId: 'photo-1494790108377-be9c29b29330',
        rating: 5,
        date: '26 jul 2026',
        text: 'Profissional exemplar. Chegou no horário, trabalhou com muito cuidado e deixou tudo perfeito. Já é fixinha em casa!',
        textEn: 'Exemplary cleaner. Arrived on time, worked diligently, and left everything spotless.',
      },
    ],
    verified: true,
    badge: 'Top Prestadora',
    badgeEn: 'Top Provider',
    availability: 'Próxima vaga: seg',
    availabilityEn: 'Next slot: Mon',
    availableNow: false,
    deliveryInfo: 'Atendimento presencial. Zona Sul, Centro e Zona Oeste. Data e horário a combinar via chat.',
    deliveryInfoEn: 'In-person service in South, Central, and West zones. Date/time scheduled via chat.',
  },
  {
    id: 10,
    name: 'Carlos Santos (Movers Pro)',
    category: 'movers',
    categoryLabel: 'Movers',
    categoryLabelEn: 'Movers & Freight',
    nationality: 'BR',
    country: 'BR',
    rating: 4.9,
    reviews: 74,
    price: 'R$ 220 / viagem',
    priceEn: 'R$ 220 / trip',
    location: 'Pinheiros, SP',
    state: 'SP',
    city: 'Pinheiros',
    description: 'Mudanças residenciais, carretos rápidos e içamentos com equipe e caminhão baú próprio.',
    descriptionEn: 'Residential moving, fast freight, and heavy furniture hoisting with truck and team.',
    bio: 'Trabalho com mudanças e transporte de móveis há mais de 8 anos. Dispomos de caminhão baú higienizado, mantas protetoras, plástico bolha e ajudantes capacitados para carregar e descarregar com total segurança.',
    bioEn: 'Over 8 years of moving and furniture transportation experience. Clean box trucks, protective blankets, bubble wrap, and experienced crew.',
    photoId: 'photo-1600585154340-be6161a56a0c',
    portfolioIds: [
      'photo-1581092918056-0c4c3acd3789',
      'photo-1600585154526-990dced4db0d',
      'photo-1504148455328-c376907d081c',
    ],
    services: [
      { name: 'Mudança residencial completa', price: 'R$ 650' },
      { name: 'Carreto rápido', price: 'R$ 220' },
      { name: 'Montagem/desmontagem de móveis', price: 'R$ 150' },
      { name: 'Embalagem de itens frágeis', price: 'R$ 120' },
    ],
    servicesEn: [
      { name: 'Full Residential Moving', price: 'R$ 650' },
      { name: 'Express Freight Trip', price: 'R$ 220' },
      { name: 'Furniture Assembly / Disassembly', price: 'R$ 150' },
      { name: 'Fragile Items Packing', price: 'R$ 120' },
    ],
    reviewsList: [
      {
        id: 1,
        author: 'Felipe Neves',
        avatarId: 'photo-1500648767791-00dcc994a43e',
        rating: 5,
        date: '14 ago 2026',
        text: 'Carlos e a equipe foram pontuais, rápidos e cuidadosos demais com os móveis e eletros. Nenhum arranhão!',
        textEn: 'Carlos and team were punctual, fast, and extremely careful with furniture and appliances. Not a scratch!',
      },
    ],
    verified: true,
    badge: 'Super Mover',
    badgeEn: 'Super Mover',
    availability: 'Disponível hoje',
    availabilityEn: 'Available today',
    availableNow: true,
    deliveryInfo: 'Atendimento em toda a Grande São Paulo e interior.',
    deliveryInfoEn: 'Service across all Greater São Paulo and state.',
  },
  {
    id: 11,
    name: 'Helena Takahashi',
    category: 'massage',
    categoryLabel: 'Massagem',
    categoryLabelEn: 'Massage & Therapy',
    nationality: 'BR',
    country: 'BR',
    rating: 5.0,
    reviews: 88,
    price: 'R$ 140 / sessão',
    priceEn: 'R$ 140 / session',
    location: 'Moema, SP',
    state: 'SP',
    city: 'Moema',
    description: 'Massoterapia, drenagem linfática, shiatsu e massagem relaxante com maca portátil em domicílio.',
    descriptionEn: 'Massotherapy, lymphatic drainage, shiatsu, and relaxation massage with heated portable table.',
    bio: 'Massoterapeuta certificada com especialização em Shiatsu e Drenagem Linfática Método Renata França. Levo maca profissional aquecida, óleos essenciais puros e música relaxante até o conforto da sua casa.',
    bioEn: 'Certified massage therapist specialized in Shiatsu and lymphatic drainage. I bring a heated professional table, pure organic essential oils, and soothing ambiance to your home.',
    photoId: 'photo-1544161515-4ab6ce6db874',
    portfolioIds: [
      'photo-1544161515-4ab6ce6db874',
      'photo-1519823551278-64ac92734fb1',
    ],
    services: [
      { name: 'Massagem Relaxante', price: 'R$ 140' },
      { name: 'Drenagem Linfática', price: 'R$ 160' },
      { name: 'Shiatsu Terapêutico', price: 'R$ 150' },
      { name: 'Ventosaterapia', price: 'R$ 120' },
    ],
    servicesEn: [
      { name: 'Relaxing Aromatherapy Massage', price: 'R$ 140' },
      { name: 'Lymphatic Drainage', price: 'R$ 160' },
      { name: 'Therapeutic Shiatsu', price: 'R$ 150' },
      { name: 'Cupping Therapy', price: 'R$ 120' },
    ],
    reviewsList: [
      {
        id: 1,
        author: 'Patrícia Prado',
        avatarId: 'photo-1534528741775-53994a69daeb',
        rating: 5,
        date: '10 ago 2026',
        text: 'Helena tem mãos mágicas! A sessão em casa foi um alívio imediato para as dores nas costas. Maravilhosa!',
        textEn: 'Helena has magic hands! The session at home was an instant relief for back tension. Wonderful!',
      },
    ],
    verified: true,
    badge: 'Terapeuta Top',
    badgeEn: 'Top Therapist',
    availability: 'Disponível hoje',
    availabilityEn: 'Available today',
    availableNow: true,
    deliveryInfo: 'Atendimento a domicílio com maca portátil. Moema, Jardins, Itaim e Vila Mariana.',
    deliveryInfoEn: 'At-home visits with portable table. Moema, Jardins, Itaim, and Vila Mariana.',
  },
  {
    id: 12,
    name: 'Larissa Beauty Makeup',
    category: 'makeup',
    categoryLabel: 'Makeup',
    categoryLabelEn: 'Makeup & Beauty',
    nationality: 'BR',
    country: 'BR',
    rating: 4.9,
    reviews: 105,
    price: 'R$ 180 / make',
    priceEn: 'R$ 180 / makeup',
    location: 'Vila Madalena, SP',
    state: 'SP',
    city: 'Vila Madalena',
    description: 'Maquiagem social, noivas, madrinhas e eventos especiais com produtos importados e fixação 24h.',
    descriptionEn: 'Social makeup, bridal beauty, bridesmaids, and gala events with imported products and 24h hold.',
    bio: 'Maquiadora profissional formada pela Make Up For Ever Academy. Especialista em pele blindada, noivas e makes glamourosas para festas. Trabalho com produtos de alta performance (MAC, NARS, Dior, Huda Beauty).',
    bioEn: 'Professional makeup artist trained at Make Up For Ever Academy. Expert in waterproof skin, bridal beauty, and glam event styles with top luxury cosmetics.',
    photoId: 'photo-1487412720507-e7ab37603c6f',
    portfolioIds: [
      'photo-1487412720507-e7ab37603c6f',
      'photo-1522337360788-8b13dee7a37e',
      'photo-1512496015851-a90fb38ba796',
    ],
    services: [
      { name: 'Make Social / Festa', price: 'R$ 180' },
      { name: 'Make Madrinha / Formanda', price: 'R$ 220' },
      { name: 'Produção Noiva', price: 'R$ 600' },
      { name: 'Design de Sobrancelhas', price: 'R$ 60' },
    ],
    servicesEn: [
      { name: 'Social / Evening Makeup', price: 'R$ 180' },
      { name: 'Bridesmaid / Prom Glam', price: 'R$ 220' },
      { name: 'Full Bridal Production', price: 'R$ 600' },
      { name: 'Eyebrow Shaping & Design', price: 'R$ 60' },
    ],
    reviewsList: [
      {
        id: 1,
        author: 'Juliana Paes',
        avatarId: 'photo-1438761681033-6461ffad8d80',
        rating: 5,
        date: '12 ago 2026',
        text: 'A make durou o casamento inteiro até as 6 da manhã intacta! Larissa é uma artista.',
        textEn: 'The makeup lasted the entire wedding reception until 6am completely intact! Larissa is an artist.',
      },
    ],
    verified: true,
    badge: 'Pro Artist',
    badgeEn: 'Pro Artist',
    availability: 'Disponível este fds',
    availabilityEn: 'Available this weekend',
    availableNow: false,
    deliveryInfo: 'Atendimento a domicílio ou no estúdio em Vila Madalena.',
    deliveryInfoEn: 'At-home visits or studio appointments in Vila Madalena.',
  },
  {
    id: 13,
    name: 'Rodrigo Hair Studio',
    category: 'cabeleleiro',
    categoryLabel: 'Cabeleireiro',
    categoryLabelEn: 'Hair Salon',
    nationality: 'BR',
    country: 'BR',
    rating: 4.9,
    reviews: 130,
    price: 'R$ 90 / corte',
    priceEn: 'R$ 90 / cut',
    location: 'Perdizes, SP',
    state: 'SP',
    city: 'Perdizes',
    description: 'Cortes masculinos e femininos, coloração, luzes, mechas e tratamentos capilares personalizados.',
    descriptionEn: 'Men & women haircuts, coloring, highlights, balayage, and personalized hair therapies.',
    bio: 'Cabeleireiro visagista com 14 anos de mercado. Especialista em mechas, loiros saudáveis, cortes modernos e terapias capilares de reconstrução e hidratação.',
    bioEn: 'Hair stylist and visagist with 14 years of market experience. Specialist in blondes, highlights, modern styling, and deep restorative hair therapies.',
    photoId: 'photo-1560066984-138dadb4c035',
    portfolioIds: [
      'photo-1560066984-138dadb4c035',
      'photo-1522337360788-8b13dee7a37e',
    ],
    services: [
      { name: 'Corte Feminino com Escova', price: 'R$ 130' },
      { name: 'Corte Masculino / Barba', price: 'R$ 90' },
      { name: 'Mechas / Luzes Glam', price: 'R$ 380' },
      { name: 'Cronograma Capilar Profundo', price: 'R$ 160' },
    ],
    servicesEn: [
      { name: 'Women Haircut & Blowdry', price: 'R$ 130' },
      { name: 'Men Haircut / Beard Trim', price: 'R$ 90' },
      { name: 'Glam Highlights / Balayage', price: 'R$ 380' },
      { name: 'Deep Hair Therapy & Treatment', price: 'R$ 160' },
    ],
    reviewsList: [
      {
        id: 1,
        author: 'Tatiana Barros',
        avatarId: 'photo-1494790108377-be9c29b29330',
        rating: 5,
        date: '15 ago 2026',
        text: 'Corte perfeito e mechas impecáveis sem danificar o cabelo. O Rodrigo entende exatamente o que a gente quer!',
        textEn: 'Perfect haircut and flawless highlights without damaging my hair. Rodrigo understands exactly what we need!',
      },
    ],
    verified: true,
    badge: 'Master Stylist',
    badgeEn: 'Master Stylist',
    availability: 'Disponível hoje',
    availabilityEn: 'Available today',
    availableNow: true,
    deliveryInfo: 'Atendimento no salão em Perdizes ou a domicílio sob agendamento.',
    deliveryInfoEn: 'Salon appointments in Perdizes or home service upon booking.',
  },
]
