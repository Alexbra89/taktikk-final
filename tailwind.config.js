/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ── FARGER ────────────────────────────────────────────────
      // KALK: verdiene ligger som RGB-kanaler i CSS-variabler i globals.css,
      // slik at kveld/dagslys byttes med data-theme på <html> uten nye klasser,
      // og slik at opasitet (bg-ink/5, bg-signal/10) fortsatt virker.
      colors: {
        // Flater – nøytral grafitt, stigende lyshet = stigende nærhet
        canvas: {
          DEFAULT: 'rgb(var(--k-canvas) / <alpha-value>)', // app-bakgrunn, lerret
          sunken:  'rgb(var(--k-sunken) / <alpha-value>)', // sidefelt, gruppeoverskrifter
          panel:   'rgb(var(--k-panel) / <alpha-value>)',  // inspektør, kort, modaler
          raised:  'rgb(var(--k-raised) / <alpha-value>)', // valgt rad, input, chips
          hover:   'rgb(var(--k-hover) / <alpha-value>)',
        },
        // Tekst og ikoner
        ink: {
          DEFAULT: 'rgb(var(--k-ink) / <alpha-value>)',
          muted:   'rgb(var(--k-ink-muted) / <alpha-value>)',
          subtle:  'rgb(var(--k-ink-subtle) / <alpha-value>)',
          faint:   'rgb(var(--k-ink-faint) / <alpha-value>)',
        },
        // Hårstreker. Faste alfaverdier per tema, derfor uten <alpha-value>.
        rule: {
          DEFAULT: 'var(--k-rule)',
          strong:  'var(--k-rule-strong)',
        },
        // Den ene aksenten: eget lag, primærhandling, «nå». Aldri pynt, aldri feil.
        signal: {
          DEFAULT: 'rgb(var(--k-signal) / <alpha-value>)',
          fg:      'rgb(var(--k-signal-fg) / <alpha-value>)', // tekst på signalflate
          soft:    'rgb(var(--k-signal) / 0.12)',
          line:    'rgb(var(--k-signal) / 0.45)',
          zone:    'rgb(var(--k-signal) / 0.06)',
        },
        // Banen: nesten svart (kveld) / lys kalkgrå (dagslys) med kalklinjer
        pitch: {
          DEFAULT: 'rgb(var(--k-pitch) / <alpha-value>)',
          line:    'var(--k-pitch-line)',
        },
        // Områdefarger (plattform): ikonflater i navigasjon og på dashbordet.
        area: {
          board:    'rgb(var(--k-area-board) / <alpha-value>)',
          training: 'rgb(var(--k-area-training) / <alpha-value>)',
          calendar: 'rgb(var(--k-area-calendar) / <alpha-value>)',
          drills:   'rgb(var(--k-area-drills) / <alpha-value>)',
          reports:  'rgb(var(--k-area-reports) / <alpha-value>)',
          ai:       'rgb(var(--k-area-ai) / <alpha-value>)',
        },
        // Kategori-identitet i Kalk: dempet, kun som 6px-prikker og tidslinjer
        category: {
          keeper:   '#D9A93E',
          forsvar:  '#6E93E6',
          midtbane: '#9A88F0',
          angrep:   '#E8834A',
          cardio:   '#D97599',
          styrke:   '#5BAE84',
        },

        // Status – eneste farger utenom signal. Leses, aldri trykkes.
        // Brukes av Badge, FilterChip, advarsler og lagringsfeil.
        ok:   { 300: '#6EE7B7', 400: '#34D399', 500: '#10B981' },
        warn: { 300: '#FCD34D', 400: '#FBBF24', 500: '#F59E0B' },
        bad:  { 300: '#FDA4AF', 400: '#FB7185', 500: '#F43F5E' },
      },

      // ── TYPOGRAFI ─────────────────────────────────────────────
      // Navngitt skala med innebygd linjehøyde/tracking/vekt.
      // Erstatter text-[12.5px]-stilen. Tailwinds egne xs/sm/base
      // står urørt slik at eksisterende skjermer ikke endres.
      // KALK: tre familier, alle selvhostet via next/font i layout.tsx.
      fontFamily: {
        // Schibsted Grotesk – alt grensesnitt. Tegnet for norsk redaksjonell presse.
        sans: ['var(--font-sans)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        // Instrument Serif – kun sidetitler og store øyeblikk.
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        // IBM Plex Mono – tall, tider, draktnumre, snarveier.
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        num: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        // KALK: serif-titler. Resten av Kalk bruker meta/caption/body/lead under.
        title: ['2.75rem', { lineHeight: '1',    letterSpacing: '-0.01em' }], // 44px sidetittel
        hero:  ['3.5rem',  { lineHeight: '0.95', letterSpacing: '-0.01em' }], // 56px «Tirsdag 22.»
        // FASE 1-skala
        label:   ['0.625rem',  { lineHeight: '0.875rem', letterSpacing: '0.09em', fontWeight: '700' }], // 10px, VERSALER
        meta:    ['0.6875rem', { lineHeight: '1rem',     letterSpacing: '0.01em' }],                    // 11px
        caption: ['0.75rem',   { lineHeight: '1.1rem' }],                                               // 12px
        body:    ['0.8125rem', { lineHeight: '1.3rem' }],                                               // 13px
        lead:    ['0.9375rem', { lineHeight: '1.5rem' }],                                               // 15px
        h4:      ['1rem',      { lineHeight: '1.35rem', letterSpacing: '-0.005em', fontWeight: '700' }],
        h3:      ['1.125rem',  { lineHeight: '1.45rem', letterSpacing: '-0.01em',  fontWeight: '700' }],
        h2:      ['1.375rem',  { lineHeight: '1.65rem', letterSpacing: '-0.02em',  fontWeight: '800' }],
        h1:      ['1.75rem',   { lineHeight: '2rem',    letterSpacing: '-0.025em', fontWeight: '800' }],
        display: ['2.25rem',   { lineHeight: '2.4rem',  letterSpacing: '-0.03em',  fontWeight: '800' }],
      },

      // ── FORM OG DYBDE ─────────────────────────────────────────
      borderRadius: {
        ctl:   '8px',  // KALK: knapper, input, segmenter
        panel: '12px', // KALK: verktøylinjer, kort, bane
        tile:  '16px', // plattform: dashbordkort og sidekort
        card: '1rem',
        pill: '9999px',
      },
      boxShadow: {
        // KALK: hårstrek som innfelt skygge, så den ikke påvirker layout
        hair:          'inset 0 0 0 1px var(--k-rule)',
        'hair-strong': 'inset 0 0 0 1px var(--k-rule-strong)',
        'hair-signal': 'inset 0 0 0 1px rgb(var(--k-signal) / 0.45)',
        pop:           'var(--k-shadow-pop)', // flytende verktøy, menyer, modaler
        tile:          'var(--k-shadow-card)', // plattform: kort på dashbord og sider
        // FASE 1
        card:      '0 1px 2px rgba(0,0,0,0.4)',
        raised:    '0 4px 16px -4px rgba(0,0,0,0.55)',
        float:     '0 18px 48px -12px rgba(0,0,0,0.75)',
        'glow-brand': '0 0 0 1px rgba(56,189,248,0.35), 0 6px 20px -6px rgba(56,189,248,0.4)',
        'inset-line': 'inset 0 1px 0 rgba(255,255,255,0.05)',
      },
      backgroundImage: {
        'brand-grad': 'linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)',
        'panel-grad': 'linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0) 60%)',
      },

      // ── BEVEGELSE ─────────────────────────────────────────────
      // Egne keyframes – appen har ingen animasjonsplugin installert.
      keyframes: {
        'fade-in':  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        rise:       { '0%': { opacity: '0', transform: 'translateY(8px)' },   '100%': { opacity: '1', transform: 'translateY(0)' } },
        'sheet-up': { '0%': { transform: 'translateY(100%)' },                '100%': { transform: 'translateY(0)' } },
        pop:        { '0%': { opacity: '0', transform: 'scale(0.96)' },       '100%': { opacity: '1', transform: 'scale(1)' } },
      },
      animation: {
        'fade-in':  'fade-in 0.18s ease-out both',
        rise:       'rise 0.24s cubic-bezier(0.2,0.8,0.3,1) both',
        'sheet-up': 'sheet-up 0.26s cubic-bezier(0.2,0.8,0.3,1) both',
        pop:        'pop 0.18s cubic-bezier(0.2,0.8,0.3,1) both',
      },
    },
  },
  plugins: [],
}
