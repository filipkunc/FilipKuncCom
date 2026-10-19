// Shared coordinates are in canvas points at 1440 x 900 (the HTML bar adds 44).
// Drive real egui input; assertions inspect the authored document via Save.
module.exports = function editorUi(page, click, press, settle) {
  const search = async name => {
    await click(80,128); await press('Control+a');
    await page.keyboard.type(name,{delay:20}); await settle();
    await press('Escape');
  };
  return {
    search,
    choose: async name => {
      await search(name);
      await click(110,250 + (name === 'Stone' ? 76 : 0));
    },
    clearSearch: async () => { await click(198,128); },
    load: async () => { await click(177,15); },
    play: async () => { await click(1395,15); },
    tour: async () => { await click(348,15); await click(380,50); },
  };
};
