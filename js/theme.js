export function initTheme() {
  const savedTheme = localStorage.getItem('versday_theme') || 'system';
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (savedTheme === 'dark' || (savedTheme === 'system' && systemDark)) {
    document.body.classList.add('light'); // atenção: no CSS, .light é o modo claro? Vamos inverter
  } else {
    document.body.classList.remove('light');
  }
  const btn = document.getElementById('themeToggleBtn');
  if (btn) {
    btn.textContent = document.body.classList.contains('light') ? '🌙' : '☀️';
    btn.onclick = () => {
      document.body.classList.toggle('light');
      const newTheme = document.body.classList.contains('light') ? 'dark' : 'light';
      localStorage.setItem('versday_theme', newTheme);
      btn.textContent = document.body.classList.contains('light') ? '🌙' : '☀️';
    };
  }
}
