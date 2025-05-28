// Placeholder image URLs
const images = [
  {
    src: 'MarketCanvas Showcase Picture 1.png',
    caption: 'Draw and create any stock market pattern you want with Market Canvas'
  },
  {
    src: 'MarketCanvas Showcase Picture 2.png',
    caption: 'Hide and show patterns with ease using Market Canvas'
  },
  {
    src: 'MarketCanvas showcase picture 3 Preset Patterns.png',
    caption: 'Customize your canvas and use preset patterns to efficiently create patterns'
  }
];

let current = 0;
const imgEl = document.getElementById('slideshow-img');
const captionEl = document.getElementById('slideshow-caption');

function showImage(idx) {
  imgEl.src = images[idx].src;
  captionEl.textContent = images[idx].caption;
}

function nextImage() {
  current = (current + 1) % images.length;
  showImage(current);
}

function prevImage() {
  current = (current - 1 + images.length) % images.length;
  showImage(current);
}

document.getElementById('next-btn').onclick = nextImage;
document.getElementById('prev-btn').onclick = prevImage;

// Auto-advance every 4 seconds
setInterval(nextImage, 10000);

// Initialize
showImage(current);
