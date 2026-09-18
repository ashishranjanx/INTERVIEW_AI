import React from 'react'
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { motion } from "motion/react"
import { buildStyles, CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

function Step3Report({ report }) {
  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading Report...</p>
      </div>
    );
  }
  const navigate = useNavigate()
  const {
    finalScore = 0,
    confidence = 0,
    communication = 0,
    correctness = 0,
    improvementPlan = null,
    questionWiseScore = [],
  } = report;

  const questionScoreData = questionWiseScore.map((score, index) => ({
    name: `Q${index + 1}`,
    score: score.score || 0
  }))

  const skills = [
    { label: "Confidence", value: confidence },
    { label: "Communication", value: communication },
    { label: "Correctness", value: correctness },
  ];

  const deliveryMetrics = questionWiseScore.reduce((totals, question) => {
    const metrics = question.voiceMetrics || {};
    totals.wordCount += Number(metrics.wordCount) || 0;
    totals.fillerWordCount += Number(metrics.fillerWordCount) || 0;
    totals.speakingRate += Number(metrics.speakingRate) || 0;
    totals.answerDuration += Number(metrics.answerDuration) || 0;
    totals.count += 1;
    return totals;
  }, { wordCount: 0, fillerWordCount: 0, speakingRate: 0, answerDuration: 0, count: 0 });

  const averageSpeakingRate = deliveryMetrics.count
    ? Math.round((deliveryMetrics.speakingRate / deliveryMetrics.count) * 10) / 10
    : 0;
  const totalMinutes = Math.round((deliveryMetrics.answerDuration / 60) * 10) / 10;

  let performanceText = "";
  let shortTagline = "";

  if (finalScore >= 8) {
    performanceText = "Ready for job opportunities.";
    shortTagline = "Excellent clarity and structured responses.";
  } else if (finalScore >= 5) {
    performanceText = "Needs minor improvement before interviews.";
    shortTagline = "Good foundation, refine articulation.";
  } else {
    performanceText = "Significant improvement required.";
    shortTagline = "Work on clarity and confidence.";
  }

  const score = Number(Number(finalScore || 0).toFixed(1));
  const percentage = (score / 10) * 100;


  const downloadPDF = () => {
  const doc = new jsPDF("p", "mm", "a4");

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  let currentY = 25;

  // ================= TITLE =================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(34, 197, 94);
  doc.text("AI Interview Performance Report", pageWidth / 2, currentY, {
    align: "center",
  });

  currentY += 5;

  // underline
  doc.setDrawColor(34, 197, 94);
  doc.line(margin, currentY + 2, pageWidth - margin, currentY + 2);

  currentY += 15;

  // ================= FINAL SCORE BOX =================
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(margin, currentY, contentWidth, 20, 4, 4, "F");

  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(
    `Final Score: ${finalScore}/10`,
    pageWidth / 2,
    currentY + 12,
    { align: "center" }
  );

  currentY += 30;

  // ================= SKILLS BOX =================
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(margin, currentY, contentWidth, 30, 4, 4, "F");

  doc.setFontSize(12);

  doc.text(`Confidence: ${confidence}`, margin + 10, currentY + 10);
  doc.text(`Communication: ${communication}`, margin + 10, currentY + 18);
  doc.text(`Correctness: ${correctness}`, margin + 10, currentY + 26);

  currentY += 45;

  // ================= ADVICE =================
  let advice = "";

  if (finalScore >= 8) {
    advice =
      "Excellent performance. Maintain confidence and structure. Continue refining clarity and supporting answers with strong real-world examples.";
  } else if (finalScore >= 5) {
    advice =
      "Good foundation shown. Improve clarity and structure. Practice delivering concise, confident answers with stronger supporting examples.";
  } else {
    advice =
      "Significant improvement required. Focus on structured thinking, clarity, and confident delivery. Practice answering aloud regularly.";
  }

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(220);
  doc.roundedRect(margin, currentY, contentWidth, 35, 4, 4);

  doc.setFont("helvetica", "bold");
  doc.text("Professional Advice", margin + 10, currentY + 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  const splitAdvice = doc.splitTextToSize(advice, contentWidth - 20);
  doc.text(splitAdvice, margin + 10, currentY + 20);

  currentY += 50;

  // ================= QUESTION TABLE =================
  autoTable(doc, {
  startY: currentY,
  margin: { left: margin, right: margin },
  head: [["#", "Question", "Score", "Feedback"]],
  body: questionWiseScore.map((q, i) => [
    `${i + 1}`,
    q.question,
    `${q.score}/10`,
    q.feedback,
  ]),
  styles: {
    fontSize: 9,
    cellPadding: 5,
    valign: "top",
  },
  headStyles: {
    fillColor: [34, 197, 94],
    textColor: 255,
    halign: "center",
  },
  columnStyles: {
    0: { cellWidth: 10, halign: "center" }, // index
    1: { cellWidth: 55 }, // question
    2: { cellWidth: 20, halign: "center" }, // score
    3: { cellWidth: "auto" }, // feedback
  },
  alternateRowStyles: {
    fillColor: [249, 250, 251],
  },
});


  doc.save("AI_Interview_Report.pdf");
};

  return (
    <div className='min-h-screen bg-[#f5f7f2] px-4 sm:px-6 lg:px-10 py-8 md:py-10 overflow-hidden'>
      <div className='hero-grid relative max-w-7xl mx-auto rounded-4xl border border-[#dce5d7] p-5 sm:p-8 lg:p-10'>
      <div className='absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[#d7f36b]/30 blur-3xl' />
      <div className='relative mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5'>
        <div className='w-full flex items-start gap-4 flex-wrap'>
          <button
            onClick={() => navigate("/history")}
            title='Back to history'
            className='mt-1 p-3.5 rounded-2xl bg-white border border-[#e1e9df] shadow-sm hover:shadow-md hover:-translate-x-0.5 transition'><FaArrowLeft className='text-[#526159]' /></button>

          <div>
            <p className='text-[#3f772f] text-xs font-bold tracking-[0.18em] mb-2'>YOUR PERFORMANCE REPORT</p>
            <h1 className='text-3xl md:text-5xl font-extrabold tracking-[-0.045em] text-[#16201a]'>
              Interview analytics
            </h1>
            <p className='text-[#526159] mt-3'>
              AI-powered performance insights
            </p>

          </div>
        </div>

        <button onClick={downloadPDF} className='bg-[#16201a] hover:bg-[#3f772f] text-white px-5 py-3 rounded-2xl shadow-lg shadow-[#16201a]/15 transition-all duration-300 font-semibold text-sm sm:text-base whitespace-nowrap'>Download PDF</button>
      </div>


      <div className='relative grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6'>

        <div className='space-y-6'>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-3xl border border-[#e1e9df] shadow-sm p-6 sm:p-8 text-center">

            <h3 className="text-[#526159] mb-4 sm:mb-6 text-sm sm:text-base font-semibold">
              Overall Performance
            </h3>
            <div className='relative w-20 h-20 sm:w-25 sm:h-25 mx-auto'>
              <CircularProgressbar
                value={percentage}
                text={`${score}/10`}
                styles={buildStyles({
                  textSize: "18px",
                  pathColor: "#3f9b63",
                  textColor: "#16201a",
                  trailColor: "#e4ebe3",
                })}
              />
            </div>

            <p className="text-[#9aa79e] mt-3 text-xs sm:text-sm">
              Out of 10
            </p>

            <div className="mt-4">
              <p className="font-bold text-[#16201a] text-sm sm:text-base">
                {performanceText}
              </p>
              <p className="text-[#718078] text-xs sm:text-sm mt-1">
                {shortTagline}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='bg-white rounded-3xl border border-[#e1e9df] shadow-sm p-6 sm:p-8'>
            <h3 className="text-base sm:text-lg font-bold text-[#16201a] mb-6">
              Skill Evaluation
            </h3>

            <div className='space-y-5'>
              {
                skills.map((s, i) => (
                  <div key={i}>
                    <div className='flex justify-between mb-2 text-sm sm:text-base'>

                      <span>{s.label}</span>
                      <span className='font-bold text-[#3f9b63]'>{s.value}</span>
                    </div>

                    <div className='bg-[#e4ebe3] h-2 sm:h-3 rounded-full overflow-hidden'>
                      <div className='bg-[#3f9b63] h-full rounded-full'
                        style={{ width: `${s.value * 10}%` }}

                      ></div>

                    </div>


                  </div>
                ))
              }
            </div>

          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='bg-white rounded-3xl border border-[#e1e9df] shadow-sm p-6 sm:p-8'>
            <div className='flex items-start justify-between gap-3 mb-6'>
              <div>
                <p className='text-[#3f772f] text-[10px] font-bold tracking-[0.16em] uppercase mb-2'>Measured delivery</p>
                <h3 className='text-base sm:text-lg font-bold text-[#16201a]'>Voice analytics</h3>
              </div>
              <span className='rounded-xl bg-[#eff9e8] px-2.5 py-1.5 text-[10px] font-bold text-[#3f772f]'>BETA</span>
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='rounded-2xl bg-[#fbfdfb] border border-[#e1e9df] p-3'>
                <p className='text-xl font-extrabold text-[#16201a]'>{averageSpeakingRate}</p>
                <p className='text-[11px] text-[#718078]'>Avg. words/min</p>
              </div>
              <div className='rounded-2xl bg-[#fbfdfb] border border-[#e1e9df] p-3'>
                <p className='text-xl font-extrabold text-[#16201a]'>{deliveryMetrics.fillerWordCount}</p>
                <p className='text-[11px] text-[#718078]'>Filler words</p>
              </div>
              <div className='rounded-2xl bg-[#fbfdfb] border border-[#e1e9df] p-3'>
                <p className='text-xl font-extrabold text-[#16201a]'>{deliveryMetrics.wordCount}</p>
                <p className='text-[11px] text-[#718078]'>Words spoken</p>
              </div>
              <div className='rounded-2xl bg-[#fbfdfb] border border-[#e1e9df] p-3'>
                <p className='text-xl font-extrabold text-[#16201a]'>{totalMinutes}m</p>
                <p className='text-[11px] text-[#718078]'>Answer time</p>
              </div>
            </div>
          </motion.div>


        </div>

        <div className='lg:col-span-2 space-y-6'>

          {improvementPlan && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className='bg-[#16201a] text-white rounded-3xl p-5 sm:p-8 shadow-lg shadow-[#16201a]/10'>
              <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4'>
                <div>
                  <p className='text-[#d7f36b] text-[10px] font-bold tracking-[0.18em] uppercase mb-2'>Your next move</p>
                  <h3 className='text-xl sm:text-2xl font-extrabold tracking-[-0.03em]'>Personalized improvement plan</h3>
                  <p className='mt-3 max-w-2xl text-sm leading-relaxed text-white/65'>{improvementPlan.summary}</p>
                </div>
                <span className='w-fit shrink-0 rounded-xl bg-[#d7f36b] px-3 py-2 text-xs font-bold text-[#16201a]'>
                  Focus: {improvementPlan.focusArea}
                </span>
              </div>
              <div className='mt-6 grid gap-3 md:grid-cols-3'>
                {(improvementPlan.actions || []).map((action, index) => (
                  <div key={index} className='rounded-2xl border border-white/10 bg-white/5 p-4'>
                    <span className='text-[#d7f36b] text-xs font-bold'>0{index + 1}</span>
                    <p className='mt-2 text-sm leading-relaxed text-white/80'>{action}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='bg-white rounded-3xl border border-[#e1e9df] shadow-sm p-5 sm:p-8'>
            <h3 className="text-base sm:text-lg font-bold text-[#16201a] mb-4 sm:mb-6">
              Performance Trend
            </h3>

            <div className='h-64 sm:h-72'>

              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={questionScoreData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dce5d7" />
                  <XAxis dataKey="name" tick={{ fill: '#718078', fontSize: 12 }} axisLine={{ stroke: '#cbd8ca' }} />
                  <YAxis domain={[0, 10]} tick={{ fill: '#718078', fontSize: 12 }} axisLine={{ stroke: '#cbd8ca' }} />
                  <Tooltip contentStyle={{ borderRadius: '14px', border: '1px solid #dce5d7' }} />
                  <Area type="monotone"
                    dataKey="score"
                    stroke="#3f9b63"
                    fill="#d9f7e7"
                    strokeWidth={3} />


                </AreaChart>

              </ResponsiveContainer>


            </div>


          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='bg-white rounded-3xl border border-[#e1e9df] shadow-sm p-5 sm:p-8'>
            <h3 className="text-base sm:text-lg font-bold text-[#16201a] mb-6">
              Question Breakdown
            </h3>
            <div className='space-y-6'>
              {questionWiseScore.map((q, i) => (
                <div key={i} className='bg-[#fbfdfb] p-4 sm:p-6 rounded-2xl border border-[#e1e9df]'>

                  <div className='flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4'>
                    <div>
                      <p className="text-xs text-[#3f772f] font-bold tracking-wider uppercase mb-1">
                        Question {i + 1}
                      </p>

                      <p className="font-semibold text-[#27362c] text-sm sm:text-base leading-relaxed">
                        {q.question || "Question not available"}
                      </p>
                    </div>


                    <div className='bg-[#d9f7e7] text-[#258054] px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm w-fit'>
                      {q.score ?? 0}/10
                    </div>
                  </div>

                  <div className='bg-[#eff9e8] border border-[#dcebd4] p-4 rounded-xl'>
                    <p className='text-xs text-[#3f772f] font-bold tracking-wide mb-1'>
                      AI Feedback
                    </p>
                    <p className='text-sm text-[#526159] leading-relaxed'>

                      {q.feedback && q.feedback.trim() !== ""
                        ? q.feedback
                        : "No feedback available for this question."}
                    </p>
                  </div>

                </div>
              ))}
            </div>

          </motion.div>





        </div>
      </div>

      </div>
    </div>
  )
}

export default Step3Report
