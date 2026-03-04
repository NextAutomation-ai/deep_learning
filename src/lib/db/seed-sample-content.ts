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

/**
 * Seed 2 sample topics (ML Textbook + Climate Change) for any user.
 * Skips if the user already has content.
 */
export function seedSampleContentForUser(userId: string) {
  const existing = db
    .select()
    .from(contents)
    .where(eq(contents.userId, userId))
    .all();
  if (existing.length > 0) return;

  const p = userId === "default-user" ? "guest" : userId.slice(0, 8);
  seedMLTextbook(userId, p);
  seedClimateEducation(userId, p);
}

/** Convenience wrapper for guest user */
export function seedGuestContent() {
  seedSampleContentForUser("default-user");
}

// ─── Topic 1: Introduction to Machine Learning (Textbook) ────

function seedMLTextbook(userId: string, p: string) {
  const contentId = `${p}-ml-textbook`;
  const now = new Date();

  db.insert(contents)
    .values({
      id: contentId,
      userId,
      title: "Introduction to Machine Learning — Smola & Vishwanathan",
      sourceType: "pdf",
      processingStatus: "completed",
      processingProgress: 100,
      totalChunks: 4,
      totalConcepts: 8,
      rawText: "Introduction to Machine Learning by Alex Smola and S.V.N. Vishwanathan, Cambridge University Press.",
      createdAt: now,
      updatedAt: now,
    })
    .run();

  const chunkIds = [
    `${p}-mltb-chunk-1`,
    `${p}-mltb-chunk-2`,
    `${p}-mltb-chunk-3`,
    `${p}-mltb-chunk-4`,
  ];

  db.insert(contentChunks)
    .values([
      {
        id: chunkIds[0],
        contentId,
        chunkIndex: 0,
        chapterTitle: "A Taste of Machine Learning",
        text: "Machine learning can appear in many guises. Much of the art of machine learning is to reduce a range of fairly disparate problems to a set of fairly narrow prototypes. Applications include web page ranking where a search engine needs to know which pages are relevant to a query. Collaborative filtering is used by stores like Amazon and Netflix to predict future purchases from past behaviour. Text classification, such as spam filtering, assigns emails to categories. Increasingly machine learning rather than guesswork and clever engineering is used to automate the process of designing good systems.",
      },
      {
        id: chunkIds[1],
        contentId,
        chunkIndex: 1,
        chapterTitle: "Probability Theory",
        text: "In order to deal with instances where machine learning can be used, we need to develop an adequate language to describe problems concisely. Probability theory allows us to model uncertainty in the outcome of experiments. A random variable associates numerical values to outcomes. The assignment of probabilities to a discrete random variable is called a probability mass function (PMF), which must be non-negative and sum to one. For continuous random variables, we use a probability density function (PDF). Bayes rule allows us to compute conditional probabilities: p(Y|X) = p(X|Y) * p(Y) / p(X), which is fundamental to many machine learning algorithms.",
      },
      {
        id: chunkIds[2],
        contentId,
        chunkIndex: 2,
        chapterTitle: "Basic Algorithms",
        text: "Naive Bayes is a simple but effective classifier that assumes features are conditionally independent given the class label, using Bayes rule to compute posterior probabilities. Nearest Neighbor estimators classify new points based on the closest training examples in feature space. The Perceptron is a linear classifier that iteratively updates weights when misclassifications occur. K-Means is an unsupervised clustering algorithm that partitions data into K clusters by iteratively assigning points to the nearest centroid and recomputing centroids until convergence.",
      },
      {
        id: chunkIds[3],
        contentId,
        chunkIndex: 3,
        chapterTitle: "Optimization and Density Estimation",
        text: "Optimization is central to machine learning — most algorithms work by minimizing a loss function. Gradient descent iteratively moves in the direction of steepest descent to find the minimum. Convex functions have the property that any local minimum is also a global minimum, making optimization tractable. Maximum Likelihood Estimation (MLE) finds parameters that maximize the probability of observing the training data. The bias-variance tradeoff describes the tension between a model's ability to fit training data (low bias) and generalize to new data (low variance). Stochastic gradient descent processes one sample at a time, making it efficient for large datasets.",
      },
    ])
    .run();

  const conceptIds = [
    `${p}-mltb-c1`,
    `${p}-mltb-c2`,
    `${p}-mltb-c3`,
    `${p}-mltb-c4`,
    `${p}-mltb-c5`,
    `${p}-mltb-c6`,
    `${p}-mltb-c7`,
    `${p}-mltb-c8`,
  ];

  db.insert(concepts)
    .values([
      {
        id: conceptIds[0],
        contentId,
        chunkId: chunkIds[0],
        name: "Collaborative Filtering",
        definition: "A technique used to predict user preferences by collecting preferences from many users, as used by Amazon and Netflix.",
        detailedExplanation: "Collaborative filtering works by finding users with similar tastes and recommending items that similar users liked. It can be user-based (find similar users) or item-based (find similar items). It powers most modern recommendation systems.",
        conceptType: "term",
        difficultyLevel: 2,
        bloomsLevel: "understand",
        importanceScore: 0.8,
        createdAt: now,
      },
      {
        id: conceptIds[1],
        contentId,
        chunkId: chunkIds[1],
        name: "Bayes Rule",
        definition: "A formula to compute conditional probabilities: P(Y|X) = P(X|Y) * P(Y) / P(X).",
        detailedExplanation: "Bayes rule is the cornerstone of probabilistic machine learning. It allows updating beliefs about a hypothesis given new evidence. The prior P(Y) represents initial beliefs, the likelihood P(X|Y) represents how well the evidence fits the hypothesis, and the posterior P(Y|X) is the updated belief.",
        conceptType: "formula",
        difficultyLevel: 3,
        bloomsLevel: "apply",
        importanceScore: 0.95,
        createdAt: now,
      },
      {
        id: conceptIds[2],
        contentId,
        chunkId: chunkIds[1],
        name: "Probability Density Function",
        definition: "A function that describes the likelihood of a continuous random variable taking on a particular value; must be non-negative and integrate to one.",
        detailedExplanation: "Unlike discrete probability mass functions, PDFs give the density of probability rather than exact probabilities. The probability of a variable falling in a range is the integral of the PDF over that range. Common PDFs include the normal (Gaussian) and uniform distributions.",
        conceptType: "term",
        difficultyLevel: 2,
        bloomsLevel: "understand",
        importanceScore: 0.85,
        createdAt: now,
      },
      {
        id: conceptIds[3],
        contentId,
        chunkId: chunkIds[2],
        name: "Naive Bayes Classifier",
        definition: "A simple classifier that assumes all features are conditionally independent given the class label, using Bayes rule to compute posterior probabilities.",
        detailedExplanation: "Despite its strong independence assumption (which is rarely true in practice), Naive Bayes works surprisingly well for text classification, spam filtering, and sentiment analysis. It is computationally efficient and requires relatively little training data.",
        conceptType: "process",
        difficultyLevel: 2,
        bloomsLevel: "apply",
        importanceScore: 0.85,
        createdAt: now,
      },
      {
        id: conceptIds[4],
        contentId,
        chunkId: chunkIds[2],
        name: "K-Means Clustering",
        definition: "An unsupervised algorithm that partitions data into K clusters by iteratively assigning points to the nearest centroid and recomputing centroids.",
        detailedExplanation: "K-Means starts by randomly initializing K centroids. Each point is assigned to the nearest centroid, then centroids are recomputed as the mean of assigned points. This repeats until convergence. The algorithm is sensitive to initialization and the choice of K.",
        conceptType: "process",
        difficultyLevel: 2,
        bloomsLevel: "apply",
        importanceScore: 0.85,
        createdAt: now,
      },
      {
        id: conceptIds[5],
        contentId,
        chunkId: chunkIds[2],
        name: "Perceptron",
        definition: "A linear classifier that iteratively updates weights when misclassifications occur, forming a decision boundary.",
        detailedExplanation: "The perceptron algorithm processes training examples one at a time. If a point is misclassified, the weight vector is updated by adding (or subtracting) the feature vector. It converges in finite steps if the data is linearly separable. It is the building block for neural networks.",
        conceptType: "process",
        difficultyLevel: 3,
        bloomsLevel: "apply",
        importanceScore: 0.8,
        createdAt: now,
      },
      {
        id: conceptIds[6],
        contentId,
        chunkId: chunkIds[3],
        name: "Gradient Descent",
        definition: "An iterative optimization algorithm that moves in the direction of steepest descent to find the minimum of a function.",
        detailedExplanation: "Gradient descent computes the gradient (derivative) of the loss function and takes a step proportional to the negative gradient. The learning rate controls step size — too large causes divergence, too small causes slow convergence. Variants include batch, mini-batch, and stochastic gradient descent.",
        conceptType: "process",
        difficultyLevel: 3,
        bloomsLevel: "apply",
        importanceScore: 0.95,
        createdAt: now,
      },
      {
        id: conceptIds[7],
        contentId,
        chunkId: chunkIds[3],
        name: "Bias-Variance Tradeoff",
        definition: "The tension between a model's ability to fit training data (low bias) and its ability to generalize to unseen data (low variance).",
        detailedExplanation: "High bias means the model is too simple and underfits (e.g., linear model for nonlinear data). High variance means the model is too complex and overfits (memorizes noise). The goal is to find the sweet spot that minimizes total error. Techniques like cross-validation help find this balance.",
        conceptType: "principle",
        difficultyLevel: 3,
        bloomsLevel: "analyze",
        importanceScore: 0.9,
        createdAt: now,
      },
    ])
    .run();

  db.insert(conceptRelationships)
    .values([
      { contentId, sourceConceptId: conceptIds[1], targetConceptId: conceptIds[3], relationshipType: "prerequisite", strength: 0.9 },
      { contentId, sourceConceptId: conceptIds[2], targetConceptId: conceptIds[1], relationshipType: "related", strength: 0.8 },
      { contentId, sourceConceptId: conceptIds[5], targetConceptId: conceptIds[6], relationshipType: "related", strength: 0.75 },
      { contentId, sourceConceptId: conceptIds[6], targetConceptId: conceptIds[7], relationshipType: "related", strength: 0.85 },
      { contentId, sourceConceptId: conceptIds[4], targetConceptId: conceptIds[6], relationshipType: "related", strength: 0.7 },
      { contentId, sourceConceptId: conceptIds[0], targetConceptId: conceptIds[3], relationshipType: "related", strength: 0.65 },
    ])
    .run();

  db.insert(questions)
    .values([
      {
        contentId,
        conceptId: conceptIds[1],
        questionType: "mcq",
        questionText: "What does Bayes rule compute?",
        options: (["The mean of a dataset", "Conditional probability P(Y|X) from P(X|Y), P(Y) and P(X)", "The variance of a distribution", "The gradient of a loss function"]),
        correctAnswer: "Conditional probability P(Y|X) from P(X|Y), P(Y) and P(X)",
        explanation: "Bayes rule states P(Y|X) = P(X|Y) * P(Y) / P(X), allowing us to update beliefs about a hypothesis given new evidence.",
        difficultyLevel: 2,
        bloomsLevel: "remember",
      },
      {
        contentId,
        conceptId: conceptIds[3],
        questionType: "mcq",
        questionText: "What assumption does the Naive Bayes classifier make?",
        options: (["Features are correlated", "Features are conditionally independent given the class", "All features have equal weight", "The data is normally distributed"]),
        correctAnswer: "Features are conditionally independent given the class",
        explanation: "Naive Bayes assumes all features are conditionally independent given the class label, which simplifies computation despite rarely being true in practice.",
        difficultyLevel: 2,
        bloomsLevel: "understand",
      },
      {
        contentId,
        conceptId: conceptIds[4],
        questionType: "mcq",
        questionText: "What does K-Means clustering optimize?",
        options: (["The number of features", "The distance between points and their assigned cluster centroids", "The probability of each class", "The depth of a decision tree"]),
        correctAnswer: "The distance between points and their assigned cluster centroids",
        explanation: "K-Means iteratively assigns points to the nearest centroid and recomputes centroids to minimize the total within-cluster distance.",
        difficultyLevel: 2,
        bloomsLevel: "understand",
      },
      {
        contentId,
        conceptId: conceptIds[6],
        questionType: "mcq",
        questionText: "What happens if the learning rate in gradient descent is too large?",
        options: (["Convergence is guaranteed", "The algorithm diverges and overshoots the minimum", "Training becomes faster with no downside", "The model underfits"]),
        correctAnswer: "The algorithm diverges and overshoots the minimum",
        explanation: "A too-large learning rate causes the optimizer to take steps that are too big, overshooting the minimum and potentially diverging.",
        difficultyLevel: 3,
        bloomsLevel: "apply",
      },
      {
        contentId,
        conceptId: conceptIds[7],
        questionType: "true_false",
        questionText: "A model with high variance is likely overfitting the training data.",
        options: (["True", "False"]),
        correctAnswer: "True",
        explanation: "High variance means the model is too sensitive to training data specifics (including noise), which is the hallmark of overfitting.",
        difficultyLevel: 2,
        bloomsLevel: "understand",
      },
      {
        contentId,
        conceptId: conceptIds[5],
        questionType: "mcq",
        questionText: "What is the perceptron guaranteed to do if data is linearly separable?",
        options: (["Find the optimal margin", "Converge in finite steps", "Minimize the squared error", "Cluster the data"]),
        correctAnswer: "Converge in finite steps",
        explanation: "The perceptron convergence theorem guarantees that the algorithm will find a separating hyperplane in a finite number of updates if the data is linearly separable.",
        difficultyLevel: 3,
        bloomsLevel: "remember",
      },
    ])
    .run();

  db.insert(flashcards)
    .values([
      { contentId, conceptId: conceptIds[1], frontText: "State Bayes Rule and explain each component.", backText: "P(Y|X) = P(X|Y) * P(Y) / P(X). P(Y) = prior belief, P(X|Y) = likelihood of evidence given hypothesis, P(X) = marginal probability of evidence, P(Y|X) = posterior (updated belief).", difficultyLevel: 3 },
      { contentId, conceptId: conceptIds[3], frontText: "What is the Naive Bayes classifier and why does it work?", backText: "Assumes features are conditionally independent given the class label. Despite this strong assumption rarely being true, it works well for text classification and spam filtering because the independence violations often cancel out.", difficultyLevel: 2 },
      { contentId, conceptId: conceptIds[4], frontText: "Describe the K-Means algorithm step by step.", backText: "1) Initialize K random centroids. 2) Assign each point to nearest centroid. 3) Recompute centroids as mean of assigned points. 4) Repeat steps 2-3 until convergence. Sensitive to initialization and choice of K.", difficultyLevel: 2 },
      { contentId, conceptId: conceptIds[6], frontText: "What is Gradient Descent and what are its variants?", backText: "Iterative optimization that moves in the direction of steepest descent (negative gradient). Variants: Batch (uses all data), Mini-batch (uses subsets), Stochastic (SGD, uses one sample). Learning rate controls step size.", difficultyLevel: 3 },
      { contentId, conceptId: conceptIds[7], frontText: "Explain the Bias-Variance Tradeoff.", backText: "High bias = model too simple, underfits. High variance = model too complex, overfits. Total error = bias² + variance + irreducible noise. Goal: find the sweet spot. Use cross-validation to balance.", difficultyLevel: 3 },
      { contentId, conceptId: conceptIds[5], frontText: "How does the Perceptron algorithm learn?", backText: "Processes training examples one at a time. If a point is misclassified, update weight: w = w + y*x. Converges in finite steps if data is linearly separable. Building block of neural networks.", difficultyLevel: 3 },
    ])
    .run();
}

// ─── Topic 2: Climate Change Education (UNESCO/UNEP) ─────────

function seedClimateEducation(userId: string, p: string) {
  const contentId = `${p}-climate-edu`;
  const now = new Date();

  db.insert(contents)
    .values({
      id: contentId,
      userId,
      title: "Climate Change Starter's Guidebook — UNESCO/UNEP",
      sourceType: "pdf",
      processingStatus: "completed",
      processingProgress: 100,
      totalChunks: 4,
      totalConcepts: 8,
      rawText: "Climate Change Starter's Guidebook. An issues guide for education planners and practitioners. UNESCO/UNEP 2011.",
      createdAt: now,
      updatedAt: now,
    })
    .run();

  const chunkIds = [
    `${p}-cedu-chunk-1`,
    `${p}-cedu-chunk-2`,
    `${p}-cedu-chunk-3`,
    `${p}-cedu-chunk-4`,
  ];

  db.insert(contentChunks)
    .values([
      {
        id: chunkIds[0],
        contentId,
        chunkIndex: 0,
        chapterTitle: "The Science of Climate Change",
        text: "Climate is described with average values and typical variability over periods of thirty years, distinguishing it from day-to-day weather. The Earth's climate system balances energy surpluses at the equator with deficits at the poles using the atmosphere and oceans. Four main factors drive long-term climate change: changes in Earth's orbit around the Sun, variations in solar output, changes in ocean circulation, and changes in atmospheric composition. Human activities since the industrial age have altered the atmospheric composition by increasing concentrations of greenhouse gases — CO2, methane (CH4), and nitrous oxide (N2O).",
      },
      {
        id: chunkIds[1],
        contentId,
        chunkIndex: 1,
        chapterTitle: "Society and Climate Change",
        text: "Climate change has both extreme impacts (storms, heat waves) and slow-onset effects (sea level rise, desertification). These can lead to climate migration, displacing millions through shoreline erosion, coastal flooding, and agricultural disruption. The world's poorest populations are the most vulnerable because they depend most directly on natural resources and have the least capacity to adapt. Health impacts include increased vector-borne diseases, heat stress, and malnutrition. Climate change also has gender dimensions — women in developing countries are disproportionately affected as they bear primary responsibility for water, food, and fuel collection.",
      },
      {
        id: chunkIds[2],
        contentId,
        chunkIndex: 2,
        chapterTitle: "Responding to Climate Change",
        text: "Mitigation and adaptation are two complementary approaches. Mitigation tackles the causes by reducing greenhouse gas emissions through renewable energy, energy efficiency, and changing consumption patterns. Policy options include carbon taxes, cap-and-trade systems, and subsidies for clean energy. Adaptation addresses the consequences by adjusting infrastructure, agriculture, and water management to new climate realities. The UNFCCC and Kyoto Protocol established the international framework for collective action. The economic dimension is crucial — the Stern Review estimated that the cost of inaction far exceeds the cost of early mitigation.",
      },
      {
        id: chunkIds[3],
        contentId,
        chunkIndex: 3,
        chapterTitle: "Education and Climate Change",
        text: "Education for Sustainable Development (ESD) takes climate change education beyond pure science to include social, economic, and ethical dimensions. Climate change education for mitigation focuses on changing behaviours — reducing energy consumption, sustainable transportation, and responsible consumption. Education for adaptation helps communities learn to deal with local changes — new farming techniques, water conservation, and disaster preparedness. Education for Disaster Risk Reduction prepares populations for extreme weather events through early warning systems, evacuation planning, and community resilience building.",
      },
    ])
    .run();

  const conceptIds = [
    `${p}-cedu-c1`,
    `${p}-cedu-c2`,
    `${p}-cedu-c3`,
    `${p}-cedu-c4`,
    `${p}-cedu-c5`,
    `${p}-cedu-c6`,
    `${p}-cedu-c7`,
    `${p}-cedu-c8`,
  ];

  db.insert(concepts)
    .values([
      {
        id: conceptIds[0],
        contentId,
        chunkId: chunkIds[0],
        name: "Climate vs Weather",
        definition: "Climate is the average of weather conditions over 30+ years, while weather is the day-to-day atmospheric state.",
        detailedExplanation: "Climate is described using statistical measures like mean temperature and seasonal variability over a standard 30-year period. Weather is the instantaneous atmospheric condition. Climate change refers to long-term shifts in these averages, not short-term weather variations.",
        conceptType: "term",
        difficultyLevel: 1,
        bloomsLevel: "understand",
        importanceScore: 0.85,
        createdAt: now,
      },
      {
        id: conceptIds[1],
        contentId,
        chunkId: chunkIds[0],
        name: "Greenhouse Gases (GHGs)",
        definition: "Gases in the atmosphere that trap heat from the Sun, including CO2, methane (CH4), and nitrous oxide (N2O).",
        detailedExplanation: "GHGs allow solar radiation in but absorb and re-emit infrared radiation, warming the lower atmosphere. Human activities since the Industrial Revolution (~1750) have increased their concentration dramatically. CO2 comes mainly from fossil fuel burning, CH4 from agriculture and waste, and N2O from fertilizers.",
        conceptType: "term",
        difficultyLevel: 1,
        bloomsLevel: "remember",
        importanceScore: 0.95,
        createdAt: now,
      },
      {
        id: conceptIds[2],
        contentId,
        chunkId: chunkIds[1],
        name: "Climate Migration",
        definition: "The displacement of people due to climate change impacts such as sea level rise, desertification, and extreme weather events.",
        detailedExplanation: "Climate migrants are forced to move by shoreline erosion, coastal flooding, agricultural disruption, and water scarcity. Unlike political refugees, climate migrants lack international legal protection. The scale is projected to reach hundreds of millions by 2050.",
        conceptType: "term",
        difficultyLevel: 2,
        bloomsLevel: "understand",
        importanceScore: 0.8,
        createdAt: now,
      },
      {
        id: conceptIds[3],
        contentId,
        chunkId: chunkIds[1],
        name: "Climate Vulnerability",
        definition: "The degree to which a population is susceptible to climate change impacts, often highest among the world's poorest.",
        detailedExplanation: "Vulnerability depends on exposure, sensitivity, and adaptive capacity. Poor communities are most vulnerable because they depend on climate-sensitive resources (rain-fed agriculture), live in exposed areas (floodplains, coasts), and lack financial and institutional resources to adapt.",
        conceptType: "principle",
        difficultyLevel: 2,
        bloomsLevel: "analyze",
        importanceScore: 0.85,
        createdAt: now,
      },
      {
        id: conceptIds[4],
        contentId,
        chunkId: chunkIds[2],
        name: "Climate Mitigation",
        definition: "Actions that reduce greenhouse gas emissions to tackle the causes of climate change.",
        detailedExplanation: "Mitigation strategies include transitioning to renewable energy, improving energy efficiency, changing land use practices, and carbon capture. Policy tools include carbon taxes, cap-and-trade systems, regulations, and subsidies for clean technology.",
        conceptType: "term",
        difficultyLevel: 1,
        bloomsLevel: "understand",
        importanceScore: 0.9,
        createdAt: now,
      },
      {
        id: conceptIds[5],
        contentId,
        chunkId: chunkIds[2],
        name: "Climate Adaptation",
        definition: "Adjustments in systems and practices to reduce harm from the actual or expected effects of climate change.",
        detailedExplanation: "Adaptation accepts that some climate change is unavoidable and focuses on reducing vulnerability. Examples include building sea walls, developing drought-resistant crops, improving water storage, updating building codes, and creating early warning systems for extreme weather.",
        conceptType: "term",
        difficultyLevel: 1,
        bloomsLevel: "understand",
        importanceScore: 0.9,
        createdAt: now,
      },
      {
        id: conceptIds[6],
        contentId,
        chunkId: chunkIds[2],
        name: "Carbon Tax vs Cap-and-Trade",
        definition: "Two market-based policy instruments for reducing greenhouse gas emissions.",
        detailedExplanation: "A carbon tax sets a price on each tonne of CO2 emitted, giving emitters a financial incentive to reduce emissions. Cap-and-trade sets a total emissions limit (cap) and lets companies trade emission allowances. Both aim to internalize the environmental cost of emissions.",
        conceptType: "term",
        difficultyLevel: 3,
        bloomsLevel: "analyze",
        importanceScore: 0.8,
        createdAt: now,
      },
      {
        id: conceptIds[7],
        contentId,
        chunkId: chunkIds[3],
        name: "Education for Sustainable Development (ESD)",
        definition: "An educational approach that integrates environmental, social, and economic dimensions to empower learners to take action for sustainability.",
        detailedExplanation: "ESD goes beyond teaching climate science to include values, attitudes, and behaviours. It covers mitigation (changing consumption), adaptation (preparing for local impacts), and disaster risk reduction (emergency preparedness). UNESCO promotes ESD as essential for addressing climate change.",
        conceptType: "principle",
        difficultyLevel: 2,
        bloomsLevel: "understand",
        importanceScore: 0.85,
        createdAt: now,
      },
    ])
    .run();

  db.insert(conceptRelationships)
    .values([
      { contentId, sourceConceptId: conceptIds[1], targetConceptId: conceptIds[0], relationshipType: "related", strength: 0.8 },
      { contentId, sourceConceptId: conceptIds[1], targetConceptId: conceptIds[4], relationshipType: "related", strength: 0.9 },
      { contentId, sourceConceptId: conceptIds[2], targetConceptId: conceptIds[3], relationshipType: "related", strength: 0.85 },
      { contentId, sourceConceptId: conceptIds[4], targetConceptId: conceptIds[5], relationshipType: "related", strength: 0.95 },
      { contentId, sourceConceptId: conceptIds[6], targetConceptId: conceptIds[4], relationshipType: "part_of", strength: 0.85 },
      { contentId, sourceConceptId: conceptIds[7], targetConceptId: conceptIds[4], relationshipType: "supports", strength: 0.8 },
      { contentId, sourceConceptId: conceptIds[7], targetConceptId: conceptIds[5], relationshipType: "supports", strength: 0.8 },
    ])
    .run();

  db.insert(questions)
    .values([
      {
        contentId,
        conceptId: conceptIds[0],
        questionType: "mcq",
        questionText: "What is the standard time period used to calculate climate statistics?",
        options: (["1 year", "10 years", "30 years", "100 years"]),
        correctAnswer: "30 years",
        explanation: "Climate statistics are calculated over a standard period of about 30 years (e.g. 1981–2010) to distinguish long-term patterns from short-term weather variations.",
        difficultyLevel: 1,
        bloomsLevel: "remember",
      },
      {
        contentId,
        conceptId: conceptIds[1],
        questionType: "mcq",
        questionText: "Which of the following is NOT a major greenhouse gas?",
        options: (["Carbon dioxide (CO2)", "Methane (CH4)", "Nitrogen (N2)", "Nitrous oxide (N2O)"]),
        correctAnswer: "Nitrogen (N2)",
        explanation: "Nitrogen (N2) makes up 78% of the atmosphere but is not a greenhouse gas. CO2, CH4, and N2O are the primary GHGs increased by human activity.",
        difficultyLevel: 1,
        bloomsLevel: "remember",
      },
      {
        contentId,
        conceptId: conceptIds[3],
        questionType: "mcq",
        questionText: "Why are the world's poorest populations most vulnerable to climate change?",
        options: (["They produce the most emissions", "They depend on climate-sensitive resources and lack adaptive capacity", "They live only in cold regions", "They refuse to adopt new technology"]),
        correctAnswer: "They depend on climate-sensitive resources and lack adaptive capacity",
        explanation: "Poor communities rely on rain-fed agriculture, live in exposed areas, and lack the financial and institutional resources to adapt to changing conditions.",
        difficultyLevel: 2,
        bloomsLevel: "understand",
      },
      {
        contentId,
        conceptId: conceptIds[4],
        questionType: "mcq",
        questionText: "What is the difference between climate mitigation and adaptation?",
        options: (["Mitigation reduces GHG emissions; adaptation adjusts to impacts", "They are the same thing", "Mitigation adjusts to impacts; adaptation reduces emissions", "Mitigation is local; adaptation is global"]),
        correctAnswer: "Mitigation reduces GHG emissions; adaptation adjusts to impacts",
        explanation: "Mitigation tackles the causes of climate change by reducing emissions. Adaptation addresses the consequences by adjusting systems to cope with new climate realities. Both are complementary approaches.",
        difficultyLevel: 1,
        bloomsLevel: "understand",
      },
      {
        contentId,
        conceptId: conceptIds[6],
        questionType: "true_false",
        questionText: "A cap-and-trade system sets a fixed price per tonne of CO2.",
        options: (["True", "False"]),
        correctAnswer: "False",
        explanation: "A carbon TAX sets a fixed price per tonne. Cap-and-trade sets a total emissions LIMIT and lets the market determine the price through trading of allowances.",
        difficultyLevel: 3,
        bloomsLevel: "analyze",
      },
      {
        contentId,
        conceptId: conceptIds[7],
        questionType: "mcq",
        questionText: "What does Education for Sustainable Development (ESD) emphasize beyond climate science?",
        options: (["Only technology solutions", "Values, attitudes, and behaviours for sustainability", "Memorizing emission statistics", "Political party alignment"]),
        correctAnswer: "Values, attitudes, and behaviours for sustainability",
        explanation: "ESD integrates environmental, social, and economic dimensions to empower learners with the values, attitudes, and skills needed to take action for a sustainable future.",
        difficultyLevel: 2,
        bloomsLevel: "understand",
      },
    ])
    .run();

  db.insert(flashcards)
    .values([
      { contentId, conceptId: conceptIds[0], frontText: "What is the difference between climate and weather?", backText: "Weather is the day-to-day atmospheric state (temperature, rain, wind). Climate is the average of weather conditions over ~30 years. Climate change refers to long-term shifts in these averages, not short-term weather variations.", difficultyLevel: 1 },
      { contentId, conceptId: conceptIds[1], frontText: "Name the three main greenhouse gases and their sources.", backText: "CO2 — fossil fuel burning, deforestation. CH4 (methane) — agriculture, livestock, waste. N2O (nitrous oxide) — fertilizers, industrial processes. All have increased since the Industrial Revolution (~1750).", difficultyLevel: 1 },
      { contentId, conceptId: conceptIds[2], frontText: "What is climate migration?", backText: "Displacement of people due to climate impacts: sea level rise, desertification, extreme weather, agricultural disruption. Projected to affect hundreds of millions by 2050. Climate migrants currently lack international legal protection.", difficultyLevel: 2 },
      { contentId, conceptId: conceptIds[4], frontText: "What is climate mitigation? Give examples.", backText: "Actions reducing GHG emissions to tackle climate change causes. Examples: renewable energy, energy efficiency, sustainable transport, carbon capture. Policy tools: carbon taxes, cap-and-trade, clean energy subsidies.", difficultyLevel: 1 },
      { contentId, conceptId: conceptIds[5], frontText: "What is climate adaptation? Give examples.", backText: "Adjustments to reduce harm from climate impacts. Examples: sea walls, drought-resistant crops, improved water storage, updated building codes, early warning systems. Accepts some climate change is unavoidable.", difficultyLevel: 1 },
      { contentId, conceptId: conceptIds[7], frontText: "What is Education for Sustainable Development (ESD)?", backText: "An approach integrating environmental, social, and economic dimensions. Goes beyond science to shape values, attitudes, behaviours. Covers: mitigation (change consumption), adaptation (prepare locally), disaster risk reduction (emergency preparedness).", difficultyLevel: 2 },
    ])
    .run();
}
