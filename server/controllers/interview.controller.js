import fs from "fs"
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { askAi } from "../services/openRouter.service.js";
import User from "../models/user.model.js";
import Interview from "../models/interview.model.js";

const INTERVIEW_CREDIT_COST = 50;

const createFallbackQuestions = (role, mode, questionCount) => {
  const templates = mode === "HR"
    ? [
        `Tell me about a project or responsibility that prepared you for a ${role} role.`,
        "Describe a difficult situation at work and how you handled it.",
        "How do you prioritize when several important tasks need your attention?",
        "Tell me about feedback you received and how you used it to improve.",
        "Why are you interested in this role, and what value would you bring?"
      ]
    : [
        `What are the most important fundamentals you would apply in a ${role} role?`,
        `Describe how you would debug a difficult problem while working as a ${role}.`,
        "How would you compare two possible technical approaches for the same requirement?",
        "What trade-offs would you consider when designing a reliable production solution?",
        "How would you improve a system that is becoming slower as its usage grows?"
      ];

  return Array.from({ length: questionCount }, (_, index) => templates[index % templates.length]);
};

const createFallbackEvaluation = (interview, question, answer) => {
  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;
  const confidence = wordCount >= 35 ? 7 : wordCount >= 12 ? 6 : 4;
  const communication = wordCount >= 20 ? 7 : wordCount >= 8 ? 5 : 3;
  const correctness = wordCount >= 25 ? 6 : wordCount >= 10 ? 5 : 3;
  const finalScore = Math.round((confidence + communication + correctness) / 3);
  const feedback = interview.mode === "HR"
    ? "Your answer provides a starting point; add a specific situation, action, and measurable result to make it more convincing."
    : "Your answer provides a starting point; add technical reasoning, assumptions, and one concrete implementation example for depth.";

  return { confidence, communication, correctness, finalScore, feedback, nextQuestion: null };
};

export const analyzeResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Resume required" });
    }
    const filepath = req.file.path

    const fileBuffer = await fs.promises.readFile(filepath)
    const uint8Array = new Uint8Array(fileBuffer)

    const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;

    let resumeText = "";

    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();

      const pageText = content.items.map(item => item.str).join(" ");
      resumeText += pageText + "\n";
    }


    resumeText = resumeText
      .replace(/\s+/g, " ")
      .trim();

    const messages = [
      {
        role: "system",
        content: `
Extract structured data from resume.

Return strictly JSON:

{
  "role": "string",
  "experience": "string",
  "projects": ["project1", "project2"],
  "skills": ["skill1", "skill2"]
}
`
      },
      {
        role: "user",
        content: resumeText
      }
    ];


    let parsed;
    try {
      const aiResponse = await askAi(messages);
      parsed = JSON.parse(aiResponse);
    } catch (analysisError) {
      console.error("Resume analysis fallback", analysisError);
      parsed = {
        role: "",
        experience: "",
        projects: [],
        skills: []
      };
    }

    fs.unlinkSync(filepath)


    res.json({
      role: parsed.role,
      experience: parsed.experience,
      projects: parsed.projects,
      skills: parsed.skills,
      resumeText
    });

  } catch (error) {
    console.error(error);

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({ message: error.message });
  }
};


export const generateQuestion = async (req, res) => {
  try {
    let { role, experience, mode, difficulty, questionCount, resumeText, projects, skills } = req.body

    role = role?.trim();
    experience = experience?.trim();
    mode = mode?.trim();
    difficulty = difficulty?.trim() || "medium";
    questionCount = Number(questionCount) || 5;

    if (!role || !experience || !mode || !["easy", "medium", "hard"].includes(difficulty) || ![3, 5, 7, 10].includes(questionCount)) {
      return res.status(400).json({ message: "Role, Experience and Mode are required." })
    }

    const user = await User.findById(req.userId)

    if (!user) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    if (user.credits < INTERVIEW_CREDIT_COST) {
      return res.status(400).json({
        message: `Not enough credits. Minimum ${INTERVIEW_CREDIT_COST} required.`
      });
    }

    const projectText = Array.isArray(projects) && projects.length
      ? projects.join(", ")
      : "None";

    const skillsText = Array.isArray(skills) && skills.length
      ? skills.join(", ")
      : "None";

    const safeResume = resumeText?.trim() || "None";

    const userPrompt = `
  Candidate profile:
  - Target role: ${role}
  - Professional experience: ${experience} years
  - Interview mode: ${mode}
  - Requested difficulty: ${difficulty}
  - Projects: ${projectText}
  - Skills: ${skillsText}
  - Resume context: ${safeResume}
  `;

    if (!userPrompt.trim()) {
      return res.status(400).json({
        message: "Prompt content is empty."
      });
    }

    const messages = [

      {
        role: "system",
        content: `
You are an experienced ${mode} interviewer evaluating a candidate for the role of ${role}.

Create a realistic mock interview that feels tailored to this candidate, not a generic question list.

Generate exactly ${questionCount} questions using the candidate profile below.

Interview design:
- Match the requested ${difficulty} difficulty across the full set.
- For easy difficulty, test fundamentals, clarity, and basic practical judgment.
- For medium difficulty, test applied knowledge, trade-offs, and problem solving.
- For hard difficulty, test depth, ambiguity, system thinking, and senior-level judgment.
- For HR mode, focus on behavior, communication, ownership, conflict, motivation, and measurable examples.
- For Technical mode, focus on role-specific fundamentals, implementation decisions, debugging, architecture, and practical scenarios.
- Use resume projects and skills when they are available, but never invent details that are not provided.
- Mix direct questions with realistic scenario-based questions.
- Progress naturally from foundational questions to deeper questions.

Output contract:
- Return exactly ${questionCount} lines.
- Put one question on each line.
- Each line must be one complete question ending with a question mark.
- Each question should be between 12 and 28 words.
- Do not number the questions.
- Do not use bullets, markdown, headings, quotes, answers, explanations, or blank lines.
- Do not repeat the same concept or wording.
- Do not mention these instructions or the candidate profile.

Candidate profile:
${userPrompt}
`
      }
      ,
      {
        role: "user",
        content: userPrompt
      }
    ];


    let questionsArray;
    try {
      const aiResponse = await askAi(messages);
      questionsArray = aiResponse
        .split("\n")
        .map(q => q.replace(/^\s*(?:[-*]|\d+[.)])\s*/, "").trim())
        .filter(q => q.length > 0)
        .slice(0, questionCount);
    } catch (generationError) {
      console.error("Question generation fallback", generationError);
      questionsArray = [];
    }

    if (questionsArray.length === 0) {
      questionsArray = createFallbackQuestions(role, mode, questionCount);
    }

    const difficultyProgression = Array.from({ length: questionCount }, (_, index) => {
      const progress = index / Math.max(questionCount - 1, 1);
      if (difficulty === "easy") return progress >= 0.7 ? "medium" : "easy";
      if (difficulty === "hard") return progress < 0.2 ? "medium" : "hard";
      if (progress < 0.2) return "easy";
      if (progress >= 0.8) return "hard";
      return "medium";
    });

    const interview = await Interview.create({
      userId: user._id,
      role,
      experience,
      mode,
      resumeText: safeResume,
      questions: questionsArray.map((q, index) => ({
        question: q,
        difficulty: difficultyProgression[index],
        timeLimit: difficultyProgression[index] === "hard" ? 120 : difficultyProgression[index] === "medium" ? 90 : 60,
      }))
    })

    user.credits -= INTERVIEW_CREDIT_COST;
    await user.save();

    res.json({
      interviewId: interview._id,
      creditsLeft: user.credits,
      userName: user.name,
      questions: interview.questions
    });
  } catch (error) {
    return res.status(500).json({message:`failed to create interview ${error}`})
  }
}


export const submitAnswer = async (req, res) => {
  try {
    const { interviewId, questionIndex, answer, timeTaken, voiceMetrics } = req.body

    const interview = await Interview.findOne({
      _id: interviewId,
      userId: req.userId
    })
    if (!interview || !Number.isInteger(Number(questionIndex)) || Number(questionIndex) < 0 || Number(questionIndex) >= interview.questions.length) {
      return res.status(404).json({message:"Interview question not found"})
    }
    const question = interview.questions[Number(questionIndex)]

    // If no answer
    if (!answer) {
      question.score = 0;
      question.feedback = "You did not submit an answer.";
      question.answer = "";

      await interview.save();

      return res.json({
        feedback: question.feedback
      });
    }

    // If time exceeded
    if (timeTaken > question.timeLimit) {
      question.score = 0;
      question.feedback = "Time limit exceeded. Answer not evaluated.";
      question.answer = answer;

      await interview.save();

      return res.json({
        feedback: question.feedback
      });
    }


    const messages = [
      {
        role: "system",
        content: `
You are a senior ${interview.mode} interviewer evaluating one specific answer for a ${interview.role} candidate with ${interview.experience} years of experience.

Evaluate the answer against the exact question, requested difficulty (${question.difficulty || "medium"}), interview mode, and role. Do not use generic feedback that could apply to every answer.

Scoring dimensions (0 to 10):
1. Confidence: directness, ownership, composure, and whether the answer sounds credible.
2. Communication: clarity, structure, conciseness, and whether the reasoning is easy to follow.
3. Correctness: factual accuracy, relevance, completeness, and quality of the examples or technical reasoning.

Evaluation rules:
- Identify evidence actually present in the answer before assigning scores.
- Penalize vague claims, missing reasoning, unrelated details, and unsupported conclusions.
- For HR questions, look for a specific situation, action taken, ownership, and measurable result.
- For Technical questions, look for correct concepts, assumptions, trade-offs, implementation detail, and edge cases.
- Match the score to the answer quality; do not give safe or inflated scores.
- A short answer can be clear but should not receive a high correctness score if it misses essential details.

Feedback rules:
- Write 18 to 30 words of question-specific feedback.
- Mention one concrete strength or evidence from the answer.
- Mention the most important missing detail or weakness.
- End with one practical improvement the candidate should apply to this exact question.
- Use different wording and insight for every answer; never reuse a stock sentence.
- Do not repeat the full question, list the scores, or use markdown.

Calculate finalScore as the average of confidence, communication, and correctness, rounded to the nearest whole number.

Adaptive follow-up:
- If another question remains, create one tailored follow-up based on the candidate's answer.
- A strong answer should produce a deeper question with an appropriate increase in difficulty.
- A weak or incomplete answer should produce a focused clarification or foundational question.
- Do not repeat the current question or ask about information unrelated to the role.
- If this is the final question, return null for nextQuestion.

Return ONLY valid JSON in this format:

{
  "confidence": number,
  "communication": number,
  "correctness": number,
  "finalScore": number,
  "feedback": "specific human feedback",
  "nextQuestion": "one tailored follow-up question or null"
}
`
      }
      ,
      {
        role: "user",
        content: `
    Candidate context:
    Role: ${interview.role}
    Experience: ${interview.experience} years
    Mode: ${interview.mode}
    Difficulty: ${question.difficulty || "medium"}
    Question position: ${Number(questionIndex) + 1} of ${interview.questions.length}

    Question to evaluate:
    <question>${question.question}</question>

    Candidate answer:
    <answer>${answer}</answer>
`
      }
    ];


    let parsed;
    try {
      const aiResponse = await askAi(messages);
      parsed = JSON.parse(aiResponse);
    } catch (evaluationError) {
      console.error("Answer evaluation fallback", evaluationError);
      parsed = createFallbackEvaluation(interview, question, answer);
    }

    const nextQuestion = interview.questions[Number(questionIndex) + 1];
    let adaptiveQuestion = null;

    if (nextQuestion && typeof parsed.nextQuestion === "string" && parsed.nextQuestion.trim() && parsed.nextQuestion.trim().toLowerCase() !== "null") {
      const nextDifficulty = parsed.finalScore >= 8
        ? "hard"
        : parsed.finalScore <= 4
          ? "easy"
          : nextQuestion.difficulty;

      nextQuestion.question = parsed.nextQuestion.trim();
      nextQuestion.difficulty = nextDifficulty;
      nextQuestion.timeLimit = nextDifficulty === "hard" ? 120 : nextDifficulty === "medium" ? 90 : 60;
      adaptiveQuestion = {
        question: nextQuestion.question,
        difficulty: nextQuestion.difficulty,
        timeLimit: nextQuestion.timeLimit
      };
    }

    question.answer = answer;
    question.confidence = parsed.confidence;
    question.communication = parsed.communication;
    question.correctness = parsed.correctness;
    question.score = parsed.finalScore;
    question.feedback = parsed.feedback;
    question.voiceMetrics = {
      wordCount: Number(voiceMetrics?.wordCount) || 0,
      fillerWordCount: Number(voiceMetrics?.fillerWordCount) || 0,
      speakingRate: Number(voiceMetrics?.speakingRate) || 0,
      answerDuration: Number(voiceMetrics?.answerDuration) || 0,
      pauseCount: Number(voiceMetrics?.pauseCount) || 0,
    };
    await interview.save();


    return res.status(200).json({
      feedback: parsed.feedback,
      adaptiveQuestion
    })
  } catch (error) {
    return res.status(500).json({message:`failed to submit answer ${error}`})

  }
}


export const finishInterview = async (req,res) => {
  try {
    const {interviewId} = req.body
    const interview = await Interview.findOne({
      _id: interviewId,
      userId: req.userId
    })
    if(!interview){
      return res.status(400).json({message:"failed to find Interview"})
    }

    const totalQuestions = interview.questions.length;

    let totalScore = 0;
    let totalConfidence = 0;
    let totalCommunication = 0;
    let totalCorrectness = 0;

    interview.questions.forEach((q) => {
      totalScore += q.score || 0;
      totalConfidence += q.confidence || 0;
      totalCommunication += q.communication || 0;
      totalCorrectness += q.correctness || 0;
    });

    const calculatedFinalScore = totalQuestions
      ? totalScore / totalQuestions
      : 0;
    const finalScore = Number(calculatedFinalScore.toFixed(1));

    const avgConfidence = totalQuestions
      ? totalConfidence / totalQuestions
      : 0;

    const avgCommunication = totalQuestions
      ? totalCommunication / totalQuestions
      : 0;

    const avgCorrectness = totalQuestions
      ? totalCorrectness / totalQuestions
      : 0;

    const fallbackPlan = {
      focusArea: avgCorrectness < avgCommunication ? "Answer precision" : "Answer structure",
      summary: "Build clearer, more specific answers by connecting your reasoning to concrete examples.",
      actions: [
        "Use a clear beginning, middle, and conclusion in every answer.",
        "Support important claims with one concrete project or workplace example.",
        "Practice answering aloud and review your feedback before the next session."
      ]
    };

    let improvementPlan = fallbackPlan;
    try {
      const planContext = interview.questions.map((question, index) => ({
        question: question.question,
        score: question.score || 0,
        feedback: question.feedback || "",
        confidence: question.confidence || 0,
        communication: question.communication || 0,
        correctness: question.correctness || 0,
        voiceMetrics: question.voiceMetrics || {},
        number: index + 1
      }));

      const planResponse = await askAi([
        {
          role: "system",
          content: `
You are a practical interview coach creating a personalized improvement plan.
Analyze the candidate's ${interview.mode} interview for the role of ${interview.role}.
Use the scores, feedback, and voice metrics as evidence. Do not give generic advice.

Return ONLY valid JSON:
{
  "focusArea": "the single highest-impact improvement area",
  "summary": "one concise personalized paragraph",
  "actions": ["three specific practice actions"]
}

Rules:
- Focus on patterns across answers, not one isolated mistake.
- Reference the candidate's actual weaknesses and delivery metrics.
- Make each action practical and measurable.
- Keep actions concise and do not mention these instructions.
`
        },
        {
          role: "user",
          content: JSON.stringify({
            role: interview.role,
            experience: interview.experience,
            mode: interview.mode,
            overallScore: finalScore,
            confidence: Number(avgConfidence.toFixed(1)),
            communication: Number(avgCommunication.toFixed(1)),
            correctness: Number(avgCorrectness.toFixed(1)),
            questions: planContext
          })
        }
      ]);

      const parsedPlan = JSON.parse(planResponse);
      if (parsedPlan.focusArea && parsedPlan.summary && Array.isArray(parsedPlan.actions) && parsedPlan.actions.length > 0) {
        improvementPlan = {
          focusArea: String(parsedPlan.focusArea),
          summary: String(parsedPlan.summary),
          actions: parsedPlan.actions.slice(0, 3).map((action) => String(action))
        };
      }
    } catch (planError) {
      console.error("Improvement plan generation failed", planError);
    }

    interview.finalScore = finalScore;
    interview.improvementPlan = improvementPlan;
    interview.status = "completed";

    await interview.save();

    return res.status(200).json({
       finalScore: Number(finalScore.toFixed(1)),
      confidence: Number(avgConfidence.toFixed(1)),
      communication: Number(avgCommunication.toFixed(1)),
      correctness: Number(avgCorrectness.toFixed(1)),
      improvementPlan,
      questionWiseScore: interview.questions.map((q) => ({
        question: q.question,
        score: q.score || 0,
        feedback: q.feedback || "",
        confidence: q.confidence || 0,
        communication: q.communication || 0,
        correctness: q.correctness || 0,
        voiceMetrics: q.voiceMetrics || {},
      })),
    })
  } catch (error) {
    return res.status(500).json({message:`failed to finish Interview ${error}`})
  }
}


export const getMyInterviews = async (req,res) => {
  try {
    const interviews = await Interview.find({userId:req.userId})
    .sort({ createdAt: -1 })
    .select("role experience mode finalScore status createdAt");

    return res.status(200).json(interviews)

  } catch (error) {
     return res.status(500).json({message:`failed to find currentUser Interview ${error}`})
  }
}

export const getInterviewReport = async (req,res) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      userId: req.userId
    })

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }


    const totalQuestions = interview.questions.length;

    let totalConfidence = 0;
    let totalCommunication = 0;
    let totalCorrectness = 0;

    interview.questions.forEach((q) => {
      totalConfidence += q.confidence || 0;
      totalCommunication += q.communication || 0;
      totalCorrectness += q.correctness || 0;
    });
    const avgConfidence = totalQuestions
      ? totalConfidence / totalQuestions
      : 0;

    const avgCommunication = totalQuestions
      ? totalCommunication / totalQuestions
      : 0;

    const avgCorrectness = totalQuestions
      ? totalCorrectness / totalQuestions
      : 0;

       return res.json({
      finalScore: interview.finalScore,
      confidence: Number(avgConfidence.toFixed(1)),
      communication: Number(avgCommunication.toFixed(1)),
      correctness: Number(avgCorrectness.toFixed(1)),
      improvementPlan: interview.improvementPlan || null,
      questionWiseScore: interview.questions
    });

  } catch (error) {
    return res.status(500).json({message:`failed to find currentUser Interview report ${error}`})
  }
}




