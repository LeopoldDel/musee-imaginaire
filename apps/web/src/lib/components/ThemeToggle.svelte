<script lang="ts">
  import { onMount } from 'svelte';
  import type { Theme } from '#lib/config.ts';
  import { t } from '#lib/i18n/index.ts';

  let theme = $state<Theme>('musee');

  onMount(() => {
    theme = document.documentElement.getAttribute('data-theme') === 'nuit' ? 'nuit' : 'musee';
  });

  function toggle() {
    theme = theme === 'nuit' ? 'musee' : 'nuit';
    if (theme === 'nuit') document.documentElement.setAttribute('data-theme', 'nuit');
    else document.documentElement.removeAttribute('data-theme');
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute('content', theme === 'nuit' ? '#0f0e0d' : '#f6f3ec');
    try {
      localStorage.setItem('theme', theme);
    } catch {
      /* stockage indisponible : le choix vaut pour cette visite seulement */
    }
  }
</script>

<button class="toggle" type="button" onclick={toggle} aria-pressed={theme === 'nuit'} title={t('theme.toggle')}>
  <span class="dot" aria-hidden="true"></span>
  <span>{theme === 'nuit' ? t('theme.nuit') : t('theme.musee')}</span>
</button>

<style>
  .toggle {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 2.75rem; /* cible tactile confortable */
    padding: 0 var(--space-4);
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--surface);
    font-size: 0.8125rem;
    cursor: pointer;
  }
  .dot {
    width: 0.85rem;
    height: 0.85rem;
    border-radius: 50%;
    background: linear-gradient(90deg, var(--ink) 50%, var(--surface-sunken) 50%);
    box-shadow: inset 0 0 0 1px var(--line);
  }
</style>
