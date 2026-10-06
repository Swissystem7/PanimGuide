(function () {
  "use strict";

  var WIKI_YITRO = "https://he.wikisource.org/wiki/%D7%96%D7%94%D7%A8_%D7%A4%D7%A8%D7%A9%D7%AA_%D7%99%D7%AA%D7%A8%D7%95";
  var WIKI_70B = "https://he.wikisource.org/wiki/%D7%96%D7%94%D7%A8_%D7%97%D7%9C%D7%A7_%D7%91_%D7%A2_%D7%91";
  var WIKI_71A = "https://he.wikisource.org/wiki/%D7%96%D7%94%D7%A8_%D7%97%D7%9C%D7%A7_%D7%91_%D7%A2%D7%90_%D7%90";
  var WIKI_71B = "https://he.wikisource.org/wiki/%D7%96%D7%94%D7%A8_%D7%97%D7%9C%D7%A7_%D7%91_%D7%A2%D7%90_%D7%91";
  var WIKI_72A = "https://he.wikisource.org/wiki/%D7%96%D7%94%D7%A8_%D7%97%D7%9C%D7%A7_%D7%91_%D7%A2%D7%91_%D7%90";
  var WIKI_72B = "https://he.wikisource.org/wiki/%D7%96%D7%94%D7%A8_%D7%97%D7%9C%D7%A7_%D7%91_%D7%A2%D7%91_%D7%91";
  var WIKI_73A = "https://he.wikisource.org/wiki/%D7%96%D7%94%D7%A8_%D7%97%D7%9C%D7%A7_%D7%91_%D7%A2%D7%92_%D7%90";
  var WIKI_73B = "https://he.wikisource.org/wiki/%D7%96%D7%94%D7%A8_%D7%97%D7%9C%D7%A7_%D7%91_%D7%A2%D7%92_%D7%91";
  var WIKI_74A = "https://he.wikisource.org/wiki/%D7%96%D7%94%D7%A8_%D7%97%D7%9C%D7%A7_%D7%91_%D7%A2%D7%93_%D7%90";
  var WIKI_74B = "https://he.wikisource.org/wiki/%D7%96%D7%94%D7%A8_%D7%97%D7%9C%D7%A7_%D7%91_%D7%A2%D7%93_%D7%91";
  var WIKI_75B = "https://he.wikisource.org/wiki/%D7%96%D7%94%D7%A8_%D7%97%D7%9C%D7%A7_%D7%91_%D7%A2%D7%94_%D7%91";
  var WIKI_78A = "https://he.wikisource.org/wiki/%D7%96%D7%94%D7%A8_%D7%97%D7%9C%D7%A7_%D7%91_%D7%A2%D7%97_%D7%90";
  var SRC_QUMRAN = "https://en.wikipedia.org/wiki/Qumran_Physiognomies";
  var SRC_4Q186 = "https://en.wikipedia.org/wiki/Qumran_%22Horoscopes%22_(4Q186)";
  var SRC_MELAMMU = "http://www.melammu-project.eu/database/gen_html/a0000542.html";
  var SRC_CHABAD = "https://www.chabad.org/kabbalah/article_cdo/aid/380238/jewish/Face-of-Justice.htm";
  var SRC_PH = "https://ph.yhb.org.il/20-25-07/";
  var SRC_RAMBAN = "https://he.wikisource.org/wiki/%D7%93%D7%A8%D7%A9%D7%AA_%D7%94%D7%A8%D7%9E%D7%91%22%D7%9F_%D7%AA%D7%95%D7%A8%D7%AA_%D7%94%27_%D7%AA%D7%9E%D7%99%D7%9E%D7%94";

  var PERIOD_ZOHAR = "זוהר, פרשת יתרו (חלק ב, דפים ע–עח). המחקר מייחס את החיבור לקסטיליה במאה הי״ג; המסורת מייחסת אותו לרשב״י.";
  var PERIOD_QUMRAN = "מגילות מדבר יהודה, בערך מאה ב׳ לפסה״נ – מאה א׳ לסה״נ.";
  var PERIOD_RAMBAN = "רמב״ן, מאה הי״ג, מצטט מסירה גאונית.";
  var PERIOD_LATER = "סיכום מאוחר / פופולרי. אינו תחליף לנוסח הזוהר.";

  var DEFAULTS = {
    hairTexture: 2,
    hairColor: 1,
    hairline: 0,
    foreheadSize: 1,
    foreheadRound: 1,
    wrinkles: 0,
    brows: 0,
    eyes: 0,
    eyeDepth: 0,
    lips: 1,
    beard: 0,
    ears: 1,
    proportion: 1,
    nose: 1,
    chin: 1,
    complexion: 0
  };

  var LABELS = {
    hairTexture: ["קמיט ועולה למעלה", "לא נקבע במקור", "שעיע ותלוי למטה"],
    hairColor: ["אוכמא צהיב (שחור מבריק)", "אוכמא דלא צהיב", "גוון אחר — לא נמצא מקור"],
    hairline: ["מלא", "מריט בין העיניים (מקום תפילין)", "מריט במקום אחר בראש"],
    foreheadSize: ["דקיק", "לא דקיק ולא רברבא — לא נמצא מקור", "רברבא"],
    foreheadRound: ["חד בלא עגולא", "בינוני — לא נמצא מקור", "בעגולא"],
    wrinkles: ["אין תיאור קמטים שנבחר", "קמיטין רברבן ולא בזווגא", "תלת קמיטין עלאין"],
    brows: ["לא תואר במפורש", "רברבין וכסיין לתתא"],
    eyes: [
      "ארבעה גוונים בשכבות",
      "ירוקין המעורבים בחוורו",
      "צהיבין ירוקין",
      "חוורין וזעיר ירוקא",
      "ירוקין וחוורין וזעיר אוכם"
    ],
    eyeDepth: ["לא שקיעין", "שקיעין"],
    lips: ["דקות — לא נמצא מקור", "בינוניות — לא נמצא מקור", "רברבן", "עתיקין ולאו דקיקין"],
    beard: ["לא מלא", "אתמלי דיקניה בשערא"],
    ears: ["זעירין וקיימין על קיומא", "בינוניות — לא נמצא מקור", "רברבין"],
    proportion: ["רחב/עגול (שבר קומראן)", "לא נקבע", "ארוך ורזה (סיכום 4Q186)"],
    nose: ["קצר", "בינוני", "ארוך/בולט"],
    chin: ["נסוג", "בינוני", "בולט"],
    complexion: ["אנפין נהירין", "סומק רגעי", "חוור רגעי", "ירוק רגעי"]
  };

  function unfound(featureLabel, note, extra) {
    return {
      found: false,
      feature: featureLabel,
      paraphrase: note,
      quote: "",
      citation: "לא נמצא מקור",
      period: "",
      href: "../sources.html#c-explorer-unfound",
      conflict: extra || ""
    };
  }

  function claim(feature, paraphrase, quote, citation, href, period, conflict) {
    return {
      found: true,
      feature: feature,
      paraphrase: paraphrase,
      quote: quote,
      citation: citation,
      href: href,
      period: period,
      conflict: conflict || ""
    };
  }

  function foreheadCombo(state) {
    var size = Number(state.foreheadSize);
    var round = Number(state.foreheadRound);
    if (size === 0 && round === 0) {
      return claim(
        "מצחא — דקיק וחד בלא עגולא",
        "טענת הזוהר: אדם שדעתו אינה מתיישבת, חושב שהוא חכם ואינו יודע, נבהל ברוחו.",
        "מצחא דאיהו דקיק וחד בלא עגולא — דא הוא בר נש דלא מתיישבא בדעתיה, חשיב דאיהו חכים ולא ידע, אתבהיל ברוחיה.",
        "זוהר ב, עא ע״ב",
        WIKI_71B,
        PERIOD_ZOHAR
      );
    }
    if (size === 0 && round === 2) {
      return claim(
        "מצחא — דקיק בעגולא",
        "טענת הזוהר: חכם במה שהוא מסתכל; לפעמים נבהל ברוחו; רחמן; אם ישתדל בתורה יהיה חכם יותר.",
        "מצחא דקיק בעגולא — דא איהו בר נש חכימא במה דאסתכל, לזמנין אתבהיל ברוחיה… רחמן איהו על כלא… אי ישתדל באורייתא ליהוי חכים יתיר.",
        "זוהר ב, עא ע״ב",
        WIKI_71B,
        PERIOD_ZOHAR
      );
    }
    if (size === 2 && round === 0) {
      return claim(
        "מצחא — בלא עגולא ורברבא",
        "טענת הזוהר: המצח הגדול שאינו עגול מתפצל לשני צדדי «שגעונא»: האחד גלוי וטיפשות, והאחר מוסתר — התחכמות שלא לשמה, לגאווה.",
        "מצחא דאיהי בלא עגולא ואיהי רברבא — האי אתפליג לתרין סטרין, ואינון סטרי שגעונא.",
        "זוהר ב, עב ע״א",
        WIKI_72A,
        PERIOD_ZOHAR,
        "הזוהר עצמו מחלק כאן לשני טיפוסים תחת אותה צורת מצח. אין ליישב אותם ל«אבחנה» אחת."
      );
    }
    if (size === 2 && round === 2) {
      return claim(
        "מצחא — בעגולא רברבא",
        "טענת הזוהר: פקח, זוכר הכול, יודע במה שמשתדל אף בלי מלמד, ונקרא נבון. בממון לפעמים מצליח ולפעמים לא.",
        "מצחא דאיהי בעגולא רברבא — פקיחא איהו… נבון אקרי.",
        "זוהר ב, עב ע״א–עב ע״ב",
        WIKI_72A,
        PERIOD_ZOHAR
      );
    }
    return unfound(
      "מצחא — צירוף שלא נמנה",
      "הזוהר מתאר מצח דקיק או רברבא, ובעגולא או בלא עגולא. מצב «בינוני» בגובה או בעיגול אינו מופיע כטיפוס בפני עצמו ביחידת יתרו שנבדקה."
    );
  }

  function readingsFor(state) {
    var list = [];

    var tex = Number(state.hairTexture);
    if (tex === 0) {
      list.push(claim(
        "שערא — קמיט ועולה",
        "טענת הזוהר: בעל רוגז, לבו «קמיט כטופסא», מעשיו אינם כשרים; בשותפות — להתרחק ממנו.",
        "האי מאן דשעריה קמיט וסליק לעילא על רישיה — מאריה דרגיזו, לביה קמיט כטופסא, לאו כשראן עובדוי, בשותפו אתרחק מניה.",
        "זוהר ב, ע ע״ב–עא ע״א",
        WIKI_70B,
        PERIOD_ZOHAR
      ));
    } else if (tex === 2) {
      list.push(claim(
        "שערא — שעיע ותלוי למטה",
        "טענת הזוהר: טוב לשותפות, ויש בו ריווח; לבדו אינו כך. בעל רזים עליונים, וברזים קטנים אינו עומד. מעשיו «כשראן ולא כשראן».",
        "שערא שעיע יתיר ותלי לתתא — טב איהו לשותפו, ורווחא אשתכח ביה, ואיהו בלחודוי לאו הכי.",
        "זוהר ב, ע ע״ב–עא ע״א",
        WIKI_70B,
        PERIOD_ZOHAR
      ));
    } else {
      list.push(unfound(
        "שערא — מרקם ביניים",
        "הזוהר מבחין בין שער קמיט העולה למעלה לבין שער שעיע התלוי למטה. מצב ביניים אינו נמנה כטיפוס."
      ));
    }

    var col = Number(state.hairColor);
    if (col === 0) {
      list.push(claim(
        "שערא — אוכמא צהיב",
        "טענת הזוהר: מצליח במעשי העולם ובסחורה; מצליח לבדו; מי שמתחבר אליו לא יצליח לימים רבים אלא מיד, וההצלחה פורחת.",
        "שערא אוכמא יתיר צהיב — אצלח בכל עובדוי במלי דעלמא, ובסחורא… מאן דמתחבר בהדיה לא אצלח ליומין סגיאין.",
        "זוהר ב, עא ע״א",
        WIKI_71A,
        PERIOD_ZOHAR
      ));
    } else if (col === 1) {
      list.push(claim(
        "שערא — אוכמא דלא צהיב",
        "טענת הזוהר: לפעמים מצליח ולפעמים לא; טוב לשותפות לזמן קרוב ולא לרחוק; יצליח בתורה אם ישתדל אחריה.",
        "שערא אוכמא דלא צהיב — לזמנין אצלח לזמנין לא אצלח… דא איהו לשותפו… טב לזמן קריב ולא לזמן רחיק.",
        "זוהר ב, עא ע״א",
        WIKI_71A,
        PERIOD_ZOHAR
      ));
    } else {
      list.push(unfound(
        "שערא — גוון אחר",
        "ביחידת יתרו שנבדקה נמנו שחור מבריק ושחור שאינו מבריק. לא נמצא כאן לוח לגווני שיער אחרים (למשל אדמוני או לבן) כטיפוסי דיוקן."
      ));
    }

    var line = Number(state.hairline);
    if (line === 1) {
      list.push(claim(
        "שערא — מריט בין העיניים, מקום תפילין",
        "טענת הזוהר: קרחת מצליחה במעשיו, והוא רמאי; נראה ירא חטא מבחוץ ולא מבפנים. אם נקרח אחרי הזקנה — נהפך ממה שהיה, לטוב או לרע. הדברים אמורים בשער שנמרט בין עיניו על המוח, מקום הנחת תפילין.",
        "שערא דמריט — יצלח בעובדוי, ורמאה איהו… והני מילי שערא דמריט בין עיניו על גבי מוחא באתר דאנח תפלין.",
        "זוהר ב, עא ע״א–עא ע״ב",
        WIKI_71A,
        PERIOD_ZOHAR
      ));
    } else if (line === 2) {
      list.push(claim(
        "שערא — מריט במקום אחר בראש",
        "טענת הזוהר: אם הקרחת אינה במקום התפילין — אינו רמאי, אלא בעל לשון הרע בלחישה בלא הרמת קול; לפעמים ירא חטא ולפעמים לא.",
        "ואי באתר אחרא דרישא — לאו הכי, ולאו איהו רמאה, אלא מאריה דלישנא בישא בלחישו בלא ארמות קלא.",
        "זוהר ב, עא ע״ב",
        WIKI_71B,
        PERIOD_ZOHAR
      ));
    } else {
      list.push(unfound(
        "שערא — קו שיער מלא",
        "הזוהר דן בסוגי שער ובמריטה. לא נמצא תיאור נפרד ל«קו שיער מלא» כטיפוס בפני עצמו."
      ));
    }

    list.push(foreheadCombo(state));

    var wr = Number(state.wrinkles);
    if (wr === 1) {
      list.push(claim(
        "קמיטין — רברבן ולא בזווגא",
        "טענת הזוהר: קמטים גדולים שאינם בזוגות, נוצרים בשעת דיבור — «הולך רכיל מגלה סוד»; כל מה שעושה חושב לתועלתו.",
        "קמיטין דמצחיה רברבן, ולאו אינון בזווגא, בשעתא דמליל אתעבידו… דא איהו «הולך רכיל מגלה סוד».",
        "זוהר ב, עא ע״ב",
        WIKI_71B,
        PERIOD_ZOHAR
      ));
    } else if (wr === 2) {
      list.push(claim(
        "קמיטין — שלושה עליונים",
        "טענת הזוהר: שלושה קמטים עליונים גדולים בשעת דיבור, ושלושה סמוך לכל עין — טוב יותר ממה שנראה; מצליח בתורה; בדין אינו מצליח ומתרחק ממנו.",
        "תלת קמיטין עלאין רברבין במצחיה בשעתא דאיהו מליל… דא איהו טב יתיר מכמה דאתחזי.",
        "זוהר ב, עא ע״ב–עב ע״א",
        WIKI_71B,
        PERIOD_ZOHAR
      ));
    } else {
      list.push(unfound(
        "קמיטין — בלי קמטים שנבחרו",
        "הזוהר מתאר קמטים כשהם מופיעים, בעיקר בשעת דיבור. העדר קמטים אינו נמנה כטיפוס חיובי או שלילי בפני עצמו."
      ));
    }

    if (Number(state.brows) === 1) {
      list.push(claim(
        "גבינין — רברבין וכסיין לתתא",
        "טענת הזוהר מופיעה בתוך רזא דעיינין: גבות גדולות המכסות כלפי מטה, ובגווני העין רשימות אדומות דקות לאורך. אין כאן פירוש נפרד לגבה כשדה עצמאי מחוץ לקטע העיניים.",
        "גביני עינוי רברבין וכסיין לתתא, באינון גוונין דעינא אית רשימין סומקין דקיקין בארכא.",
        "זוהר ב, עב ע״ב–עג ע״א",
        WIKI_72B,
        PERIOD_ZOHAR
      ));
    } else {
      list.push(unfound(
        "גבינין — בלי תיאור",
        "ביחידת יתרו נמצא תיאור לגבות גדולות המכסות כלפי מטה. לא נמצא לוח נפרד לגבה דקה, קצרה או מקושתת."
      ));
    }

    var eye = Number(state.eyes);
    if (eye === 0) {
      list.push(claim(
        "עיינין — ארבעה גוונים",
        "טענת הזוהר: חוורו מבחוץ, אוכמא, ירוקא, ונקודת בת־העין האוכמת. אדם שחייך תמיד ושמח, חושב מחשבות לטובה ואינן נשלמות כי מסלקן מיד; מצליח בדברי שמים.",
        "גווני דעיינין אינון ארבע, חוורו לבר… לגו מניה אוכמא… לגו מניה ירוקא… לגו מניה ההוא בת עינא נקודה אוכמא. דא איהו בר נש דחייך תדיר וחדי בחדו.",
        "זוהר ב, עב ע״ב",
        WIKI_72B,
        PERIOD_ZOHAR,
        "הזוהר דן בגוונים, לא בצורת העין (שקד / עיגול). צורת עין כשלעצמה לא נמצאה כטיפוס."
      ));
    } else if (eye === 1) {
      list.push(claim(
        "עיינין — ירוקין בחוורו",
        "טענת הזוהר: רחמן, וחושב תמיד לתועלתו; אינו חושב לנזק אחרים. נאמן במה שנודע, ואינו נאמן במה שלא נודע; מגלה סוד מששמע אותו במקום אחר.",
        "עיינין ירוקין, דסחרין בחוורו, ומתערבין אינון ירוקין בההוא חוורו — רחמנא איהו, ואיהו חשיב תדיר לתועלתיה.",
        "זוהר ב, עג ע״א",
        WIKI_73A,
        PERIOD_ZOHAR
      ));
    } else if (eye === 2) {
      list.push(claim(
        "עיינין — צהיבין ירוקין",
        "טענת הזוהר: יש בו שגעונא; פה מדבר גדולות, ועושה עצמו אדם גדול; אינו ראוי לרזי תורה.",
        "עיינין צהיבין ירוקין, שגעונא אית ביה, ובגין שגעוניה איהו פום ממלל רברבן, ועביד גרמיה כבר נש רב ברברבנו.",
        "זוהר ב, עג ע״א",
        WIKI_73A,
        PERIOD_ZOHAR
      ));
    } else if (eye === 3) {
      list.push(claim(
        "עיינין — חוורין וזעיר ירוקא",
        "טענת הזוהר: בעל רוגז, ורחמן ברוב הזמנים; כשמתמלא רוגז אין בו אהבה כלל ונהפך לאכזריות. אינו בעל רזים.",
        "עיינין חוורין דסחרן זעיר בירוקא — מאריה דרוגזא, ורחמנא איהו לרוב זמנין, וכד אתמלי רוגזא לית ביה רחימו כלל ואתהפך לאכזריות.",
        "זוהר ב, עג ע״א",
        WIKI_73A,
        PERIOD_ZOHAR
      ));
    } else {
      list.push(claim(
        "עיינין — ירוק וחוור וזעיר אוכם",
        "טענת הזוהר: בעל רזים ומצליח בהם; אם מתחיל בהצלחה — עולה, ושונאיו אינם יכולים לו.",
        "עיינין ירוקין וחוורין כחדא, וזעיר מגוון אוכם בהו, דא איהו מאריה דרזין ואצלח בהו.",
        "זוהר ב, עג ע״א–עג ע״ב",
        WIKI_73A,
        PERIOD_ZOHAR
      ));
    }

    if (Number(state.eyeDepth) === 1) {
      list.push(claim(
        "עיינין שקיעין",
        "טענת הזוהר מופיעה בציור השור (אחת מארבע צורות המרכבה, רגעית): אחרי סימני השורות באנפין — «וכדין שקיעין עינוי». זה אינו לוח של «צורת עין» קבועה, אלא סימן בתוך דיוקן רגעי.",
        "וכדין שקיעין עינוי.",
        "זוהר ב, עה ע״א, ציורא תליתאה",
        WIKI_74A,
        PERIOD_ZOHAR,
        "הצורות אדם / אריה / שור / נשר אינן גזעים ואינן טיפוסי רחוב. הזוהר אומר שהן חולפות «לפום שעתא»."
      ));
    } else {
      list.push(unfound(
        "צורת העין",
        "לא נמצא ביחידת יתרו לוח של עין שקדית, עגולה או רחבה. מה שנמצא הוא גוונים, ובמקום אחד — עיניים שקועות בציור השור הרגעי."
      ));
    }

    var lips = Number(state.lips);
    if (lips === 2) {
      list.push(claim(
        "שפוון רברבן",
        "טענת הזוהר: מדבר לשון הרע, אינו מתבייש ואינו ירא; בעל מחלוקת ורכיל בין זה לזה; אינו בעל רזים. כשעוסק בתורה מכסה רזים, אבל הוא בעל לשון הרע.",
        "שפוון רברבן — דא איהו בר נש מליל בלישנא בישא, ולא אכסיף ולא דחיל, מארי דמחלוקת, רכילא איהו בין האי להאי.",
        "זוהר ב, עה ע״ב",
        WIKI_75B,
        PERIOD_ZOHAR
      ));
    } else if (lips === 3) {
      list.push(claim(
        "שפוון עתיקין ולאו דקיקין",
        "טענת הזוהר: בעל רוגז יתר וזדון, אינו יכול לסבול דבר, בעל לשון הרע בפרהסיה בלא בושה; לפעמים בליצנות. «בעי לאתרחקא מניה».",
        "שפוון עתיקין בעתיקו ולאו דקיקין — האי איהו בר נש מאריה דרוגזא יתיר, מאריה דזדונא, לא יכיל למסבל מלה.",
        "זוהר ב, עה ע״ב",
        WIKI_75B,
        PERIOD_ZOHAR
      ));
    } else {
      list.push(unfound(
        lips === 0 ? "שפוון דקות" : "שפוון בינוניות",
        "הזוהר מתאר שפתיים רברבן, ושפתיים «עתיקין ולאו דקיקין». לא נמצא טיפוס נפרד לשפתיים דקות או בינוניות, אלא רק שלילה של הדקות בתיאור העבות."
      ));
    }

    if (Number(state.beard) === 1) {
      list.push(claim(
        "דיקנא מלאה",
        "טענת הזוהר, בסוף רזא דשפוון: כשהזקן מתמלא שיער — לשון הרע אורבת עליו בפרהסיה, אין בו בושה, עוסק במחלוקת, מצליח בדברי העולם. מצוטט «העז איש רשע בפניו».",
        "אתמלי דיקניה בשערא — ההוא לישנא בישא אורי עליה בפרהסיא, לית ליה כסופא, אשתדל במחלוקת.",
        "זוהר ב, עה ע״ב",
        WIKI_75B,
        PERIOD_ZOHAR
      ));
    } else {
      list.push(unfound(
        "דיקנא — לא מלאה",
        "הזוהר מתאר מצב של זקן מלא. לא נמצא טיפוס נגדי מפורש לזקן גזור או למשולל זקן."
      ));
    }

    var ears = Number(state.ears);
    if (ears === 0) {
      list.push(claim(
        "אודנין זעירין על קיומא",
        "טענת הזוהר: פקח לב בהתעוררות, חפץ להשתדל בכול.",
        "מאן דאודנוי זעירין וקיימין על קיומא — פקיחא דלבא באתערותא איהו, צבי לאשתדלא בכלא.",
        "זוהר ב, עה ע״ב",
        WIKI_75B,
        PERIOD_ZOHAR,
        "בדף עח ע״א נמנים שישה צדדים על «ואתה תחזה» בלי האוזניים. שתי הרשימות מוצגות כפי שהן."
      ));
    } else if (ears === 2) {
      list.push(claim(
        "אודנין רברבין",
        "טענת הזוהר: טיפש בליבו ושגעון ברוחו.",
        "מאן דאודנוי רברבין — טפשא בלביה ושגעונא ברוחיה.",
        "זוהר ב, עה ע״ב",
        WIKI_75B,
        PERIOD_ZOHAR
      ));
    } else {
      list.push(unfound(
        "אודנין בינוניות",
        "הזוהר מבחין בין אוזניים גדולות לבין קטנות העומדות על תיקונן. מצב ביניים אינו נמנה."
      ));
    }

    var prop = Number(state.proportion);
    if (prop === 2) {
      list.push(claim(
        "מתאר — ארוך ורזה",
        "סיכום מחקרי של 4Q186: אדם ש«ששה חלקים בבית האור ושלושה בבור החושך» מתואר פיזיוגנומית כ«long and lean», ולפי ורמש צפוי להיות «meek» (ענו).",
        "a man of “six parts” from the “house of light” and “three parts” from the “pit of darkness” is described (physiognomically) as “long and lean,” and is expected (horoscopically) to “be meek.”",
        "Wikipedia, Qumran Horoscopes (4Q186), על פי Albani ו־Vermes",
        SRC_4Q186,
        PERIOD_QUMRAN,
        "תרגום גרסיה־מרטינס אצל Melammu כותב על קטע 1.2 (שש באור, שלוש בחושך; ירכיים ארוכות ודקות; נולד ברגל השור) «He will be poor». יש מתח בין «ענו» ל«עני» בסיכומים. גוף המגילה עצמו לא צוטט כאן מילה במילה מעבר לסיכומים האלה."
      ));
    } else if (prop === 0) {
      list.push(claim(
        "מתאר — רחב / עגול (שבור)",
        "ב־4Q186 1.1, לפי תרגום גרסיה־מרטינס אצל Melammu, נשתמר «wide, circular» — אבל הקטע מקוטע («And the man who will be [ … ] wide, circular [ … ]»). אי אפשר לבנות מזה טיפוס שלם.",
        "And the man who will be [ … ] wide, circular [ … ] pleasant and not the flesh of …",
        "4Q186 1.1, García Martínez & Watson אצל Melammu",
        SRC_MELAMMU,
        PERIOD_QUMRAN,
        "זה שבר. אין לגזור ממנו יחס זהב, שלישי פנים, או «פנים רחבות = …» מעבר למילים השבורות."
      ));
    } else {
      list.push(unfound(
        "פרופורציות פנים «קלאסיות»",
        "לא נמצא ביחידת הזוהר מניין של שלישי מצח–אף–סנטר או יחס זהב. בקומראן יש תיאורי גוף (ארוך/רזה, לא גבוה ולא נמוך) יותר מלוח פרופורציות פנים. 4Q186 2.1: «He is neither tall nor short» — על הקומה, לא על שלישי הפנים."
      ));
    }

    list.push(unfound(
      "חוטם / קו האף",
      "שבעת מושאי הזוהר ביחידת יתרו הם: שער, מצח, עיניים, פנים, שפתיים, שרטוטי ידיים, אוזניים. האף אינו נמנה שם כשדה. לכן כל «קריאת אף» כאן מסומנת כלא מאומתת ביחידה שנבדקה.",
      "סיכום מאוחר באנגלית באתר Chabad («Face of Justice») מונה שיער, עיניים, אף, שפתיים, הפנים והידיים — בלי מצח ובלי אוזניים. זה מתנגש ברשימת הזוהר עצמה. אין ליישב את הסתירה בלי מקור, ואין כאן ציטוט מגוף «חכמת הפרצוף השלם» (לא נפתח)."
    ));

    list.push(unfound(
      "סנטר",
      "לא נמצא ביחידת יתרו שנבדקה שדה דיוקן בשם סנטר, ולא לוח של סנטר נסוג / בולט / מחודד. שיעורים מודרניים על «קריאת פנים קבלית» דנים בסנטר — הם אינם מקור ראשוני שאומת כאן."
    ));

    var cx = Number(state.complexion);
    if (cx === 0) {
      list.push(claim(
        "אנפין נהירין",
        "טענת הזוהר: ההסתכלות בפנים «על ארח קשוט» היא בשעה שהפנים מאירות והאדם עומד על קיומו, והרשימות נראות בדרך אמת. בשעת רוגז נמסר דין אחר. זה תנאי הסתכלות, לא סולם גוון עור.",
        "אסתכלותא דאנפין על ארח קשוט, בשעתא דאנפין נהירין וקיימא בר נש על קיומא, ואינון רשימין אתחזון בארח קשוט.",
        "זוהר ב, עו ע״א",
        WIKI_YITRO,
        PERIOD_ZOHAR,
        "הזוהר אינו מסווג בני אדם לפי גוון עור גזעי. סולם כהה–בהיר כ«גזע» לא נמצא במקורות שנבדקו — והאתר מסרב לבנות אותו."
      ));
    } else if (cx === 1) {
      list.push(claim(
        "סומק רגעי באנפין",
        "טענת הזוהר, בציור האריה (רגעי, לא טיפוס קבוע): הפנים מתכסות דם, ולפי שעה נהפכות לחוור או לירוק. בציור השור נזכרים «תלת קורטמי סומקי» בצד ימין ושמאל.",
        "אנפוי חפיין דמא, לפום שעתא מתהפכן לחוורא או לירוקא.",
        "זוהר ב, עד ע״ב; וכן עה ע״א",
        WIKI_74B,
        PERIOD_ZOHAR
      ));
    } else if (cx === 2) {
      list.push(claim(
        "חוור רגעי",
        "טענת הזוהר: אחרי כיסוי הדם בציור האריה, הפנים נהפכות לפי שעה לחוור או לירוק. זה שינוי רגעי של דיוקן פנימי, לא גוון עור קבוע.",
        "אנפוי חפיין דמא, לפום שעתא מתהפכן לחוורא או לירוקא.",
        "זוהר ב, עד ע״ב",
        WIKI_74B,
        PERIOD_ZOHAR
      ));
    } else {
      list.push(claim(
        "ירוק רגעי",
        "אותו משפט בזוהר: המעבר הוא לחוור או לירוק לפי שעה. אין כאן «פנים ירוקות» כטיפוס קבוע, ואין סיווג גזעי.",
        "לפום שעתא מתהפכן לחוורא או לירוקא.",
        "זוהר ב, עד ע״ב",
        WIKI_74B,
        PERIOD_ZOHAR
      ));
    }

    list.push(claim(
      "גבול שהמסורת עצמה מציבה",
      "הזוהר כותב שהדיוקן אינו רק סימנים חיצוניים, ושבסוף היחידה משה לא נזקק לשיטה כי רוח הקודש באה אליו. הרמב״ן מצטט שהחכמה נשארה «בשבוש». פניני הלכה: גם תכונות אופי אין נכון לברר בחכמות אלה.",
      "ואתה תחזה — «תבחר» לא כתיב, אלא «תחזה»… ועם כל דא משה לא אצטריך דא… בגין דרוחא קודשא הוה אתי לגביה.",
      "זוהר ב, עח ע״א; רמב״ן, תורת ה׳ תמימה; פניני הלכה כה, ז",
      WIKI_78A,
      PERIOD_ZOHAR + " " + PERIOD_RAMBAN
    ));

    return list;
  }

  function el(id) {
    return document.getElementById(id);
  }

  function currentState() {
    var state = {};
    Object.keys(DEFAULTS).forEach(function (key) {
      var node = document.querySelector("[name='" + key + "']");
      if (!node) {
        state[key] = DEFAULTS[key];
        return;
      }
      if (node.type === "radio") {
        var checked = document.querySelector("[name='" + key + "']:checked");
        state[key] = checked ? Number(checked.value) : DEFAULTS[key];
      } else {
        state[key] = Number(node.value);
      }
    });
    return state;
  }

  function setAria(name, value) {
    var input = document.querySelector("input[name='" + name + "'][type='range']");
    if (!input) return;
    var text = (LABELS[name] && LABELS[name][value]) || String(value);
    input.setAttribute("aria-valuetext", text);
    var out = el("val-" + name);
    if (out) out.textContent = text;
  }

  function renderFace(state) {
    var svg = el("schematic-face");
    if (!svg) return;

    var long = Number(state.proportion);
    var rx = long === 2 ? 62 : long === 0 ? 84 : 72;
    var ry = long === 2 ? 118 : long === 0 ? 92 : 104;
    var cy = 178;
    var cx = 130;

    var face = el("face-oval");
    if (face) {
      face.setAttribute("cx", cx);
      face.setAttribute("cy", cy);
      face.setAttribute("rx", rx);
      face.setAttribute("ry", ry);
    }

    var fills = ["#efe2c4", "#e8b8a8", "#f3efe4", "#d5ddc4"];
    var faceFill = el("face-fill");
    if (faceFill) {
      faceFill.setAttribute("cx", cx);
      faceFill.setAttribute("cy", cy);
      faceFill.setAttribute("rx", rx);
      faceFill.setAttribute("ry", ry);
      faceFill.setAttribute("fill", fills[Number(state.complexion)] || fills[0]);
    }

    var size = Number(state.foreheadSize);
    var hairlineY = cy - ry + (size === 0 ? 18 : size === 2 ? 42 : 30);
    var round = Number(state.foreheadRound);
    var curve = round === 2 ? 18 : round === 0 ? 2 : 10;
    var hl = el("hairline-path");
    if (hl) {
      var left = cx - rx + 10;
      var right = cx + rx - 10;
      hl.setAttribute(
        "d",
        "M" + left + " " + (hairlineY + 6) +
        " Q" + cx + " " + (hairlineY - curve) + " " + right + " " + (hairlineY + 6)
      );
    }

    var wrinklesG = el("wrinkles-group");
    if (wrinklesG) {
      var wsvg = "";
      var wr = Number(state.wrinkles);
      if (wr === 1) {
        wsvg += line(cx - 28, hairlineY + 10, cx + 10, hairlineY + 8);
        wsvg += line(cx - 8, hairlineY + 20, cx + 32, hairlineY + 18);
      } else if (wr === 2) {
        wsvg += line(cx - 30, hairlineY + 8, cx + 30, hairlineY + 8);
        wsvg += line(cx - 34, hairlineY + 16, cx - 6, hairlineY + 16);
        wsvg += line(cx + 6, hairlineY + 16, cx + 34, hairlineY + 16);
        wsvg += line(cx - 30, hairlineY + 24, cx + 30, hairlineY + 24);
      }
      wrinklesG.innerHTML = wsvg;
    }

    var hairG = el("hair-group");
    if (hairG) {
      var h = "";
      var tex = Number(state.hairTexture);
      var lineType = Number(state.hairline);
      var top = cy - ry;
      if (lineType === 0 || lineType === 2) {
        var i;
        if (tex === 0) {
          for (i = -5; i <= 5; i += 1) {
            var hx = cx + i * (rx / 7);
            h += '<path d="M' + hx + " " + (top + 8) + " q8 -22 0 -34" + '" fill="none" stroke="currentColor" stroke-width="1.6"/>';
          }
        } else if (tex === 2) {
          for (i = -4; i <= 4; i += 1) {
            var sx = cx + i * (rx / 6);
            h += '<path d="M' + sx + " " + (top + 4) + " C" + (sx - 6) + " " + (top + 40) + " " + (sx + 8) + " " + (cy - 20) + " " + sx + " " + (cy + 10) + '" fill="none" stroke="currentColor" stroke-width="1.4"/>';
          }
        } else {
          for (i = -4; i <= 4; i += 1) {
            h += '<line x1="' + (cx + i * 12) + '" y1="' + (top + 6) + '" x2="' + (cx + i * 12) + '" y2="' + (top + 28) + '" stroke="currentColor" stroke-width="1.4"/>';
          }
        }
      }
      if (lineType === 1) {
        h += '<circle cx="' + cx + '" cy="' + (hairlineY - 4) + '" r="7" fill="none" stroke="currentColor" stroke-dasharray="3 3"/>';
      }
      if (lineType === 2) {
        h = "";
        for (i = -3; i <= 3; i += 1) {
          if (Math.abs(i) < 2) continue;
          h += '<path d="M' + (cx + i * 14) + " " + (top + 10) + " q6 -10 0 -16" + '" fill="none" stroke="currentColor"/>';
        }
      }
      var shine = Number(state.hairColor) === 0;
      hairG.setAttribute("opacity", shine ? "1" : "0.75");
      hairG.innerHTML = h;
    }

    var browY = hairlineY + 36;
    var browDrop = Number(state.brows) === 1 ? 8 : 0;
    var browW = Number(state.brows) === 1 ? 3.2 : 1.8;
    var bl = el("brow-left");
    var br = el("brow-right");
    if (bl) {
      bl.setAttribute("d", "M" + (cx - 38) + " " + (browY + browDrop) + " Q" + (cx - 22) + " " + (browY - 8) + " " + (cx - 8) + " " + (browY + 2));
      bl.setAttribute("stroke-width", browW);
    }
    if (br) {
      br.setAttribute("d", "M" + (cx + 38) + " " + (browY + browDrop) + " Q" + (cx + 22) + " " + (browY - 8) + " " + (cx + 8) + " " + (browY + 2));
      br.setAttribute("stroke-width", browW);
    }

    var eyeY = browY + 18;
    var sunken = Number(state.eyeDepth) === 1;
    var eyeR = sunken ? 6 : 9;
    var iris = ["#2c2416", "#6a8f4e", "#b7c35a", "#d8d2c2", "#4d6b3a"];
    ["eye-left", "eye-right"].forEach(function (id, idx) {
      var node = el(id);
      if (!node) return;
      var ex = idx === 0 ? cx - 24 : cx + 24;
      node.setAttribute("cx", ex);
      node.setAttribute("cy", eyeY + (sunken ? 4 : 0));
      node.setAttribute("r", eyeR);
      node.setAttribute("fill", iris[Number(state.eyes)] || iris[0]);
    });

    var nose = el("nose-path");
    if (nose) {
      var n = Number(state.nose);
      var ny = eyeY + 14;
      var nd = n === 0 ? 16 : n === 2 ? 34 : 24;
      var nw = n === 2 ? 12 : 8;
      nose.setAttribute("d", "M" + cx + " " + ny + " L" + (cx - nw) + " " + (ny + nd) + " H" + (cx + nw));
    }

    var lipsN = Number(state.lips);
    var lipY = cy + ry * 0.28;
    var fullness = lipsN === 0 ? 4 : lipsN === 3 ? 16 : lipsN === 2 ? 12 : 8;
    var lu = el("lips-upper");
    var ll = el("lips-lower");
    if (lu) lu.setAttribute("d", "M" + (cx - 22) + " " + lipY + " Q" + cx + " " + (lipY - fullness) + " " + (cx + 22) + " " + lipY);
    if (ll) ll.setAttribute("d", "M" + (cx - 22) + " " + (lipY + 3) + " Q" + cx + " " + (lipY + fullness + 4) + " " + (cx + 22) + " " + (lipY + 3));

    var chinN = Number(state.chin);
    var chin = el("chin-mark");
    if (chin) {
      var cy2 = cy + ry - 6;
      var bump = chinN === 2 ? 10 : chinN === 0 ? -6 : 2;
      chin.setAttribute("d", "M" + (cx - 16) + " " + cy2 + " Q" + cx + " " + (cy2 + bump) + " " + (cx + 16) + " " + cy2);
    }

    var earSize = Number(state.ears) === 0 ? 10 : Number(state.ears) === 2 ? 22 : 15;
    var eln = el("ear-left");
    var ern = el("ear-right");
    if (eln) eln.setAttribute("d", earPath(cx - rx, cy, earSize, -1));
    if (ern) ern.setAttribute("d", earPath(cx + rx, cy, earSize, 1));

    var beardG = el("beard-group");
    if (beardG) {
      if (Number(state.beard) === 1) {
        var b = "";
        var j;
        for (j = -5; j <= 5; j += 1) {
          b += '<line x1="' + (cx + j * 6) + '" y1="' + (lipY + 16) + '" x2="' + (cx + j * 6) + '" y2="' + (cy + ry - 4) + '" stroke="currentColor" stroke-width="1"/>';
        }
        beardG.innerHTML = b;
      } else {
        beardG.innerHTML = "";
      }
    }
  }

  function line(x1, y1, x2, y2) {
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="currentColor" stroke-width="1.2"/>';
  }

  function earPath(x, y, size, dir) {
    var dx = dir * size;
    return "M" + x + " " + (y - size) + " Q" + (x + dx) + " " + y + " " + x + " " + (y + size);
  }

  function renderClaim(item, active) {
    var cls = "claim-card" + (active ? " is-active" : "") + (item.found ? "" : " unfound");
    var badge = item.found ? "" : '<span class="badge-unfound">לא נמצא מקור</span>';
    var conflict = item.conflict
      ? '<p><span class="badge-conflict">סתירה או עמימות</span> ' + escapeHtml(item.conflict) + "</p>"
      : "";
    var quote = item.quote
      ? "<blockquote class=\"claim-quote\">" + escapeHtml(item.quote) + "</blockquote>"
      : "";
    var cite = item.found
      ? '<p class="source-line"><a href="' + item.href + '">' + escapeHtml(item.citation) + "</a>" +
        (item.period ? " · " + escapeHtml(item.period) : "") + "</p>"
      : '<p class="source-line"><a href="' + item.href + '">למדיניות הציטוט</a></p>';
    return (
      '<article class="' + cls + '">' +
      '<p class="claim-kicker">' + (active ? "השדה ששיניתם עכשיו" : "טענת המסורת") + "</p>" +
      "<h3>" + badge + escapeHtml(item.feature) + "</h3>" +
      "<p>" + escapeHtml(item.paraphrase) + "</p>" +
      quote + conflict + cite +
      "</article>"
    );
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderReadings(state, focusKey) {
    var all = readingsFor(state);
    var focusMap = {
      hairTexture: 0, hairColor: 1, hairline: 2,
      foreheadSize: 3, foreheadRound: 3, wrinkles: 4,
      brows: 5, eyes: 6, eyeDepth: 7,
      lips: 8, beard: 9, ears: 10,
      proportion: 11, nose: 12, chin: 13, complexion: 14
    };
    var idx = focusMap.hasOwnProperty(focusKey) ? focusMap[focusKey] : 0;
    var active = all[idx] || all[0];
    var activeBox = el("active-reading");
    var listBox = el("all-readings");
    var composite = el("composite-body");
    var printState = el("print-state");
    if (activeBox) activeBox.innerHTML = renderClaim(active, true);
    if (listBox) {
      listBox.innerHTML = all.map(function (item, i) {
        return i === idx ? "" : renderClaim(item, false);
      }).join("");
    }
    if (composite) composite.innerHTML = buildComposite(state, all);
    if (printState) {
      printState.innerHTML = "<strong>מצב התרשים בהדפסה:</strong> " +
        Object.keys(LABELS).map(function (k) {
          return LABELS[k][state[k]];
        }).join(" · ");
    }
  }

  function buildComposite(state, all) {
    var sourced = all.filter(function (item) { return item.found && item.feature.indexOf("גבול") !== 0; });
    var missing = all.filter(function (item) { return !item.found; });
    var parts = sourced.map(function (item) {
      return "<li><strong>" + escapeHtml(item.feature) + ":</strong> " + escapeHtml(item.paraphrase) + "</li>";
    });
    var miss = missing.map(function (item) {
      return "<li><span class=\"badge-unfound\">לא נמצא מקור</span> " + escapeHtml(item.feature) + "</li>";
    });
    return (
      '<p class="composite-label">קריאה מסורתית — טענת המקורות על הצורה בתרשים, לא על אדם חי</p>' +
      "<p>ההרכב שלהלן הוא ליקוט של טענות נפרדות. הזוהר עצמו דן בשדות אחד־אחד, ואינו מוסר «מתכון פנים» אחד. צירוף השדות הוא מעשה הדף הזה, ומסומן במפורש כטענת המסורת בלבד.</p>" +
      "<ul>" + parts.join("") + "</ul>" +
      (missing.length > 0 ? "<p><strong>שדות בבחירה זו בלי מקור מאומת</strong></p>" +
      "<ul>" + miss.join("") + "</ul>" : "") +
      '<p class="science-sticky">פיזיוגנומיה אינה שיטה מדעית, ואין לה תוקף לקבוע אישיות, יכולת, בריאות או אופי של איש. אין כאן עצה להעסקה, לשידוך, לשפיטה או לאבחון. ראו את <a href="../history.html#consensus">הקונצנזוס המודרני נגד פיזיוגנומיה</a> ואת <a href="' + SRC_PH + '">פניני הלכה כה, ז</a>.</p>'
    );
  }

  function update(focusKey) {
    var state = currentState();
    Object.keys(LABELS).forEach(function (key) {
      setAria(key, state[key]);
    });
    renderFace(state);
    renderReadings(state, focusKey);
  }

  function reset() {
    Object.keys(DEFAULTS).forEach(function (key) {
      var radios = document.querySelectorAll("input[name='" + key + "'][type='radio']");
      if (radios.length) {
        radios.forEach(function (r) {
          r.checked = Number(r.value) === DEFAULTS[key];
        });
        return;
      }
      var range = document.querySelector("input[name='" + key + "'][type='range']");
      if (range) range.value = String(DEFAULTS[key]);
    });
    update("hairTexture");
  }

  function init() {
    if (!el("explorer-root")) return;
    document.querySelectorAll("#explorer-root input").forEach(function (input) {
      input.addEventListener("input", function () {
        update(input.name);
      });
      input.addEventListener("change", function () {
        update(input.name);
      });
    });
    var resetBtn = el("explorer-reset");
    if (resetBtn) resetBtn.addEventListener("click", reset);
    update("hairTexture");
  }

  document.addEventListener("DOMContentLoaded", init);
})();

