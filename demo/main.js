// Web Share API
const shareBtn = document.getElementById('shareBtn');
shareBtn?.addEventListener('click', async () => {
  if (navigator.share) {
    await navigator.share({ title: 'Baseline Dev Coach', url: location.href });
  }
});

// Async Clipboard API
async function copySomething() {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText('Hello clipboard');
  }
}

// Dialog element API
const dlg = document.getElementById('dlg');
document.getElementById('close')?.addEventListener('click', () => dlg.close());
setTimeout(() => dlg.showModal(), 500);
