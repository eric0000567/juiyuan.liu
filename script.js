// Mobile Navigation Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', mobileMenu);

function mobileMenu() {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
}

// Close mobile menu when clicking on nav links
const navLink = document.querySelectorAll('.nav-link');

navLink.forEach(n => n.addEventListener('click', closeMenu));

function closeMenu() {
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar background on scroll
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(0, 0, 0, 0.98)';
    } else {
        navbar.style.background = 'rgba(0, 0, 0, 0.95)';
    }
});

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all sections for scroll animations
document.addEventListener('DOMContentLoaded', function() {
    // Add animation classes to sections
    const sections = document.querySelectorAll('section:not(.hero)');
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(50px)';
        section.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
        observer.observe(section);
    });

    // Animate timeline items
    const timelineItems = document.querySelectorAll('.timeline-item, .education-item');
    timelineItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateX(-50px)';
        item.style.transition = `opacity 0.6s ease-out ${index * 0.1}s, transform 0.6s ease-out ${index * 0.1}s`;
        observer.observe(item);
    });

    // Animate project cards
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `opacity 0.6s ease-out ${index * 0.1}s, transform 0.6s ease-out ${index * 0.1}s`;
        observer.observe(card);
    });
});

// Typing effect for hero section
function typeWriter(element, text, speed = 50) {
    let i = 0;
    element.innerHTML = '';
    
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

// Initialize typing effect when page loads
window.addEventListener('load', function() {
    const heroTitle = document.querySelector('.hero-title');
    const heroSubtitle = document.querySelector('.hero-subtitle');
    
    if (heroTitle && heroSubtitle) {
        // Small delay before starting typing effect
        setTimeout(() => {
            typeWriter(heroTitle, '劉瑞源', 100);
            setTimeout(() => {
                typeWriter(heroSubtitle, 'Jui-Yuan Liu', 80);
            }, 800);
        }, 500);
    }
});

// Parallax effect for hero section
window.addEventListener('scroll', function() {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    const rate = scrolled * -0.5;
    
    if (hero) {
        hero.style.transform = `translateY(${rate}px)`;
    }
});

// Active navigation link highlighting
window.addEventListener('scroll', function() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        
        if (scrollY >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// Add CSS for active nav link
const style = document.createElement('style');
style.textContent = `
    .nav-link.active {
        color: #64ffda !important;
    }
    
    .nav-link.active::after {
        width: 100% !important;
    }
`;
document.head.appendChild(style);

// Email copy functionality
document.addEventListener('DOMContentLoaded', function() {
    const emailElement = document.querySelector('.contact-item:first-child span');
    if (emailElement) {
        emailElement.style.cursor = 'pointer';
        emailElement.title = '點擊複製電子郵件';
        
        emailElement.addEventListener('click', function() {
            const email = this.textContent;
            navigator.clipboard.writeText(email).then(function() {
                // Show temporary notification
                const notification = document.createElement('div');
                notification.textContent = '電子郵件已複製到剪貼簿';
                notification.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #64ffda;
                    color: #0a192f;
                    padding: 10px 20px;
                    border-radius: 5px;
                    z-index: 10000;
                    font-weight: 500;
                    animation: slideIn 0.3s ease-out;
                `;
                
                document.body.appendChild(notification);
                
                setTimeout(() => {
                    notification.remove();
                }, 3000);
            });
        });
    }
});

// Add slide-in animation for notification
const notificationStyle = document.createElement('style');
notificationStyle.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(notificationStyle);

// Lazy loading for better performance
document.addEventListener('DOMContentLoaded', function() {
    const lazyElements = document.querySelectorAll('.project-card, .timeline-item, .education-item');
    
    const lazyObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('loaded');
                lazyObserver.unobserve(entry.target);
            }
        });
    });
    
    lazyElements.forEach(element => {
        lazyObserver.observe(element);
    });
});

// Preload critical resources
document.addEventListener('DOMContentLoaded', function() {
    // Preload fonts
    const fontLinks = [
        'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700&family=JetBrains+Mono:wght@400;500&display=swap',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
    ];
    
    fontLinks.forEach(href => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'style';
        link.href = href;
        document.head.appendChild(link);
    });
});

// Performance monitoring
window.addEventListener('load', function() {
    // Log page load time
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
    console.log(`頁面載入時間: ${loadTime}ms`);
    
    // Add performance badge for development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const perfBadge = document.createElement('div');
        perfBadge.textContent = `載入: ${loadTime}ms`;
        perfBadge.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: rgba(100, 255, 218, 0.9);
            color: #0a192f;
            padding: 5px 10px;
            border-radius: 3px;
            font-size: 12px;
            z-index: 10000;
            font-family: 'JetBrains Mono', monospace;
        `;
        document.body.appendChild(perfBadge);
    }
}); 