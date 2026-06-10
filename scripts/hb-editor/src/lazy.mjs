// Defers a demo mount until its element approaches the viewport, so a
// below-the-fold demo costs nothing (wasm, fonts, GL context) for readers
// who never scroll to it.
export function mountWhenVisible(el, mount) {
  const io = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        io.disconnect();
        mount();
      }
    },
    { rootMargin: '400px' },
  );
  io.observe(el);
}
