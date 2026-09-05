/* ============================ strings ============================
   Plain words in both languages. Vietnamese is written short and everyday. */
const STR = {
  en: {
    appName: 'Nabu Twin Stars', tagline: 'Two pictures. Find what changed.',
    nav: { home: 'Home', map: 'Levels', daily: 'Daily', shop: 'Shop', me: 'Me' },
    play: 'Play', continueBtn: 'Continue', next: 'Next level', retry: 'Try again', back: 'Back', close: 'Close', ok: 'OK', cancel: 'Cancel',
    level: 'Level', chapter: 'Chapter', locked: 'Locked', needStars: 'Collect {n} stars to open this chapter',
    stardust: 'Stardust', moon: 'Moonstones', hearts: 'Hearts', hints: 'Hints',
    typeDiff: 'Find the differences', typeSame: 'Bonus: find what stayed the same', typeMirror: 'Mirror stage: picture B is flipped',
    found: 'Found', misses: 'Misses', time: 'Time', noTimer: 'No timer',
    hint: 'Hint', hintFree: 'Use a hint', hintCost: 'Hint · {n} ✦', hintAd: 'Hint · watch ad', addTime: '+30 s · {n} ✦', pause: 'Pause', paused: 'Paused', resume: 'Resume', quit: 'Leave level',
    tutDiff: 'Look at both pictures. Tap anything that is different. Wrong taps cost time, so look first.',
    tutSame: 'Bonus stage! Almost everything changed. Tap only what stayed exactly the same.',
    tutMirror: 'Picture B is a mirror image. Compare left with right.',
    win: 'Lovely!', winSub: 'You found them all.', fail: 'Not this time', failTime: 'Time ran out.', failMiss: 'Too many wrong taps.',
    reward: 'Reward', firstClear: 'First clear bonus', threeStar: '3-star bonus', blessingBonus: 'Card blessing',
    doubleAd: 'Double reward · watch ad', continueAd: 'Continue · watch ad', continueMoon: 'Continue · {n} 🌙', continueNote: '+30 s and your misses are forgiven',
    loseHeart: 'You lose 1 heart', noHearts: 'No hearts left', heartsRefillAd: 'Refill hearts · watch ad', heartsRefillMoon: 'Refill hearts · {n} 🌙', heartIn: 'Next heart in {t}',
    chapterDone: 'Chapter complete!', chest: 'Chapter chest', chestGet: 'Open chest',
    // home
    hello: 'Hello', nextUp: 'Next level', todaysCard: "Today's card", checkin: 'Daily check-in', lucky: 'Lucky draw', challenge: 'Daily challenge',
    starsTotal: '{n} stars', progress: '{a} of {b} levels', claimed: 'Claimed', claim: 'Claim', spin: 'Spin', spinAgainAd: 'Spin again · watch ad', spinAgainMoon: 'Spin again · {n} 🌙', spinsLeft: 'Free spin ready', noSpins: 'Come back tomorrow for a free spin',
    drawCard: 'Check your luck', drawSub: 'Draw one card for today. Its blessing works all day.', redrawAd: 'Draw again · watch ad', redrawMoon: 'Draw again · {n} 🌙', blessing: "Today's blessing",
    streak: 'Streak', day: 'Day', streakLost: 'You missed a day. Mend your streak?', mendAd: 'Mend · watch ad', mendMoon: 'Mend · {n} 🌙', mendNo: 'Start over',
    challengeSub: 'One special level a day. Harder, but well paid.', challengeDone: 'Done today', challengePlay: 'Play today\'s challenge',
    // shop
    shopTitle: 'Shop', shopSub: 'Small extras. Everything in the game can also be earned by playing.',
    packMoon: '{n} Moonstones', packBest: 'Best value', packStarter: 'Starter pack', packStarterSub: '120 Moonstones + 10 hints. Once only.',
    removeAds: 'Remove ads', removeAdsSub: 'No more ads between levels. Reward ads stay optional. Includes 100 Moonstones.', removed: 'Ads removed',
    hintPack: '5 hints', buyWith: 'Buy for {p}', freeAd: 'Free · watch ad', bonusAd: 'Bonus gifts', adGift: '+20 ✦ · watch ad', adGiftLeft: '{n} left today',
    restore: 'Restore purchases', restored: 'Purchases restored', storeOff: 'Purchases work in the Android app.', thanks: 'Thank you!', notEnough: 'Not enough {c}',
    // me
    settings: 'Settings', language: 'Language', theme: 'Theme', themeAuto: 'Auto', themeLight: 'Light', themeDark: 'Dark', themePink: 'Pink', sound: 'Sound', on: 'On', off: 'Off',
    stats: 'Your stars', starsLabel: 'Stars', statsPlayed: 'Levels played', statsFound: 'Differences found', privacy: 'Privacy policy', privacyOptions: 'Ad privacy options', about: 'About', aboutText: 'A cosy spot-the-difference game by Nabu Tarot. Pictures are drawn, not photographed, and nothing in here is scary.', reset: 'Reset progress', resetSure: 'Delete all progress? This cannot be undone.', version: 'Version',
    nabuApp: 'Open Nabu Tarot', install: 'Install', adTest: 'Test ad', adTestSub: 'A stand-in for a real ad. Real ads show in the Android app.', adWatching: 'Ad playing…', adSkipIn: 'Reward in {n} s', adDone: 'Reward received', adFail: 'No ad right now. Try again in a moment.',
    mockBuy: 'Test purchase', mockBuySub: 'This is the web preview. In the Android app this opens Google Play.',
    kinds: { color: 'colour', variant: 'detail', remove: 'missing', flip: 'flipped', rotate: 'turned', scale: 'size', move: 'moved', swap: 'swapped' },
    stars3: 'Fast and clean', stars2: 'Well done', stars1: 'Cleared', par: 'Par {t}',
    unlocks: 'Opens after level {n}', skipMoon: 'Skip this level · {n} 🌙', dailyTitle: 'Daily', mapTitle: 'Levels', meTitle: 'Me', homeTitle: 'Home',
    tapToContinue: 'Tap to continue', bestTime: 'Best {t}', newBest: 'New best!', missPenalty: '−5 s',
    blessings: {
      stardust: '+25% Stardust from every level today', hint: '+1 free hint right now', spin: 'One extra lucky draw spin today', heart: 'Hearts refilled', time: '+20 s on every timed level today', calm: 'Wrong taps cost no time today', double: 'Your next level pays double'
    }
  },
  vi: {
    appName: 'Nabu Twin Stars', tagline: 'Hai bức tranh. Tìm chỗ khác nhau.',
    nav: { home: 'Trang chủ', map: 'Màn chơi', daily: 'Mỗi ngày', shop: 'Cửa hàng', me: 'Tôi' },
    play: 'Chơi', continueBtn: 'Tiếp tục', next: 'Màn tiếp', retry: 'Chơi lại', back: 'Quay lại', close: 'Đóng', ok: 'OK', cancel: 'Huỷ',
    level: 'Màn', chapter: 'Chương', locked: 'Đang khoá', needStars: 'Gom đủ {n} sao để mở chương này',
    stardust: 'Bụi sao', moon: 'Đá trăng', hearts: 'Tim', hints: 'Gợi ý',
    typeDiff: 'Tìm điểm khác nhau', typeSame: 'Màn thưởng: tìm chỗ giống nhau', typeMirror: 'Màn gương: tranh B bị lật ngược',
    found: 'Đã tìm', misses: 'Bấm sai', time: 'Thời gian', noTimer: 'Không tính giờ',
    hint: 'Gợi ý', hintFree: 'Dùng gợi ý', hintCost: 'Gợi ý · {n} ✦', hintAd: 'Gợi ý · xem quảng cáo', addTime: '+30 giây · {n} ✦', pause: 'Tạm dừng', paused: 'Đang tạm dừng', resume: 'Chơi tiếp', quit: 'Thoát màn',
    tutDiff: 'Nhìn kỹ hai bức tranh. Chạm vào chỗ nào khác nhau. Bấm sai sẽ mất thời gian, nên hãy nhìn trước.',
    tutSame: 'Màn thưởng! Gần như mọi thứ đã đổi. Chỉ chạm vào chỗ còn y nguyên.',
    tutMirror: 'Tranh B là ảnh trong gương. So bên trái với bên phải.',
    win: 'Tuyệt vời!', winSub: 'Bạn đã tìm ra hết.', fail: 'Chưa được rồi', failTime: 'Hết giờ.', failMiss: 'Bấm sai quá nhiều.',
    reward: 'Phần thưởng', firstClear: 'Thưởng lần đầu qua màn', threeStar: 'Thưởng 3 sao', blessingBonus: 'Lộc lá bài',
    doubleAd: 'Nhân đôi thưởng · xem quảng cáo', continueAd: 'Chơi tiếp · xem quảng cáo', continueMoon: 'Chơi tiếp · {n} 🌙', continueNote: '+30 giây và xoá hết lần bấm sai',
    loseHeart: 'Bạn mất 1 tim', noHearts: 'Hết tim rồi', heartsRefillAd: 'Đầy tim · xem quảng cáo', heartsRefillMoon: 'Đầy tim · {n} 🌙', heartIn: 'Tim tiếp theo sau {t}',
    chapterDone: 'Xong chương!', chest: 'Rương chương', chestGet: 'Mở rương',
    hello: 'Chào bạn', nextUp: 'Màn tiếp theo', todaysCard: 'Lá bài hôm nay', checkin: 'Điểm danh', lucky: 'Vòng quay may mắn', challenge: 'Thử thách ngày',
    starsTotal: '{n} sao', progress: '{a} / {b} màn', claimed: 'Đã nhận', claim: 'Nhận', spin: 'Quay', spinAgainAd: 'Quay thêm · xem quảng cáo', spinAgainMoon: 'Quay thêm · {n} 🌙', spinsLeft: 'Có 1 lượt quay miễn phí', noSpins: 'Mai quay lại để có lượt miễn phí',
    drawCard: 'Thử vận may', drawSub: 'Rút một lá cho hôm nay. Lộc của lá bài kéo dài cả ngày.', redrawAd: 'Rút lại · xem quảng cáo', redrawMoon: 'Rút lại · {n} 🌙', blessing: 'Lộc hôm nay',
    streak: 'Chuỗi ngày', day: 'Ngày', streakLost: 'Bạn bỏ lỡ một ngày. Nối lại chuỗi nhé?', mendAd: 'Nối lại · xem quảng cáo', mendMoon: 'Nối lại · {n} 🌙', mendNo: 'Bắt đầu lại',
    challengeSub: 'Mỗi ngày một màn đặc biệt. Khó hơn, thưởng nhiều hơn.', challengeDone: 'Hôm nay đã xong', challengePlay: 'Chơi thử thách hôm nay',
    shopTitle: 'Cửa hàng', shopSub: 'Vài món nhỏ. Mọi thứ trong game đều có thể kiếm được bằng cách chơi.',
    packMoon: '{n} Đá trăng', packBest: 'Lợi nhất', packStarter: 'Gói khởi đầu', packStarterSub: '120 Đá trăng + 10 gợi ý. Chỉ mua một lần.',
    removeAds: 'Bỏ quảng cáo', removeAdsSub: 'Không còn quảng cáo giữa các màn. Quảng cáo nhận thưởng vẫn tuỳ bạn. Tặng kèm 100 Đá trăng.', removed: 'Đã bỏ quảng cáo',
    hintPack: '5 gợi ý', buyWith: 'Mua với {p}', freeAd: 'Miễn phí · xem quảng cáo', bonusAd: 'Quà thêm', adGift: '+20 ✦ · xem quảng cáo', adGiftLeft: 'Còn {n} lượt hôm nay',
    restore: 'Khôi phục mua hàng', restored: 'Đã khôi phục', storeOff: 'Mua hàng hoạt động trong app Android.', thanks: 'Cảm ơn bạn!', notEnough: 'Không đủ {c}',
    settings: 'Cài đặt', language: 'Ngôn ngữ', theme: 'Giao diện', themeAuto: 'Tự động', themeLight: 'Sáng', themeDark: 'Tối', themePink: 'Hồng', sound: 'Âm thanh', on: 'Bật', off: 'Tắt',
    stats: 'Sao của bạn', starsLabel: 'Sao', statsPlayed: 'Số màn đã chơi', statsFound: 'Điểm khác đã tìm', privacy: 'Chính sách riêng tư', privacyOptions: 'Tuỳ chọn quảng cáo', about: 'Giới thiệu', aboutText: 'Game tìm điểm khác nhau nhẹ nhàng của Nabu Tarot. Tranh được vẽ, không phải ảnh chụp, và không có gì đáng sợ.', reset: 'Xoá tiến trình', resetSure: 'Xoá toàn bộ tiến trình? Không thể hoàn tác.', version: 'Phiên bản',
    nabuApp: 'Mở Nabu Tarot', install: 'Cài đặt', adTest: 'Quảng cáo thử', adTestSub: 'Thay cho quảng cáo thật. Quảng cáo thật chỉ có trong app Android.', adWatching: 'Đang chiếu quảng cáo…', adSkipIn: 'Nhận thưởng sau {n} giây', adDone: 'Đã nhận thưởng', adFail: 'Chưa có quảng cáo. Thử lại sau chút nhé.',
    mockBuy: 'Mua thử', mockBuySub: 'Đây là bản xem trước trên web. Trong app Android sẽ mở Google Play.',
    kinds: { color: 'màu', variant: 'chi tiết', remove: 'biến mất', flip: 'lật', rotate: 'xoay', scale: 'kích cỡ', move: 'dời chỗ', swap: 'đổi vật' },
    stars3: 'Nhanh và sạch', stars2: 'Giỏi lắm', stars1: 'Đã qua', par: 'Chuẩn {t}',
    unlocks: 'Mở sau màn {n}', skipMoon: 'Bỏ qua màn này · {n} 🌙', dailyTitle: 'Mỗi ngày', mapTitle: 'Màn chơi', meTitle: 'Tôi', homeTitle: 'Trang chủ',
    tapToContinue: 'Chạm để tiếp tục', bestTime: 'Tốt nhất {t}', newBest: 'Kỷ lục mới!', missPenalty: '−5 giây',
    blessings: {
      stardust: 'Hôm nay +25% Bụi sao ở mọi màn', hint: '+1 gợi ý miễn phí ngay bây giờ', spin: 'Thêm 1 lượt quay may mắn hôm nay', heart: 'Tim đã đầy lại', time: 'Hôm nay +20 giây ở mọi màn tính giờ', calm: 'Hôm nay bấm sai không mất giờ', double: 'Màn tiếp theo được thưởng gấp đôi'
    }
  }
};

/* 22 Major Arcana for "Check your luck": a cheerful two-line reading and the
   day's blessing. Symbols pick the card art; nothing spooky in words or pictures. */
const CARDS = [
  { id: 0, en: 'The Fool', vi: 'Chàng Khờ', sym: 'sparkle', bless: 'double', ren: 'A fresh start. Try something small and new today.', rvi: 'Một khởi đầu mới. Hôm nay thử một điều nhỏ mà mới nhé.' },
  { id: 1, en: 'The Magician', vi: 'Pháp Sư', sym: 'wand', bless: 'hint', ren: 'You have what you need. Use your hands and your head.', rvi: 'Bạn có đủ những gì cần. Dùng tay và dùng đầu.' },
  { id: 2, en: 'The High Priestess', vi: 'Nữ Tư Tế', sym: 'moon', bless: 'calm', ren: 'Quiet helps today. Listen before you answer.', rvi: 'Hôm nay yên tĩnh giúp bạn. Nghe trước rồi hãy trả lời.' },
  { id: 3, en: 'The Empress', vi: 'Hoàng Hậu', sym: 'flower', bless: 'stardust', ren: 'Things grow when you care for them. Water something.', rvi: 'Mọi thứ lớn lên khi được chăm. Tưới cho một thứ gì đó.' },
  { id: 4, en: 'The Emperor', vi: 'Hoàng Đế', sym: 'compass', bless: 'time', ren: 'A little order goes a long way. Make a short list.', rvi: 'Gọn gàng một chút đi rất xa. Viết một danh sách ngắn.' },
  { id: 5, en: 'The Hierophant', vi: 'Giáo Hoàng', sym: 'book', bless: 'hint', ren: 'Ask someone who has done it before. Old advice still works.', rvi: 'Hỏi người từng làm rồi. Lời khuyên cũ vẫn dùng được.' },
  { id: 6, en: 'The Lovers', vi: 'Người Tình', sym: 'heart', bless: 'double', ren: 'Choose with your heart, then stand by it.', rvi: 'Chọn bằng trái tim, rồi giữ lấy lựa chọn đó.' },
  { id: 7, en: 'The Chariot', vi: 'Cỗ Xe', sym: 'comet', bless: 'time', ren: 'Keep going in one direction. You are closer than you think.', rvi: 'Cứ đi theo một hướng. Bạn gần đích hơn bạn nghĩ.' },
  { id: 8, en: 'Strength', vi: 'Sức Mạnh', sym: 'sun', bless: 'heart', ren: 'Gentle is strong. Be patient with yourself.', rvi: 'Nhẹ nhàng là mạnh mẽ. Kiên nhẫn với chính mình.' },
  { id: 9, en: 'The Hermit', vi: 'Ẩn Sĩ', sym: 'lantern', bless: 'calm', ren: 'A quiet hour will show you the answer.', rvi: 'Một giờ yên tĩnh sẽ cho bạn câu trả lời.' },
  { id: 10, en: 'Wheel of Fortune', vi: 'Bánh Xe Số Phận', sym: 'clockmoon', bless: 'spin', ren: 'Luck turns your way. Say yes to a surprise.', rvi: 'May mắn đang xoay về phía bạn. Đón một bất ngờ nhé.' },
  { id: 11, en: 'Justice', vi: 'Công Lý', sym: 'sword', bless: 'calm', ren: 'Fair and clear wins today. Say what you mean.', rvi: 'Hôm nay công bằng và rõ ràng sẽ thắng. Nói điều bạn nghĩ.' },
  { id: 12, en: 'The Hanged One', vi: 'Người Treo Ngược', sym: 'hourglass', bless: 'time', ren: 'Look at it upside down. A pause is not a loss.', rvi: 'Thử nhìn ngược lại. Dừng một chút không phải là thua.' },
  { id: 13, en: 'Renewal', vi: 'Đổi Mới', sym: 'butterfly', bless: 'double', ren: 'Something ends so something better can start.', rvi: 'Một thứ kết thúc để thứ tốt hơn bắt đầu.' },
  { id: 14, en: 'Temperance', vi: 'Điều Độ', sym: 'teacup', bless: 'stardust', ren: 'Mix work and rest. Slow sips today.', rvi: 'Trộn việc với nghỉ. Hôm nay nhấp từng ngụm chậm.' },
  { id: 15, en: 'The Tempter', vi: 'Cám Dỗ', sym: 'potion', bless: 'hint', ren: 'One treat is fine. Know when to stop.', rvi: 'Một chút thưởng thì được. Biết lúc nào nên dừng.' },
  { id: 16, en: 'The Tower', vi: 'Tòa Tháp', sym: 'crystal', bless: 'heart', ren: 'A shake-up clears the view. Rebuild lighter.', rvi: 'Một cú lắc giúp nhìn rõ hơn. Xây lại nhẹ hơn.' },
  { id: 17, en: 'The Star', vi: 'Ngôi Sao', sym: 'star', bless: 'hint', ren: 'Hope is on your side. Make a small wish.', rvi: 'Hy vọng đứng về phía bạn. Ước một điều nhỏ.' },
  { id: 18, en: 'The Moon', vi: 'Mặt Trăng', sym: 'moon', bless: 'time', ren: 'Not everything is clear yet. Sleep on it.', rvi: 'Chưa phải mọi thứ đều rõ. Ngủ một giấc rồi tính.' },
  { id: 19, en: 'The Sun', vi: 'Mặt Trời', sym: 'sun', bless: 'stardust', ren: 'A bright day. Share it with someone.', rvi: 'Một ngày rực rỡ. Chia sẻ với ai đó.' },
  { id: 20, en: 'Judgement', vi: 'Phán Xét', sym: 'bell', bless: 'spin', ren: 'A call to rise. Answer the message you have been avoiding.', rvi: 'Tiếng gọi đứng dậy. Trả lời tin nhắn bạn vẫn né.' },
  { id: 21, en: 'The World', vi: 'Thế Giới', sym: 'planet', bless: 'double', ren: 'A circle closes. Celebrate what you finished.', rvi: 'Một vòng khép lại. Ăn mừng điều bạn đã hoàn thành.' }
];
