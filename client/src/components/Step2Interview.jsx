import React from 'react'
import maleVideo from "../assets/videos/male-ai.mp4"
import femaleVideo from "../assets/videos/female-ai.mp4"
import Timer from './Timer'
import { motion } from "motion/react"
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import { useState } from 'react'
import { useRef } from 'react'
import { useEffect } from 'react'
import axios from "axios"
import { ServerUrl } from '../App'
import { BsArrowRight, BsMic } from 'react-icons/bs'

function Step2Interview({ interviewData, onFinish }) {
  const { interviewId, userName } = interviewData;
  const [questions, setQuestions] = useState(interviewData.questions || []);
  const [isIntroPhase, setIsIntroPhase] = useState(true);

  const [isMicOn, setIsMicOn] = useState(true);
  const recognitionRef = useRef(null);
  const [isAIPlaying, setIsAIPlaying] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [timeLeft, setTimeLeft] = useState(
    questions[0]?.timeLimit || 60
  );
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voiceGender] = useState(() => (Math.random() < 0.5 ? "female" : "male"));
  const [isQuestionReady, setIsQuestionReady] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
  const [subtitle, setSubtitle] = useState("");
  const [micError, setMicError] = useState("");


  const videoRef = useRef(null);

  const currentQuestion = questions[currentIndex];


  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;

      const femaleVoice =
        voices.find(v =>
          v.name.toLowerCase().includes("zira") ||
          v.name.toLowerCase().includes("samantha") ||
          v.name.toLowerCase().includes("female")
        );

      const maleVoice =
        voices.find(v =>
          v.name.toLowerCase().includes("david") ||
          v.name.toLowerCase().includes("mark") ||
          v.name.toLowerCase().includes("male")
        );

      const preferredVoice = voiceGender === "male" ? maleVoice : femaleVoice;
      setSelectedVoice(preferredVoice || voices[0]);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

  }, [voiceGender])

  const videoSource = voiceGender === "male" ? maleVideo : femaleVideo;


  /* ---------------- SPEAK FUNCTION ---------------- */
  const speakText = (text) => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis || !selectedVoice) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();

      // Add natural pauses after commas and periods
      const humanText = text
        .replace(/,/g, ", ... ")
        .replace(/\./g, ". ... ");

      const utterance = new SpeechSynthesisUtterance(humanText);

      utterance.voice = selectedVoice;

      // Human-like pacing
      utterance.rate = 0.92;     // slightly slower than normal
      utterance.pitch = 1.05;    // small warmth
      utterance.volume = 1;

      utterance.onstart = () => {
        setIsAIPlaying(true);
        stopMic()
        videoRef.current?.play();
      };


      utterance.onend = () => {
        videoRef.current?.pause();
        videoRef.current.currentTime = 0;
        setIsAIPlaying(false);



        if (isMicOn && isAnswering) {
          startMic();
        }
        setTimeout(() => {
          setSubtitle("");
          resolve();
        }, 300);
      };


      setSubtitle(text);

      window.speechSynthesis.speak(utterance);
    });
  };


  useEffect(() => {
    if (!selectedVoice) {
      return;
    }
    const runIntro = async () => {
      if (isIntroPhase) {
        await speakText(
          `Hi ${userName}, it's great to meet you today. I hope you're feeling confident and ready.`
        );

        await speakText(
          "I'll ask you a few questions. Just answer naturally, and take your time. Let's begin."
        );

        setIsIntroPhase(false)
      } else if (currentQuestion) {
        setIsQuestionReady(false);
        await new Promise(r => setTimeout(r, 800));

        // If last question (hard level)
        if (currentIndex === questions.length - 1) {
          await speakText("Alright, this one might be a bit more challenging.");
        }

        await speakText(currentQuestion.question);
        setIsQuestionReady(true);

      }

    }

    runIntro()


  }, [selectedVoice, isIntroPhase, currentIndex])



  useEffect(() => {
    if (isIntroPhase || !isQuestionReady || !isAnswering || isAIPlaying) return;
    if (!currentQuestion) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0;
        }
        return prev - 1

      })
    }, 1000);

    return () => clearInterval(timer)

  }, [isIntroPhase, currentIndex, isQuestionReady, isAnswering, isAIPlaying])

  useEffect(() => {
  if (!isIntroPhase && currentQuestion) {
    setTimeLeft(currentQuestion.timeLimit || 60);
  }
}, [currentIndex]);


  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMicError("Voice typing is not supported in this browser. Use Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onstart = () => setMicError("");

    recognition.onresult = (event) => {
      const transcript =
        event.results[event.results.length - 1][0].transcript;

      setAnswer((prev) => `${prev}${prev ? " " : ""}${transcript}`);
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setMicError("Microphone access was blocked. Allow microphone access and try again.");
      } else if (event.error === "network") {
        setIsMicOn(false);
        setMicError("Voice service is unavailable. Check your internet or VPN, then click the microphone to retry.");
      } else {
        setMicError(`Voice typing failed: ${event.error}.`);
      }
    };

    recognitionRef.current = recognition;

  }, []);


  const startMic = () => {
    if (recognitionRef.current && !isAIPlaying) {
      setMicError("");
      try {
        recognitionRef.current.start();
      } catch (error) {
        if (error.name !== "InvalidStateError") {
          setMicError("Could not start voice typing. Check microphone permissions.");
        }
      }
    }
  };

  const stopMic = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };
  const toggleMic = () => {
    if (isMicOn) {
      stopMic();
    } else {
      startMic();
    }
    setIsMicOn(!isMicOn);
  };

  const startAnswer = () => {
    if (!isQuestionReady || isAIPlaying || isSubmitting) return;
    setIsAnswering(true);
    if (isMicOn) {
      startMic();
    }
  };

  const getVoiceMetrics = () => {
    const words = answer.trim() ? answer.trim().split(/\s+/) : [];
    const fillerPattern = /\b(um+|uh+|like|actually|basically|you know)\b/gi;
    const fillerWordCount = (answer.match(fillerPattern) || []).length;
    const answerDuration = Math.max(0, (currentQuestion?.timeLimit || 60) - timeLeft);
    const speakingRate = answerDuration > 0
      ? Math.round((words.length / (answerDuration / 60)) * 10) / 10
      : 0;

    return {
      wordCount: words.length,
      fillerWordCount,
      speakingRate,
      answerDuration,
      pauseCount: Math.max(0, answer.split(/[.!?]+/).filter(Boolean).length - 1),
    };
  };


  const submitAnswer = async () => {
    if (isSubmitting) return;
    stopMic()
    setIsAnswering(false)
    setIsSubmitting(true)

    try {
      const result = await axios.post(ServerUrl + "/api/interview/submit-answer", {
        interviewId,
        questionIndex: currentIndex,
        answer,
        timeTaken:
          currentQuestion.timeLimit - timeLeft,
        voiceMetrics: getVoiceMetrics(),
      } , {withCredentials:true})

      setFeedback(result.data.feedback)
      if (result.data.adaptiveQuestion && currentIndex + 1 < questions.length) {
        setQuestions((currentQuestions) => currentQuestions.map((question, index) => (
          index === currentIndex + 1
            ? { ...question, ...result.data.adaptiveQuestion }
            : question
        )))
      }
      speakText(result.data.feedback)
      setIsSubmitting(false)
    } catch (error) {
console.log(error)
setIsSubmitting(false)
    }
  }

  const handleNext =async () => {
    setAnswer("");
    setFeedback("");
    setIsQuestionReady(false);
    setIsAnswering(false);

    if (currentIndex + 1 >= questions.length) {
      finishInterview();
      return;
    }

    await speakText("Alright, let's move to the next question.");

    setCurrentIndex(currentIndex + 1);
    setTimeout(() => {
      if (isMicOn) startMic();
    }, 500);

   
  }

  const finishInterview = async () => {
    stopMic()
    setIsMicOn(false)
    try {
      const result = await axios.post(ServerUrl+ "/api/interview/finish" , { interviewId} , {withCredentials:true})

      console.log(result.data)
      onFinish(result.data)
    } catch (error) {
      console.log(error)
    }
  }


   useEffect(() => {
    if (isIntroPhase) return;
    if (!currentQuestion) return;

    if (timeLeft === 0 && !isSubmitting && !feedback) {
      submitAnswer()
    }
  }, [timeLeft]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current.abort();
      }

      window.speechSynthesis.cancel();
    };
  }, []);







  return (
    <div className='hero-grid min-h-screen bg-[#f5f7f2] flex items-center justify-center p-4 sm:p-6'>
      <div className='w-full max-w-350 min-h-[80vh] bg-white rounded-4xl shadow-[0_24px_70px_rgba(22,32,26,0.14)] border border-[#dce5d7] flex flex-col lg:flex-row overflow-hidden'>

        {/* video section */}
        <div className='w-full lg:w-[35%] bg-[#16201a] text-white flex flex-col items-center p-5 sm:p-6 space-y-5 border-r border-[#26372c]'>
          <div className='w-full max-w-md flex items-center justify-between'>
            <div>
              <p className='text-[#d7f36b] text-[10px] font-bold tracking-[0.18em] uppercase'>Live interviewer</p>
              <p className='text-white/55 text-xs mt-1'>QuantumAI session</p>
            </div>
            <span className='rounded-full bg-white/10 border border-white/10 px-3 py-1.5 text-[10px] font-semibold text-white/70'>
              {voiceGender === 'male' ? 'MALE VOICE' : 'FEMALE VOICE'}
            </span>
          </div>
          <div className='relative w-full max-w-md rounded-3xl overflow-hidden shadow-[0_18px_40px_rgba(0,0,0,0.24)] border border-white/10'>
            <video
              src={videoSource}
              key={videoSource}
              ref={videoRef}
              muted
              playsInline
              preload="auto"
              className="w-full h-auto object-cover"
            />
            <div className='absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/45 px-3 py-1.5 text-[10px] font-semibold text-white backdrop-blur-sm'>
              <span className={`h-2 w-2 rounded-full ${isAIPlaying ? 'bg-[#d7f36b] animate-pulse' : 'bg-white/60'}`} />
              {isAIPlaying ? 'Speaking' : 'Ready'}
            </div>
          </div>

          {/* subtitle */}
          {subtitle && (
            <div className='w-full max-w-md bg-white/10 border border-white/10 rounded-2xl p-4'>
              <p className='text-white/80 text-sm sm:text-base font-medium text-center leading-relaxed'>{subtitle}</p>
            </div>
          )}


          {/* timer Area */}
          <div className='w-full max-w-md bg-white/[0.07] border border-white/10 rounded-3xl p-5 space-y-5'>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-white/50'>
                Interview Status
              </span>
              {isAIPlaying && <span className='text-sm font-semibold text-[#d7f36b]'>
                {isAIPlaying ? "AI Speaking" : ""}
              </span>}
            </div>

            <div className="h-px bg-white/10"></div>

            <div className='flex justify-center'>

              <Timer timeLeft={timeLeft} totalTime={currentQuestion?.timeLimit} />
            </div>

            <div className="h-px bg-white/10"></div>

            <div className='grid grid-cols-2 gap-6 text-center'>
              <div>
                <span className='text-2xl font-bold text-[#d7f36b]'>{currentIndex + 1}</span>
                <span className='text-xs text-white/45'>Current question</span>
              </div>

              <div>
                <span className='text-2xl font-bold text-[#d7f36b]'>{questions.length}</span>
                <span className='text-xs text-white/45'>Total questions</span>
              </div>
            </div>


          </div>
        </div>

        {/* Text section */}

        <div className='flex-1 flex flex-col p-5 sm:p-7 md:p-9 relative bg-white'>
          <div className='flex items-start justify-between gap-4 mb-6'>
            <div>
              <p className='text-[#3f772f] text-[10px] font-bold tracking-[0.18em] uppercase mb-2'>QuantumAI / Live session</p>
              <h2 className='text-2xl sm:text-3xl font-extrabold tracking-[-0.04em] text-[#16201a]'>
                AI Smart Interview
              </h2>
            </div>
            <span className='hidden sm:inline-flex rounded-full bg-[#eff9e8] px-3 py-1.5 text-xs font-semibold text-[#3f772f]'>
              {isQuestionReady ? 'Answer when ready' : 'Preparing question'}
            </span>
          </div>


          {!isIntroPhase && (<div className='relative mb-6 bg-[#f7fbf5] p-5 sm:p-6 rounded-3xl border border-[#dcebd4] shadow-sm'>
            <p className='text-[#3f772f] text-xs sm:text-sm font-bold tracking-wide uppercase mb-3'>
              Question {currentIndex + 1} of {questions.length}
            </p>

            <div className='text-base sm:text-lg font-semibold text-[#16201a] leading-relaxed '>{currentQuestion?.question}</div>
          </div>)
          }
          <textarea
            placeholder="Type your answer here..."
            onChange={(e) => setAnswer(e.target.value)}
            value={answer}
            className="flex-1 min-h-56 bg-[#fbfdfb] p-4 sm:p-6 rounded-3xl resize-none outline-none border border-[#dce5d7] focus:ring-2 focus:ring-[#9acb76] focus:border-[#9acb76] transition text-[#16201a]" />

          {micError && (
            <p className="mt-2 text-sm text-red-600" role="alert">
              {micError}
            </p>
          )}


        {!feedback ? (!isAnswering ? <motion.button
          onClick={startAnswer}
          disabled={!isQuestionReady || isAIPlaying}
          whileTap={{ scale: 0.98 }}
          className='w-full flex items-center justify-center gap-3 mt-6 bg-[#16201a] text-white py-4 rounded-2xl shadow-lg hover:bg-[#3f772f] transition font-semibold disabled:bg-[#aab5ae]'>
            <BsMic size={20} />
            {isAIPlaying ? 'AI is speaking...' : !isQuestionReady ? 'Preparing question...' : 'Start Answer'}
         </motion.button> : <div className='flex items-center gap-4 mt-6'>
            <motion.button
              onClick={toggleMic}
              whileTap={{ scale: 0.9 }}
              className='w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-2xl bg-[#16201a] text-white shadow-lg hover:bg-[#3f772f] transition'>
              {isMicOn ? <FaMicrophone size={20} /> : <FaMicrophoneSlash size={20}/>}
            </motion.button>

            <motion.button
            onClick={submitAnswer}
            disabled={isSubmitting}
              whileTap={{ scale: 0.95 }}
              className='flex-1 bg-[#16201a] text-white py-3 sm:py-4 rounded-2xl shadow-lg hover:bg-[#3f772f] transition font-semibold disabled:bg-[#aab5ae]'>
              {isSubmitting?"Submitting...":"Submit Answer"}

            </motion.button>

          </div>):(
            <motion.div 
             initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            className='mt-6 bg-[#eff9e8] border border-[#dcebd4] p-5 rounded-2xl shadow-sm'>
              <p className='text-[#3f772f] font-medium mb-4'>{feedback}</p>

              <button
              onClick={handleNext}

               className='w-full bg-[#16201a] text-white py-3 rounded-xl shadow-md hover:bg-[#3f772f] transition flex items-center justify-center gap-1'>
                Next Question <BsArrowRight size={18}/>
              </button>

            </motion.div>
          )}
        </div>
      </div>

    </div>
  )
}

export default Step2Interview
