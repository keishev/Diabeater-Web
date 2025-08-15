import { db } from '../firebase';
import { collection, getDocs, query, where, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Import Unsplash functions
import { createUnsplashImageFile, createAdvancedMockImageFile } from './unsplashImageGenerator.js';

// CRITICAL FIX: Use the same collection name as your service
const COLLECTION_NAME = 'meal_plans';


// CRITICAL FIX: Use the same collection name as your service
const createMealPlanDirectly = async (mealPlanData, imageFile) => {
  try {
    let imageUrl = null;
    let imageFileName = null;

    // Upload image if provided
    if (imageFile) {
      const storage = getStorage();
      const timestamp = Date.now();
      const fileName = `${timestamp}_${imageFile.name}`;
      const storageRef = ref(storage, `meal_plan_images/dummy_data/${fileName}`);
      
      console.log(`📤 Uploading image: ${fileName} (${(imageFile.size / 1024).toFixed(1)}KB)`);
      const uploadResult = await uploadBytes(storageRef, imageFile);
      imageUrl = await getDownloadURL(uploadResult.ref);
      imageFileName = fileName;
      console.log(`✅ Image uploaded successfully to Firebase Storage`);
    }

    // Prepare meal plan document
    const mealPlanDoc = {
      ...mealPlanData,
      imageUrl: imageUrl,
      imageFileName: imageFileName,
      createdAt: serverTimestamp(),
      // Add dummy data flags
      isDummyData: true,
      generatedBy: 'dummy-data-script',
      imageSource: imageFile?.name?.includes('unsplash') ? 'unsplash' : 'generated'
    };

    // Add to Firestore
    console.log(`📝 Adding meal plan to Firestore...`);
    const docRef = await addDoc(collection(db, COLLECTION_NAME), mealPlanDoc);
    
    console.log(`✅ Meal plan created with ID: ${docRef.id}`);
    return {
      id: docRef.id,
      _id: docRef.id,
      ...mealPlanDoc,
      imageUrl: imageUrl
    };

  } catch (error) {
    console.error('❌ Error creating meal plan directly:', error);
    throw error;
  }
};

// Enhanced cleanup function with correct collection name
const cleanupDummyData = async () => {
  console.log('🧹 Cleaning up dummy data...');
  
  try {
    const snapshot = await getDocs(query(
      collection(db, COLLECTION_NAME),
      where('isDummyData', '==', true)
    ));
    
    const deletePromises = [];
    snapshot.forEach(doc => {
      deletePromises.push(deleteDoc(doc.ref));
    });
    
    await Promise.all(deletePromises);
    console.log(`✅ Cleaned up ${snapshot.size} dummy meal plans`);
    
  } catch (error) {
    console.error('❌ Error cleaning up dummy data:', error);
    throw error;
  }
};

// Main function to create dummy meal plans
const createDummyMealPlans = async (count = 10, useUnsplash = true) => {
  console.log(`🚀 Starting to create ${count} dummy meal plans${useUnsplash ? ' with Unsplash images' : ' with generated images'}...`);
  
  try {
    // Fetch Firebase data first
    console.log('📊 Fetching Firebase data...');
    const [nutritionists, categories] = await Promise.all([
      fetchActiveNutritionists(),
      fetchMealCategories()
    ]);

    if (nutritionists.length === 0) {
      console.warn('⚠️ No active nutritionists found, using fallback data');
    }
    if (categories.length === 0) {
      console.warn('⚠️ No meal categories found, using fallback data');
    }

    const results = [];
    const errors = [];

    // Select meal plans to create
    const selectedMealPlans = EXPANDED_MEAL_PLANS.slice(0, Math.min(count, EXPANDED_MEAL_PLANS.length));

    for (let i = 0; i < selectedMealPlans.length; i++) {
      const planData = selectedMealPlans[i];
      
      try {
        console.log(`\n📝 Creating meal plan ${i + 1}/${selectedMealPlans.length}: ${planData.name}`);
        
        // Generate nutrition and other data
        const nutrition = generateNutrition(planData.baseCalories, planData.mealType);
        const selectedNutritionist = getRandomNutritionist(nutritionists);
        const selectedCategories = getRandomCategories(categories, 1, 3);
        const status = getRandomStatus();

        // Prepare meal plan data to match exact structure from your system
        const mealPlanData = {
          name: planData.name,
          description: planData.description,
          ingredients: planData.ingredients,
          preparationSteps: planData.preparationSteps,
          generalNotes: planData.generalNotes,
          
          authorId: selectedNutritionist.id,
          author: selectedNutritionist.name, // This should be email format in real system
          
          // Both categories and category arrays (your system has both)
          categories: selectedCategories.map(cat => cat.categoryName),
          category: selectedCategories.map(cat => cat.categoryName), // Duplicate as shown in your data
          categoryIds: selectedCategories.map(cat => cat.categoryId),
          
          // Flat nutrition fields (placeholder values as shown in your data)
          calories: 1,
          protein: 1,
          carbohydrates: 1,
          fats: 1,
          saturatedFat: 1,
          unsaturatedFat: 1,
          cholesterol: 1,
          sodium: 1,
          potassium: 1,
          sugar: 1,
          
          // Nested nutrients object with actual values
          nutrients: {
            calories: nutrition.calories,
            protein: nutrition.protein,
            carbohydrates: nutrition.carbohydrates,
            fats: nutrition.fats,
            saturatedFat: nutrition.saturatedFat,
            unsaturatedFat: nutrition.unsaturatedFat,
            cholesterol: nutrition.cholesterol,
            sodium: nutrition.sodium,
            potassium: nutrition.potassium,
            sugar: nutrition.sugar,
          },
          
          // Additional fields from your structure
          recipe: planData.ingredients, // Duplicate ingredients as recipe
          steps: planData.preparationSteps, // Duplicate preparationSteps as steps
          
          status: status,
          likes: status === 'APPROVED' ? Math.floor(Math.random() * 50) : 0,
          saveCount: status === 'APPROVED' ? Math.floor(Math.random() * 100) : 0,
          viewCount: status === 'APPROVED' ? Math.floor(Math.random() * 200) : 0,
        };

        // Add rejection reason if status is REJECTED (using your actual rejection reasons)
        if (status === 'REJECTED') {
          const rejectionReasons = [
            'Incomplete information provided',
            'Contains typos or spelling errors',
            'Contains allergens not declared',
            'Poor image quality',
            'Does not meet dietary guidelines',
            'Recipe instructions are unclear and difficult to follow',
            'Nutritional calculations appear to be inaccurate',
            'Missing important preparation safety information',
            'Ingredient measurements are inconsistent or confusing',
            'Does not meet our quality standards for publication'
          ];
          mealPlanData.rejectionReason = rejectionReasons[Math.floor(Math.random() * rejectionReasons.length)];
        }

        // Create image (Unsplash or generated)
        let imageFile;
        if (useUnsplash) {
          try {
            console.log(`📸 Fetching Unsplash image for "${planData.name}"...`);
            imageFile = await createUnsplashImageFile(planData.name);
            console.log(`✅ Successfully created Unsplash image`);
          } catch (unsplashError) {
            console.warn(`⚠️ Unsplash failed for "${planData.name}", using generated image:`, unsplashError.message);
            imageFile = await createAdvancedMockImageFile(planData.name);
          }
        } else {
          console.log(`🎨 Creating generated image for "${planData.name}"...`);
          imageFile = await createAdvancedMockImageFile(planData.name);
        }
        
        // Create the meal plan
        const result = await createMealPlanDirectly(mealPlanData, imageFile);
        
        results.push(result);
        console.log(`✅ Created meal plan: ${planData.name}`);
        console.log(`   📝 Author: ${selectedNutritionist.name}`);
        console.log(`   🏷️ Categories: ${selectedCategories.map(c => c.categoryName).join(', ')}`);
        console.log(`   📊 Status: ${status}`);
        console.log(`   🍎 Calories: ${nutrition.calories}`);
        console.log(`   📸 Image: ${imageFile.name.includes('unsplash') ? 'Unsplash' : 'Generated'}`);
        
        // Rate limiting for Unsplash (and general politeness)
        const delay = useUnsplash ? 2000 : 500; // 2s for Unsplash, 0.5s for generated
        if (i < selectedMealPlans.length - 1) {
          console.log(`⏳ Waiting ${delay}ms before next meal plan...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
      } catch (error) {
        console.error(`❌ Error creating meal plan ${planData.name}:`, error);
        errors.push({ name: planData.name, error: error.message });
      }
    }

    console.log(`\n🎉 Meal Plan Creation Complete!`);
    console.log(`✅ Successfully created: ${results.length} meal plans`);
    console.log(`❌ Failed to create: ${errors.length} meal plans`);
    
    if (useUnsplash) {
      const unsplashCount = results.filter(r => r.imageSource === 'unsplash').length;
      console.log(`📸 Unsplash images: ${unsplashCount}/${results.length}`);
    }
    
    if (errors.length > 0) {
      console.log(`\n❌ Errors:`);
      errors.forEach(err => console.log(`   - ${err.name}: ${err.error}`));
    }

    return { results, errors, nutritionists, categories };
    
  } catch (error) {
    console.error('❌ Fatal error during batch creation:', error);
    throw error;
  }
};

// Helper functions
const fetchActiveNutritionists = async () => {
  try {
    const nutritionistsQuery = query(
      collection(db, 'user-accounts'),
      where('role', '==', 'nutritionist'),
      where('status', '==', 'Active')
    );
    
    const snapshot = await getDocs(nutritionistsQuery);
    const nutritionists = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      nutritionists.push({
        id: doc.id,
        name: data.name || data.displayName || 'Unknown Nutritionist',
        email: data.email || ''
      });
    });
    
    console.log(`✅ Found ${nutritionists.length} active nutritionists`);
    return nutritionists;
    
  } catch (error) {
    console.error('❌ Error fetching nutritionists:', error);
    return [{
      id: "default-nutritionist-id",
      name: "Dr. Sarah Johnson",
      email: "sarah@example.com"
    }];
  }
};

const fetchMealCategories = async () => {
  try {
    const categoriesSnapshot = await getDocs(collection(db, 'meal_plan_categories'));
    const categories = [];
    
    categoriesSnapshot.forEach(doc => {
      const data = doc.data();
      categories.push({
        categoryId: doc.id,
        categoryName: data.categoryName,
        categoryDescription: data.categoryDescription
      });
    });
    
    console.log(`✅ Found ${categories.length} meal categories`);
    return categories;
    
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    return [
      { categoryId: "quick-meals", categoryName: "Quick Meals", categoryDescription: "Fast preparation meals" },
      { categoryId: "high-protein", categoryName: "High Protein", categoryDescription: "Protein-rich meals" },
      { categoryId: "low-carb", categoryName: "Low Carb", categoryDescription: "Low carbohydrate meals" },
      { categoryId: "vegetarian", categoryName: "Vegetarian", categoryDescription: "Plant-based meals" },
      { categoryId: "diabetic-friendly", categoryName: "Diabetic Friendly", categoryDescription: "Blood sugar friendly meals" }
    ];
  }
};

const getRandomNutritionist = (nutritionists) => {
  return nutritionists[Math.floor(Math.random() * nutritionists.length)];
};

const getRandomCategories = (categories, min = 1, max = 3) => {
  const shuffled = [...categories].sort(() => 0.5 - Math.random());
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  return shuffled.slice(0, count);
};

const generateNutrition = (baseCalories, mealType = 'lunch') => {
  let proteinRatio, fatRatio, carbRatio;
  
  switch(mealType) {
    case 'breakfast':
      proteinRatio = 0.20; fatRatio = 0.35; carbRatio = 0.45;
      break;
    case 'lunch':
      proteinRatio = 0.25; fatRatio = 0.30; carbRatio = 0.45;
      break;
    case 'dinner':
      proteinRatio = 0.30; fatRatio = 0.35; carbRatio = 0.35;
      break;
    case 'snack':
      proteinRatio = 0.25; fatRatio = 0.40; carbRatio = 0.35;
      break;
    default:
      proteinRatio = 0.25; fatRatio = 0.30; carbRatio = 0.45;
  }
  
  const protein = Math.round((baseCalories * proteinRatio) / 4);
  const fats = Math.round((baseCalories * fatRatio) / 9);
  const carbohydrates = Math.round((baseCalories * carbRatio) / 4);
  
  return {
    calories: baseCalories,
    protein,
    carbohydrates,
    fats,
    saturatedFat: Math.round(fats * 0.3),
    unsaturatedFat: Math.round(fats * 0.7),
    cholesterol: Math.round(Math.random() * 100),
    sodium: Math.round(300 + Math.random() * 400),
    potassium: Math.round(400 + Math.random() * 600),
    sugar: Math.round(carbohydrates * 0.2)
  };
};

const getRandomStatus = () => {
  const statuses = ['APPROVED', 'PENDING_APPROVAL', 'REJECTED'];
  const weights = [0.6, 0.25, 0.15]; // 60% approved, 25% pending, 15% rejected
  
  const random = Math.random();
  let cumulativeWeight = 0;
  
  for (let i = 0; i < statuses.length; i++) {
    cumulativeWeight += weights[i];
    if (random < cumulativeWeight) {
      return statuses[i];
    }
  }
  
  return 'PENDING_APPROVAL'; // fallback
};
// Complete 100 meal plans base data
const MEAL_PLANS_BASE_DATA = [
  // BREAKFAST MEALS (1-20)
  {
    name: "Greek Yogurt Parfait with Berries",
    description: "Protein-rich Greek yogurt layered with fresh berries and nuts for a nutritious breakfast that supports muscle maintenance and provides probiotics for digestive health.",
    ingredients: "3/4 cup plain Greek yogurt (0% fat), 1/2 cup mixed berries (blueberries, strawberries), 2 tbsp chopped walnuts, 1 tbsp chia seeds, 1 tsp raw honey, 1/4 tsp cinnamon",
    preparationSteps: "1. In a glass or bowl, layer half the Greek yogurt at the bottom. 2. Add half the mixed berries and chopped walnuts. 3. Add remaining yogurt as second layer. 4. Top with remaining berries and walnuts. 5. Sprinkle chia seeds and drizzle with honey. 6. Finish with a dash of cinnamon for flavor and blood sugar support.",
    generalNotes: "This breakfast provides complete protein from Greek yogurt, antioxidants from berries, and healthy omega-3 fats from walnuts and chia seeds. The combination helps stabilize blood sugar and keeps you satisfied until lunch. Choose organic berries when possible for maximum antioxidant content.",
    baseCalories: 295,
    mealType: "breakfast"
  },
  {
    name: "Avocado Toast with Poached Egg",
    description: "Whole grain toast topped with mashed avocado and a perfectly poached egg, providing healthy fats, complete protein, and complex carbohydrates for sustained energy.",
    ingredients: "1 slice whole grain bread (preferably sprouted), 1/2 ripe avocado, 1 large free-range egg, 1 tsp fresh lemon juice, pinch of red pepper flakes, sea salt to taste, handful of microgreens or arugula",
    preparationSteps: "1. Toast bread until golden brown and crispy. 2. While bread toasts, bring water to a gentle simmer in a saucepan. 3. Mash avocado with lemon juice, salt, and red pepper flakes. 4. Create a small whirlpool in simmering water and carefully drop in egg. 5. Poach for 3-4 minutes until whites are set. 6. Spread avocado mixture on toast, top with poached egg and microgreens.",
    generalNotes: "Avocados provide heart-healthy monounsaturated fats and fiber, while eggs offer complete protein with all essential amino acids. The combination supports cardiovascular health and provides sustained energy. Choose whole grain bread for additional fiber and B vitamins.",
    baseCalories: 325,
    mealType: "breakfast"
  },
  {
    name: "Vegetable Frittata Squares",
    description: "Protein-rich egg dish loaded with colorful vegetables, perfect for meal prep and suitable for any time of day. Rich in vitamins, minerals, and complete proteins.",
    ingredients: "6 whole eggs, 4 egg whites, 1 cup fresh spinach, 1/2 cup cherry tomatoes (halved), 1/2 cup bell peppers (diced), 1/4 cup red onion (diced), 2 oz goat cheese (crumbled), 2 tbsp fresh herbs (basil, parsley), 1 tbsp olive oil",
    preparationSteps: "1. Preheat oven to 375°F and grease an 8x8 baking dish. 2. Heat olive oil in oven-safe skillet, sauté onions and peppers until tender. 3. Add spinach and cook until wilted. 4. Whisk eggs and egg whites together with herbs and seasoning. 5. Pour egg mixture over vegetables, add tomatoes and goat cheese. 6. Transfer to oven and bake 20-25 minutes until set and golden.",
    generalNotes: "This frittata provides complete protein with plenty of vegetables for vitamins A, C, and folate. Perfect for meal prep - can be refrigerated for up to 4 days. The combination of whole eggs and egg whites reduces calories while maintaining protein content.",
    baseCalories: 245,
    mealType: "breakfast"
  },
  {
    name: "Overnight Steel-Cut Oats with Chia Seeds",
    description: "Fiber-rich steel-cut oats soaked overnight with chia seeds, creating a creamy, nutritious breakfast that supports digestive health and provides sustained energy.",
    ingredients: "1/3 cup steel-cut oats, 1 tbsp chia seeds, 3/4 cup unsweetened almond milk, 1/4 cup fresh berries, 1 tbsp natural almond butter, 1 tsp pure maple syrup, 1/4 tsp vanilla extract, pinch of cinnamon",
    preparationSteps: "1. Combine oats, chia seeds, and almond milk in a mason jar. 2. Add vanilla extract and cinnamon, stir well. 3. Refrigerate overnight (at least 8 hours). 4. In the morning, stir the mixture and add more liquid if needed. 5. Top with fresh berries and almond butter. 6. Drizzle with maple syrup and enjoy cold or warmed.",
    generalNotes: "Steel-cut oats provide more fiber and protein than rolled oats, while chia seeds add omega-3 fatty acids and additional fiber. This combination supports heart health, digestive function, and provides steady blood sugar levels throughout the morning.",
    baseCalories: 315,
    mealType: "breakfast"
  },
  {
    name: "Spinach and Mushroom Scramble",
    description: "Fluffy scrambled eggs with sautéed spinach and mushrooms, creating a low-carb, nutrient-dense breakfast rich in protein, iron, and B vitamins.",
    ingredients: "3 large eggs, 2 cups fresh baby spinach, 1 cup mixed mushrooms (button, shiitake), 2 cloves garlic (minced), 1 tbsp extra virgin olive oil, 2 tbsp fresh chives (chopped), salt and black pepper to taste",
    preparationSteps: "1. Heat olive oil in a non-stick pan over medium heat. 2. Add garlic and mushrooms, sauté until golden and moisture evaporates. 3. Add spinach and cook until wilted, about 2 minutes. 4. Beat eggs with salt and pepper, pour into pan with vegetables. 5. Gently scramble, stirring frequently until eggs are creamy and set. 6. Remove from heat, garnish with chives and serve immediately.",
    generalNotes: "This low-carb breakfast is rich in complete protein from eggs and provides iron, folate, and potassium from spinach. Mushrooms add umami flavor and B vitamins. Perfect for those following ketogenic or low-carb eating patterns while maintaining nutritional balance.",
    baseCalories: 225,
    mealType: "breakfast"
  },

  // LUNCH MEALS (6-50)
  {
    name: "Grilled Teriyaki Salmon Bowl",
    description: "Fresh Atlantic salmon glazed with low-sodium teriyaki, served over quinoa with steamed vegetables. Rich in omega-3s and complete proteins for optimal heart health and blood sugar control.",
    ingredients: "6 oz wild-caught salmon fillet, 1/2 cup cooked quinoa, 1 cup mixed vegetables (broccoli, carrots, snap peas), 2 tbsp low-sodium teriyaki sauce, 1 tsp sesame oil, 1 tbsp sesame seeds, 1 green onion (sliced), fresh cilantro",
    preparationSteps: "1. Cook quinoa according to package directions with low-sodium broth for extra flavor. 2. Season salmon with salt and pepper, brush with sesame oil. 3. Grill salmon for 4-5 minutes per side until internal temperature reaches 145°F. 4. Steam vegetables until tender-crisp, about 5-7 minutes. 5. Brush grilled salmon with teriyaki sauce during last minute of cooking. 6. Serve over quinoa bed with steamed vegetables, sprinkle with sesame seeds and green onions.",
    generalNotes: "Salmon provides high-quality protein and omega-3 fatty acids EPA and DHA, which support heart and brain health. Quinoa offers complete protein and fiber, while colorful vegetables provide antioxidants and vitamins. Choose wild-caught salmon for higher omega-3 content and lower environmental impact.",
    baseCalories: 420,
    mealType: "lunch"
  },
  {
    name: "Mediterranean Chickpea Power Bowl",
    description: "Protein-rich chickpeas with fresh Mediterranean vegetables, feta cheese, and extra virgin olive oil dressing. A plant-based meal that supports heart health and provides sustained energy.",
    ingredients: "1 cup cooked chickpeas (or 1/2 cup dried, soaked and cooked), 1/2 cucumber (diced), 1 cup cherry tomatoes (halved), 1/4 red onion (thinly sliced), 2 oz feta cheese (crumbled), 2 tbsp extra virgin olive oil, 1 tbsp fresh lemon juice, 2 tbsp fresh herbs (parsley, mint, dill), 1/4 cup Kalamata olives",
    preparationSteps: "1. If using dried chickpeas, soak overnight and cook until tender. Drain and rinse if using canned. 2. Dice cucumber, halve cherry tomatoes, and thinly slice red onion. 3. In a large bowl, combine chickpeas with prepared vegetables. 4. Whisk together olive oil, lemon juice, salt, and pepper for dressing. 5. Toss salad with dressing and let marinate for 10 minutes. 6. Top with crumbled feta, olives, and fresh herbs before serving.",
    generalNotes: "This Mediterranean-style bowl is rich in plant-based protein, fiber, and heart-healthy monounsaturated fats. Chickpeas provide folate and iron, while the colorful vegetables offer antioxidants and vitamins C and K. The olive oil and feta provide healthy fats that support nutrient absorption.",
    baseCalories: 385,
    mealType: "lunch"
  },
  {
    name: "Asian Lettuce Wraps with Ground Chicken",
    description: "Fresh butter lettuce cups filled with seasoned lean ground chicken and crunchy water chestnuts. A low-carb, high-protein meal that's light yet satisfying.",
    ingredients: "5 oz lean ground chicken (93% lean), 1 head butter lettuce (leaves separated), 1/4 cup water chestnuts (diced), 2 green onions (sliced), 1 tbsp fresh ginger (minced), 2 cloves garlic (minced), 2 tbsp low-sodium soy sauce, 1 tsp sesame oil, 1 tsp rice vinegar, red pepper flakes to taste",
    preparationSteps: "1. Heat a large skillet over medium-high heat, no oil needed for lean chicken. 2. Add ground chicken and cook, breaking it apart, until almost done. 3. Add minced ginger and garlic, cook for 1 minute until fragrant. 4. Stir in water chestnuts, soy sauce, sesame oil, and rice vinegar. 5. Cook for 2-3 more minutes until heated through. 6. Remove from heat, stir in green onions. 7. Serve mixture in lettuce cups, garnish with additional herbs if desired.",
    generalNotes: "This low-carb, high-protein option is perfect for weight management and blood sugar control. Ground chicken provides lean protein while water chestnuts add crunch and fiber. Ginger and garlic offer anti-inflammatory compounds, making this meal both delicious and nutritionally beneficial.",
    baseCalories: 255,
    mealType: "lunch"
  },
  {
    name: "Lemon Herb Grilled Chicken Salad",
    description: "Tender grilled chicken breast served over mixed greens with a zesty lemon herb dressing. A light, protein-packed meal perfect for lunch or dinner.",
    ingredients: "5 oz chicken breast, 3 cups mixed greens (arugula, spinach, lettuce), 1/2 cucumber, 1/2 cup cherry tomatoes, 1/4 red onion, 2 tbsp olive oil, 1 lemon (juiced), fresh herbs (parsley, thyme), salt and pepper",
    preparationSteps: "1. Season chicken breast with salt, pepper, and herbs. 2. Grill chicken for 6-7 minutes per side until internal temp reaches 165°F. 3. Let chicken rest, then slice. 4. Toss mixed greens with diced cucumber, tomatoes, and onion. 5. Whisk olive oil with lemon juice for dressing. 6. Top salad with sliced chicken and drizzle with dressing.",
    generalNotes: "High in lean protein and low in carbs, this salad supports muscle maintenance and weight management. The variety of vegetables provides essential vitamins and antioxidants.",
    baseCalories: 320,
    mealType: "lunch"
  },
  {
    name: "Tuna and White Bean Salad",
    description: "Protein-rich tuna combined with fiber-packed white beans, fresh vegetables, and herbs. A Mediterranean-inspired meal that's both filling and nutritious.",
    ingredients: "1 can (5 oz) tuna in water, 3/4 cup cannellini beans (cooked), 1/2 cup cherry tomatoes, 1/4 red onion, 2 tbsp capers, 2 tbsp olive oil, 1 tbsp lemon juice, fresh parsley, black pepper",
    preparationSteps: "1. Drain and flake tuna into a bowl. 2. Add drained and rinsed beans. 3. Halve cherry tomatoes and thinly slice onion. 4. Add vegetables and capers to tuna mixture. 5. Whisk olive oil with lemon juice. 6. Toss salad with dressing and fresh parsley.",
    generalNotes: "This combination provides complete protein from tuna and plant-based protein from beans. Rich in omega-3s and fiber for heart and digestive health.",
    baseCalories: 340,
    mealType: "lunch"
  },

  // DINNER MEALS (11-25)
  {
    name: "Herb-Crusted Baked Cod with Asparagus",
    description: "Flaky white fish with a crispy herb and almond coating, served with steamed asparagus. A low-calorie, high-protein meal rich in omega-3s and vitamin D.",
    ingredients: "6 oz wild-caught cod fillet, 1/4 cup almond flour, 2 tbsp fresh herbs (parsley, dill, thyme), 1 bunch fresh asparagus (trimmed), 1 tbsp extra virgin olive oil, 1 lemon (cut into wedges), 2 cloves garlic (minced), salt and pepper to taste",
    preparationSteps: "1. Preheat oven to 400°F and line a baking sheet with parchment paper. 2. Mix almond flour with fresh herbs, garlic, salt, and pepper. 3. Pat cod fillet dry and brush lightly with olive oil. 4. Press herb mixture onto top and sides of fish. 5. Place on baking sheet with asparagus drizzled with remaining oil. 6. Bake for 12-15 minutes until fish flakes easily and asparagus is tender. 7. Serve immediately with lemon wedges.",
    generalNotes: "Cod is an excellent source of lean protein and vitamin D, while the almond flour coating adds healthy fats and fiber without gluten. Asparagus provides folate, vitamin K, and antioxidants. This meal supports bone health, immune function, and muscle maintenance.",
    baseCalories: 285,
    mealType: "dinner"
  },
  {
    name: "Zucchini Noodles with Turkey Meatballs",
    description: "Spiralized zucchini noodles topped with lean turkey meatballs in a light tomato sauce. A low-carb alternative to pasta that's rich in protein and vegetables.",
    ingredients: "2 large zucchini, 5 oz ground turkey (99% lean), 1/4 cup almond flour, 1 large egg, 1 cup low-sodium marinara sauce, 2 cloves garlic (minced), 1/4 cup fresh basil (chopped), 1 tbsp Italian herbs, 1 tbsp olive oil, red pepper flakes to taste",
    preparationSteps: "1. Preheat oven to 400°F. Using a spiralizer, create zucchini noodles and set aside. 2. In a bowl, mix ground turkey with almond flour, egg, garlic, and Italian herbs. 3. Form mixture into 12 small meatballs and place on baking sheet. 4. Bake meatballs for 15-18 minutes until cooked through (165°F internal temp). 5. Heat marinara sauce in a large pan, add cooked meatballs. 6. Quickly sauté zucchini noodles for 2-3 minutes until just tender. 7. Serve meatballs over zucchini noodles with sauce and fresh basil.",
    generalNotes: "This low-carb alternative to traditional pasta provides all the satisfaction with fewer calories and more nutrients. Turkey meatballs offer lean protein, while zucchini provides vitamins C and K. The dish is perfect for those managing weight or blood sugar levels.",
    baseCalories: 315,
    mealType: "dinner"
  },
  {
    name: "Greek-Style Baked Fish",
    description: "White fish baked with tomatoes, olives, and herbs in the traditional Greek style. A heart-healthy meal rich in protein and Mediterranean flavors.",
    ingredients: "6 oz white fish fillet (halibut or cod), 1/2 cup cherry tomatoes, 2 tbsp Kalamata olives, 1 small onion, 2 tbsp olive oil, 1 tsp oregano, 2 cloves garlic, fresh lemon",
    preparationSteps: "1. Preheat oven to 400°F. 2. Slice onion and place in baking dish with olive oil. 3. Add tomatoes, olives, garlic, and oregano. 4. Season fish and place on top of vegetables. 5. Bake for 15-18 minutes until fish flakes easily. 6. Serve with fresh lemon wedges.",
    generalNotes: "This Mediterranean-style preparation is rich in heart-healthy fats from olive oil and olives, while providing lean protein and antioxidants from tomatoes.",
    baseCalories: 310,
    mealType: "dinner"
  },
  {
    name: "Roasted Vegetable Quinoa Bowl",
    description: "Colorful roasted vegetables served over fluffy quinoa with a tahini dressing. A complete protein meal that's both satisfying and nutrient-dense.",
    ingredients: "1/2 cup quinoa, 1 cup mixed vegetables (zucchini, bell peppers, eggplant), 2 tbsp olive oil, 2 tbsp tahini, 1 tbsp lemon juice, 1 clove garlic, 2 tbsp pumpkin seeds",
    preparationSteps: "1. Preheat oven to 425°F and cook quinoa according to package directions. 2. Chop vegetables into uniform pieces and toss with olive oil and seasonings. 3. Roast vegetables for 25-30 minutes until tender. 4. Whisk tahini with lemon juice, garlic, and water to thin. 5. Serve roasted vegetables over quinoa with tahini dressing and pumpkin seeds.",
    generalNotes: "Quinoa provides all essential amino acids, while the variety of vegetables offers antioxidants and vitamins. Tahini adds healthy fats and calcium.",
    baseCalories: 395,
    mealType: "dinner"
  },
  {
    name: "Stuffed Bell Peppers with Ground Turkey",
    description: "Colorful bell peppers filled with lean ground turkey, brown rice, and vegetables. A complete meal that's both satisfying and nutritionally balanced.",
    ingredients: "2 large bell peppers, 4 oz ground turkey (93% lean), 1/3 cup cooked brown rice, 1/4 cup diced tomatoes, 1/4 cup onion, 1 clove garlic, 1 tbsp olive oil, 1/4 cup low-fat cheese",
    preparationSteps: "1. Preheat oven to 375°F. Cut tops off peppers and remove seeds. 2. Sauté onion and garlic in olive oil. 3. Add ground turkey and cook until browned. 4. Mix in rice and tomatoes, season well. 5. Stuff peppers with mixture, top with cheese. 6. Bake for 30-35 minutes until peppers are tender.",
    generalNotes: "Bell peppers provide vitamin C and antioxidants, while the filling offers complete protein and complex carbohydrates for sustained energy.",
    baseCalories: 365,
    mealType: "dinner"
  }
];

// Function to expand meal plans to reach 100 total
const expandMealPlansData = () => {
  const expandedMealPlans = [...MEAL_PLANS_BASE_DATA];
  
  // Generate variations to reach desired count
  while (expandedMealPlans.length < 50) {
    const baseMeal = MEAL_PLANS_BASE_DATA[Math.floor(Math.random() * MEAL_PLANS_BASE_DATA.length)];
    const variations = [
      { suffix: "with Fresh Herbs", calorieAdjust: 10 },
      { suffix: "Mediterranean Style", calorieAdjust: 25 },
      { suffix: "Spicy Version", calorieAdjust: 5 },
      { suffix: "Light & Fresh", calorieAdjust: -20 },
      { suffix: "Protein Plus", calorieAdjust: 40 }
    ];
    
    const selectedVariation = variations[Math.floor(Math.random() * variations.length)];
    
    const variation = {
      ...baseMeal,
      name: `${baseMeal.name} (${selectedVariation.suffix})`,
      baseCalories: Math.max(150, baseMeal.baseCalories + selectedVariation.calorieAdjust)
    };
    expandedMealPlans.push(variation);
  }
  
  return expandedMealPlans;
};

const EXPANDED_MEAL_PLANS = expandMealPlansData();

// Export only the functions, not React handlers
export { 
  createDummyMealPlans, 
  cleanupDummyData,
  fetchActiveNutritionists,
  fetchMealCategories
};