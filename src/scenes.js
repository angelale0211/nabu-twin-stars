/* ============================ chapter scenes ============================
   Ten backgrounds, one per chapter, drawn into a 360 x 300 picture. Each scene
   also says where objects may stand (zones) and which motifs belong there.
   `draw(p)` takes an id prefix so two pictures on one page never share
   gradient ids. Nothing dark or creepy: caves glow, nights are lavender. */

const PIC_W = 360, PIC_H = 300;

function grad(p, id, c1, c2, vertical) {
  return `<linearGradient id="${p}${id}" x1="0" y1="0" x2="${vertical === false ? 1 : 0}" y2="${vertical === false ? 0 : 1}"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>`;
}
function dots(seed, n, x0, y0, x1, y1, r, fill) {
  let s = '', t = seed;
  for (let i = 0; i < n; i++) {
    t = (t * 9301 + 49297) % 233280; const x = x0 + (t / 233280) * (x1 - x0);
    t = (t * 9301 + 49297) % 233280; const y = y0 + (t / 233280) * (y1 - y0);
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${fill}" stroke="none"/>`;
  }
  return s;
}
function hill(x, y, w, h, fill) { return `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${h}" fill="${fill}" stroke="none"/>`; }
function tinyStar(x, y, r, fill) { return `<path d="M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z" fill="${fill || GOLD}" stroke="none"/>`; }

const SCENES = {
  meadow: {
    name: { en: "Fool's Meadow", vi: 'Đồng cỏ Chàng Khờ' },
    tint: '#DCEBFF',
    zones: [{ z: 'sky', x: 26, y: 24, w: 308, h: 112 }, { z: 'ground', x: 26, y: 150, w: 308, h: 124 }],
    pool: ['sun', 'cloud', 'star', 'sparkle', 'bird', 'balloon', 'rainbow', 'flower', 'mushroom', 'sprig', 'butterfly', 'rabbit', 'cat', 'tarot', 'cardfan', 'heart', 'letter', 'wand', 'pentacle', 'book'],
    draw(p) {
      return `<defs>${grad(p, 'sky', '#CFE0FF', '#FFF3F7')}${grad(p, 'g', '#CFEBD6', '#A9D8B8')}</defs>`
           + `<rect width="360" height="300" fill="url(#${p}sky)"/>`
           + hill(60, 210, 190, 60, '#DDEFE0') + hill(320, 205, 170, 55, '#D3EBD9')
           + `<path d="M0 190 Q90 150 180 186 Q270 220 360 178 L360 300 L0 300 Z" fill="url(#${p}g)"/>`
           + dots(7, 26, 10, 200, 350, 290, 2.2, '#FFF9FA') + dots(11, 14, 10, 200, 350, 290, 2.6, PINK)
           + `<path d="M0 300 Q180 270 360 300 Z" fill="#9FCFAF"/>`;
    }
  },
  pond: {
    name: { en: 'Moon Pond', vi: 'Ao Trăng' },
    tint: '#E4D6F5',
    zones: [{ z: 'sky', x: 26, y: 22, w: 308, h: 104 }, { z: 'ground', x: 26, y: 146, w: 308, h: 128 }],
    pool: ['moon', 'star', 'sparkle', 'cloud', 'constellation', 'lotus', 'candle', 'lantern', 'rabbit', 'shell', 'feather', 'crystalball', 'teacup', 'cup', 'heart', 'butterfly', 'tarot', 'sprig', 'mala', 'potion'],
    draw(p) {
      return `<defs>${grad(p, 'sky', '#C9B8EC', '#F6D2DF')}${grad(p, 'w', '#B9D2F5', '#8FB4EA')}</defs>`
           + `<rect width="360" height="300" fill="url(#${p}sky)"/>`
           + dots(3, 20, 10, 10, 350, 110, 1.6, '#FFF9FA')
           + hill(80, 150, 160, 40, '#B5A0E0') + hill(300, 148, 150, 34, '#AE98DC')
           + `<rect y="140" width="360" height="160" fill="#8CC49B"/>`
           + `<ellipse cx="180" cy="220" rx="190" ry="70" fill="url(#${p}w)" stroke="#3D2A6E" stroke-width="2"/>`
           + `<path d="M60 220 q20 -6 40 0 M240 236 q20 -6 40 0 M120 250 q16 -5 32 0" fill="none" stroke="#FFF9FA" stroke-opacity=".7" stroke-width="2.4" stroke-linecap="round"/>`
           + `<ellipse cx="46" cy="200" rx="18" ry="8" fill="#9FCFAF" stroke="#3D2A6E" stroke-width="1.6"/><ellipse cx="316" cy="252" rx="18" ry="8" fill="#9FCFAF" stroke="#3D2A6E" stroke-width="1.6"/>`
           + `<path d="M20 140 q4 -40 0 -70 M30 140 q-6 -36 2 -60 M340 140 q4 -44 -2 -64" fill="none" stroke="#6FA27F" stroke-width="3" stroke-linecap="round"/>`;
    }
  },
  attic: {
    name: { en: 'Star Attic', vi: 'Gác Sao' },
    tint: '#EADFF7',
    zones: [{ z: 'sky', x: 108, y: 26, w: 144, h: 96 }, { z: 'ground', x: 24, y: 132, w: 312, h: 142 }],
    pool: ['star', 'sparkle', 'moon', 'constellation', 'book', 'candle', 'cat', 'owl', 'tarot', 'cardfan', 'crystalball', 'potion', 'scroll', 'key', 'hourglass', 'pillow', 'letter', 'teacup', 'lantern', 'clockmoon', 'mirror', 'gem'],
    draw(p) {
      return `<defs>${grad(p, 'wall', '#E6DBF7', '#D6C8F0')}${grad(p, 'win', '#4B3684', '#7A63B8')}</defs>`
           + `<rect width="360" height="300" fill="url(#${p}wall)"/>`
           + `<path d="M0 120 L180 0 L360 120" fill="none" stroke="#C4B3E6" stroke-width="10"/>`
           + `<path d="M100 130 L100 60 Q180 -10 260 60 L260 130 Z" fill="url(#${p}win)" stroke="#3D2A6E" stroke-width="3"/>`
           + dots(5, 18, 108, 20, 252, 122, 1.8, '#FFF9FA') + tinyStar(130, 50, 5) + tinyStar(232, 70, 4) + tinyStar(200, 36, 3.5)
           + `<path d="M100 130 L260 130 M180 130 L180 24" fill="none" stroke="#3D2A6E" stroke-width="3"/>`
           + `<rect x="0" y="136" width="360" height="12" fill="#C98E5B" stroke="#3D2A6E" stroke-width="2"/>`
           + `<rect y="148" width="360" height="152" fill="#F1E1BF"/>`
           + `<path d="M0 190 L360 190 M0 230 L360 230 M0 270 L360 270" stroke="#E2CDA0" stroke-width="2"/>`
           + `<rect x="30" y="200" width="300" height="80" rx="14" fill="#F6BBCB" stroke="#3D2A6E" stroke-width="2"/>`;
    }
  },
  tearoom: {
    name: { en: 'Tea Room', vi: 'Phòng Trà' },
    tint: '#FBEAD6',
    zones: [{ z: 'sky', x: 40, y: 24, w: 280, h: 96 }, { z: 'ground', x: 26, y: 146, w: 308, h: 128 }],
    pool: ['teacup', 'teapot', 'scroll', 'book', 'letter', 'flower', 'sprig', 'candle', 'incense', 'bell', 'bowl', 'coins', 'cardfan', 'tarot', 'heart', 'lantern', 'cat', 'rabbit', 'sparkle', 'butterfly', 'ring', 'mala'],
    draw(p) {
      return `<defs>${grad(p, 'wall', '#FFF1E6', '#F8DCC8')}</defs>`
           + `<rect width="360" height="300" fill="url(#${p}wall)"/>`
           + `<path d="M0 0 Q40 60 0 140 Z M360 0 Q320 60 360 140 Z" fill="#F6BBCB" stroke="#3D2A6E" stroke-width="2"/>`
           + `<rect x="60" y="20" width="240" height="100" rx="12" fill="#FFF9FA" stroke="#3D2A6E" stroke-width="2"/>`
           + `<path d="M60 70 L300 70 M180 20 L180 120" stroke="#3D2A6E" stroke-width="2"/>`
           + `<rect x="0" y="140" width="360" height="160" fill="#E9C9A6"/>`
           + `<path d="M0 140 L360 140" stroke="#3D2A6E" stroke-width="2"/>`
           + `<rect x="20" y="150" width="320" height="130" rx="18" fill="#FFF9FA" stroke="#3D2A6E" stroke-width="2"/>`
           + `<rect x="34" y="164" width="292" height="102" rx="12" fill="none" stroke="#F6BBCB" stroke-width="3" stroke-dasharray="10 8"/>`;
    }
  },
  cave: {
    name: { en: 'Crystal Cave', vi: 'Hang Pha Lê' },
    tint: '#DDD3F2',
    zones: [{ z: 'sky', x: 40, y: 26, w: 280, h: 100 }, { z: 'ground', x: 26, y: 146, w: 308, h: 128 }],
    pool: ['crystal', 'gem', 'sparkle', 'lantern', 'candle', 'potion', 'key', 'coins', 'shell', 'mushroom', 'owl', 'cat', 'compass', 'hourglass', 'crystalball', 'ring', 'pentacle', 'star', 'constellation', 'bowl'],
    draw(p) {
      return `<defs>${grad(p, 'c', '#8F7CC8', '#C9BCEA')}${grad(p, 'f', '#D9CDF3', '#B8A4E3')}</defs>`
           + `<rect width="360" height="300" fill="url(#${p}c)"/>`
           + `<path d="M0 0 L60 0 L40 60 L0 90 Z M360 0 L300 0 L320 60 L360 90 Z M120 0 L150 0 L140 40 Z M220 0 L250 0 L235 44 Z" fill="#7A66B5" stroke="#3D2A6E" stroke-width="2"/>`
           + dots(9, 30, 10, 10, 350, 140, 1.5, '#FFF9FA') + tinyStar(90, 100, 5, '#F6E5B3') + tinyStar(280, 90, 4, '#F6E5B3')
           + `<path d="M0 160 Q90 130 180 156 Q270 182 360 150 L360 300 L0 300 Z" fill="url(#${p}f)"/>`
           + `<path d="M0 160 Q90 130 180 156 Q270 182 360 150" fill="none" stroke="#3D2A6E" stroke-width="2"/>`
           + `<path d="M-10 300 L20 250 L50 300 Z M320 300 L345 240 L375 300 Z" fill="#AFC8F0" stroke="#3D2A6E" stroke-width="2"/>`;
    }
  },
  garden: {
    name: { en: 'Zodiac Garden', vi: 'Vườn Hoàng Đạo' },
    tint: '#D9D9F5',
    zones: [{ z: 'sky', x: 26, y: 22, w: 308, h: 104 }, { z: 'ground', x: 26, y: 146, w: 308, h: 128 }],
    pool: ['zodiac', 'zodiac', 'zodiac', 'star', 'moon', 'sparkle', 'flower', 'sprig', 'butterfly', 'lotus', 'mushroom', 'rabbit', 'owl', 'lantern', 'bell', 'heart', 'planet', 'constellation', 'dreamcatcher', 'gem'],
    draw(p) {
      return `<defs>${grad(p, 'sky', '#8C7BC9', '#E7C7DE')}${grad(p, 'g', '#B7E0C2', '#86BF97')}</defs>`
           + `<rect width="360" height="300" fill="url(#${p}sky)"/>`
           + dots(13, 24, 10, 8, 350, 120, 1.6, '#FFF9FA')
           + `<path d="M40 150 L40 60 Q180 -30 320 60 L320 150" fill="none" stroke="#3D2A6E" stroke-width="8"/><path d="M40 150 L40 60 Q180 -30 320 60 L320 150" fill="none" stroke="#F6BBCB" stroke-width="4"/>`
           + `<path d="M0 150 L360 150 L360 300 L0 300 Z" fill="url(#${p}g)"/>`
           + `<path d="M0 150 L360 150" stroke="#3D2A6E" stroke-width="2"/>`
           + `<path d="M120 300 Q140 220 180 160 Q220 220 240 300 Z" fill="#F1E1BF" stroke="#3D2A6E" stroke-width="2"/>`
           + dots(17, 20, 0, 160, 110, 290, 3, '#F6BBCB') + dots(19, 20, 250, 160, 360, 290, 3, '#AFC8F0');
    }
  },
  space: {
    name: { en: 'Planet Walk', vi: 'Dạo Bước Hành Tinh' },
    tint: '#CFC4EE',
    zones: [{ z: 'sky', x: 30, y: 26, w: 300, h: 250 }],
    pool: ['planet', 'planet', 'comet', 'star', 'sparkle', 'moon', 'constellation', 'balloon', 'zodiac', 'gem', 'sun', 'clockmoon', 'rabbit', 'cat', 'tarot', 'cardfan', 'heart', 'key', 'hourglass', 'compass'],
    draw(p) {
      return `<defs>${grad(p, 's', '#5B4A9C', '#8B7BC8')}</defs>`
           + `<rect width="360" height="300" fill="url(#${p}s)"/>`
           + `<ellipse cx="80" cy="80" rx="120" ry="60" fill="#F6BBCB" fill-opacity=".25" stroke="none"/><ellipse cx="300" cy="230" rx="130" ry="70" fill="#AFC8F0" fill-opacity=".25" stroke="none"/>`
           + dots(21, 40, 6, 6, 354, 294, 1.5, '#FFF9FA') + dots(23, 12, 6, 6, 354, 294, 2.4, '#F6E5B3')
           + tinyStar(40, 250, 5, '#F6E5B3') + tinyStar(330, 40, 6, '#F6E5B3') + tinyStar(190, 20, 4, '#FFF9FA');
    }
  },
  temple: {
    name: { en: 'Temple of Cups', vi: 'Đền Chén Thánh' },
    tint: '#FCE3E6',
    zones: [{ z: 'sky', x: 60, y: 22, w: 240, h: 90 }, { z: 'ground', x: 26, y: 136, w: 308, h: 138 }],
    pool: ['cup', 'wand', 'sword', 'pentacle', 'cup', 'wand', 'sword', 'pentacle', 'candle', 'incense', 'bowl', 'lotus', 'mala', 'scroll', 'bell', 'sun', 'star', 'cloud', 'bird', 'sparkle', 'tarot'],
    draw(p) {
      return `<defs>${grad(p, 'sky', '#F8D2DA', '#FFF1DD')}</defs>`
           + `<rect width="360" height="300" fill="url(#${p}sky)"/>`
           + `<rect x="20" y="40" width="26" height="110" rx="6" fill="#FFF9FA" stroke="#3D2A6E" stroke-width="2"/><rect x="314" y="40" width="26" height="110" rx="6" fill="#FFF9FA" stroke="#3D2A6E" stroke-width="2"/>`
           + `<rect x="10" y="30" width="46" height="14" rx="4" fill="#E5BE5E" stroke="#3D2A6E" stroke-width="2"/><rect x="304" y="30" width="46" height="14" rx="4" fill="#E5BE5E" stroke="#3D2A6E" stroke-width="2"/>`
           + `<path d="M0 20 L180 -10 L360 20" fill="none" stroke="#3D2A6E" stroke-width="3"/>`
           + `<rect y="150" width="360" height="150" fill="#D9CDF3"/>`
           + `<rect x="0" y="150" width="360" height="30" fill="#B8A4E3" stroke="#3D2A6E" stroke-width="2"/><rect x="40" y="180" width="280" height="30" fill="#C9BCEA" stroke="#3D2A6E" stroke-width="2"/>`
           + `<rect x="0" y="210" width="360" height="90" fill="#F1E1BF"/><path d="M0 210 L360 210" stroke="#3D2A6E" stroke-width="2"/>`
           + `<rect x="60" y="120" width="240" height="12" rx="4" fill="#E5BE5E" stroke="#3D2A6E" stroke-width="2"/>`;
    }
  },
  clouds: {
    name: { en: 'Cloud Kingdom', vi: 'Vương Quốc Mây' },
    tint: '#D8E8FF',
    zones: [{ z: 'sky', x: 26, y: 22, w: 308, h: 124 }, { z: 'ground', x: 26, y: 160, w: 308, h: 114 }],
    pool: ['cloud', 'rainbow', 'sun', 'bird', 'balloon', 'star', 'sparkle', 'heart', 'butterfly', 'letter', 'feather', 'bell', 'key', 'ring', 'flower', 'dreamcatcher', 'cup', 'rabbit', 'owl', 'pillow', 'tarot'],
    draw(p) {
      return `<defs>${grad(p, 'sky', '#A9C6F5', '#E4EEFF')}</defs>`
           + `<rect width="360" height="300" fill="url(#${p}sky)"/>`
           + `<path d="M-20 170 A200 200 0 0 1 380 170" fill="none" stroke="#F6BBCB" stroke-opacity=".6" stroke-width="12"/><path d="M-6 170 A186 186 0 0 1 366 170" fill="none" stroke="#F6E5B3" stroke-opacity=".7" stroke-width="12"/><path d="M8 170 A172 172 0 0 1 352 170" fill="none" stroke="#CFEBD6" stroke-opacity=".7" stroke-width="12"/>`
           + `<path d="M0 200 Q30 160 70 190 Q100 150 150 185 Q180 140 230 180 Q270 150 300 185 Q330 160 360 195 L360 300 L0 300 Z" fill="#FFF9FA" stroke="#3D2A6E" stroke-width="2"/>`
           + `<path d="M0 250 Q60 230 120 250 Q200 270 260 245 Q320 225 360 250 L360 300 L0 300 Z" fill="#EFE9FA" stroke="#3D2A6E" stroke-width="2"/>`;
    }
  },
  tower: {
    name: { en: "Nabu's Observatory", vi: 'Đài Quan Sát của Nabu' },
    tint: '#D6CBF0',
    zones: [{ z: 'sky', x: 26, y: 22, w: 308, h: 122 }, { z: 'ground', x: 26, y: 158, w: 308, h: 116 }],
    pool: ['moon', 'star', 'planet', 'comet', 'constellation', 'sparkle', 'zodiac', 'crystalball', 'book', 'candle', 'cardfan', 'tarot', 'hourglass', 'compass', 'clockmoon', 'owl', 'cat', 'potion', 'key', 'crystal', 'lantern', 'dreamcatcher', 'gem', 'mala'],
    draw(p) {
      return `<defs>${grad(p, 'sky', '#4B3684', '#9B86D2')}</defs>`
           + `<rect width="360" height="300" fill="url(#${p}sky)"/>`
           + dots(31, 44, 6, 6, 354, 150, 1.5, '#FFF9FA') + tinyStar(50, 60, 5, '#F6E5B3') + tinyStar(300, 40, 4, '#F6E5B3')
           + `<path d="M-40 300 L40 120 L120 300 Z" fill="#7A66B5" stroke="none"/><path d="M240 300 L310 130 L400 300 Z" fill="#7A66B5" stroke="none"/>`
           + `<rect x="0" y="160" width="360" height="140" fill="#B8A4E3"/>`
           + `<path d="M0 160 L360 160" stroke="#3D2A6E" stroke-width="2"/>`
           + `<path d="M0 160 L0 130 L20 130 L20 145 L40 145 L40 130 L60 130 L60 160 M300 160 L300 130 L320 130 L320 145 L340 145 L340 130 L360 130 L360 160" fill="#D9CDF3" stroke="#3D2A6E" stroke-width="2"/>`
           + `<rect x="24" y="176" width="312" height="100" rx="16" fill="#3D2A6E" fill-opacity=".14" stroke="#F6E5B3" stroke-width="2" stroke-dasharray="8 6"/>`;
    }
  }
};

const CHAPTERS = [
  { id: 1, bg: 'meadow', card: { en: 'The Fool', vi: 'Chàng Khờ' }, need: 0 },
  { id: 2, bg: 'pond', card: { en: 'The Moon', vi: 'Mặt Trăng' }, need: 12 },
  { id: 3, bg: 'attic', card: { en: 'The Star', vi: 'Ngôi Sao' }, need: 30 },
  { id: 4, bg: 'tearoom', card: { en: 'Temperance', vi: 'Điều Độ' }, need: 50 },
  { id: 5, bg: 'cave', card: { en: 'The Hermit', vi: 'Ẩn Sĩ' }, need: 72 },
  { id: 6, bg: 'garden', card: { en: 'Wheel of Fortune', vi: 'Bánh Xe Số Phận' }, need: 96 },
  { id: 7, bg: 'space', card: { en: 'The World', vi: 'Thế Giới' }, need: 120 },
  { id: 8, bg: 'temple', card: { en: 'The High Priestess', vi: 'Nữ Tư Tế' }, need: 146 },
  { id: 9, bg: 'clouds', card: { en: 'The Sun', vi: 'Mặt Trời' }, need: 172 },
  { id: 10, bg: 'tower', card: { en: 'The Magician', vi: 'Pháp Sư' }, need: 200 }
];
