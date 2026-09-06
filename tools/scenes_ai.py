# -*- coding: utf-8 -*-
"""The twenty surfaces the levels are played on, one per chapter.

Each scene says which object themes belong on it, so a chapter has its own
character and the objects do not repeat from chapter to chapter.
"""
SURFACES = [
 ('altar',    {'en': 'The Moon Altar',    'vi': 'Bàn Thờ Trăng'},    (150, 124, 172),
  'an empty dark walnut wood table surface photographed from directly straight above, completely empty with nothing on it, '
  'warm candlelight falling from one side, rich wood grain, deep soft shadows towards the corners',
  ['light', 'celestial', 'paper', 'crystal']),
 ('velvet',   {'en': 'Velvet Night',      'vi': 'Đêm Nhung'},        (138, 122, 186),
  'an empty deep indigo blue velvet cloth photographed from directly straight above, completely empty with nothing on it, '
  'soft folds in the fabric, gentle warm light from one side',
  ['crystal', 'celestial', 'jewel', 'paper']),
 ('linen',    {'en': 'Tea and Petals',    'vi': 'Trà và Cánh Hoa'},  (168, 146, 172),
  'an empty warm cream linen tablecloth photographed from directly straight above, completely empty with nothing on it, '
  'soft natural daylight, gentle fabric texture',
  ['tea', 'botanical', 'paper', 'fabric']),
 ('marble',   {'en': 'Marble Table',      'vi': 'Bàn Đá Hoa'},       (170, 160, 180),
  'an empty pale grey marble table top photographed from directly straight above, completely empty with nothing on it, '
  'soft veining in the stone, cool even daylight',
  ['jewel', 'crystal', 'tool', 'bottle']),
 ('moss',     {'en': 'Forest Floor',      'vi': 'Nền Rừng'},         (128, 150, 128),
  'an empty bed of soft green moss photographed from directly straight above, completely empty with nothing on it, '
  'dappled forest light, tiny details in the moss',
  ['botanical', 'nature', 'figure', 'light']),
 ('sand',     {'en': 'Shore at Dusk',     'vi': 'Bờ Biển Hoàng Hôn'}, (188, 168, 150),
  'an empty stretch of smooth pale beach sand photographed from directly straight above, completely empty with nothing on it, '
  'warm low evening light, fine ripples in the sand',
  ['nature', 'crystal', 'bottle', 'celestial']),
 ('slate',    {'en': 'Black Slate',       'vi': 'Đá Đen'},           (120, 118, 132),
  'an empty dark charcoal slate slab photographed from directly straight above, completely empty with nothing on it, '
  'matte stone texture, a single warm light from the left',
  ['light', 'crystal', 'tool', 'botanical']),
 ('kraft',    {'en': 'The Writing Desk',  'vi': 'Bàn Viết'},         (172, 152, 128),
  'an empty sheet of warm brown kraft paper on a desk photographed from directly straight above, completely empty with nothing on it, '
  'soft lamp light from the upper left',
  ['paper', 'tool', 'botanical', 'fabric']),
 ('silk',     {'en': 'Rose Silk',         'vi': 'Lụa Hồng'},         (196, 156, 168),
  'an empty sheet of dusty rose pink silk photographed from directly straight above, completely empty with nothing on it, '
  'soft sheen and gentle folds, warm light',
  ['jewel', 'botanical', 'fabric', 'tea']),
 ('night',    {'en': 'Star Cloth',        'vi': 'Vải Sao'},          (120, 118, 178),
  'an empty deep navy cloth scattered with tiny embroidered gold stars, photographed from directly straight above, '
  'completely empty with nothing on it, soft moonlight',
  ['celestial', 'crystal', 'light', 'jewel']),
 ('oak',      {'en': 'The Old Table',     'vi': 'Bàn Gỗ Cũ'},        (162, 140, 120),
  'an empty pale oak wooden table top photographed from directly straight above, completely empty with nothing on it, '
  'visible grain and small knots, bright soft daylight',
  ['tea', 'tool', 'paper', 'botanical']),
 ('terracotta',{'en': 'Terracotta',       'vi': 'Gốm Đất Nung'},     (190, 148, 126),
  'an empty warm terracotta tiled surface photographed from directly straight above, completely empty with nothing on it, '
  'gentle clay texture, warm afternoon light',
  ['botanical', 'bottle', 'figure', 'tea']),
 ('lace',     {'en': 'Lace and Lamplight', 'vi': 'Ren và Ánh Đèn'},  (198, 178, 176),
  'an empty piece of cream crocheted lace over a wooden table, photographed from directly straight above, '
  'completely empty with nothing on it, warm lamp light',
  ['fabric', 'jewel', 'tea', 'paper']),
 ('water',    {'en': 'Still Water',       'vi': 'Mặt Nước Lặng'},    (130, 152, 172),
  'an empty surface of very still dark water photographed from directly straight above, completely empty with nothing on it, '
  'faint reflections and gentle ripples, moonlight',
  ['nature', 'celestial', 'crystal', 'light']),
 ('snow',     {'en': 'First Snow',        'vi': 'Tuyết Đầu Mùa'},    (196, 200, 214),
  'an empty field of clean fresh snow photographed from directly straight above, completely empty with nothing on it, '
  'soft blue shadows, cold pale light',
  ['nature', 'crystal', 'light', 'botanical']),
 ('leather',  {'en': 'The Travelling Case', 'vi': 'Rương Du Hành'},  (152, 126, 108),
  'an empty worn brown leather surface photographed from directly straight above, completely empty with nothing on it, '
  'soft creases in the leather, warm light',
  ['tool', 'paper', 'bottle', 'celestial']),
 ('emerald',  {'en': 'Emerald Cloth',     'vi': 'Vải Ngọc Lục'},     (120, 158, 140),
  'an empty deep emerald green velvet cloth photographed from directly straight above, completely empty with nothing on it, '
  'soft folds, warm gold light from one side',
  ['jewel', 'crystal', 'figure', 'celestial']),
 ('ash',      {'en': 'Ash and Amber',     'vi': 'Tro và Hổ Phách'},  (156, 142, 132),
  'an empty pale grey concrete surface photographed from directly straight above, completely empty with nothing on it, '
  'fine speckled texture, warm amber light from the right',
  ['bottle', 'tool', 'light', 'crystal']),
 ('paper_old',{'en': 'The Star Chart',    'vi': 'Bản Đồ Sao'},       (176, 160, 138),
  'an empty aged parchment star chart with faint drawn constellations, photographed from directly straight above, '
  'completely empty with nothing on it, warm lamplight',
  ['celestial', 'paper', 'tool', 'jewel']),
 ('garden',   {'en': 'Garden Stone',      'vi': 'Đá Vườn'},          (150, 156, 138),
  'an empty flat weathered garden stone with a little moss at the edges, photographed from directly straight above, '
  'completely empty with nothing on it, soft cloudy daylight',
  ['botanical', 'nature', 'figure', 'tea']),
]

CARDS = [
 {'en': 'The Fool', 'vi': 'Chàng Khờ'}, {'en': 'The Moon', 'vi': 'Mặt Trăng'},
 {'en': 'Temperance', 'vi': 'Điều Độ'}, {'en': 'The Star', 'vi': 'Ngôi Sao'},
 {'en': 'The Empress', 'vi': 'Hoàng Hậu'}, {'en': 'The World', 'vi': 'Thế Giới'},
 {'en': 'The Hermit', 'vi': 'Ẩn Sĩ'}, {'en': 'The Magician', 'vi': 'Pháp Sư'},
 {'en': 'The Lovers', 'vi': 'Người Tình'}, {'en': 'The High Priestess', 'vi': 'Nữ Tư Tế'},
 {'en': 'Strength', 'vi': 'Sức Mạnh'}, {'en': 'The Sun', 'vi': 'Mặt Trời'},
 {'en': 'The Chariot', 'vi': 'Cỗ Xe'}, {'en': 'Wheel of Fortune', 'vi': 'Bánh Xe Số Phận'},
 {'en': 'Justice', 'vi': 'Công Lý'}, {'en': 'The Hierophant', 'vi': 'Giáo Hoàng'},
 {'en': 'Judgement', 'vi': 'Phán Xét'}, {'en': 'The Emperor', 'vi': 'Hoàng Đế'},
 {'en': 'Renewal', 'vi': 'Đổi Mới'}, {'en': 'The Hanged One', 'vi': 'Người Treo Ngược'},
]
