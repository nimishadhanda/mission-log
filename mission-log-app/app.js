(function () {
  // ---------------- Supabase ----------------
  var supabaseClient = null;
  var configOk = window.SUPABASE_URL && window.SUPABASE_ANON_KEY &&
    window.SUPABASE_URL.indexOf('YOUR_SUPABASE') !== 0;
  if (configOk) {
    supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  }

  // ---------------- data ----------------
  var MISSION_WEEK_URL = 'https://claude.ai/code/artifact/0f7e17bc-3ce4-4d29-a550-ab88212fbffb';
  var DAY_NAMES = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

  // Point weights: the four pillars (sports, study, music, sleep) are "main" and
  // worth more; everyday good habits are worth less but still count.
  var POINTS = { main: 3, good: 1 };

  // Sleep is a main pillar — added to every day, same as the wellness items were.
  var MAIN_DAILY_ITEMS = [
    { id: 'sleep', label: 'Asleep on time', cat: 'sleep', tier: 'main' },
    { id: 'writing', label: 'Writing — 5 lines', cat: 'stem', tier: 'main' }
  ];

  // Good-to-do daily habits — worth fewer points than the main pillars, but still
  // shown and still count toward the day.
  var GOOD_DAILY_ITEMS = [
    { id: 'feet',    label: 'Foot exercises (20–30 min)', cat: 'wellness', tier: 'good' },
    { id: 'water',   label: 'Water through the day', cat: 'wellness', tier: 'good' },
    { id: 'dinner',  label: 'Dinner on time', cat: 'wellness', tier: 'good' },
    { id: 'brush',   label: 'Brushed teeth (morning & night)', cat: 'wellness', tier: 'good' }
  ];

  // Main-pillar activities: sports, study (Olympiad/robotics), music (ukulele).
  var DAY_ITEMS = {
    Monday:    [ { id:'olympiad', label:'Olympiad practice — English', cat:'stem', tier:'main' },
                 { id:'ukulele',  label:'Ukulele practice', cat:'arts', tier:'main' },
                 { id:'football', label:'Football', cat:'sport', tier:'main' } ],
    Tuesday:   [ { id:'cricket',  label:'Cricket', cat:'sport', tier:'main' },
                 { id:'olympiad', label:'Olympiad practice — Science', cat:'stem', tier:'main' },
                 { id:'sc',       label:'Strength & Conditioning', cat:'sport', tier:'main' } ],
    Wednesday: [ { id:'olympiad', label:'Olympiad practice — English', cat:'stem', tier:'main' },
                 { id:'ukulele',  label:'Ukulele practice', cat:'arts', tier:'main' },
                 { id:'football', label:'Football', cat:'sport', tier:'main' } ],
    Thursday:  [ { id:'cricket',  label:'Cricket', cat:'sport', tier:'main' },
                 { id:'olympiad', label:'Olympiad practice — English', cat:'stem', tier:'main' },
                 { id:'sc',       label:'Strength & Conditioning', cat:'sport', tier:'main' } ],
    Friday:    [ { id:'olympiad', label:'Olympiad practice — Science', cat:'stem', tier:'main' },
                 { id:'ukulele',  label:'Ukulele practice', cat:'arts', tier:'main' } ],
    Saturday:  [ { id:'swim',     label:'Swimming', cat:'sport', tier:'main' },
                 { id:'olympiad', label:'Olympiad practice — English', cat:'stem', tier:'main' },
                 { id:'robotics', label:'Robotics', cat:'stem', tier:'main' },
                 { id:'ukuleleclass', label:'Ukulele class', cat:'arts', tier:'main' },
                 { id:'sc',       label:'Strength & Conditioning', cat:'sport', tier:'main' } ],
    Sunday:    [ { id:'swim',     label:'Swimming', cat:'sport', tier:'main' },
                 { id:'olympiad', label:'Olympiad practice — pick a subject', cat:'stem', tier:'main' } ]
  };

  function itemsFor(dayName) {
    return MAIN_DAILY_ITEMS.concat(DAY_ITEMS[dayName]).concat(GOOD_DAILY_ITEMS);
  }
  function pointsFor(item) { return POINTS[item.tier] || POINTS.good; }

  // ---- full-day timeline (from Mission Week) + default times for checklist items ----
  // This is the same time-blocked plan as the separate Mission Week page, brought
  // inline so Moksh can see "what's happening when" without leaving Mission Log.
  // 'open' / 'pickyour' / 'build' blocks are the ones Moksh can add his own plans into.
  var TIME_BLOCKS = {
    Monday: [
      ['06:30','07:05','Wake & morning routine','meal'],
      ['07:05','15:20','School','school'],
      ['15:20','15:45','Snack & unwind','meal'],
      ['15:45','16:15','Olympiad practice — English','stem'],
      ['16:15','16:20','Open time','open'],
      ['16:20','16:45','Ukulele practice','arts'],
      ['16:45','17:00','Open time','open'],
      ['17:00','18:00','Football','sport'],
      ['18:00','19:30','Play time','open'],
      ['19:30','20:00','Shower & wind down','meal'],
      ['20:00','20:30','Dinner','meal'],
      ['20:30','06:30','Sleep','sleep']
    ],
    Tuesday: [
      ['06:30','07:05','Wake & morning routine','meal'],
      ['07:05','15:20','School','school'],
      ['15:20','15:45','Snack & unwind','meal'],
      ['15:45','16:00','Open time','open'],
      ['16:00','17:00','Cricket','sport'],
      ['17:00','17:15','Open time','open'],
      ['17:15','17:45','Olympiad practice — Science','stem'],
      ['17:45','18:00','Open time','open'],
      ['18:00','19:00','Strength & Conditioning','sport'],
      ['19:00','19:45','Play time','open'],
      ['19:45','20:00','Shower & wind down','meal'],
      ['20:00','20:30','Dinner','meal'],
      ['20:30','06:30','Sleep','sleep']
    ],
    Wednesday: [
      ['06:30','07:05','Wake & morning routine','meal'],
      ['07:05','15:20','School','school'],
      ['15:20','15:45','Snack & unwind','meal'],
      ['15:45','16:15','Olympiad practice — English','stem'],
      ['16:15','16:20','Open time','open'],
      ['16:20','16:45','Ukulele practice','arts'],
      ['16:45','17:00','Open time','open'],
      ['17:00','18:00','Football','sport'],
      ['18:00','19:30','Play time','open'],
      ['19:30','20:00','Shower & wind down','meal'],
      ['20:00','20:30','Dinner','meal'],
      ['20:30','06:30','Sleep','sleep']
    ],
    Thursday: [
      ['06:30','07:05','Wake & morning routine','meal'],
      ['07:05','15:20','School','school'],
      ['15:20','15:45','Snack & unwind','meal'],
      ['15:45','16:00','Open time','open'],
      ['16:00','17:00','Cricket','sport'],
      ['17:00','17:15','Open time','open'],
      ['17:15','17:45','Olympiad practice — English','stem'],
      ['17:45','18:00','Open time','open'],
      ['18:00','19:00','Strength & Conditioning','sport'],
      ['19:00','19:45','Play time','open'],
      ['19:45','20:00','Shower & wind down','meal'],
      ['20:00','20:30','Dinner','meal'],
      ['20:30','06:30','Sleep','sleep']
    ],
    Friday: [
      ['06:30','07:05','Wake & morning routine','meal'],
      ['07:05','15:20','School','school'],
      ['15:20','15:45','Snack & unwind','meal'],
      ['15:45','16:15','Olympiad practice — Science','stem'],
      ['16:15','16:20','Open time','open'],
      ['16:20','16:50','Ukulele practice','arts'],
      ['16:50','17:00','Open time','open'],
      ['17:00','18:30','Build time','build'],
      ['18:30','20:00','Play time','open'],
      ['20:00','20:30','Dinner','meal'],
      ['20:30','21:30','Pick your activity','pickyour'],
      ['21:30','22:00','Wind-down routine','meal'],
      ['22:00','07:00','Sleep','sleep']
    ],
    Saturday: [
      ['06:30','08:00','Wake, breakfast & morning routine','meal'],
      ['08:00','09:00','Swimming','sport'],
      ['09:00','09:30','Post-swim snack & rest','meal'],
      ['09:30','10:00','Open time','open'],
      ['10:00','10:30','Olympiad practice — English','stem'],
      ['10:30','11:00','Open time','open'],
      ['11:00','12:00','Robotics','stem'],
      ['12:00','13:30','Pick your activity','pickyour'],
      ['13:30','14:00','Lunch','meal'],
      ['14:00','16:30','Open time','open'],
      ['16:30','17:30','Ukulele class','arts'],
      ['17:30','18:00','Open time','open'],
      ['18:00','19:00','Strength & Conditioning','sport'],
      ['19:00','20:00','Open time','open'],
      ['20:00','21:30','Movie time','open'],
      ['21:30','22:00','Wind-down routine','meal'],
      ['22:00','07:00','Sleep','sleep']
    ],
    Sunday: [
      ['06:30','08:00','Wake, breakfast & morning routine','meal'],
      ['08:00','09:00','Swimming','sport'],
      ['09:00','10:00','Open time','open'],
      ['10:00','10:30','Olympiad practice — choose your subject','stem'],
      ['10:30','19:30','Open time','open'],
      ['19:30','20:00','Wind down & shower','meal'],
      ['20:00','20:30','Dinner','meal'],
      ['20:30','06:00','Sleep','sleep']
    ]
  };
  function isFillableBlock(cat) { return cat === 'open' || cat === 'pickyour' || cat === 'build'; }
  function fmtTime(hhmm) {
    var parts = hhmm.split(':'); var h = parseInt(parts[0], 10), m = parts[1];
    var ap = h < 12 ? 'AM' : 'PM'; var h12 = h % 12; if (h12 === 0) h12 = 12;
    return h12 + (m !== '00' ? ':' + m : '') + ' ' + ap;
  }

  // Checklist items that already have a named block in the day's timeline above —
  // matched by hand (safer than guessing from labels) so their time can be shown
  // right on the checklist instead of only in the full-day view.
  var ITEM_DEFAULT_TIMES = {
    Monday:    { olympiad:['15:45','16:15'], ukulele:['16:20','16:45'], football:['17:00','18:00'], dinner:['20:00','20:30'], sleep:['20:30','06:30'] },
    Tuesday:   { cricket:['16:00','17:00'], olympiad:['17:15','17:45'], sc:['18:00','19:00'], dinner:['20:00','20:30'], sleep:['20:30','06:30'] },
    Wednesday: { olympiad:['15:45','16:15'], ukulele:['16:20','16:45'], football:['17:00','18:00'], dinner:['20:00','20:30'], sleep:['20:30','06:30'] },
    Thursday:  { cricket:['16:00','17:00'], olympiad:['17:15','17:45'], sc:['18:00','19:00'], dinner:['20:00','20:30'], sleep:['20:30','06:30'] },
    Friday:    { olympiad:['15:45','16:15'], ukulele:['16:20','16:50'], dinner:['20:00','20:30'], sleep:['22:00','07:00'] },
    Saturday:  { swim:['08:00','09:00'], olympiad:['10:00','10:30'], robotics:['11:00','12:00'], ukuleleclass:['16:30','17:30'], sc:['18:00','19:00'], sleep:['22:00','07:00'] },
    Sunday:    { swim:['08:00','09:00'], olympiad:['10:00','10:30'], dinner:['20:00','20:30'], sleep:['20:30','06:00'] }
  };
  // Items with no fixed slot at all (feet/water/brush/writing): Moksh picks his own
  // time for these, per day — stored in extras.itemTimes, never hardcoded here.

  var ENCOURAGEMENTS = [
    "Nice one!", "That's one more done.", "Great focus.", "Good going.",
    "Nicely done.", "That counts — well done.", "Solid work."
  ];

  // Values-based lines for growing into a good, strong person — not attributed to
  // anyone in particular, just steady reminders. Rotates once per day.
  var QUOTES = [
    "Never give up.",
    "Try, try, until you succeed.",
    "Be kind.",
    "Mistakes help you grow.",
    "Small steps still move you forward.",
    "Kind words cost nothing and mean everything.",
    "Courage is doing it even when you're scared.",
    "A good teammate lifts others up.",
    "Curiosity is your superpower.",
    "Say sorry, then do better.",
    "Practice makes progress, not perfect.",
    "Helping someone is never a waste of time.",
    "Listen more than you speak.",
    "Be proud of your effort, not just the result.",
    "Every expert was once a beginner.",
    "Gratitude turns what you have into enough.",
    "Patience is a quiet kind of strong.",
    "Stand up for what's right, even when it's hard.",
    "Your best today is enough.",
    "Great things take time — keep going.",
    "Be honest, even when it's difficult.",
    "Compare yourself only to who you were yesterday.",
    "A calm mind solves problems better.",
    "Fall down seven times, stand up eight."
  ];
  function todaysQuote() {
    var start = new Date(today.getFullYear(), 0, 0);
    var dayOfYear = Math.floor((today - start) / 86400000);
    return QUOTES[dayOfYear % QUOTES.length];
  }

  // Mission-themed rank, based on total missions ever completed — a slow-building
  // sense of progress, no currency, nothing to lose.
  var RANKS = [
    { min: 0,   title: 'Cadet' },
    { min: 10,  title: 'Explorer' },
    { min: 25,  title: 'Pilot' },
    { min: 50,  title: 'Navigator' },
    { min: 100, title: 'Commander' },
    { min: 200, title: 'Mission Chief' }
  ];
  function computeRank(totalDone) {
    var current = RANKS[0], next = RANKS[1];
    for (var i = 0; i < RANKS.length; i++) {
      if (totalDone >= RANKS[i].min) current = RANKS[i];
      if (totalDone < RANKS[i].min) { next = RANKS[i]; break; }
      next = null;
    }
    return { title: current.title, next: next };
  }

  // ---------------- date helpers ----------------
  function pad(n) { return String(n).padStart(2, '0'); }
  function dateKey(d) { return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()); }
  function addDays(d, n) { var r = new Date(d); r.setDate(r.getDate() + n); return r; }
  function startOfDay(d) { var r = new Date(d); r.setHours(0,0,0,0); return r; }
  function mondayOf(d) {
    var r = startOfDay(d);
    var dow = r.getDay();
    var diff = (dow === 0) ? -6 : 1 - dow;
    return addDays(r, diff);
  }
  function fmtDay(d) { return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }); }
  function dayNameOf(d) { return DAY_NAMES[(d.getDay() + 6) % 7]; }

  // ---------------- state ----------------
  // Each completion is { submitted, approved }. Moksh taps an item to submit it;
  // it only counts toward streak/rank/progress once Mom approves it in Parent
  // Review. Older saved data stored a plain "true" for a finished item — treat
  // that as already submitted-and-approved so nothing already done gets undone.
  function normalizeCompletions(raw) {
    var out = {};
    Object.keys(raw || {}).forEach(function (k) {
      var v = raw[k];
      if (v === true) { out[k] = { submitted: true, approved: true }; }
      else if (v && typeof v === 'object') { out[k] = v; }
    });
    return out;
  }

  // extras.itemTimes: "<dateKey>|<itemId>" -> "HH:MM" Moksh picked for an item with
  // no fixed slot. extras.customPlans: "<dateKey>|<blockIndex>" -> [{id,label}, ...]
  // his own entries added into an Open/Pick-your-activity/Build-time block.
  function normalizeExtras(raw) {
    var r = (raw && typeof raw === 'object') ? raw : {};
    return {
      itemTimes: (r.itemTimes && typeof r.itemTimes === 'object') ? r.itemTimes : {},
      customPlans: (r.customPlans && typeof r.customPlans === 'object') ? r.customPlans : {}
    };
  }

  var STATE = { completions: {}, rewards: { balance: 0, ledger: [] }, extras: { itemTimes: {}, customPlans: {} } };
  var stateLoaded = false;
  var loadError = null;

  function defaultTimeFor(dayName, itemId) {
    var byDay = ITEM_DEFAULT_TIMES[dayName];
    return (byDay && byDay[itemId]) ? byDay[itemId] : null;
  }
  function pickedTimeFor(dateKeyStr, itemId) {
    return STATE.extras.itemTimes[dateKeyStr + '|' + itemId] || null;
  }
  function setPickedTime(dateKeyStr, itemId, hhmm) {
    var next = Object.assign({}, STATE, { extras: Object.assign({}, STATE.extras, {
      itemTimes: Object.assign({}, STATE.extras.itemTimes)
    }) });
    if (hhmm) next.extras.itemTimes[dateKeyStr + '|' + itemId] = hhmm;
    else delete next.extras.itemTimes[dateKeyStr + '|' + itemId];
    STATE = next;
  }
  function customPlansFor(dateKeyStr, blockIndex) {
    return STATE.extras.customPlans[dateKeyStr + '|' + blockIndex] || [];
  }
  function addCustomPlan(dateKeyStr, blockIndex, label) {
    var next = Object.assign({}, STATE, { extras: Object.assign({}, STATE.extras, {
      customPlans: Object.assign({}, STATE.extras.customPlans)
    }) });
    var listKey = dateKeyStr + '|' + blockIndex;
    var list = (next.extras.customPlans[listKey] || []).concat([{ id: genId(), label: label }]);
    next.extras.customPlans[listKey] = list;
    STATE = next;
  }
  function removeCustomPlan(dateKeyStr, blockIndex, planId) {
    var next = Object.assign({}, STATE, { extras: Object.assign({}, STATE.extras, {
      customPlans: Object.assign({}, STATE.extras.customPlans)
    }) });
    var listKey = dateKeyStr + '|' + blockIndex;
    next.extras.customPlans[listKey] = (next.extras.customPlans[listKey] || []).filter(function (p) { return p.id !== planId; });
    STATE = next;
  }

  function isSubmitted(key) { var c = STATE.completions[key]; return !!(c && c.submitted); }
  function isDone(key) { var c = STATE.completions[key]; return !!(c && c.approved); }
  function submitItem(key) {
    var next = Object.assign({}, STATE, { completions: Object.assign({}, STATE.completions) });
    next.completions[key] = { submitted: true, approved: false };
    STATE = next;
  }
  function unsubmitItem(key) {
    var next = Object.assign({}, STATE, { completions: Object.assign({}, STATE.completions) });
    delete next.completions[key];
    STATE = next;
  }
  function approveItem(key) {
    var next = Object.assign({}, STATE, { completions: Object.assign({}, STATE.completions) });
    var cur = next.completions[key];
    if (cur) next.completions[key] = Object.assign({}, cur, { approved: true });
    STATE = next;
  }
  // Undo an approval made by mistake — drops it back to "waiting for Mom" rather
  // than erasing that Moksh did it, so it just needs approving again.
  function unapproveItem(key) {
    var next = Object.assign({}, STATE, { completions: Object.assign({}, STATE.completions) });
    var cur = next.completions[key];
    if (cur) next.completions[key] = Object.assign({}, cur, { approved: false });
    STATE = next;
  }

  function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function addReward(amount, note, dateLabel) {
    var next = Object.assign({}, STATE, { rewards: {
      balance: STATE.rewards.balance + amount,
      ledger: [{ id: genId(), type: 'add', amount: amount, note: note, dateLabel: dateLabel }].concat(STATE.rewards.ledger)
    } });
    STATE = next;
  }
  function spendReward(amount, note, dateLabel) {
    var next = Object.assign({}, STATE, { rewards: {
      balance: Math.max(0, STATE.rewards.balance - amount),
      ledger: [{ id: genId(), type: 'spend', amount: amount, note: note, dateLabel: dateLabel }].concat(STATE.rewards.ledger)
    } });
    STATE = next;
  }

  var today = startOfDay(new Date());
  var monday = mondayOf(today);
  var weekDates = [0,1,2,3,4,5,6].map(function (i) { return addDays(monday, i); });
  var selectedDayKey = null; // UI-only, not persisted
  var rewardFormOpen = null; // 'add' | 'spend' | null — UI-only, not persisted
  var timeEditorKey = null; // "<dateKey>|<itemId>" of the item whose time picker is open, or null
  var drawerOpen = false; // full-day timeline side panel — UI-only
  var drawerDayKey = null; // dateKey being viewed in the drawer; set to today's when opened
  var planFormBlock = null; // "<dateKey>|<blockIndex>" whose "add your own" form is open, or null

  var lastMessage = null; // UI-only, not persisted — survives one renderApp() pass, then clears itself
  var msgTimer = null;
  function setFlash(text) {
    lastMessage = text;
    clearTimeout(msgTimer);
    msgTimer = setTimeout(function () { lastMessage = null; renderApp(); }, 2200);
  }

  function computeStreak() {
    var streak = 0;
    for (var i = 0; i < 60; i++) {
      var d = addDays(today, -i);
      var items = itemsFor(dayNameOf(d));
      var key = dateKey(d);
      var allDone = items.every(function (it) { return isDone(key + '|' + it.id); });
      if (allDone) streak++; else break;
    }
    return streak;
  }

  // An item either has a fixed default time (from the day's timeline), a time
  // Moksh picked himself, or neither — in which case it's untimed and shows up
  // in the "finish before free time" reminder at the top of Today.
  function timeInfoFor(dName, dKeyStr, itemId) {
    var def = defaultTimeFor(dName, itemId);
    if (def) return { label: fmtTime(def[0]), editable: false };
    var picked = pickedTimeFor(dKeyStr, itemId);
    if (picked) return { label: fmtTime24to12(picked), editable: true, raw: picked };
    return null;
  }
  function fmtTime24to12(hhmm) { return fmtTime(hhmm); }

  function renderItemRow(d, item, allowToggle) {
    var dName = dayNameOf(d);
    var dKeyStr = dateKey(d);
    var key = dKeyStr + '|' + item.id;
    var done = isDone(key);
    var submitted = isSubmitted(key);

    var row = document.createElement('div');
    row.className = 'item-row' + (done ? ' done' : (submitted ? ' pending' : ''));

    var toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'item-toggle';
    toggle.innerHTML =
      '<span class="box"><svg viewBox="0 0 16 16"><path d="M3 8.5l3 3 7-7"/></svg></span>' +
      '<span class="dot cat-' + item.cat + '"></span>' +
      '<span class="item-label"></span>';
    toggle.querySelector('.item-label').textContent = item.label;
    if (done) {
      toggle.addEventListener('click', function () {
        unapproveItem(key);
        setFlash('Approval undone — back to waiting for Mom.');
        persistAndRender();
      });
    } else if (allowToggle) {
      toggle.addEventListener('click', function () {
        if (submitted) {
          unsubmitItem(key);
        } else {
          submitItem(key);
          setFlash(ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)] + ' Sent to Mom to check.');
        }
        persistAndRender();
      });
    } else {
      toggle.disabled = true;
    }
    row.appendChild(toggle);

    // ---- time chip / picker (only meaningful for today-and-earlier interactive rows) ----
    var info = timeInfoFor(dName, dKeyStr, item.id);
    var isEditingTime = timeEditorKey === key;
    if (isEditingTime) {
      var form = document.createElement('span');
      form.className = 'time-edit-form';
      form.innerHTML = '<input type="time" class="time-input"><button type="button" class="time-save">Save</button>';
      var input = form.querySelector('.time-input');
      if (info && info.raw) input.value = info.raw;
      form.querySelector('.time-save').addEventListener('click', function () {
        if (input.value) setPickedTime(dKeyStr, item.id, input.value);
        timeEditorKey = null;
        persistAndRender();
      });
      row.appendChild(form);
    } else if (info) {
      var chip = document.createElement(info.editable ? 'button' : 'span');
      chip.type = info.editable ? 'button' : undefined;
      chip.className = 'time-chip' + (info.editable ? ' time-chip-editable' : '');
      chip.textContent = info.label;
      if (info.editable) {
        chip.title = 'Tap to change the time';
        chip.addEventListener('click', function () { timeEditorKey = key; renderApp(); });
      }
      row.appendChild(chip);
    } else if (allowToggle && !done) {
      var setBtn = document.createElement('button');
      setBtn.type = 'button';
      setBtn.className = 'time-set-btn';
      setBtn.textContent = 'Set time';
      setBtn.addEventListener('click', function () { timeEditorKey = key; renderApp(); });
      row.appendChild(setBtn);
    }

    if (submitted && !done) {
      var pb = document.createElement('span');
      pb.className = 'pending-badge';
      pb.textContent = 'Waiting for Mom';
      row.appendChild(pb);
    }
    if (done) {
      var db = document.createElement('span');
      db.className = 'done-badge';
      db.textContent = 'Tap to undo';
      row.appendChild(db);
    }
    return row;
  }

  // Renders a day's items grouped under "Main" and "Good to do" headers.
  function renderItemGroup(container, d, items, allowToggle) {
    var mainItems = items.filter(function (it) { return it.tier === 'main'; });
    var goodItems = items.filter(function (it) { return it.tier !== 'main'; });
    if (mainItems.length) {
      var mainLabel = document.createElement('div');
      mainLabel.className = 'tier-label';
      mainLabel.textContent = 'Main';
      container.appendChild(mainLabel);
      mainItems.forEach(function (item) { container.appendChild(renderItemRow(d, item, allowToggle)); });
    }
    if (goodItems.length) {
      var goodLabel = document.createElement('div');
      goodLabel.className = 'tier-label';
      goodLabel.textContent = 'Good to do';
      container.appendChild(goodLabel);
      goodItems.forEach(function (item) { container.appendChild(renderItemRow(d, item, allowToggle)); });
    }
  }

  // The hamburger + full-day timeline drawer — a prominent, always-available way
  // to see the whole day (fixed times + open blocks) without leaving Mission Log.
  function renderDrawer(app) {
    var hamburger = document.createElement('button');
    hamburger.type = 'button';
    hamburger.className = 'hamburger-btn';
    hamburger.setAttribute('aria-label', 'Open full day plan');
    hamburger.innerHTML = '<span></span><span></span><span></span>';
    hamburger.addEventListener('click', function () {
      drawerOpen = true;
      if (!drawerDayKey) drawerDayKey = dateKey(today);
      renderApp();
    });
    app.appendChild(hamburger);

    if (!drawerOpen) return;

    var overlay = document.createElement('div');
    overlay.className = 'drawer-overlay';
    overlay.addEventListener('click', function () { drawerOpen = false; renderApp(); });
    app.appendChild(overlay);

    var panel = document.createElement('div');
    panel.className = 'drawer-panel';

    var head = document.createElement('div');
    head.className = 'drawer-head';
    head.innerHTML = '<span class="drawer-title">Full Day Plan</span><button type="button" class="drawer-close" aria-label="Close">✕</button>';
    head.querySelector('.drawer-close').addEventListener('click', function () { drawerOpen = false; renderApp(); });
    panel.appendChild(head);

    var tabs = document.createElement('div');
    tabs.className = 'drawer-tabs';
    weekDates.forEach(function (d) {
      var dKeyStr = dateKey(d);
      var tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'drawer-tab' + (dKeyStr === drawerDayKey ? ' is-active' : '') + (dKeyStr === dateKey(today) ? ' is-today' : '');
      tab.textContent = dayNameOf(d).slice(0, 3);
      tab.addEventListener('click', function () { drawerDayKey = dKeyStr; renderApp(); });
      tabs.appendChild(tab);
    });
    panel.appendChild(tabs);

    var selDate = weekDates.filter(function (d) { return dateKey(d) === drawerDayKey; })[0] || today;
    var selDayName = dayNameOf(selDate);
    var selDKey = dateKey(selDate);

    var timeline = document.createElement('div');
    timeline.className = 'drawer-timeline';
    TIME_BLOCKS[selDayName].forEach(function (block, blockIndex) {
      var start = block[0], end = block[1], label = block[2], cat = block[3];
      var row = document.createElement('div');
      row.className = 'timeline-block cat-' + cat;
      row.innerHTML =
        '<div class="timeline-time">' + fmtTime(start) + ' – ' + fmtTime(end) + '</div>' +
        '<div class="timeline-label"></div>';
      row.querySelector('.timeline-label').textContent = label;

      if (isFillableBlock(cat)) {
        var plans = customPlansFor(selDKey, blockIndex);
        if (plans.length) {
          var planList = document.createElement('div');
          planList.className = 'timeline-plans';
          plans.forEach(function (p) {
            var chip = document.createElement('span');
            chip.className = 'plan-chip';
            chip.innerHTML = '<span class="plan-chip-label"></span><button type="button" class="plan-chip-remove" aria-label="Remove">✕</button>';
            chip.querySelector('.plan-chip-label').textContent = p.label;
            chip.querySelector('.plan-chip-remove').addEventListener('click', function () {
              removeCustomPlan(selDKey, blockIndex, p.id);
              persistAndRender();
            });
            planList.appendChild(chip);
          });
          row.appendChild(planList);
        }

        var formKey = selDKey + '|' + blockIndex;
        if (planFormBlock === formKey) {
          var form = document.createElement('div');
          form.className = 'plan-add-form';
          form.innerHTML = '<input type="text" class="plan-input" placeholder="What will he do?" maxlength="60"><button type="button" class="plan-save">Add</button>';
          var input = form.querySelector('.plan-input');
          form.querySelector('.plan-save').addEventListener('click', function () {
            var label = input.value.trim();
            if (!label) { input.focus(); return; }
            addCustomPlan(selDKey, blockIndex, label);
            planFormBlock = null;
            persistAndRender();
          });
          row.appendChild(form);
        } else {
          var addBtn = document.createElement('button');
          addBtn.type = 'button';
          addBtn.className = 'plan-add-btn';
          addBtn.textContent = '+ Add his own plan';
          addBtn.addEventListener('click', function () { planFormBlock = formKey; renderApp(); });
          row.appendChild(addBtn);
        }
      }

      timeline.appendChild(row);
    });
    panel.appendChild(timeline);

    app.appendChild(panel);
  }

  function renderApp() {
    var app = document.getElementById('app');
    app.innerHTML = '';

    if (!configOk) {
      var cfgMsg = document.createElement('div');
      cfgMsg.className = 'load-state is-error';
      cfgMsg.textContent = 'config.js needs your Supabase URL and anon key filled in before this will work.';
      app.appendChild(cfgMsg);
      return;
    }
    if (loadError) {
      var errMsg = document.createElement('div');
      errMsg.className = 'load-state is-error';
      errMsg.textContent = 'Could not load data from Supabase: ' + loadError;
      app.appendChild(errMsg);
      return;
    }
    if (!stateLoaded) {
      var loadMsg = document.createElement('div');
      loadMsg.className = 'load-state';
      loadMsg.textContent = 'Loading Mission Log…';
      app.appendChild(loadMsg);
      return;
    }

    renderDrawer(app);

    var masthead = document.createElement('div');
    masthead.className = 'masthead';
    var streak = computeStreak();
    var totalDone = Object.keys(STATE.completions).filter(function (k) { return isDone(k); }).length;
    var rank = computeRank(totalDone);
    masthead.innerHTML =
      '<div class="brand-row">' +
        '<svg class="emblem" width="46" height="52" viewBox="0 0 46 52" fill="none">' +
          '<path d="M23 1 L44 8 V24 C44 38 35 47 23 51 C11 47 2 38 2 24 V8 Z" fill="var(--hero-gold)" stroke="var(--hero-navy)" stroke-width="2.5"/>' +
          '<path d="M23 10 L27 20 H38 L29 27 L32.5 38 L23 31 L13.5 38 L17 27 L8 20 H19 Z" fill="var(--hero-navy)"/>' +
        '</svg>' +
        '<div>' +
          '<p class="eyebrow">Mission Log</p>' +
          '<h1>Today’s Missions</h1>' +
          '<p class="date-line">' + fmtDay(today) + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="streak-tile"><div class="streak-value">' + streak + '</div>ALL-DONE STREAK' +
        '<div class="rank-line"><span class="rank-title">' + rank.title + '</span>' +
        (rank.next ? '<span class="rank-next">' + (rank.next.min - totalDone) + ' to ' + rank.next.title + '</span>' : '<span class="rank-next">top rank reached</span>') +
        '</div>' +
      '</div>';
    app.appendChild(masthead);

    var quoteCard = document.createElement('div');
    quoteCard.className = 'quote-card';
    quoteCard.innerHTML = '<p class="quote-eyebrow">Today\'s reminder</p><p class="quote-text"></p>';
    quoteCard.querySelector('.quote-text').textContent = todaysQuote();
    app.appendChild(quoteCard);

    var todayCard = document.createElement('div');
    todayCard.className = 'card';
    var todayName = dayNameOf(today);
    var todayItems = itemsFor(todayName);
    var todayKey = dateKey(today);
    var approvedCount = todayItems.filter(function (it) { return isDone(todayKey + '|' + it.id); }).length;
    var pendingTodayCount = todayItems.filter(function (it) { return isSubmitted(todayKey + '|' + it.id) && !isDone(todayKey + '|' + it.id); }).length;
    var todayPoints = todayItems.reduce(function (sum, it) { return isDone(todayKey + '|' + it.id) ? sum + pointsFor(it) : sum; }, 0);
    var todayPossible = todayItems.reduce(function (sum, it) { return sum + pointsFor(it); }, 0);
    var todaySub = approvedCount + ' of ' + todayItems.length + ' approved' +
      (pendingTodayCount ? ' · ' + pendingTodayCount + ' waiting for Mom' : '') +
      ' — tap to check off as you go.';
    todayCard.innerHTML =
      '<div class="card-head"><h2>Today</h2><span class="points-pill">' + todayPoints + ' / ' + todayPossible + ' pts</span></div>' +
      '<p class="sub">' + todaySub + '</p>' +
      '<div class="msg">' + (lastMessage || '') + '</div>';

    // Reminder: items with no fixed time and no time picked yet, still not done —
    // called out up top so they don't get lost until they're either timed or done.
    var untimed = todayItems.filter(function (it) {
      var k = todayKey + '|' + it.id;
      return !isDone(k) && !timeInfoFor(todayName, todayKey, it.id);
    });
    if (untimed.length) {
      var reminder = document.createElement('div');
      reminder.className = 'time-reminder';
      reminder.innerHTML = '<span class="time-reminder-mark">⏰ Finish before play time or bedtime</span>' +
        '<span class="time-reminder-list"></span>';
      reminder.querySelector('.time-reminder-list').textContent = untimed.map(function (it) { return it.label; }).join(' · ');
      todayCard.appendChild(reminder);
    }

    var todayList = document.createElement('div');
    renderItemGroup(todayList, today, todayItems, true);
    todayCard.appendChild(todayList);
    app.appendChild(todayCard);

    // Parent Review — items Moksh has checked off, waiting on Mom's OK. Scans the
    // whole current week so nothing gets lost if a review is missed for a day or two.
    var pendingReview = [];
    weekDates.forEach(function (d) {
      itemsFor(dayNameOf(d)).forEach(function (item) {
        var key = dateKey(d) + '|' + item.id;
        if (isSubmitted(key) && !isDone(key)) pendingReview.push({ d: d, item: item, key: key });
      });
    });
    var reviewCard = document.createElement('div');
    reviewCard.className = 'card review-card';
    reviewCard.innerHTML =
      '<h2>Parent Review</h2>' +
      '<p class="sub">' + (pendingReview.length
        ? pendingReview.length + ' item' + (pendingReview.length === 1 ? '' : 's') + ' waiting for your OK.'
        : 'Nothing waiting on you right now.') + '</p>';
    if (pendingReview.length === 0) {
      var emptyR = document.createElement('p');
      emptyR.className = 'empty-state';
      emptyR.textContent = 'Moksh will show up here as soon as he checks something off.';
      reviewCard.appendChild(emptyR);
    } else {
      var rList = document.createElement('div');
      pendingReview.forEach(function (p) {
        var row = document.createElement('button');
        row.type = 'button';
        row.className = 'item-row review-row';
        row.innerHTML =
          '<span class="dot cat-' + p.item.cat + '"></span>' +
          '<span class="item-label"></span>' +
          '<span class="approve-pill">Approve</span>';
        row.querySelector('.item-label').textContent = p.item.label + ' — ' + p.d.toLocaleDateString(undefined, { weekday: 'short' });
        row.addEventListener('click', function () {
          approveItem(p.key);
          persistAndRender();
        });
        rList.appendChild(row);
      });
      reviewCard.appendChild(rList);
    }
    app.appendChild(reviewCard);

    var pending = [];
    weekDates.forEach(function (d) {
      if (d >= today) return;
      itemsFor(dayNameOf(d)).forEach(function (item) {
        var key = dateKey(d) + '|' + item.id;
        if (!isSubmitted(key)) pending.push({ d: d, item: item });
      });
    });
    var catchupCard = document.createElement('div');
    catchupCard.className = 'card';
    catchupCard.innerHTML =
      '<h2>Catch Up</h2>' +
      '<p class="sub">Things from earlier this week Moksh hasn’t checked off yet.</p>';
    if (pending.length === 0) {
      var empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'Nothing pending — the week so far is all caught up.';
      catchupCard.appendChild(empty);
    } else {
      var list = document.createElement('div');
      pending.forEach(function (p) {
        var row = renderItemRow(p.d, p.item, true);
        var lbl = row.querySelector('.item-label');
        lbl.textContent = p.item.label + ' — ' + p.d.toLocaleDateString(undefined, { weekday: 'short' });
        list.appendChild(row);
      });
      catchupCard.appendChild(list);
    }
    app.appendChild(catchupCard);

    var weekCard = document.createElement('div');
    weekCard.className = 'card';
    weekCard.innerHTML = '<h2>This Week</h2><p class="sub">Tap a day to see what’s on it.</p>';
    var strip = document.createElement('div');
    strip.className = 'week-strip';
    weekDates.forEach(function (d) {
      var items = itemsFor(dayNameOf(d));
      var key = dateKey(d);
      var done = items.filter(function (it) { return isDone(key + '|' + it.id); }).length;
      var hasPending = items.some(function (it) { return isSubmitted(key + '|' + it.id) && !isDone(key + '|' + it.id); });
      var isToday = key === dateKey(today);
      var isFuture = d > today;
      var isOpen = key === selectedDayKey;
      var tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'week-tile' + (isToday ? ' is-today' : '') + (isFuture ? ' is-future' : '') + (isOpen ? ' is-open' : '');
      var pct = items.length ? Math.round((done / items.length) * 100) : 0;
      tile.innerHTML =
        (hasPending ? '<span class="pending-dot" title="Waiting for review"></span>' : '') +
        '<div class="week-day">' + dayNameOf(d).slice(0,3) + '</div>' +
        '<div class="week-frac">' + (isFuture ? '—' : (done + '/' + items.length)) + '</div>' +
        (isFuture ? '' : '<div class="bar"><div class="bar-fill" style="width:' + pct + '%"></div></div>');
      tile.addEventListener('click', function () {
        selectedDayKey = isOpen ? null : key;
        renderApp();
      });
      strip.appendChild(tile);
    });
    weekCard.appendChild(strip);

    if (selectedDayKey) {
      var selDate = weekDates.filter(function (d) { return dateKey(d) === selectedDayKey; })[0];
      var selItems = itemsFor(dayNameOf(selDate));
      var selInteractive = selDate <= today;
      var detail = document.createElement('div');
      detail.className = 'day-detail';
      detail.innerHTML =
        '<div class="day-detail-head">' +
          '<span class="day-detail-title">' + fmtDay(selDate) + '</span>' +
          '<a class="day-link" href="' + MISSION_WEEK_URL + '" target="_blank" rel="noopener">Full day plan ↗</a>' +
        '</div>';
      var selList = document.createElement('div');
      renderItemGroup(selList, selDate, selItems, selInteractive);
      detail.appendChild(selList);
      weekCard.appendChild(detail);
    }

    app.appendChild(weekCard);

    // progress: week-over-week
    var progressCard = document.createElement('div');
    progressCard.className = 'card';
    progressCard.innerHTML = '<h2>Progress</h2><p class="sub">Completion rate, week over week.</p>';
    var chart = document.createElement('div');
    chart.className = 'progress-chart';
    for (var w = 5; w >= 0; w--) {
      var wMonday = addDays(monday, -7 * w);
      var wDone = 0, wTotal = 0;
      for (var di = 0; di < 7; di++) {
        var wd = addDays(wMonday, di);
        if (wd > today) break; // don't count days that haven't happened yet
        var wItems = itemsFor(dayNameOf(wd));
        var wKey = dateKey(wd);
        wTotal += wItems.length;
        wDone += wItems.filter(function (it) { return isDone(wKey + '|' + it.id); }).length;
      }
      var wPct = wTotal ? Math.round((wDone / wTotal) * 100) : 0;
      var col = document.createElement('div');
      col.className = 'progress-col' + (w === 0 ? ' is-current' : '');
      col.innerHTML =
        '<div class="progress-pct">' + wPct + '%</div>' +
        '<div class="progress-bar-track"><div class="progress-bar" style="height:' + Math.max(wPct, 2) + '%"></div></div>' +
        '<div class="progress-label">' + (w === 0 ? 'This wk' : wMonday.toLocaleDateString(undefined, { month:'short', day:'numeric' })) + '</div>';
      chart.appendChild(col);
    }
    progressCard.appendChild(chart);
    app.appendChild(progressCard);

    // rewards: a running bonus-money balance, separate from mission points
    var rewards = STATE.rewards;
    var rewardsCard = document.createElement('div');
    rewardsCard.className = 'card rewards-card';
    rewardsCard.innerHTML =
      '<h2>Rewards</h2>' +
      '<p class="sub">Bonus money for great behaviour, discipline, and sticking to the day plan.</p>' +
      '<div class="balance-row">' +
        '<div class="balance-amount">₹' + rewards.balance.toLocaleString('en-IN') + '</div>' +
        '<div class="balance-actions">' +
          '<button type="button" class="reward-btn reward-btn-add">+ Add</button>' +
          '<button type="button" class="reward-btn reward-btn-spend">− Spend</button>' +
        '</div>' +
      '</div>';

    if (rewardFormOpen) {
      var rForm = document.createElement('div');
      rForm.className = 'reward-form';
      rForm.innerHTML =
        '<input type="number" min="1" step="1" inputmode="numeric" placeholder="Amount (₹)" class="reward-amount">' +
        '<input type="text" placeholder="' + (rewardFormOpen === 'add' ? 'What was it for? (optional)' : 'What did he get? (optional)') + '" class="reward-note">' +
        '<div class="reward-form-actions">' +
          '<button type="button" class="reward-save">' + (rewardFormOpen === 'add' ? 'Add' : 'Spend') + '</button>' +
          '<button type="button" class="reward-cancel">Cancel</button>' +
        '</div>';
      rewardsCard.appendChild(rForm);
      var rAmountInput = rForm.querySelector('.reward-amount');
      var rNoteInput = rForm.querySelector('.reward-note');
      rForm.querySelector('.reward-save').addEventListener('click', function () {
        var amt = parseInt(rAmountInput.value, 10);
        if (!amt || amt <= 0) { rAmountInput.focus(); return; }
        var label = today.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        if (rewardFormOpen === 'add') addReward(amt, rNoteInput.value.trim(), label);
        else spendReward(amt, rNoteInput.value.trim(), label);
        rewardFormOpen = null;
        persistAndRender();
      });
      rForm.querySelector('.reward-cancel').addEventListener('click', function () {
        rewardFormOpen = null;
        renderApp();
      });
    }

    rewardsCard.querySelector('.reward-btn-add').addEventListener('click', function () {
      rewardFormOpen = (rewardFormOpen === 'add') ? null : 'add';
      renderApp();
    });
    rewardsCard.querySelector('.reward-btn-spend').addEventListener('click', function () {
      rewardFormOpen = (rewardFormOpen === 'spend') ? null : 'spend';
      renderApp();
    });

    if (rewards.ledger.length) {
      var ledgerWrap = document.createElement('div');
      ledgerWrap.className = 'reward-ledger';
      rewards.ledger.slice(0, 8).forEach(function (entry) {
        var row = document.createElement('div');
        row.className = 'reward-entry';
        var sign = entry.type === 'add' ? '+' : '−';
        row.innerHTML =
          '<span class="reward-entry-note"></span>' +
          '<span class="reward-entry-amount ' + (entry.type === 'add' ? 'is-add' : 'is-spend') + '">' + sign + '₹' + entry.amount.toLocaleString('en-IN') + '</span>';
        var noteText = (entry.note ? entry.note : (entry.type === 'add' ? 'Bonus' : 'Spent')) + ' · ' + entry.dateLabel;
        row.querySelector('.reward-entry-note').textContent = noteText;
        ledgerWrap.appendChild(row);
      });
      rewardsCard.appendChild(ledgerWrap);
    } else {
      var emptyLedger = document.createElement('p');
      emptyLedger.className = 'empty-state';
      emptyLedger.textContent = 'No entries yet.';
      rewardsCard.appendChild(emptyLedger);
    }

    app.appendChild(rewardsCard);

    var foot = document.createElement('footer');
    foot.textContent = 'Checks off here save automatically. Mom gives the final OK in Parent Review.';
    app.appendChild(foot);
  }

  // ---------------- persistence (Supabase) ----------------
  var ROW_ID = 'default';
  var applyingRemote = false;

  function loadState() {
    return supabaseClient
      .from('mission_log')
      .select('completions, rewards, extras')
      .eq('id', ROW_ID)
      .single()
      .then(function (res) {
        if (res.error) throw res.error;
        STATE = {
          completions: normalizeCompletions(res.data.completions),
          rewards: (res.data.rewards && typeof res.data.rewards === 'object')
            ? { balance: res.data.rewards.balance || 0, ledger: res.data.rewards.ledger || [] }
            : { balance: 2500, ledger: [] },
          extras: normalizeExtras(res.data.extras)
        };
        stateLoaded = true;
        renderApp();
        subscribeRealtime();
      })
      .catch(function (err) {
        loadError = (err && err.message) ? err.message : String(err);
        renderApp();
      });
  }

  function subscribeRealtime() {
    supabaseClient
      .channel('mission_log_changes')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'mission_log', filter: 'id=eq.' + ROW_ID },
        function (payload) {
          if (applyingRemote) return; // ignore the echo of our own write
          var row = payload.new;
          STATE = {
            completions: normalizeCompletions(row.completions),
            rewards: (row.rewards && typeof row.rewards === 'object')
              ? { balance: row.rewards.balance || 0, ledger: row.rewards.ledger || [] }
              : STATE.rewards,
            extras: (row.extras && typeof row.extras === 'object') ? normalizeExtras(row.extras) : STATE.extras
          };
          renderApp();
        })
      .subscribe();
  }

  var pendingSave = false;
  var saveAgain = false;
  function persistAndRender() {
    renderApp();
    saveState();
  }
  function saveState() {
    if (pendingSave) { saveAgain = true; return; }
    pendingSave = true;
    applyingRemote = true;
    supabaseClient
      .from('mission_log')
      .update({ completions: STATE.completions, rewards: STATE.rewards, extras: STATE.extras, updated_at: new Date().toISOString() })
      .eq('id', ROW_ID)
      .then(function (res) {
        if (res.error) console.error('Save failed:', res.error);
      })
      .catch(function (err) { console.error('Save failed:', err); })
      .then(function () {
        pendingSave = false;
        setTimeout(function () { applyingRemote = false; }, 400);
        if (saveAgain) { saveAgain = false; saveState(); }
      });
  }

  renderApp();
  if (configOk) {
    loadState();
  }
})();
