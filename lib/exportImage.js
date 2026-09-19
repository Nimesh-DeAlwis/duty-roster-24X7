import { toPng } from "html-to-image";

// html-to-image sizes its output canvas from the node's live layout box. If the
// node sits inside a horizontally-scrolled container (our roster tables do, on
// narrow screens or when Sunday is scrolled out of view) it can capture only
// the visible slice instead of the full width, producing a "half" image.
// Fix: reset any scrolled ancestor back to the start, wait a frame for layout
// to settle, then force explicit width/height from scrollWidth/scrollHeight.
export async function exportNodeAsPng(node, filename) {
  if (!node) return;

  const scrolledAncestors = [];
  let parent = node.parentElement;
  while (parent) {
    if (parent.scrollWidth > parent.clientWidth || parent.scrollLeft > 0) {
      scrolledAncestors.push([parent, parent.scrollLeft]);
      parent.scrollLeft = 0;
    }
    parent = parent.parentElement;
  }

  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  const width = node.scrollWidth;
  const height = node.scrollHeight;

  try {
    const dataUrl = await toPng(node, {
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      width,
      height,
      canvasWidth: width * 2,
      canvasHeight: height * 2,
      style: {
        width: `${width}px`,
        height: `${height}px`,
        transform: "none",
      },
    });

    const link = document.createElement("a");
    link.download = filename;
    link.href = dataUrl;
    link.click();
  } finally {
    scrolledAncestors.forEach(([el, left]) => { el.scrollLeft = left; });
  }
}
