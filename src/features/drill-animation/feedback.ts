// «Ser noe feil ut?» under en animert øvelse åpner en e-post med øvelsens
// navn ferdig utfylt. Bytt adressen her til den som skal motta meldingene.
export const FEEDBACK_EMAIL = 'post@example.com';

/** mailto-lenke med emne og tekst ferdig utfylt. */
export function feedbackMailto(drillName: string, phase: number, phaseCount: number, email = FEEDBACK_EMAIL): string {
  const subject = `Feil i animert øvelse: ${drillName}`;
  const body = `Øvelse: ${drillName}\nFase: ${phase} av ${phaseCount}\n\nDette ser feil ut:\n`;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
