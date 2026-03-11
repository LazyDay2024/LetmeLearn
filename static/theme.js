// static/theme.js
const toggleTheme = () => {
  const currentTheme = localStorage.getItem('theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(newTheme);
};

const applyTheme = (theme) => {
  if (theme === 'dark') {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
  localStorage.setItem('theme', theme);
  
  // Update button icon if exists
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    if (theme === 'dark') {
      themeBtn.innerHTML = '☀️';
    } else {
      themeBtn.innerHTML = '🌙';
    }
  }
};

// Initialize theme on load
document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme') || 'light';
  applyTheme(savedTheme);
  
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', toggleTheme);
  }
});
