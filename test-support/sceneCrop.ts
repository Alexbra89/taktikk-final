/** Central half of the pitch. BoardScene.layoutHud puts the phase pill at
 * top-left and the progress bar along the bottom; neither reaches this area.
 * Only pixels within this area are hashed, so changing overlays cannot hide stale scenes.
 */
export function sceneCrop(width: number, height: number) {
  return { x: Math.floor(width / 4), y: Math.floor(height / 4),
    width: Math.floor(width / 2), height: Math.floor(height / 2) };
}
