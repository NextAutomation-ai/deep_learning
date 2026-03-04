import { db } from "./index";
import {
  contents,
  contentChunks,
  concepts,
  conceptRelationships,
  questions,
  flashcards,
} from "./schema";
import { eq } from "drizzle-orm";

const GUEST_USER_ID = "default-user";

export function seedGuestContent() {
  // Only seed if no content exists for guest
  const existing = db
    .select()
    .from(contents)
    .where(eq(contents.userId, GUEST_USER_ID))
    .all();
  if (existing.length > 0) return;

  seedMLContent();
  seedClimateContent();
}

// ─── Topic 1: Introduction to Machine Learning ───────────────

function seedMLContent() {
  const contentId = "guest-ml-intro";
  const now = new Date();

  db.insert(contents)
    .values({
      id: contentId,
      userId: GUEST_USER_ID,
      title: "Introduction to Machine Learning",
      sourceType: "text",
      processingStatus: "completed",
      processingProgress: 100,
      totalChunks: 3,
      totalConcepts: 6,
      rawText: "Sample content about machine learning fundamentals.",
      createdAt: now,
      updatedAt: now,
    })
    .run();

  // Chunks
  const chunkIds = ["guest-ml-chunk-1", "guest-ml-chunk-2", "guest-ml-chunk-3"];

  db.insert(contentChunks)
    .values([
      {
        id: chunkIds[0],
        contentId,
        chunkIndex: 0,
        chapterTitle: "What is Machine Learning?",
        text: "Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed. It focuses on developing algorithms that can access data, learn from it, and make predictions or decisions. The three main types are supervised learning, unsupervised learning, and reinforcement learning.",
      },
      {
        id: chunkIds[1],
        contentId,
        chunkIndex: 1,
        chapterTitle: "Supervised vs Unsupervised Learning",
        text: "In supervised learning, the algorithm learns from labeled training data, mapping inputs to known outputs. Common tasks include classification and regression. In unsupervised learning, the algorithm finds hidden patterns in unlabeled data. Common tasks include clustering and dimensionality reduction. Each approach has different use cases depending on the available data.",
      },
      {
        id: chunkIds[2],
        contentId,
        chunkIndex: 2,
        chapterTitle: "Neural Networks and Deep Learning",
        text: "Neural networks are computing systems inspired by biological neural networks. They consist of layers of interconnected nodes that process information. Deep learning uses neural networks with many layers (deep neural networks) to model complex patterns. Overfitting occurs when a model learns the training data too well, including noise, and fails to generalize to new data. Regularization techniques help prevent overfitting.",
      },
    ])
    .run();

  // Concepts
  const conceptIds = [
    "guest-ml-c1",
    "guest-ml-c2",
    "guest-ml-c3",
    "guest-ml-c4",
    "guest-ml-c5",
    "guest-ml-c6",
  ];

  db.insert(concepts)
    .values([
      {
        id: conceptIds[0],
        contentId,
        chunkId: chunkIds[0],
        name: "Machine Learning",
        definition: "A subset of AI that enables systems to learn from data and improve without explicit programming.",
        detailedExplanation: "Machine learning algorithms build models from sample data to make predictions or decisions. It powers applications like email filtering, computer vision, and recommendation systems.",
        conceptType: "term",
        difficultyLevel: 1,
        bloomsLevel: "remember",
        importanceScore: 0.9,
        createdAt: now,
      },
      {
        id: conceptIds[1],
        contentId,
        chunkId: chunkIds[1],
        name: "Supervised Learning",
        definition: "A learning approach where the algorithm trains on labeled data with known input-output pairs.",
        detailedExplanation: "In supervised learning, each training example has a corresponding label. The algorithm learns to map inputs to outputs, then predicts labels for unseen data. Examples include spam detection and image classification.",
        conceptType: "term",
        difficultyLevel: 2,
        bloomsLevel: "understand",
        importanceScore: 0.85,
        createdAt: now,
      },
      {
        id: conceptIds[2],
        contentId,
        chunkId: chunkIds[1],
        name: "Unsupervised Learning",
        definition: "A learning approach where the algorithm discovers hidden patterns in unlabeled data.",
        detailedExplanation: "Without labeled examples, unsupervised learning finds structure in data. Clustering groups similar items together, while dimensionality reduction simplifies complex data while preserving important relationships.",
        conceptType: "term",
        difficultyLevel: 2,
        bloomsLevel: "understand",
        importanceScore: 0.8,
        createdAt: now,
      },
      {
        id: conceptIds[3],
        contentId,
        chunkId: chunkIds[2],
        name: "Neural Network",
        definition: "A computing system inspired by biological neural networks, consisting of interconnected layers of nodes.",
        detailedExplanation: "Neural networks have an input layer, one or more hidden layers, and an output layer. Each connection has a weight that adjusts during training. They excel at pattern recognition tasks like image and speech recognition.",
        conceptType: "term",
        difficultyLevel: 3,
        bloomsLevel: "understand",
        importanceScore: 0.85,
        createdAt: now,
      },
      {
        id: conceptIds[4],
        contentId,
        chunkId: chunkIds[2],
        name: "Deep Learning",
        definition: "A subset of machine learning using neural networks with many layers to model complex patterns.",
        detailedExplanation: "Deep learning automates feature extraction, learning representations directly from raw data. It has achieved breakthroughs in natural language processing, computer vision, and game playing.",
        conceptType: "term",
        difficultyLevel: 3,
        bloomsLevel: "analyze",
        importanceScore: 0.8,
        createdAt: now,
      },
      {
        id: conceptIds[5],
        contentId,
        chunkId: chunkIds[2],
        name: "Overfitting",
        definition: "When a model learns training data too well, including noise, and fails to generalize to new data.",
        detailedExplanation: "Overfitting is one of the most common problems in machine learning. Signs include high accuracy on training data but poor performance on test data. Solutions include regularization, dropout, cross-validation, and using more training data.",
        conceptType: "term",
        difficultyLevel: 2,
        bloomsLevel: "apply",
        importanceScore: 0.75,
        createdAt: now,
      },
    ])
    .run();

  // Relationships
  db.insert(conceptRelationships)
    .values([
      { contentId, sourceConceptId: conceptIds[0], targetConceptId: conceptIds[1], relationshipType: "part_of", strength: 0.9 },
      { contentId, sourceConceptId: conceptIds[0], targetConceptId: conceptIds[2], relationshipType: "part_of", strength: 0.9 },
      { contentId, sourceConceptId: conceptIds[3], targetConceptId: conceptIds[4], relationshipType: "prerequisite", strength: 0.85 },
      { contentId, sourceConceptId: conceptIds[4], targetConceptId: conceptIds[0], relationshipType: "part_of", strength: 0.8 },
      { contentId, sourceConceptId: conceptIds[5], targetConceptId: conceptIds[3], relationshipType: "related", strength: 0.7 },
    ])
    .run();

  // Quiz questions
  db.insert(questions)
    .values([
      {
        contentId,
        conceptId: conceptIds[0],
        questionType: "mcq",
        questionText: "What is machine learning?",
        options: JSON.stringify(["A type of database", "A subset of AI that learns from data", "A programming language", "A hardware component"]),
        correctAnswer: "A subset of AI that learns from data",
        explanation: "Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed.",
        difficultyLevel: 1,
        bloomsLevel: "remember",
      },
      {
        contentId,
        conceptId: conceptIds[1],
        questionType: "mcq",
        questionText: "Which type of learning uses labeled training data?",
        options: JSON.stringify(["Unsupervised learning", "Reinforcement learning", "Supervised learning", "Transfer learning"]),
        correctAnswer: "Supervised learning",
        explanation: "Supervised learning trains on labeled data where each example has a known input-output pair.",
        difficultyLevel: 1,
        bloomsLevel: "remember",
      },
      {
        contentId,
        conceptId: conceptIds[2],
        questionType: "true_false",
        questionText: "Unsupervised learning requires labeled data to find patterns.",
        options: JSON.stringify(["True", "False"]),
        correctAnswer: "False",
        explanation: "Unsupervised learning discovers hidden patterns in unlabeled data, without needing predefined labels.",
        difficultyLevel: 1,
        bloomsLevel: "understand",
      },
      {
        contentId,
        conceptId: conceptIds[3],
        questionType: "mcq",
        questionText: "What are neural networks inspired by?",
        options: JSON.stringify(["Computer circuits", "Biological neural networks", "Mathematical theorems", "Search engines"]),
        correctAnswer: "Biological neural networks",
        explanation: "Neural networks are computing systems inspired by the structure of biological neural networks in the brain.",
        difficultyLevel: 2,
        bloomsLevel: "remember",
      },
      {
        contentId,
        conceptId: conceptIds[5],
        questionType: "mcq",
        questionText: "What is overfitting?",
        options: JSON.stringify(["When a model is too simple", "When a model memorizes training data and fails on new data", "When a model trains too slowly", "When a model uses too little data"]),
        correctAnswer: "When a model memorizes training data and fails on new data",
        explanation: "Overfitting occurs when a model learns the training data too well, including noise, and fails to generalize to unseen data.",
        difficultyLevel: 2,
        bloomsLevel: "understand",
      },
    ])
    .run();

  // Flashcards
  db.insert(flashcards)
    .values([
      { contentId, conceptId: conceptIds[0], frontText: "What is Machine Learning?", backText: "A subset of AI that enables systems to learn from data and improve without explicit programming.", difficultyLevel: 1 },
      { contentId, conceptId: conceptIds[1], frontText: "What is Supervised Learning?", backText: "A learning approach where the algorithm trains on labeled data with known input-output pairs. Examples: spam detection, image classification.", difficultyLevel: 2 },
      { contentId, conceptId: conceptIds[2], frontText: "What is Unsupervised Learning?", backText: "A learning approach where the algorithm discovers hidden patterns in unlabeled data. Examples: clustering, dimensionality reduction.", difficultyLevel: 2 },
      { contentId, conceptId: conceptIds[3], frontText: "What is a Neural Network?", backText: "A computing system inspired by biological neural networks, with interconnected layers of nodes (input, hidden, output) that process information.", difficultyLevel: 3 },
      { contentId, conceptId: conceptIds[5], frontText: "What is Overfitting and how do you prevent it?", backText: "When a model learns training data too well (including noise) and fails to generalize. Prevent with: regularization, dropout, cross-validation, more data.", difficultyLevel: 2 },
    ])
    .run();
}

// ─── Topic 2: Climate Change ─────────────────────────────────

function seedClimateContent() {
  const contentId = "guest-climate-101";
  const now = new Date();

  db.insert(contents)
    .values({
      id: contentId,
      userId: GUEST_USER_ID,
      title: "Climate Change: Causes and Solutions",
      sourceType: "text",
      processingStatus: "completed",
      processingProgress: 100,
      totalChunks: 3,
      totalConcepts: 5,
      rawText: "Sample content about climate change fundamentals.",
      createdAt: now,
      updatedAt: now,
    })
    .run();

  // Chunks
  const chunkIds = ["guest-cc-chunk-1", "guest-cc-chunk-2", "guest-cc-chunk-3"];

  db.insert(contentChunks)
    .values([
      {
        id: chunkIds[0],
        contentId,
        chunkIndex: 0,
        chapterTitle: "The Greenhouse Effect",
        text: "The greenhouse effect is a natural process where certain gases in Earth's atmosphere trap heat from the sun. Without it, Earth would be too cold to support life. However, human activities have dramatically increased the concentration of greenhouse gases, particularly carbon dioxide (CO2) and methane (CH4), amplifying this effect and causing global warming.",
      },
      {
        id: chunkIds[1],
        contentId,
        chunkIndex: 1,
        chapterTitle: "Human Impact",
        text: "A carbon footprint measures the total greenhouse gas emissions caused by an individual, event, organization, or product. The burning of fossil fuels for electricity, heat, and transportation is the largest source of global greenhouse gas emissions. Deforestation also contributes significantly as trees absorb CO2 and removing them reduces Earth's capacity to process carbon.",
      },
      {
        id: chunkIds[2],
        contentId,
        chunkIndex: 2,
        chapterTitle: "Solutions and Renewable Energy",
        text: "Renewable energy sources such as solar, wind, and hydroelectric power produce little to no greenhouse gas emissions. Transitioning from fossil fuels to renewables is considered one of the most effective strategies for mitigating climate change. The Paris Agreement, signed by 196 countries, aims to limit global warming to 1.5°C above pre-industrial levels through collective action.",
      },
    ])
    .run();

  // Concepts
  const conceptIds = [
    "guest-cc-c1",
    "guest-cc-c2",
    "guest-cc-c3",
    "guest-cc-c4",
    "guest-cc-c5",
  ];

  db.insert(concepts)
    .values([
      {
        id: conceptIds[0],
        contentId,
        chunkId: chunkIds[0],
        name: "Greenhouse Effect",
        definition: "A natural process where atmospheric gases trap heat from the sun, warming Earth's surface.",
        detailedExplanation: "Greenhouse gases like CO2, methane, and water vapor allow sunlight to pass through but absorb and re-emit infrared radiation, warming the lower atmosphere. Human activities have intensified this natural effect.",
        conceptType: "process",
        difficultyLevel: 1,
        bloomsLevel: "understand",
        importanceScore: 0.9,
        createdAt: now,
      },
      {
        id: conceptIds[1],
        contentId,
        chunkId: chunkIds[1],
        name: "Carbon Footprint",
        definition: "The total greenhouse gas emissions caused by an individual, organization, event, or product.",
        detailedExplanation: "Carbon footprints are usually measured in tonnes of CO2 equivalent. Reducing one's carbon footprint can involve using public transport, eating less meat, reducing energy consumption, and choosing renewable energy.",
        conceptType: "term",
        difficultyLevel: 1,
        bloomsLevel: "remember",
        importanceScore: 0.8,
        createdAt: now,
      },
      {
        id: conceptIds[2],
        contentId,
        chunkId: chunkIds[1],
        name: "Fossil Fuels",
        definition: "Non-renewable energy sources (coal, oil, natural gas) formed from ancient organic matter that release CO2 when burned.",
        detailedExplanation: "Fossil fuels currently supply about 80% of the world's energy. Their combustion is the primary driver of increased atmospheric CO2. Transitioning away from fossil fuels is central to climate change mitigation.",
        conceptType: "term",
        difficultyLevel: 1,
        bloomsLevel: "remember",
        importanceScore: 0.85,
        createdAt: now,
      },
      {
        id: conceptIds[3],
        contentId,
        chunkId: chunkIds[2],
        name: "Renewable Energy",
        definition: "Energy from sources that are naturally replenished — solar, wind, hydroelectric, geothermal.",
        detailedExplanation: "Renewable energy produces little to no greenhouse gas emissions during operation. Solar and wind costs have dropped dramatically, making them competitive with fossil fuels in many regions.",
        conceptType: "term",
        difficultyLevel: 2,
        bloomsLevel: "understand",
        importanceScore: 0.85,
        createdAt: now,
      },
      {
        id: conceptIds[4],
        contentId,
        chunkId: chunkIds[2],
        name: "Paris Agreement",
        definition: "An international treaty signed by 196 countries to limit global warming to 1.5°C above pre-industrial levels.",
        detailedExplanation: "Adopted in 2015, the Paris Agreement requires countries to set nationally determined contributions (NDCs) and progressively strengthen their climate targets over time.",
        conceptType: "fact",
        difficultyLevel: 2,
        bloomsLevel: "remember",
        importanceScore: 0.75,
        createdAt: now,
      },
    ])
    .run();

  // Relationships
  db.insert(conceptRelationships)
    .values([
      { contentId, sourceConceptId: conceptIds[0], targetConceptId: conceptIds[2], relationshipType: "causes", strength: 0.85 },
      { contentId, sourceConceptId: conceptIds[2], targetConceptId: conceptIds[1], relationshipType: "related", strength: 0.8 },
      { contentId, sourceConceptId: conceptIds[3], targetConceptId: conceptIds[2], relationshipType: "opposite", strength: 0.9 },
      { contentId, sourceConceptId: conceptIds[4], targetConceptId: conceptIds[3], relationshipType: "supports", strength: 0.8 },
    ])
    .run();

  // Quiz questions
  db.insert(questions)
    .values([
      {
        contentId,
        conceptId: conceptIds[0],
        questionType: "mcq",
        questionText: "What is the greenhouse effect?",
        options: JSON.stringify(["A type of farming technique", "A process where atmospheric gases trap heat from the sun", "A cooling phenomenon", "A weather pattern"]),
        correctAnswer: "A process where atmospheric gases trap heat from the sun",
        explanation: "The greenhouse effect is a natural process where gases in the atmosphere trap solar heat, warming Earth's surface.",
        difficultyLevel: 1,
        bloomsLevel: "remember",
      },
      {
        contentId,
        conceptId: conceptIds[1],
        questionType: "mcq",
        questionText: "What does a carbon footprint measure?",
        options: JSON.stringify(["Physical footprint size", "Total greenhouse gas emissions", "Amount of carbon in soil", "Forest density"]),
        correctAnswer: "Total greenhouse gas emissions",
        explanation: "A carbon footprint measures the total greenhouse gas emissions caused by an individual, organization, event, or product.",
        difficultyLevel: 1,
        bloomsLevel: "remember",
      },
      {
        contentId,
        conceptId: conceptIds[2],
        questionType: "true_false",
        questionText: "Burning fossil fuels is the largest source of global greenhouse gas emissions.",
        options: JSON.stringify(["True", "False"]),
        correctAnswer: "True",
        explanation: "The combustion of fossil fuels for energy and transportation is indeed the primary source of greenhouse gas emissions globally.",
        difficultyLevel: 1,
        bloomsLevel: "remember",
      },
      {
        contentId,
        conceptId: conceptIds[3],
        questionType: "mcq",
        questionText: "Which of the following is a renewable energy source?",
        options: JSON.stringify(["Coal", "Natural gas", "Solar power", "Oil"]),
        correctAnswer: "Solar power",
        explanation: "Solar power is renewable as it comes from sunlight, which is naturally replenished. Coal, natural gas, and oil are non-renewable fossil fuels.",
        difficultyLevel: 1,
        bloomsLevel: "remember",
      },
      {
        contentId,
        conceptId: conceptIds[4],
        questionType: "mcq",
        questionText: "What temperature limit does the Paris Agreement aim to achieve?",
        options: JSON.stringify(["3°C above pre-industrial levels", "1.5°C above pre-industrial levels", "0°C change", "5°C above pre-industrial levels"]),
        correctAnswer: "1.5°C above pre-industrial levels",
        explanation: "The Paris Agreement aims to limit global warming to 1.5°C above pre-industrial levels through collective international action.",
        difficultyLevel: 2,
        bloomsLevel: "remember",
      },
    ])
    .run();

  // Flashcards
  db.insert(flashcards)
    .values([
      { contentId, conceptId: conceptIds[0], frontText: "What is the Greenhouse Effect?", backText: "A natural process where atmospheric gases (CO2, methane, water vapor) trap heat from the sun, warming Earth's surface. Human activities have intensified it.", difficultyLevel: 1 },
      { contentId, conceptId: conceptIds[1], frontText: "What is a Carbon Footprint?", backText: "The total greenhouse gas emissions caused by an individual, organization, event, or product. Measured in tonnes of CO2 equivalent.", difficultyLevel: 1 },
      { contentId, conceptId: conceptIds[2], frontText: "Why are Fossil Fuels a problem?", backText: "Fossil fuels (coal, oil, gas) release CO2 when burned and supply ~80% of world energy. They are the primary driver of increased atmospheric CO2.", difficultyLevel: 1 },
      { contentId, conceptId: conceptIds[3], frontText: "What is Renewable Energy?", backText: "Energy from naturally replenished sources: solar, wind, hydroelectric, geothermal. Produces little to no greenhouse gas emissions during operation.", difficultyLevel: 2 },
      { contentId, conceptId: conceptIds[4], frontText: "What is the Paris Agreement?", backText: "An international treaty (2015) signed by 196 countries to limit global warming to 1.5°C above pre-industrial levels through nationally determined contributions.", difficultyLevel: 2 },
    ])
    .run();
}
