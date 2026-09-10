/**
 * رَواء — مخزن الحالة المشترك (localStorage)
 * يربط بيانات المستخدم (الوزن، الهدف اليومي، سجل الشرب، الإعدادات)
 * بين كل صفحات الموقع الخمس.
 */
window.RawaaStore = (function () {
  var KEY = 'rawaa_state_v1';

  var defaults = {
    gender: 'male',
    weight: 70,
    height: 170,
    age: 30,
    activityMultiplier: 1.0,
    climateAddMl: 0,
    caffeineAdd: false,
    maternityAdd: false,
    fastingMode: false,
    targetMl: 2600,
    cupSizeMl: 250,
    consumedCups: 0,
    logs: [],           // { id, time(ISO), label, amountMl }
    autoDistribute: true,
    units: 'metric',     // metric | imperial
    updatedAt: null
  };

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return Object.assign({}, defaults);
      var parsed = JSON.parse(raw);
      return Object.assign({}, defaults, parsed);
    } catch (e) {
      return Object.assign({}, defaults);
    }
  }

  function save(state) {
    try {
      state.updatedAt = new Date().toISOString();
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      // التخزين غير متاح (وضع خاص/متصفح قديم) - نتجاهل بصمت
    }
    return state;
  }

  function get() {
    return load();
  }

  function set(partial) {
    var current = load();
    var next = Object.assign({}, current, partial);
    return save(next);
  }

  function addLog(entry) {
    var current = load();
    var logs = current.logs || [];
    var newEntry = Object.assign({
      id: Date.now(),
      time: new Date().toISOString()
    }, entry);
    logs.unshift(newEntry);
    current.logs = logs.slice(0, 200);
    save(current);
    return newEntry;
  }

  function isToday(isoTime) {
    var d = new Date(isoTime);
    var now = new Date();
    return d.toDateString() === now.toDateString();
  }

  function todayLogs() {
    var current = load();
    return (current.logs || []).filter(function (l) {
      return isToday(l.time);
    });
  }

  function todayConsumedMl() {
    return todayLogs().reduce(function (sum, l) {
      return sum + (l.amountMl || 0);
    }, 0);
  }

  function exportReport() {
    var current = load();
    var blob = new Blob([JSON.stringify(current, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'rawaa-report-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return {
    get: get,
    set: set,
    addLog: addLog,
    todayLogs: todayLogs,
    todayConsumedMl: todayConsumedMl,
    exportReport: exportReport,
    defaults: defaults
  };
})();
