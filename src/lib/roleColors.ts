export function getDutyColors(role: string): { bg: string; text: string; glow: string } {
  if (['keeper'].includes(role))
    return { bg:'rgba(26,58,92,0.85)',  text:'#7dd3fc', glow:'rgba(125,211,252,0.3)' };
  if (['defender','sweeper','libero'].includes(role))
    return { bg:'rgba(26,58,92,0.85)',  text:'#93c5fd', glow:'rgba(147,197,253,0.3)' };
  if (['wingback'].includes(role))
    return { bg:'rgba(22,58,42,0.85)',  text:'#6ee7b7', glow:'rgba(110,231,183,0.3)' };
  if (['midfielder','playmaker','box2box'].includes(role))
    return { bg:'rgba(30,42,26,0.85)',  text:'#86efac', glow:'rgba(134,239,172,0.3)' };
  if (['forward','targetman','pressforward','false9','trequartista'].includes(role))
    return { bg:'rgba(42,26,26,0.85)',  text:'#fca5a5', glow:'rgba(252,165,165,0.3)' };
  if (['winger'].includes(role))
    return { bg:'rgba(42,21,32,0.85)',  text:'#f9a8d4', glow:'rgba(249,168,212,0.3)' };
  return   { bg:'rgba(30,42,26,0.85)', text:'#86efac', glow:'rgba(134,239,172,0.3)' };
}
