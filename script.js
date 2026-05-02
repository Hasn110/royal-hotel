/**
 * Royal Family 2026 Hotel — SPA controller
 * Modular IIFEs: StorageManager, Tasks (Rooms), Notes (Services), Timer (Stay), Dashboard, UIController
 */

(function () {
  "use strict";

  /* -------------------------------------------------------------------------- */
  /*  StorageManager — central localStorage persistence                         */
  /* -------------------------------------------------------------------------- */
  const StorageManager = (function () {
    const KEY = "rfh_app_state_v1";

    const defaultState = () => ({
      bookedRoomIds: [],
      session: {
        isLoggedIn: false,
        email: "",
        displayName: "",
      },
      services: {
        spa: { bg: "#252525", fg: "#ffffff" },
        restaurant: { bg: "#1f1f1f", fg: "#f5f0e6" },
        vip: { bg: "#2a2419", fg: "#d4af37" },
      },
      stay: {
        checkIn: "",
        checkOut: "",
        rate: 599,
      },
      stats: {
        bookingsCount: 0,
        totalSpent: 0,
        loyaltyPoints: 0,
      },
      locale: "ar",
      theme: "dark",
      /** تفاصيل الحجز لكل غرفة: { [roomId]: { nights: number } } */
      roomBookingMeta: {},
    });

    function load() {
      try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return defaultState();
        const parsed = JSON.parse(raw);
        const base = defaultState();
        const booked = Array.isArray(parsed.bookedRoomIds)
          ? parsed.bookedRoomIds
          : base.bookedRoomIds;
        const loc =
          parsed.locale === "en" || parsed.locale === "ar"
            ? parsed.locale
            : base.locale;
        const th =
          parsed.theme === "light" || parsed.theme === "dark"
            ? parsed.theme
            : base.theme;
        const rbm =
          parsed.roomBookingMeta &&
          typeof parsed.roomBookingMeta === "object" &&
          !Array.isArray(parsed.roomBookingMeta)
            ? parsed.roomBookingMeta
            : {};
        return {
          ...base,
          ...parsed,
          bookedRoomIds: booked,
          locale: loc,
          theme: th,
          roomBookingMeta: { ...base.roomBookingMeta, ...rbm },
          session: { ...base.session, ...(parsed.session || {}) },
          services: { ...base.services, ...(parsed.services || {}) },
          stay: { ...base.stay, ...(parsed.stay || {}) },
          stats: { ...base.stats, ...(parsed.stats || {}) },
        };
      } catch {
        return defaultState();
      }
    }

    function save(next) {
      const prev = load();
      const merged = {
        ...prev,
        ...next,
        locale: next.locale !== undefined ? next.locale : prev.locale,
        theme: next.theme !== undefined ? next.theme : prev.theme,
        roomBookingMeta:
          next.roomBookingMeta !== undefined
            ? next.roomBookingMeta
            : prev.roomBookingMeta,
        session: { ...prev.session, ...(next.session || {}) },
        services: { ...prev.services, ...(next.services || {}) },
        stay: { ...prev.stay, ...(next.stay || {}) },
        stats: { ...prev.stats, ...(next.stats || {}) },
      };
      localStorage.setItem(KEY, JSON.stringify(merged));
      return merged;
    }

    return { load, save, defaultState };
  })();

  /* -------------------------------------------------------------------------- */
  /*  I18n — عربي / English + تطبيق على DOM                                     */
  /* -------------------------------------------------------------------------- */
  const I18n = (function () {
    const STR = {
      ar: {
        "brand.aria": "الرئيسية",
        "lang.groupAria": "اختيار اللغة",
        "nav.menuOpen": "فتح القائمة",
        "nav.navAria": "القائمة الرئيسية",
        "nav.home": "الرئيسية",
        "nav.rooms": "الغرف والحجز",
        "nav.reviews": "آراء عملائنا",
        "nav.about": "من نحن",
        "theme.toLight": "الوضع الفاتح",
        "theme.toDark": "الوضع الداكن",
        "theme.toLightAria": "التبديل إلى الوضع الفاتح",
        "theme.toDarkAria": "التبديل إلى الوضع الداكن",
        "footer.socialAria": "روابط التواصل الاجتماعي",
        "footer.whatsapp": "واتساب",
        "footer.instagram": "إنستغرام",
        "footer.facebook": "فيسبوك",
        "header.login": "تسجيل الدخول",
        "header.logout": "تسجيل الخروج",
        "header.session": "مسجّل: {name}",
        "hero.eyebrow": "ضيافة فاخرة · هوية ذهبية وسوداء",
        "hero.tagline":
          "مركز واحد لحجز غرفتك، متابعة نقاط الولاء، وتقدير مدة إقامتك — بسرعة وبخصوصية على جهازك.",
        "hero.ctaBook": "انتقل للحجز",
        "hero.ctaDash": "لوحة التحكم",
        "home.intro.title": "مرحبًا بك في بوابة رويال فاميلي",
        "home.intro.p1":
          "من هذه الصفحة يمكنك استعراض الغرف المتاحة مع صورها، معرفة رقم كل غرفة وموقعها داخل الفندق (الطابق والجناح)، ثم الانتقال لإتمام الحجز.",
        "home.intro.p2":
          "مخطط الإقامة يحسب الليالي والتكلفة التقديرية ويحدّث حلقة التقدم. لوحة التحكم تعرض الحجوزات ونقاط الولاء والإنفاق محليًا.",
        "home.intro.note":
          "لإتمام الحجز سجّل الدخول أدناه (تجربة محلية — البيانات على هذا المتصفح فقط).",
        "home.login.title": "تسجيل الدخول للمتابعة",
        "home.login.lead":
          "أدخل البريد وكلمة المرور (٤ أحرف على الأقل للتجربة). يمكنك إضافة اسم للظهور في الأعلى.",
        "home.login.email": "البريد الإلكتروني",
        "home.login.pass": "كلمة المرور",
        "home.login.nameOpt": "الاسم الظاهر (اختياري)",
        "home.login.submit": "دخول",
        "home.logged.title": "مرحبًا بعودتك",
        "home.logged.prefix": "تم تسجيل الدخول كـ",
        "home.logged.goRooms": "اذهب لحجز الغرفة",
        "home.logged.logout": "تسجيل الخروج",
        "home.rooms.title": "الغرف المتاحة — الرقم والموقع",
        "home.rooms.desc":
          "كل بطاقة تعرض الصورة ورقم الغرفة والطابق والمنطقة داخل الفندق.",
        "rooms.panel.title": "المخزون والحجز",
        "rooms.panel.sub":
          "احجز الغرف المتاحة. المحجوزة تُقفل وتظهر كحالة مكتملة.",
        "rooms.chip": "مباشر",
        "services.panel.title": "معرض الخدمات",
        "services.panel.sub": "خصص ألوان البطاقات — تُحفظ محليًا.",
        "stay.panel.title": "أداة مدة الإقامة",
        "stay.panel.sub": "التواريخ تحسب الليالي والتقدير وحلقة التقدّم.",
        "stay.checkin": "تاريخ الوصول",
        "stay.checkout": "تاريخ المغادرة",
        "stay.rate": "السعر لليلة (دولار)",
        "stay.submit": "احسب الإقامة",
        "stay.ringTitle": "حلقة مدة الإقامة",
        "stay.ringUnit": "ليالٍ",
        "stay.statsNights": "إجمالي الليالي",
        "stay.statsTotal": "الإجمالي التقديري",
        "dash.panel.title": "لوحة الأداء",
        "dash.panel.sub": "من حجوزاتك وإنفاقك — مخزّن على جهازك.",
        "dash.stat.bookings": "إجمالي الحجوزات",
        "dash.stat.loyalty": "نقاط الولاء",
        "dash.stat.spent": "إجمالي الإنفاق",
        "dash.tier.title": "حالة العضوية",
        "reviews.panel.title": "آراء عملائنا",
        "reviews.panel.sub": "نعتز بثقة ضيوفنا وتجاربهم في فندقنا.",
        "reviews.text1": "تجربة استثنائية، خدمة الكونسيرج لا يعلى عليها. سأعود بالتأكيد في زيارتي القادمة.",
        "reviews.text2": "The Royal Suite exceeded all expectations. Incredible attention to detail and impeccable service.",
        "reviews.text3": "الطعام في المطعم الكبير كان من أفضل التجارب التي حظيت بها. شكراً لفريق العمل.",
        "about.panel.title": "من نحن",
        "about.panel.sub": "تعرف على قصة فندق رويال فاميلي ٢٠٢٦.",
        "about.intro.title": "إرث من الفخامة والضيافة",
        "about.intro.p1": "تأسس فندق رويال فاميلي ليكون الوجهة الأولى للباحثين عن الرقي والتميز. نقدم لضيوفنا تجربة ضيافة لا تُنسى تجمع بين الأصالة والمعاصرة والتصميم الفاخر.",
        "about.intro.p2": "بفضل فريق عملنا المحترف ومرافقنا ذات الخمس نجوم، نضمن تلبية كافة احتياجاتك وتجاوز توقعاتك، سواء كنت في رحلة عمل أو عطلة استجمام، لأن راحتك هي أولويتنا.",
        "modal.closeAria": "إغلاق",
        "modal.titleDefault": "تأكيد",
        "modal.continue": "متابعة",
        "modal.loginTitle": "تسجيل الدخول مطلوب",
        "modal.loginBody":
          "يرجى تسجيل الدخول من الصفحة الرئيسية قبل الحجز. اضغط «تسجيل الدخول» في الأعلى أو انتقل للرئيسية.",
        "modal.bookedTitle": "تم تأكيد الحجز",
        "modal.bookBody":
          "تم تأكيد حجز {name} (غرفة {num}) لمدة {nights} ليلة. الإجمالي التقديري: {amount}.",
        "room.available": "متاحة",
        "room.booked": "محجوزة",
        "room.goBook": "انتقل للحجز",
        "room.reserveStatus": "حالة الحجز",
        "room.roomLabel": "رقم الغرفة:",
        "room.locationLabel": "الموقع داخل الفندق:",
        "room.ratingLabel": "التقييم",
        "room.perNight": "/ ليلة",
        "room.whereStrong": "الموقع:",
        "status.available": "متاحة",
        "status.reserved": "محجوزة",
        "btn.reserve": "احجز",
        "btn.bookedDone": "تم الحجز",
        "btn.cancelBooking": "إلغاء الحجز",
        "room.nightsLabel": "عدد الليالي للحجز",
        "room.nightsHint": "من ١ إلى ٩٠ ليلة",
        "room.bookedFor": "محجوز لمدة {n} ليلة",
        "cancel.confirm": "هل تريد إلغاء حجز هذه الغرفة؟",
        "modal.cancelDoneTitle": "تم إلغاء الحجز",
        "modal.cancelDoneBody": "تم إلغاء حجز هذه الغرفة وتحديث الإحصائيات.",
        "tier.silver": "فضي",
        "tier.gold": "ذهبي",
        "tier.royal": "رويال",
        "dash.caption.royal": "لقد وصلت لعضوية رويال — مزايا مفعّلة.",
        "dash.caption.toRoyal": "تبقى {n} نقطة للوصول لرويال.",
        "dash.caption.toGold": "تبقى {n} نقطة لفتح الذهبي.",
        "timer.invalidDates": "اختر تواريخ صحيحة",
        "timer.night": "ليلة",
        "timer.nights": "ليالٍ",
        "svc.surface": "السطح",
        "svc.type": "النص",
      },
      en: {
        "brand.aria": "Home",
        "lang.groupAria": "Language",
        "nav.menuOpen": "Open menu",
        "nav.navAria": "Main navigation",
        "nav.home": "Home",
        "nav.rooms": "Rooms & booking",
        "nav.reviews": "Customer Reviews",
        "nav.about": "About Us",
        "theme.toLight": "Light mode",
        "theme.toDark": "Dark mode",
        "theme.toLightAria": "Switch to light mode",
        "theme.toDarkAria": "Switch to dark mode",
        "footer.socialAria": "Social media links",
        "footer.whatsapp": "WhatsApp",
        "footer.instagram": "Instagram",
        "footer.facebook": "Facebook",
        "header.login": "Sign in",
        "header.logout": "Sign out",
        "header.session": "Signed in: {name}",
        "hero.eyebrow": "Luxury hospitality · black & gold",
        "hero.tagline":
          "Book rooms, track loyalty, and estimate your stay — fast and private on your device.",
        "hero.ctaBook": "Go to booking",
        "hero.ctaDash": "Dashboard",
        "home.intro.title": "Welcome to Royal Family portal",
        "home.intro.p1":
          "Browse rooms with photos, room numbers, and on-property locations (floor & wing), then complete your booking.",
        "home.intro.p2":
          "The stay planner calculates nights and estimates cost. The dashboard shows bookings, points, and spend stored locally.",
        "home.intro.note":
          "You must sign in below to book (local demo — data stays in this browser only).",
        "home.login.title": "Sign in to continue",
        "home.login.lead":
          "Email and password (min 4 characters for demo). Optional display name.",
        "home.login.email": "Email",
        "home.login.pass": "Password",
        "home.login.nameOpt": "Display name (optional)",
        "home.login.submit": "Sign in",
        "home.logged.title": "Welcome back",
        "home.logged.prefix": "Signed in as",
        "home.logged.goRooms": "Book a room",
        "home.logged.logout": "Sign out",
        "home.rooms.title": "Rooms — number & location",
        "home.rooms.desc":
          "Each card shows the photo, room number, floor, and area inside the hotel.",
        "rooms.panel.title": "Inventory & booking",
        "rooms.panel.sub": "Reserve available rooms. Booked rooms lock as completed.",
        "rooms.chip": "Live",
        "services.panel.title": "Services gallery",
        "services.panel.sub": "Customize card colors — saved locally.",
        "stay.panel.title": "Stay duration tool",
        "stay.panel.sub": "Dates drive nights, estimate, and the progress ring.",
        "stay.checkin": "Check-in",
        "stay.checkout": "Check-out",
        "stay.rate": "Nightly rate (USD)",
        "stay.submit": "Calculate stay",
        "stay.ringTitle": "Stay duration ring",
        "stay.ringUnit": "nights",
        "stay.statsNights": "Total nights",
        "stay.statsTotal": "Estimated total",
        "dash.panel.title": "Performance dashboard",
        "dash.panel.sub": "From your bookings and spend — stored on device.",
        "dash.stat.bookings": "Total bookings",
        "dash.stat.loyalty": "Loyalty points",
        "dash.stat.spent": "Total spent",
        "dash.tier.title": "Membership status",
        "reviews.panel.title": "Customer Reviews",
        "reviews.panel.sub": "We cherish our guests' trust and experiences.",
        "reviews.text1": "Exceptional experience, the concierge service is second to none. I will definitely return.",
        "reviews.text2": "The Royal Suite exceeded all expectations. Incredible attention to detail and impeccable service.",
        "reviews.text3": "The food at the Grand Restaurant was one of the best experiences I've ever had. Thanks to the team.",
        "about.panel.title": "About Us",
        "about.panel.sub": "Discover the story of Royal Family 2026.",
        "about.intro.title": "A Legacy of Luxury and Hospitality",
        "about.intro.p1": "Royal Family Hotel was established to be the premier destination for those seeking elegance and excellence. We offer an unforgettable hospitality experience combining authenticity, modernity, and luxurious design.",
        "about.intro.p2": "With our professional team and five-star facilities, we ensure all your needs are met and expectations exceeded, whether on a business trip or a leisure holiday, because your comfort is our priority.",
        "modal.closeAria": "Close",
        "modal.titleDefault": "Notice",
        "modal.continue": "Continue",
        "modal.loginTitle": "Sign in required",
        "modal.loginBody":
          "Please sign in from the home page before booking. Use “Sign in” at the top or go to Home.",
        "modal.bookedTitle": "Reservation confirmed",
        "modal.bookBody":
          "Booking confirmed for {name} (room {num}) for {nights} night(s). Estimated total: {amount}.",
        "room.available": "Available",
        "room.booked": "Booked",
        "room.goBook": "Go to booking",
        "room.reserveStatus": "Booking status",
        "room.roomLabel": "Room:",
        "room.locationLabel": "Location in hotel:",
        "room.ratingLabel": "Guest rating",
        "room.perNight": "/ night",
        "room.whereStrong": "Location:",
        "status.available": "Available",
        "status.reserved": "Reserved",
        "btn.reserve": "Reserve",
        "btn.bookedDone": "Booked",
        "btn.cancelBooking": "Cancel booking",
        "room.nightsLabel": "Nights to book",
        "room.nightsHint": "1–90 nights",
        "room.bookedFor": "Booked for {n} night(s)",
        "cancel.confirm": "Cancel this room reservation?",
        "modal.cancelDoneTitle": "Booking cancelled",
        "modal.cancelDoneBody": "This reservation was removed and stats were updated.",
        "tier.silver": "Silver",
        "tier.gold": "Gold",
        "tier.royal": "Royal",
        "dash.caption.royal": "You’ve reached Royal — elevated perks unlocked.",
        "dash.caption.toRoyal": "{n} points to reach Royal.",
        "dash.caption.toGold": "{n} points to unlock Gold.",
        "timer.invalidDates": "Select valid dates",
        "timer.night": "night",
        "timer.nights": "nights",
        "svc.surface": "Surface",
        "svc.type": "Text",
      },
    };

    function getLocale() {
      const l = StorageManager.load().locale;
      return l === "en" ? "en" : "ar";
    }

    function t(key, vars) {
      const lang = getLocale();
      let s = (STR[lang] && STR[lang][key]) || STR.ar[key] || key;
      if (vars && typeof s === "string") {
        Object.keys(vars).forEach((k) => {
          s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(vars[k]));
        });
      }
      return s;
    }

    function applyDom() {
      document.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.getAttribute("data-i18n");
        if (!key) return;
        const val = t(key);
        if (val) el.textContent = val;
      });
      document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
        const key = el.getAttribute("data-i18n-aria");
        if (key) el.setAttribute("aria-label", t(key));
      });
      document.querySelectorAll("[data-i18n-title]").forEach((el) => {
        const key = el.getAttribute("data-i18n-title");
        if (key) el.setAttribute("title", t(key));
      });
    }

    function setLocale(lang) {
      if (lang !== "ar" && lang !== "en") return;
      StorageManager.save({ locale: lang });
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
      applyDom();
      document
        .getElementById("lang-ar")
        ?.classList.toggle("lang-switch__btn--active", lang === "ar");
      document
        .getElementById("lang-en")
        ?.classList.toggle("lang-switch__btn--active", lang === "en");
      if (typeof Tasks !== "undefined" && Tasks.render) Tasks.render();
      if (typeof Home !== "undefined" && Home.renderRoomCards) Home.renderRoomCards();
      if (typeof Auth !== "undefined" && Auth.render) Auth.render();
      if (typeof Theme !== "undefined" && Theme.refresh) Theme.refresh();
    }

    function initFromStorage() {
      const lang = getLocale();
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
      applyDom();
      document
        .getElementById("lang-ar")
        ?.classList.toggle("lang-switch__btn--active", lang === "ar");
      document
        .getElementById("lang-en")
        ?.classList.toggle("lang-switch__btn--active", lang === "en");
    }

    function initLangButtons() {
      document.querySelectorAll("[data-set-lang]").forEach((btn) => {
        btn.addEventListener("click", () => setLocale(btn.getAttribute("data-set-lang")));
      });
    }

    function roomLine(room) {
      const ar = getLocale() === "ar";
      return {
        name: ar ? room.nameAr : room.name,
        type: ar ? room.typeAr : room.type,
        floor: ar ? room.floorLabelAr : room.floorLabelEn,
        loc: ar ? room.locationAr : room.locationEn,
        blurb: ar ? room.blurbAr : room.blurb,
      };
    }

    return {
      t,
      applyDom,
      setLocale,
      getLocale,
      initFromStorage,
      initLangButtons,
      roomLine,
    };
  })();

  /* -------------------------------------------------------------------------- */
  /*  Theme — فاتح / داكن (محليًا)                                              */
  /* -------------------------------------------------------------------------- */
  const Theme = (function () {
    function current() {
      const t = StorageManager.load().theme;
      return t === "light" ? "light" : "dark";
    }

    function apply(mode) {
      const m = mode === "light" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", m);
      const btn = document.getElementById("theme-toggle");
      if (btn) {
        btn.setAttribute("aria-pressed", m === "dark" ? "true" : "false");
        btn.setAttribute(
          "title",
          I18n.t(m === "dark" ? "theme.toLight" : "theme.toDark")
        );
        btn.setAttribute(
          "aria-label",
          I18n.t(m === "dark" ? "theme.toLightAria" : "theme.toDarkAria")
        );
      }
    }

    function refresh() {
      apply(current());
    }

    function init() {
      apply(current());
      document.getElementById("theme-toggle")?.addEventListener("click", () => {
        const next = current() === "dark" ? "light" : "dark";
        StorageManager.save({ theme: next });
        apply(next);
      });
    }

    return { init, refresh, apply, current };
  })();

  /* -------------------------------------------------------------------------- */
  /*  Room catalog (source of truth for inventory metadata)                      */
  /* -------------------------------------------------------------------------- */
  const ROOM_CATALOG = [
    {
      id: "royal-suite",
      name: "Royal Suite",
      nameAr: "جناح رويال",
      type: "Suite",
      typeAr: "جناح",
      roomNumber: "801",
      floorLabelAr: "الطابق 8",
      floorLabelEn: "Floor 8",
      locationAr: "الجناح الشرقي — إطلالة مباشرة على النيل",
      locationEn: "East wing — direct Nile view",
      pricePerNight: 799,
      rating: 4.9,
      blurb: "Panoramic lounge, private office, butler routing.",
      blurbAr: "صالة بانورامية، مكتب خاص، وتنسيق مع البتلر.",
      image:
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&q=80",
    },
    {
      id: "deluxe-king",
      name: "Deluxe King",
      nameAr: "غرفة ديلوكس كينج",
      type: "Deluxe",
      typeAr: "ديلوكس",
      roomNumber: "412",
      floorLabelAr: "الطابق 4",
      floorLabelEn: "Floor 4",
      locationAr: "برج الغرف — الجهة الجنوبية بجوار المصعد الرئيسي",
      locationEn: "Tower wing — south side by main elevators",
      pricePerNight: 449,
      rating: 4.7,
      blurb: "King bed, marble bath, skyline views.",
      blurbAr: "سرير كينج، حمّام رخامي، وإطلالة على الأفق.",
      image:
        "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=900&q=80",
    },
    {
      id: "sky-penthouse",
      name: "Sky Penthouse",
      nameAr: "بنتهاوس السماء",
      type: "Penthouse",
      typeAr: "بنتهاوس",
      roomNumber: "PH-01",
      floorLabelAr: "الطابق 18 (أعلى المبنى)",
      floorLabelEn: "Floor 18 (top of tower)",
      locationAr: "الجناح الملكي — تراس خاص ومصعد VIP مستقل",
      locationEn: "Royal wing — private terrace & dedicated VIP lift",
      pricePerNight: 1499,
      rating: 5.0,
      blurb: "Terrace pool, chef kitchen, VIP elevator.",
      blurbAr: "تراس وحمّام سباحة صغير، مطبخ الشيف، ومصعد خاص.",
      image:
        "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=900&q=80",
    },
    {
      id: "junior-suite",
      name: "Junior Suite",
      nameAr: "جناح جونيور",
      type: "Junior Suite",
      typeAr: "جناح جونيور",
      roomNumber: "602",
      floorLabelAr: "الطابق 6",
      floorLabelEn: "Floor 6",
      locationAr: "الممر الشرقي — قرب صالة الإفطار",
      locationEn: "East corridor — near breakfast lounge",
      pricePerNight: 629,
      rating: 4.8,
      blurb: "Separate sitting area, rain shower, city lights.",
      blurbAr: "جلسة منفصلة، دش مطري، وإطلالة ليلية.",
      image:
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900&q=80",
    },
    {
      id: "exec-twin",
      name: "Executive Twin",
      nameAr: "غرفة تنفيذية توأم",
      type: "Executive",
      typeAr: "تنفيذي",
      roomNumber: "508",
      floorLabelAr: "الطابق 5",
      floorLabelEn: "Floor 5",
      locationAr: "برج الأعمال — قرب مركز المؤتمرات",
      locationEn: "Business tower — near convention hub",
      pricePerNight: 519,
      rating: 4.6,
      blurb: "Twin beds, ergonomic workspace, soundproof glazing.",
      blurbAr: "سريران، مكتب مريح، وعازل للصوت.",
      image:
        "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=900&q=80",
    },
    {
      id: "garden-villa",
      name: "Garden Villa",
      nameAr: "فيلا الحديقة",
      type: "Villa",
      typeAr: "فيلا",
      roomNumber: "GV-2",
      floorLabelAr: "الطابق الأرضي — الجناح الحدائقي",
      floorLabelEn: "Ground floor — garden wing",
      locationAr: "جناح منفصل ببوابة خاصة ومسار إلى المسبح",
      locationEn: "Standalone wing with private gate & pool path",
      pricePerNight: 899,
      rating: 4.85,
      blurb: "Private patio, outdoor tub, direct garden access.",
      blurbAr: "فناء خاص، حوض خارجي، ودخول مباشر للحديقة.",
      image:
        "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=900&q=80",
    },
    {
      id: "family-connecting",
      name: "Family Connecting",
      nameAr: "غرف عائلية متصلة",
      type: "Family",
      typeAr: "عائلية",
      roomNumber: "315–316",
      floorLabelAr: "الطابق 3",
      floorLabelEn: "Floor 3",
      locationAr: "الجناح الشمالي — غرفتان متصلتان للعائلات",
      locationEn: "North wing — two connecting rooms for families",
      pricePerNight: 679,
      rating: 4.75,
      blurb: "Connecting doors, sofa bed, kid-friendly amenities.",
      blurbAr: "باب داخلي، كنبة سرير، ومرافق للأطفال.",
      image:
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80",
    },
  ];

  /* -------------------------------------------------------------------------- */
  /*  Auth — تسجيل الدخول محليًا (localStorage)                                */
  /* -------------------------------------------------------------------------- */
  const Auth = (function () {
    function session() {
      const s = StorageManager.load().session;
      return s && typeof s === "object"
        ? s
        : { isLoggedIn: false, email: "", displayName: "" };
    }

    function isLoggedIn() {
      return !!session().isLoggedIn;
    }

    function render() {
      const s = session();
      const guest = document.getElementById("home-auth-guest");
      const userBox = document.getElementById("home-auth-user");
      const headerTxt = document.getElementById("header-session-text");
      const authBtn = document.getElementById("header-auth-btn");
      const nameEl = document.getElementById("user-display-name");
      const emailEl = document.getElementById("user-email-display");

      const guestLabel = I18n.getLocale() === "ar" ? "ضيف" : "Guest";

      if (isLoggedIn()) {
        if (guest) guest.hidden = true;
        if (userBox) userBox.hidden = false;
        const display = s.displayName || s.email || guestLabel;
        if (nameEl) nameEl.textContent = display;
        if (emailEl) emailEl.textContent = s.email || "";
        if (headerTxt) headerTxt.textContent = I18n.t("header.session", { name: display });
        if (authBtn) {
          authBtn.textContent = I18n.t("header.logout");
          authBtn.removeAttribute("data-nav");
        }
      } else {
        if (guest) guest.hidden = false;
        if (userBox) userBox.hidden = true;
        if (headerTxt) headerTxt.textContent = "";
        if (authBtn) {
          authBtn.textContent = I18n.t("header.login");
          authBtn.removeAttribute("data-nav");
        }
      }
    }

    function login(email, password, displayName) {
      if (!email || !password || password.length < 4) return false;
      StorageManager.save({
        session: {
          isLoggedIn: true,
          email: String(email).trim(),
          displayName:
            String(displayName || "").trim() ||
            String(email).split("@")[0] ||
            (I18n.getLocale() === "ar" ? "ضيف" : "Guest"),
        },
      });
      render();
      return true;
    }

    function logout() {
      StorageManager.save({
        session: {
          isLoggedIn: false,
          email: "",
          displayName: "",
        },
      });
      render();
    }

    function init() {
      document.getElementById("login-form")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email")?.value;
        const password = document.getElementById("login-pass")?.value;
        const displayName = document.getElementById("login-name")?.value;
        login(email, password, displayName);
      });
      document.getElementById("logout-btn")?.addEventListener("click", logout);
      document.getElementById("header-auth-btn")?.addEventListener("click", () => {
        if (isLoggedIn()) {
          logout();
        } else {
          UIController.navigate("home");
          requestAnimationFrame(() =>
            document.getElementById("home-login-anchor")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            })
          );
        }
      });
      render();
    }

    return { init, render, isLoggedIn, login, logout };
  })();

  /* -------------------------------------------------------------------------- */
  /*  Home — معاينة الغرف على الصفحة الرئيسية                                   */
  /* -------------------------------------------------------------------------- */
  const Home = (function () {
    function renderRoomCards() {
      const grid = document.getElementById("home-rooms-grid");
      if (!grid) return;
      const state = StorageManager.load();
      const booked = new Set(state.bookedRoomIds);
      const metaAll = state.roomBookingMeta || {};
      grid.innerHTML = "";

      ROOM_CATALOG.forEach((room, i) => {
        const isBooked = booked.has(room.id);
        const bookedNights = metaAll[room.id]?.nights ?? 1;
        const rl = I18n.roomLine(room);
        const article = document.createElement("article");
        article.className = "home-room-card reveal-item";
        article.style.setProperty("--stagger", String(i));
        article.setAttribute("role", "listitem");

        article.innerHTML = `
          <div class="home-room-card__media">
            <img src="${room.image}" alt="${rl.name}" loading="lazy" width="640" height="400" />
            <span class="home-room-card__badge ${isBooked ? "home-room-card__badge--booked" : ""}">${isBooked ? I18n.t("room.booked") : I18n.t("room.available")}</span>
          </div>
          <div class="home-room-card__body">
            <span class="home-room-card__type">${rl.type}</span>
            <h3 class="home-room-card__title">${rl.name}</h3>
            <p class="home-room-card__meta">
              <span class="home-room-card__num">${I18n.t("room.roomLabel")} <strong>${room.roomNumber}</strong></span>
              <span class="home-room-card__floor">${rl.floor}</span>
            </p>
            <p class="home-room-card__loc"><span class="home-room-card__loc-label">${I18n.t("room.locationLabel")}</span> ${rl.loc}</p>
            <p class="home-room-card__desc">${rl.blurb}</p>
            ${isBooked ? `<p class="home-room-card__booked-for">${I18n.t("room.bookedFor", { n: String(bookedNights) })}</p>` : ""}
            <div class="home-room-card__foot">
              <span class="home-room-card__price">$${room.pricePerNight.toLocaleString()} <small>${I18n.t("room.perNight")}</small></span>
              ${
                isBooked
                  ? `<button type="button" class="btn btn--danger btn--small js-cancel-book-home" data-room-id="${room.id}">${I18n.t("btn.cancelBooking")}</button>`
                  : `<button type="button" class="btn btn--gold btn--small" data-nav="rooms">${I18n.t("room.goBook")}</button>`
              }
            </div>
          </div>
        `;
        grid.appendChild(article);
      });

      document.querySelectorAll(".js-cancel-book-home").forEach((btn) => {
        btn.addEventListener("click", () => {
          Tasks.cancelBooking(btn.getAttribute("data-room-id"));
        });
      });

      UIController.refreshReveal(grid);
    }

    return { renderRoomCards };
  })();

  /* -------------------------------------------------------------------------- */
  /*  Tasks — Room booking engine                                               */
  /* -------------------------------------------------------------------------- */
  const Tasks = (function () {
    const listEl = () => document.getElementById("room-list");

    function escAttr(s) {
      return String(s)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;");
    }

    function isBooked(id) {
      const { bookedRoomIds } = StorageManager.load();
      return bookedRoomIds.includes(id);
    }

    /** سعر الليلة: من أداة الإقامة إن وُجد، وإلا سعر الغرفة */
    function getNightlyRate(room) {
      const stay = StorageManager.load().stay;
      const r = Number(stay.rate);
      return r > 0 ? r : room.pricePerNight;
    }

    function computeBookingAmount(room, nights) {
      const n = Math.max(1, Math.min(90, Number(nights) || 1));
      return Math.round(getNightlyRate(room) * n);
    }

    function readNightsFromInput(roomId) {
      const el = document.getElementById(`nights-input-${roomId}`);
      let n = parseInt(el?.value, 10);
      if (!n || n < 1) n = 1;
      if (n > 90) n = 90;
      return n;
    }

    function render() {
      const root = listEl();
      if (!root) return;
      const state = StorageManager.load();
      const booked = new Set(state.bookedRoomIds);

      const metaAll = state.roomBookingMeta || {};

      root.innerHTML = "";
      ROOM_CATALOG.forEach((room, index) => {
        const bookedFlag = booked.has(room.id);
        const rl = I18n.roomLine(room);
        const savedNights = metaAll[room.id]?.nights ?? 1;
        const li = document.createElement("li");
        li.className = "room-row reveal-item";
        li.style.setProperty("--stagger", String(index));
        if (bookedFlag) {
          li.classList.add("room-row--booked", "completed-booking");
        }

        const statusEl = bookedFlag
          ? `<span class="room-row__status status--reserved">${I18n.t("status.reserved")}</span>`
          : `<span class="room-row__status status--available">${I18n.t("status.available")}</span>`;

        const priceLabel = `$${room.pricePerNight.toLocaleString()} ${I18n.t("room.perNight")}`;

        const nightsBlock = bookedFlag
          ? `<p class="room-row__booked-meta">${I18n.t("room.bookedFor", { n: String(savedNights) })}</p>`
          : `<div class="room-row__nights-wrap">
              <label class="room-row__nights" for="nights-input-${room.id}">
                <span>${I18n.t("room.nightsLabel")}</span>
                <input type="number" id="nights-input-${room.id}" class="room-row__nights-input" min="1" max="90" value="1" aria-describedby="nights-hint-${room.id}" />
              </label>
              <span id="nights-hint-${room.id}" class="room-row__nights-hint">${I18n.t("room.nightsHint")}</span>
            </div>`;

        const actionBtns = bookedFlag
          ? `<button type="button" class="btn btn--danger btn--small js-cancel-book" data-room-id="${room.id}">${I18n.t("btn.cancelBooking")}</button>`
          : `<button type="button" class="btn btn--gold js-book-room" data-room-id="${room.id}">${I18n.t("btn.reserve")}</button>`;

        const rVal =
          typeof room.rating === "number" && room.rating > 0 ? room.rating : 4.5;
        const ratingRow = `<div class="room-row__rating-row"><span class="room-row__rating-label">${I18n.t("room.ratingLabel")}</span><strong class="room-row__rating-num">${rVal.toFixed(1)}</strong><span class="room-row__rating-max"> / 5</span></div>`;

        li.innerHTML = `
          <div class="room-row__thumb">
            <img src="${escAttr(room.image)}" alt="${escAttr(rl.name)}" loading="lazy" width="400" height="250" />
            ${ratingRow}
          </div>
          <div class="room-row__main">
            <span class="room-row__type">${rl.type} · ${room.roomNumber}</span>
            <h3 class="room-row__name">${rl.name}</h3>
            <p class="room-row__meta">${rl.blurb}</p>
            <p class="room-row__where"><strong>${I18n.t("room.whereStrong")}</strong> ${rl.floor} — ${rl.loc}</p>
            ${nightsBlock}
          </div>
          <div class="room-row__side">
            <div class="room-row__price">${priceLabel}</div>
            <div class="room-row__actions">
              ${statusEl}
              ${actionBtns}
            </div>
          </div>
        `;
        root.appendChild(li);
      });

      document.querySelectorAll(".js-book-room").forEach((btn) => {
        btn.addEventListener("click", () => book(btn.getAttribute("data-room-id")));
      });
      document.querySelectorAll(".js-cancel-book").forEach((btn) => {
        btn.addEventListener("click", () =>
          cancelBooking(btn.getAttribute("data-room-id"))
        );
      });

      UIController.refreshReveal(root);
      Home.renderRoomCards();
    }

    function book(roomId) {
      const room = ROOM_CATALOG.find((r) => r.id === roomId);
      if (!room || isBooked(roomId)) return;

      if (!Auth.isLoggedIn()) {
        UIController.openModal(I18n.t("modal.loginTitle"), I18n.t("modal.loginBody"));
        return;
      }

      const nights = readNightsFromInput(roomId);
      const amount = computeBookingAmount(room, nights);
      const state = StorageManager.load();
      const bookedRoomIds = [...new Set([...state.bookedRoomIds, roomId])];
      const roomBookingMeta = {
        ...(state.roomBookingMeta || {}),
        [roomId]: { nights },
      };

      const bookingsCount = state.stats.bookingsCount + 1;
      const totalSpent = state.stats.totalSpent + amount;
      const loyaltyPoints = Math.floor(totalSpent / 8) + bookingsCount * 40;

      StorageManager.save({
        bookedRoomIds,
        roomBookingMeta,
        stats: { bookingsCount, totalSpent, loyaltyPoints },
      });

      render();

      const rl = I18n.roomLine(room);
      const rVal =
        typeof room.rating === "number" && room.rating > 0 ? room.rating : 4.5;
      const summaryLine = I18n.t("modal.bookBody", {
        name: rl.name,
        num: room.roomNumber,
        nights: String(nights),
        amount: `$${amount.toLocaleString()}`,
      });
      const modalBody = `
        <div class="modal-book-preview">
          <img class="modal-book-preview__img" src="${escAttr(room.image)}" alt="${escAttr(rl.name)}" width="480" height="300" loading="lazy" />
          <div class="modal-book-preview__meta">
            <p class="modal-book-preview__loc"><strong>${I18n.t("room.locationLabel")}</strong> ${rl.floor} — ${rl.loc}</p>
            <p class="modal-book-preview__rating"><strong>${I18n.t("room.ratingLabel")}:</strong> ${rVal.toFixed(1)} / 5</p>
          </div>
        </div>
        <p class="modal-book-preview__summary">${summaryLine}</p>`;
      UIController.openModal(I18n.t("modal.bookedTitle"), modalBody);
    }

    function cancelBooking(roomId) {
      if (!confirm(I18n.t("cancel.confirm"))) return;
      const state = StorageManager.load();
      if (!state.bookedRoomIds.includes(roomId)) return;
      const room = ROOM_CATALOG.find((r) => r.id === roomId);
      if (!room) return;

      const meta = state.roomBookingMeta?.[roomId] || { nights: 1 };
      const nights = meta.nights || 1;
      const amount = computeBookingAmount(room, nights);

      const bookedRoomIds = state.bookedRoomIds.filter((id) => id !== roomId);
      const roomBookingMeta = { ...(state.roomBookingMeta || {}) };
      delete roomBookingMeta[roomId];

      const totalSpent = Math.max(0, state.stats.totalSpent - amount);
      const bookingsCount = Math.max(0, state.stats.bookingsCount - 1);
      const loyaltyPoints = Math.floor(totalSpent / 8) + bookingsCount * 40;

      StorageManager.save({
        bookedRoomIds,
        roomBookingMeta,
        stats: { totalSpent, bookingsCount, loyaltyPoints },
      });

      render();

      UIController.openModal(
        I18n.t("modal.cancelDoneTitle"),
        I18n.t("modal.cancelDoneBody")
      );
    }

    return { render, book, cancelBooking, isBooked };
  })();

  /* -------------------------------------------------------------------------- */
  /*  Notes — Services gallery (visual cards + color persistence)               */
  /* -------------------------------------------------------------------------- */
  const Notes = (function () {
    const SERVICES = [
      {
        id: "spa",
        icon: "◇",
        title: "The Spa",
        titleAr: "السبا",
        copy:
          "Signature rituals, thermal suites, and gold-standard therapists — private cadence for recovery.",
        copyAr:
          "طقوس مميزة، أجنحة حرارية، وأخصائيون بمعايير ذهبية لاستعادة التوازن.",
      },
      {
        id: "restaurant",
        icon: "◆",
        title: "Grand Restaurant",
        titleAr: "المطعم الكبير",
        copy:
          "Chef’s tasting menus, sommelier pairings, and skyline seating aligned with your itinerary.",
        copyAr:
          "قوائم تذوق بإشراف الشيف، عشاء مع سوملييه، ومقاعد بإطلالة سماوية.",
      },
      {
        id: "vip",
        icon: "✦",
        title: "VIP Transport",
        titleAr: "النقل VIP",
        copy:
          "Chauffeured arrivals, tarmac coordination, and encrypted itinerary sync with concierge.",
        copyAr:
          "استقبال بسيارة خاصة، تنسيق على المدرج، ومزامنة آمنة مع الكونسييرج.",
      },
    ];

    const mount = () => document.getElementById("service-cards");

    function applyTheme(cardEl, bg, fg) {
      cardEl.style.background = bg;
      cardEl.style.color = fg;
      const icon = cardEl.querySelector(".service-card__icon");
      if (icon) {
        icon.style.borderColor = fg + "33";
        icon.style.color = fg;
      }
    }

    function render() {
      const root = mount();
      if (!root) return;
      const { services } = StorageManager.load();

      root.innerHTML = "";
      SERVICES.forEach((svc, i) => {
        const theme = services[svc.id] || { bg: "#252525", fg: "#ffffff" };
        const ar = I18n.getLocale() === "ar";
        const title = ar ? svc.titleAr : svc.title;
        const copy = ar ? svc.copyAr : svc.copy;
        const article = document.createElement("article");
        article.className = "service-card reveal-item";
        article.style.setProperty("--stagger", String(i));
        article.dataset.serviceId = svc.id;

        article.innerHTML = `
          <div class="service-card__icon" aria-hidden="true">${svc.icon}</div>
          <h3 class="service-card__title">${title}</h3>
          <div class="service-card__rule"></div>
          <p class="service-card__desc">${copy}</p>
          <div class="service-card__controls">
            <label>${I18n.t("svc.surface")} <input type="color" class="js-svc-bg" value="${hexToInput(theme.bg)}" /></label>
            <label>${I18n.t("svc.type")} <input type="color" class="js-svc-fg" value="${hexToInput(theme.fg)}" /></label>
          </div>
        `;

        applyTheme(article, theme.bg, theme.fg);

        const bgInput = article.querySelector(".js-svc-bg");
        const fgInput = article.querySelector(".js-svc-fg");

        const persist = () => {
          const bg = bgInput.value;
          const fg = fgInput.value;
          const state = StorageManager.load();
          const nextServices = {
            ...state.services,
            [svc.id]: { bg, fg },
          };
          StorageManager.save({ services: nextServices });
          applyTheme(article, bg, fg);
        };

        bgInput.addEventListener("input", persist);
        fgInput.addEventListener("input", persist);

        root.appendChild(article);
      });

      UIController.refreshReveal(root);
    }

    function hexToInput(hex) {
      if (/^#[0-9A-Fa-f]{6}$/.test(hex)) return hex;
      return "#252525";
    }

    return { render };
  })();

  /* -------------------------------------------------------------------------- */
  /*  Timer — Stay duration tool (Pomodoro-style ring + cost)                   */
  /* -------------------------------------------------------------------------- */
  const Timer = (function () {
    const MAX_NIGHTS_RING = 14;
    const R = 52;
    const CIRC = 2 * Math.PI * R;

    function els() {
      return {
        form: document.getElementById("stay-form"),
        checkin: document.getElementById("stay-checkin"),
        checkout: document.getElementById("stay-checkout"),
        rate: document.getElementById("stay-rate"),
        ring: document.getElementById("stay-ring-progress"),
        nightsDisplay: document.getElementById("stay-nights-display"),
        nightsText: document.getElementById("stay-nights-text"),
        totalText: document.getElementById("stay-total-text"),
      };
    }

    function loadFormFromStorage() {
      const e = els();
      const { stay } = StorageManager.load();
      if (e.checkin) e.checkin.value = stay.checkIn || "";
      if (e.checkout) e.checkout.value = stay.checkOut || "";
      if (e.rate) e.rate.value = stay.rate || 599;
    }

    function parseNights() {
      const e = els();
      if (!e.checkin?.value || !e.checkout?.value) return 0;
      const start = new Date(e.checkin.value + "T12:00:00");
      const end = new Date(e.checkout.value + "T12:00:00");
      const n = Math.round((end - start) / (1000 * 60 * 60 * 24));
      return n > 0 ? n : 0;
    }

    function updateRing(nights) {
      const e = els();
      if (!e.ring) return;
      const pct = Math.min(nights / MAX_NIGHTS_RING, 1);
      const offset = CIRC * (1 - pct);
      e.ring.style.strokeDasharray = String(CIRC);
      e.ring.style.strokeDashoffset = String(offset);
    }

    function calculate(evt) {
      if (evt) evt.preventDefault();
      const e = els();
      const nights = parseNights();
      const rate = Number(e.rate?.value) || 0;
      const stay = {
        checkIn: e.checkin?.value || "",
        checkOut: e.checkout?.value || "",
        rate,
      };
      StorageManager.save({ stay });

      if (e.nightsDisplay) e.nightsDisplay.textContent = String(nights);
      if (e.nightsText) {
        const u = nights === 1 ? I18n.t("timer.night") : I18n.t("timer.nights");
        e.nightsText.textContent = nights > 0 ? `${nights} ${u}` : "—";
      }

      const total = nights > 0 && rate > 0 ? nights * rate : 0;
      if (e.totalText) {
        e.totalText.textContent =
          total > 0
            ? `$${total.toLocaleString()}`
            : nights === 0
              ? I18n.t("timer.invalidDates")
              : "—";
      }

      updateRing(nights);
    }

    function init() {
      loadFormFromStorage();
      const e = els();
      calculate();
      e.form?.addEventListener("submit", calculate);
      [e.checkin, e.checkout, e.rate].forEach((input) => {
        input?.addEventListener("change", () => calculate());
      });
    }

    function getSnapshot() {
      return {
        nights: parseNights(),
        rate: Number(els().rate?.value) || 0,
      };
    }

    return { init, calculate, getSnapshot };
  })();

  /* -------------------------------------------------------------------------- */
  /*  Dashboard — analytics & membership tiers                                  */
  /* -------------------------------------------------------------------------- */
  const Dashboard = (function () {
    const TIERS = [
      { id: "silver", min: 0, badgeClass: "tier-badge--silver" },
      { id: "gold", min: 1000, badgeClass: "tier-badge--gold" },
      { id: "royal", min: 5000, badgeClass: "tier-badge--royal" },
    ];

    function currentTier(points) {
      let tier = TIERS[0];
      for (let i = TIERS.length - 1; i >= 0; i--) {
        if (points >= TIERS[i].min) {
          tier = TIERS[i];
          break;
        }
      }
      return tier;
    }

    /** Progress 0–100 toward next tier */
    function tierProgress(points) {
      if (points >= TIERS[2].min) return 100;
      if (points >= TIERS[1].min) {
        return Math.min(100, ((points - TIERS[1].min) / (TIERS[2].min - TIERS[1].min)) * 100);
      }
      return Math.min(100, (points / TIERS[1].min) * 100);
    }

    function caption(points) {
      if (points >= TIERS[2].min) {
        return I18n.t("dash.caption.royal");
      }
      if (points >= TIERS[1].min) {
        const need = TIERS[2].min - points;
        return I18n.t("dash.caption.toRoyal", { n: need.toLocaleString() });
      }
      const need = TIERS[1].min - points;
      return I18n.t("dash.caption.toGold", { n: need.toLocaleString() });
    }

    function render() {
      const { stats } = StorageManager.load();
      const elBook = document.getElementById("stat-bookings");
      const elLoy = document.getElementById("stat-loyalty");
      const elSpent = document.getElementById("stat-spent");
      const badge = document.getElementById("tier-badge");
      const bar = document.getElementById("tier-bar");
      const fill = document.getElementById("tier-bar-fill");
      const cap = document.getElementById("tier-caption");

      const points = stats.loyaltyPoints || 0;
      const tier = currentTier(points);
      const pct = tierProgress(points);

      if (elBook) elBook.textContent = String(stats.bookingsCount ?? 0);
      if (elLoy) elLoy.textContent = String(points.toLocaleString());
      if (elSpent) elSpent.textContent = `$${(stats.totalSpent ?? 0).toLocaleString()}`;

      if (badge) {
        badge.textContent = I18n.t(`tier.${tier.id}`);
        badge.className = `tier-badge ${tier.badgeClass}`;
      }
      if (fill) {
        fill.style.width = `${pct}%`;
      }
      if (bar) {
        bar.setAttribute("aria-valuenow", String(Math.round(pct)));
      }
      if (cap) cap.textContent = caption(points);
    }

    return { render };
  })();

  /* -------------------------------------------------------------------------- */
  /*  UIController — SPA navigation, modal, scroll reveals, mobile nav          */
  /* -------------------------------------------------------------------------- */
  const UIController = (function () {
    let navOpen = false;

    function sections() {
      return Array.from(document.querySelectorAll(".spa-section"));
    }

    function showSection(id) {
      sections().forEach((sec) => {
        const active = sec.id === id;
        sec.classList.toggle("spa-section--active", active);
      });

      document.querySelectorAll(".nav-link").forEach((btn) => {
        btn.classList.toggle("nav-link--active", btn.getAttribute("data-nav") === id);
      });

      const main = document.getElementById("spa-main");
      main?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "smooth" });

      const activeSection = document.getElementById(id);
      if (activeSection) {
        refreshReveal(activeSection);
      }

      if (id === "home") Home.renderRoomCards();
      if (id === "rooms") Tasks.render();
    }

    function bindNav() {
      document.addEventListener("click", (e) => {
        const el = e.target.closest("[data-nav]");
        if (!el) return;
        const id = el.getAttribute("data-nav");
        if (!id) return;
        if (el.closest("form")) return;
        e.preventDefault();
        navigate(id);
      });
    }

    function navigate(id) {
      showSection(id);
      closeMobileNav();
      history.replaceState(null, "", `#${id}`);
    }

    function onHash() {
      const h = (location.hash || "#home").slice(1);
      if (document.getElementById(h)) navigate(h);
    }

    function mobileNav() {
      const toggle = document.getElementById("nav-toggle");
      const nav = document.getElementById("primary-nav");
      toggle?.addEventListener("click", () => {
        navOpen = !navOpen;
        nav?.classList.toggle("is-open", navOpen);
        toggle.setAttribute("aria-expanded", navOpen ? "true" : "false");
      });
    }

    function closeMobileNav() {
      const toggle = document.getElementById("nav-toggle");
      const nav = document.getElementById("primary-nav");
      navOpen = false;
      nav?.classList.remove("is-open");
      toggle?.setAttribute("aria-expanded", "false");
    }

    const modalEl = () => document.getElementById("booking-modal");
    const modalTitle = () => document.getElementById("modal-title");
    const modalBody = () => document.getElementById("modal-body");

    function openModal(title, html) {
      const m = modalEl();
      if (!m) return;
      if (modalTitle()) modalTitle().textContent = title;
      if (modalBody()) modalBody().innerHTML = html;
      m.hidden = false;
      document.body.style.overflow = "hidden";
    }

    function closeModal() {
      const m = modalEl();
      if (!m) return;
      m.hidden = true;
      document.body.style.overflow = "";
    }

    function bindModal() {
      document.querySelectorAll("[data-close-modal]").forEach((el) => {
        el.addEventListener("click", closeModal);
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeModal();
      });
    }

    /** IntersectionObserver — staggered reveal for .reveal-item */
    let io;
    function refreshReveal(root) {
      const scope = root || document;
      scope.querySelectorAll(".reveal-item").forEach((el) => {
        el.classList.remove("is-visible");
        io?.observe(el);
      });
    }

    function initReveals() {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -6% 0px" }
      );
      refreshReveal();
    }

    function hideLoader() {
      const loader = document.getElementById("app-loader");
      loader?.classList.add("is-hidden");
      setTimeout(() => loader?.remove(), 700);
    }

    function init() {
      I18n.initFromStorage();
      Theme.init();
      I18n.initLangButtons();

      bindNav();
      bindModal();
      mobileNav();
      initReveals();

      window.addEventListener("hashchange", onHash);

      /* First paint: default section */
      const initial = (location.hash || "#home").replace("#", "") || "home";
      showSection(document.getElementById(initial) ? initial : "home");

      Auth.init();
      Tasks.render();

      window.addEventListener("load", hideLoader, { once: true });
      setTimeout(hideLoader, 1600);
    }

    return { init, openModal, navigate, refreshReveal, showSection };
  })();

  /* Boot */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", UIController.init);
  } else {
    UIController.init();
  }
})();
