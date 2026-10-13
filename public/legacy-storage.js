// Carries preferences saved under the app's earlier name (`monocode.*` and
// `monocode:*` keys) over to `avenrail.*`. It runs synchronously from <head>,
// before any code reads storage, and is safe to run repeatedly: a value that
// already exists under the new name is never overwritten.
(function () {
  try {
    var store = window.localStorage;
    var legacy = [];
    for (var i = 0; i < store.length; i++) {
      var key = store.key(i);
      if (key && /^monocode[.:]/.test(key)) legacy.push(key);
    }
    legacy.forEach(function (key) {
      var next = "avenrail" + key.slice("monocode".length);
      if (store.getItem(next) === null) store.setItem(next, store.getItem(key));
      store.removeItem(key);
    });
  } catch (_) {}
})();
