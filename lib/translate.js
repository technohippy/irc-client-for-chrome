if (typeof(jQuery) != 'undefined') {
  // How to use: ${i18n.message_key}
  jQuery.i18nTmpl = function(tmplId, obj) {
    if (!obj) obj = {};
    var tmpl = $(tmplId).html();
    var i18n = {};
    while (tmpl.match(/\$\{i18n\.(.*?)\}((.|\n)*)/)) {
      var key = RegExp.$1;
      i18n[key] = chrome.i18n.getMessage(key);
      tmpl = RegExp.$2;
    }
    if (obj) {
      if (obj.length) {
        for (var i = 0; i < obj.length; i++) {
          obj[i]['i18n'] = i18n;
        }
      }
      else {
        obj['i18n'] = i18n;
      }
    }
    return $(tmplId).tmpl(obj);
  }
}

// How to use: <script>t('message_key')</script>
function translate(key) {
  document.write(chrome.i18n.getMessage(key));
}
var t = translate;

// How to use: <t>message_key</t>
(function() {
  function translateDocument() {
    function translateNode(node) {
      if (node.tagName == 'T' || node.tagName == 'TRANSLATE') {
        var translatedText = chrome.i18n.getMessage(node.innerHTML);
        if (translatedText) {
          node.parentNode.insertBefore(document.createTextNode(translatedText), node);
          node.parentNode.removeChild(node);
        }
      }
      else if (node.className && node.className.match(/.*\btranslate\b.*/)) {
        node.innerHTML = chrome.i18n.getMessage(node.innerHTML);
      }
      else {
        var children = node.childNodes;
        if (children) {
          for (var i = 0; i < children.length; i++) {
            translateNode(children[i]);
          }
        }
      }
    }
    translateNode(document.body);
  }
  window.addEventListener('load', translateDocument);
})();
