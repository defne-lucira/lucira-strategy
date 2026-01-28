import './styles/main.scss';

// --------------------------------------------
// DOM READY HELPER
// --------------------------------------------
function ready(fn) {
  if (document.readyState !== 'loading') fn();
  else document.addEventListener('DOMContentLoaded', fn);
}

// --------------------------------------------
// UTILITIES
// --------------------------------------------
function debounce(fn, wait = 16) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
}

// --------------------------------------------
// SCROLL ANIMATIONS + STAGGERED CARDS
// --------------------------------------------
function initScrollAnimations() {
  const animatedElements = document.querySelectorAll('.animate-on-scroll');
  if (!animatedElements.length) return;

  const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -80px 0px'
  };

  const animateOnScroll = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');
        // Optional: uncomment to unobserve after first animation
        // animateOnScroll.unobserve(entry.target);
      }
    });
  }, observerOptions);

  animatedElements.forEach(el => animateOnScroll.observe(el));

  // Stagger animation delays for card grids
  const cardContainers = document.querySelectorAll('.cards, .pillar-grid');
  cardContainers.forEach(container => {
    const cards = container.querySelectorAll('.card, .cluster');
    cards.forEach((card, index) => {
      card.style.transitionDelay = `${index * 0.1}s`;
    });
  });
}

// --------------------------------------------
// SERVICES TAB NAVIGATION + ANIMATIONS
// --------------------------------------------
function initServicesTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabPanels = document.querySelectorAll('.tab-panel');

  if (!tabButtons.length || !tabPanels.length) return;

  const buttonsArray = Array.from(tabButtons);

  function activateTab(button) {
    const targetTab = button.getAttribute('data-tab');
    const targetPanel = document.getElementById(`panel-${targetTab}`);
    if (!targetPanel) return;

    // Reset all buttons + panels
    tabButtons.forEach(btn => {
      btn.classList.remove('active');
      btn.setAttribute('aria-selected', 'false');
    });
    tabPanels.forEach(panel => panel.classList.remove('active'));

    // Activate current
    button.classList.add('active');
    button.setAttribute('aria-selected', 'true');
    targetPanel.classList.add('active');

    // Animate clusters/cards in the active panel
    const cards = targetPanel.querySelectorAll('.cluster');
    cards.forEach((card, index) => {
      card.style.animation = 'none';
      // Force reflow-ish delay so animation restarts
      setTimeout(() => {
        card.style.animation = `fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s forwards`;
      }, 10);
    });
  }

  tabButtons.forEach(button => {
    button.addEventListener('click', () => activateTab(button));

    button.addEventListener('keydown', (e) => {
      const currentIndex = buttonsArray.indexOf(button);
      let nextIndex = null;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextIndex = (currentIndex + 1) % buttonsArray.length;
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        nextIndex = currentIndex === 0 ? buttonsArray.length - 1 : currentIndex - 1;
      } else if (e.key === 'Home') {
        e.preventDefault();
        nextIndex = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        nextIndex = buttonsArray.length - 1;
      }

      if (nextIndex !== null) {
        const nextButton = buttonsArray[nextIndex];
        nextButton.click();
        nextButton.focus();
      }
    });
  });
}

// --------------------------------------------
// SMOOTH SCROLL FOR IN-PAGE ANCHORS
// --------------------------------------------
function initSmoothScroll() {
  const isDesktop = () => window.innerWidth >= 768;  
  if (!isDesktop()) return;
  
  const anchors = document.querySelectorAll('a[href^="#"]');
  if (!anchors.length) return;

  anchors.forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;

      const targetElement = document.querySelector(href);
      if (!targetElement) return;

      e.preventDefault();
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });

      history.pushState(null, '', href);
    });
  });
}

// --------------------------------------------
// CONTACT FORM (API SUBMIT + HONEYPOT)
// --------------------------------------------
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const submitBtn = document.getElementById('submitBtn');
  const statusEl =
    form.querySelector('.form-status') ||
    document.querySelector('.form-status');

  if (!submitBtn || !statusEl) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    const name = data.name;
    const email = data.email;
    const message = data.message;
    const honeypot = data.hp;

    // Honeypot anti-bot
    if (honeypot) {
      console.log('Bot detected');
      return;
    }

    // Required fields
    if (!name || !email || !message) {
      statusEl.textContent = 'Please fill in name, email, and message.';
      statusEl.style.color = '#ff7676';
      return;
    }

    // Email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      statusEl.textContent = 'Please enter a valid email address.';
      statusEl.style.color = '#ff7676';
      return;
    }

    // Lock UI
    submitBtn.disabled = true;
    form.classList.add('is-submitting');
    statusEl.textContent = 'Sending...';
    statusEl.style.color = 'var(--light-blue)';

    try {
      // Replace with your actual endpoint logic as needed
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const payload = await res.json().catch(() => ({}));

      if (res.ok && payload.ok !== false) {
        statusEl.textContent = "Thanks - we'll be in touch shortly.";
        statusEl.style.color = 'var(--gold)';
        form.reset();
      } else {
        statusEl.textContent =
          payload.error || 'Something went wrong. Please try again.';
        statusEl.style.color = '#ff7676';
      }
    } catch (err) {
      console.error(err);
      statusEl.textContent = 'Network error. Please try again.';
      statusEl.style.color = '#ff7676';
    } finally {
      submitBtn.disabled = false;
      form.classList.remove('is-submitting');
    }
  });
}

// --------------------------------------------
// HERO PARALLAX
// --------------------------------------------
function initParallaxHero() {
  const heroSection = document.querySelector('.hero');
  if (!heroSection) return;

  const handleScroll = () => {
    const scrolled = window.pageYOffset || document.documentElement.scrollTop;
    const heroHeight = heroSection.offsetHeight;

    if (scrolled <= heroHeight) {
      const parallax = scrolled * 0.5;
      heroSection.style.transform = `translateY(${parallax}px)`;
    } else {
      heroSection.style.transform = 'translateY(0)';
    }
  };

  window.addEventListener(
    'scroll',
    debounce(handleScroll, 16),
    { passive: true }
  );
  handleScroll(); // run once on load
}

// --------------------------------------------
// NAVBAR SCROLL EFFECT
// --------------------------------------------
function initNavbarScrollEffect() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  const handleScroll = () => {
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    
    // Add a class when scrolled past a certain point
    if (currentScroll > 100) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };

  window.addEventListener(
    'scroll',
    debounce(handleScroll, 16),
    { passive: true }
  );
  handleScroll(); // initial state
}

// --------------------------------------------
// CURSOR TRAIL (DESKTOP ONLY)
// --------------------------------------------
function initCursorTrail() {
  // Check if device is desktop
  const isDesktop = () => window.innerWidth >= 768;
  
  if (!isDesktop()) return;

  // Canvas setup
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  canvas.style.opacity = '0.4';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');

  const resizeCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resizeCanvas();
  
  // Handle window resize
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (!isDesktop()) {
        // Remove canvas if resized to mobile
        canvas.remove();
        return;
      }
      resizeCanvas();
    }, 100);
  });

  const particles = [];
  const particleCount = 2;

  class Particle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.size = Math.random() * 4 + 2;
      this.speedX = (Math.random() - 0.5) * 1;
      this.speedY = (Math.random() - 0.5) * 1;
      this.life = 1;
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.life -= 0.015;
      if (this.size > 0.1) this.size -= 0.04;
    }

    draw() {
      ctx.fillStyle = `rgba(212, 175, 55, ${this.life})`;
      ctx.shadowBlur = 10;
      ctx.shadowColor = `rgba(212, 175, 55, ${this.life * 0.5})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  document.addEventListener('mousemove', (e) => {
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle(mouseX, mouseY));
    }
  });

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update();
      p.draw();
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }

    requestAnimationFrame(animate);
  }

  animate();
}

// --------------------------------------------
// LAZY-LOAD IMAGES
// --------------------------------------------
function initLazyImages() {
  const images = document.querySelectorAll('img[data-src]');
  if (!images.length) return;

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const img = entry.target;
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
      observer.unobserve(img);
    });
  });

  images.forEach(img => imageObserver.observe(img));
}


// --------------------------------------------
// MOBILE NAVIGATION TOGGLE
// --------------------------------------------
function initMobileNav() {
  const navbar = document.querySelector('.navbar');
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelectorAll('.nav-links a');
  const navLinksContainer = document.querySelector('.nav-links');

  if (!navbar || !toggle) return;

  toggle.addEventListener('click', () => {
    const isOpen = navbar.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    
    // Prevent body scroll when menu is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    // Stagger animation for menu items
    if (isOpen && navLinksContainer) {
      const links = navLinksContainer.querySelectorAll('a');
      links.forEach((link, index) => {
        link.style.opacity = '0';
        link.style.transform = 'translateX(20px)';
        setTimeout(() => {
          link.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
          link.style.opacity = '1';
          link.style.transform = 'translateX(0)';
        }, 100 + (index * 80));
      });
    }
  });

  // Close menu when a link is clicked
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navbar.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (navbar.classList.contains('is-open') && 
        !navbar.contains(e.target) && 
        !toggle.contains(e.target)) {
      navbar.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });

  // Close menu on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navbar.classList.contains('is-open')) {
      navbar.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });
}




// --------------------------------------------
// INIT ALL
// --------------------------------------------
ready(() => {
  initScrollAnimations();
  initServicesTabs();
  initSmoothScroll();
  initContactForm();
  //initParallaxHero();
  //initNavbarScrollEffect();
  // initCursorTrail();
  //initLazyImages();
  initMobileNav();
  //ready();

  console.log('Scripts loaded.');
});
