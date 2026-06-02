export function initTheme() {
  const saved = localStorage.getItem('versday_theme');
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  let isLight = false;
  if (saved === 'light') isLight = true;
  else if (saved === 'dark') isLight = false;
  else isLight = !systemDark;
  if (isLight) document.body.classList.add('light');
  else document.body.classList.remove('light');

  const btn = document.getElementById('themeToggleBtn');
  if (btn) {
    btn.textContent = isLight ? '☀️' : '🌙';
    btn.onclick = () => {
      document.body.classList.toggle('light');
      const nowLight = document.body.classList.contains('light');
      localStorage.setItem('versday_theme', nowLight ? 'light' : 'dark');
      btn.textContent = nowLight ? '☀️' : '🌙';
    };
  }
}
