'use strict';
// Non-intrusive language suggestion. Both localized URLs remain directly accessible.
(() => {
  const current = document.documentElement.lang.toLowerCase().startsWith('fr') ? 'fr' : 'en';
  const storageKey = 'soundboardmaker-language-preference';

  function readChoice() {
    try {
      const value = window.localStorage.getItem(storageKey);
      return value === 'fr' || value === 'en' ? value : null;
    } catch (_) {
      return null;
    }
  }
  function saveChoice(language) {
    try { window.localStorage.setItem(storageKey, language); } catch (_) {}
  }

  // A manual click on the existing language switcher always wins.
  document.querySelectorAll('.language-switch').forEach(link => {
    link.addEventListener('click', () => saveChoice(current === 'fr' ? 'en' : 'fr'));
  });

  const languages = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en'];
  const browserLanguage = String(languages[0] || 'en').split('-')[0].toLowerCase();
  const desired = readChoice() || (browserLanguage === 'fr' ? 'fr' : 'en');
  if (desired === current) return;

  const frenchPage = current === 'fr';
  const content = frenchPage
    ? {
        heading: 'English version available',
        message: 'Your browser is set to another language. Would you prefer to view this website in English?',
        stay: 'Stay in French',
        switchTo: 'View in English',
        accessible: 'Language suggestion'
      }
    : {
        heading: 'Version française disponible',
        message: 'Votre navigateur est configuré en français. Préférez-vous consulter le site en français ?',
        stay: 'Rester en anglais',
        switchTo: 'Voir en français',
        accessible: 'Suggestion de langue'
      };

  const suggestion = document.createElement('aside');
  suggestion.className = 'language-prompt';
  suggestion.setAttribute('aria-label', content.accessible);

  const heading = document.createElement('strong');
  heading.className = 'language-prompt__title';
  heading.textContent = content.heading;

  const description = document.createElement('p');
  description.className = 'language-prompt__description';
  description.textContent = content.message;

  const actions = document.createElement('div');
  actions.className = 'language-prompt__actions';

  const stay = document.createElement('button');
  stay.type = 'button';
  stay.className = 'language-prompt__stay';
  stay.textContent = content.stay;
  stay.addEventListener('click', () => {
    saveChoice(current);
    suggestion.remove();
  });

  const switchTo = document.createElement('a');
  switchTo.className = 'language-prompt__switch';
  switchTo.href = desired === 'fr' ? '/' : '/en/';
  switchTo.textContent = content.switchTo;
  switchTo.addEventListener('click', () => saveChoice(desired));

  actions.append(stay, switchTo);
  suggestion.append(heading, description, actions);
  document.body.appendChild(suggestion);
})();
