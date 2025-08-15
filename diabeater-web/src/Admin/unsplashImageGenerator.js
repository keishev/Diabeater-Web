// Complete Unsplash Food Image Generator with Advanced Fallback
// This file should be saved as unsplashImageGenerator.js

// Configuration
const UNSPLASH_ACCESS_KEY = 'd0ciLEi_rA2JWMDZRAVJN8iTmPW_-wKI--yZpjjsin8';
const UNSPLASH_API_URL = 'https://api.unsplash.com';

// Helper function to determine food search terms based on meal name
const getFoodSearchTerms = (mealName) => {
  const mealLower = mealName.toLowerCase();
  
  // Map meal names to specific food search terms
  const foodMappings = {
    // Proteins
    'salmon': ['salmon', 'grilled salmon', 'fish fillet'],
    'chicken': ['grilled chicken', 'chicken breast', 'roasted chicken'],
    'turkey': ['turkey', 'roasted turkey', 'turkey breast'],
    'fish': ['fish', 'seafood', 'grilled fish'],
    'cod': ['cod fish', 'white fish', 'baked fish'],
    'tuna': ['tuna', 'tuna steak', 'seared tuna'],
    
    // Vegetables & Salads
    'salad': ['fresh salad', 'green salad', 'mixed greens'],
    'avocado': ['avocado', 'avocado toast', 'fresh avocado'],
    'spinach': ['spinach', 'leafy greens', 'fresh spinach'],
    'broccoli': ['broccoli', 'green vegetables', 'steamed broccoli'],
    'asparagus': ['asparagus', 'green asparagus', 'grilled asparagus'],
    'zucchini': ['zucchini', 'zucchini noodles', 'spiralized zucchini'],
    
    // Grains & Carbs
    'quinoa': ['quinoa bowl', 'quinoa salad', 'healthy grains'],
    'rice': ['rice bowl', 'brown rice', 'healthy rice'],
    'oats': ['oatmeal', 'overnight oats', 'healthy breakfast'],
    'toast': ['avocado toast', 'whole grain toast', 'healthy toast'],
    
    // Breakfast items
    'eggs': ['eggs', 'scrambled eggs', 'healthy breakfast'],
    'yogurt': ['greek yogurt', 'yogurt parfait', 'healthy yogurt'],
    'smoothie': ['smoothie bowl', 'healthy smoothie', 'fruit smoothie'],
    'parfait': ['yogurt parfait', 'breakfast parfait', 'healthy parfait'],
    
    // Cooking methods
    'grilled': ['grilled food', 'healthy grilling', 'grilled vegetables'],
    'baked': ['baked food', 'oven baked', 'healthy baking'],
    'roasted': ['roasted vegetables', 'roasted food', 'healthy roasting'],
    
    // Diet types
    'vegetarian': ['vegetarian food', 'plant based', 'healthy vegetables'],
    'protein': ['high protein', 'protein rich food', 'healthy protein'],
    'low carb': ['low carb food', 'keto food', 'healthy low carb'],
    
    // Meal types
    'bowl': ['healthy bowl', 'buddha bowl', 'nutrition bowl'],
    'wrap': ['healthy wrap', 'lettuce wrap', 'fresh wrap'],
    'soup': ['healthy soup', 'vegetable soup', 'fresh soup']
  };
  
  // Find matching terms
  let searchTerms = [];
  
  Object.keys(foodMappings).forEach(key => {
    if (mealLower.includes(key)) {
      searchTerms.push(...foodMappings[key]);
    }
  });
  
  // If no specific terms found, use general healthy food terms
  if (searchTerms.length === 0) {
    searchTerms = ['healthy food', 'fresh meal', 'nutritious food', 'clean eating', 'healthy plate'];
  }
  
  // Add some general food terms for variety
  searchTerms.push('healthy meal', 'fresh ingredients', 'clean food');
  
  return [...new Set(searchTerms)]; // Remove duplicates
};

// Function to search Unsplash for food images
const searchUnsplashFoodImage = async (mealName, retryCount = 0) => {
  try {
    if (!UNSPLASH_ACCESS_KEY || UNSPLASH_ACCESS_KEY === 'YOUR_UNSPLASH_ACCESS_KEY') {
      throw new Error('Unsplash API key not configured');
    }
    
    const searchTerms = getFoodSearchTerms(mealName);
    const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
    
    console.log(`🔍 Searching Unsplash for: "${randomTerm}" (for meal: ${mealName})`);
    
    const searchUrl = `${UNSPLASH_API_URL}/search/photos?query=${encodeURIComponent(randomTerm)}&per_page=30&orientation=landscape&content_filter=high`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        'Accept-Version': 'v1'
      }
    });
    
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Unsplash API rate limit exceeded or invalid key');
      }
      throw new Error(`Unsplash API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      if (retryCount < 2) {
        console.log(`No results for "${randomTerm}", trying different term...`);
        return searchUnsplashFoodImage(mealName, retryCount + 1);
      }
      throw new Error('No images found on Unsplash');
    }
    
    // Select a random image from results
    const randomImage = data.results[Math.floor(Math.random() * data.results.length)];
    
    // Use regular size (not raw) to be respectful of bandwidth
    const imageUrl = randomImage.urls.regular;
    const imageId = randomImage.id;
    const photographer = randomImage.user.name;
    
    console.log(`📸 Found image by ${photographer} (ID: ${imageId})`);
    
    return {
      url: imageUrl,
      id: imageId,
      photographer,
      downloadLocation: randomImage.links.download_location
    };
    
  } catch (error) {
    console.error('Error searching Unsplash:', error);
    throw error;
  }
};

// Advanced mock image generator (fallback when Unsplash fails)
const createAdvancedMockImageFile = (mealName) => {
  return new Promise(resolve => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    
    // Determine meal type and color scheme
    const mealLower = mealName.toLowerCase();
    let primaryHue, secondaryHue, bgStyle;
    
    if (mealLower.includes('salad') || mealLower.includes('vegetable') || mealLower.includes('green')) {
      primaryHue = 120; // Green
      secondaryHue = 60; // Yellow-green
      bgStyle = 'fresh';
    } else if (mealLower.includes('salmon') || mealLower.includes('fish') || mealLower.includes('seafood')) {
      primaryHue = 200; // Blue
      secondaryHue = 180; // Cyan
      bgStyle = 'oceanic';
    } else if (mealLower.includes('chicken') || mealLower.includes('turkey') || mealLower.includes('protein')) {
      primaryHue = 30; // Orange-brown
      secondaryHue = 15; // Brown
      bgStyle = 'protein';
    } else if (mealLower.includes('fruit') || mealLower.includes('berry') || mealLower.includes('smoothie')) {
      primaryHue = 320; // Pink/magenta
      secondaryHue = 300; // Purple
      bgStyle = 'fruity';
    } else {
      // Default warm colors
      primaryHue = 45; // Warm orange
      secondaryHue = 25; // Golden
      bgStyle = 'warm';
    }
    
    // Create themed gradient background
    const gradient = ctx.createRadialGradient(400, 300, 0, 400, 300, 500);
    gradient.addColorStop(0, `hsl(${primaryHue}, 70%, 90%)`);
    gradient.addColorStop(0.7, `hsl(${secondaryHue}, 60%, 80%)`);
    gradient.addColorStop(1, `hsl(${primaryHue}, 50%, 70%)`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 600);
    
    // Add styled background pattern
    ctx.fillStyle = `hsla(${primaryHue}, 30%, 95%, 0.8)`;
    for (let i = 0; i < 12; i++) {
      const angle = (i * 30) * Math.PI / 180;
      const x = 400 + Math.cos(angle) * 250;
      const y = 300 + Math.sin(angle) * 180;
      
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    // Create main content area with shadow
    const contentX = 80;
    const contentY = 150;
    const contentW = 640;
    const contentH = 300;
    
    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(contentX + 8, contentY + 8, contentW, contentH);
    
    // Main content background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(contentX, contentY, contentW, contentH);
    
    // Border with rounded corners effect
    ctx.strokeStyle = `hsl(${primaryHue}, 60%, 50%)`;
    ctx.lineWidth = 6;
    ctx.strokeRect(contentX, contentY, contentW, contentH);
    
    // Inner border
    ctx.strokeStyle = `hsl(${secondaryHue}, 40%, 60%)`;
    ctx.lineWidth = 2;
    ctx.strokeRect(contentX + 10, contentY + 10, contentW - 20, contentH - 20);
    
    // Prepare text
    const words = mealName.split(' ');
    const lines = [];
    let currentLine = '';
    
    // Smart line breaking
    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      if (testLine.length > 20 && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    if (currentLine) lines.push(currentLine);
    
    // Dynamic font sizing
    const baseSize = Math.max(24, Math.min(56, 800 / Math.max(...lines.map(l => l.length))));
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw text with styling
    const lineHeight = baseSize * 1.3;
    const totalHeight = lines.length * lineHeight;
    const startY = 300 - totalHeight / 2 + lineHeight / 2;
    
    lines.forEach((line, index) => {
      const y = startY + index * lineHeight;
      
      // Text shadow
      ctx.font = `bold ${baseSize}px 'Georgia', serif`;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillText(line, 402, y + 3);
      
      // Main text with gradient
      const textGradient = ctx.createLinearGradient(0, y - baseSize/2, 0, y + baseSize/2);
      textGradient.addColorStop(0, `hsl(${primaryHue}, 80%, 25%)`);
      textGradient.addColorStop(1, `hsl(${secondaryHue}, 70%, 35%)`);
      ctx.fillStyle = textGradient;
      ctx.fillText(line, 400, y);
    });
    
    // Add decorative elements
    ctx.fillStyle = `hsl(${primaryHue}, 60%, 60%)`;
    
    // Top decoration
    ctx.beginPath();
    ctx.moveTo(350, 120);
    ctx.lineTo(400, 100);
    ctx.lineTo(450, 120);
    ctx.closePath();
    ctx.fill();
    
    // Bottom decoration
    ctx.beginPath();
    ctx.moveTo(350, 480);
    ctx.lineTo(400, 500);
    ctx.lineTo(450, 480);
    ctx.closePath();
    ctx.fill();
    
    // Corner decorations
    const corners = [[120, 180], [680, 180], [120, 420], [680, 420]];
    corners.forEach(([x, y]) => {
      ctx.fillStyle = `hsl(${secondaryHue}, 50%, 70%)`;
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    // Subtle "DEMO" watermark
    ctx.font = 'italic 18px Arial';
    ctx.fillStyle = `hsla(${primaryHue}, 40%, 50%, 0.4)`;
    ctx.textAlign = 'right';
    ctx.fillText('Demo Image', 760, 560);
    
    // Convert to file
    canvas.toBlob(blob => {
      const fileName = `${mealName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_demo.png`;
      const file = new File([blob], fileName, { type: 'image/png' });
      resolve(file);
    }, 'image/png', 0.92);
  });
};

// Function to download and create File object from Unsplash image
const createUnsplashImageFile = async (mealName) => {
  try {
    console.log(`🖼️ Creating Unsplash image for: ${mealName}`);
    
    // Search for appropriate image
    const imageInfo = await searchUnsplashFoodImage(mealName);
    
    // Download the image
    console.log(`⬇️ Downloading image from Unsplash...`);
    const imageResponse = await fetch(imageInfo.url);
    
    if (!imageResponse.ok) {
      throw new Error('Failed to download image from Unsplash');
    }
    
    const blob = await imageResponse.blob();
    
    // Create filename
    const safeMealName = mealName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const fileName = `${safeMealName}_unsplash_${imageInfo.id}.jpg`;
    
    // Create File object
    const file = new File([blob], fileName, { type: 'image/jpeg' });
    
    console.log(`✅ Created image file: ${fileName} (${(blob.size / 1024).toFixed(1)}KB)`);
    
    // Track download for Unsplash (required by their API terms)
    if (imageInfo.downloadLocation) {
      try {
        await fetch(imageInfo.downloadLocation, {
          headers: {
            'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
          }
        });
      } catch (trackError) {
        console.warn('Failed to track download (non-critical):', trackError);
      }
    }
    
    return file;
    
  } catch (error) {
    console.error(`Failed to create Unsplash image for "${mealName}":`, error);
    
    // Fallback to canvas-generated image
    console.log('🎨 Falling back to canvas-generated image...');
    return createAdvancedMockImageFile(mealName);
  }
};

// Batch function to create multiple images with rate limiting
const createUnsplashImagesInBatch = async (mealNames, delayMs = 1000) => {
  const results = [];
  
  for (let i = 0; i < mealNames.length; i++) {
    const mealName = mealNames[i];
    
    try {
      console.log(`🔄 Processing image ${i + 1}/${mealNames.length}: ${mealName}`);
      
      const imageFile = await createUnsplashImageFile(mealName);
      results.push({
        mealName,
        success: true,
        file: imageFile
      });
      
      // Rate limiting - wait between requests
      if (i < mealNames.length - 1) {
        console.log(`⏳ Waiting ${delayMs}ms before next request...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
      
    } catch (error) {
      console.error(`❌ Failed to create image for ${mealName}:`, error);
      results.push({
        mealName,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
};

// Export functions
export { 
  createUnsplashImageFile,
  createAdvancedMockImageFile,
  createUnsplashImagesInBatch,
  searchUnsplashFoodImage,
  getFoodSearchTerms
};