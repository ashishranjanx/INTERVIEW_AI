import React from 'react'
import { motion } from "motion/react"
import {
    FaUserTie,
    FaBriefcase,
    FaFileUpload,
    FaMicrophoneAlt,
    FaChartLine,
} from "react-icons/fa";
import { useState } from 'react';
import axios from "axios"
import { ServerUrl } from '../App';
import { useDispatch, useSelector } from 'react-redux';
import { setUserData } from '../redux/userSlice';
function Step1SetUp({ onStart }) {
    const {userData}= useSelector((state)=>state.user)
    const dispatch = useDispatch()
    const [role, setRole] = useState("");
    const [experience, setExperience] = useState("");
    const [mode, setMode] = useState("Technical");
    const [difficulty, setDifficulty] = useState("medium");
    const [questionCount, setQuestionCount] = useState("5");
    const [resumeFile, setResumeFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState([]);
    const [skills, setSkills] = useState([]);
    const [resumeText, setResumeText] = useState("");
    const [analysisDone, setAnalysisDone] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const normalizeExperience = (value) => {
        const match = String(value ?? "").match(/\d+/);
        return match ? match[0] : "";
    };


    const handleUploadResume = async () => {
        if (!resumeFile || analyzing) return;
        setAnalyzing(true)

        const formdata = new FormData()
        formdata.append("resume", resumeFile)

        try {
            const result = await axios.post(ServerUrl + "/api/interview/resume", formdata, { withCredentials: true })

            console.log(result.data)

            setRole(result.data.role || role);
            const parsedExperience = normalizeExperience(result.data.experience);
            if (parsedExperience) {
                setExperience(parsedExperience);
            }
            setProjects(result.data.projects || []);
            setSkills(result.data.skills || []);
            setResumeText(result.data.resumeText || "");
            setAnalysisDone(true);

            setAnalyzing(false);

        } catch (error) {
            console.log(error)
            setAnalyzing(false);
        }
    }

    const handleStart = async () => {
        const trimmedRole = role.trim();
        const trimmedExperience = experience.trim();

        if (!trimmedRole || !trimmedExperience) {
            setErrorMessage("Enter your role and experience before starting.");
            return;
        }

        setLoading(true)
        setErrorMessage("");
        try {
           const result = await axios.post(ServerUrl + "/api/interview/generate-questions" , {role: trimmedRole, experience: trimmedExperience, mode, difficulty, questionCount: Number(questionCount), resumeText, projects, skills } , {withCredentials:true}) 
           console.log(result.data)
           if(userData){
            dispatch(setUserData({...userData , credits:result.data.creditsLeft}))
           }
           setLoading(false)
           onStart(result.data)

        } catch (error) {
            console.log(error)
            setErrorMessage(error.response?.data?.message || "Could not start the interview. Please try again.");
            setLoading(false)
        }
    }
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className='min-h-screen flex items-center justify-center bg-[#f5f7f2] px-4 py-8 md:py-12 overflow-hidden'>

            <div className='w-full max-w-6xl bg-white rounded-4xl shadow-[0_24px_70px_rgba(22,32,26,0.14)] grid md:grid-cols-2 overflow-hidden border border-white'>

                <motion.div
                    initial={{ x: -80, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.7 }}
                    className='relative bg-linear-to-br from-[#effff4] via-[#e0f9e9] to-[#c9f2d8] p-8 md:p-12 lg:p-14 flex flex-col justify-center min-h-140 overflow-hidden'>

                    <div className='absolute -right-24 -top-24 h-72 w-72 rounded-full border-36 border-white/40' />
                    <div className='absolute -left-20 -bottom-24 h-64 w-64 rounded-full bg-white/30 blur-2xl' />

                    <div className='relative flex items-center gap-2 mb-10'>
                        <span className='flex h-8 w-8 items-center justify-center rounded-xl bg-[#16201a] text-[#d7f36b]'>
                            <FaMicrophoneAlt size={14} />
                        </span>
                        <span className='text-[#3f772f] text-xs font-bold tracking-[0.18em]'>QUANTUMAI / SESSION 01</span>
                    </div>

                    <h2 className="relative text-4xl md:text-5xl font-extrabold tracking-[-0.04em] leading-[1.05] text-[#16201a] mb-6">
                        Prepare with
                        <span className='block text-[#3f772f]'>precision.</span>
                    </h2>

                    <p className="relative text-[#526159] leading-relaxed max-w-md mb-10">
                        Build a focused practice session tailored to your role, experience, and goals.
                    </p>

                    <div className='relative space-y-4'>

                        {
                            [
                                {
                                    icon: <FaUserTie className="text-[#3f772f] text-xl" />,
                                    text: "Choose Role & Experience",
                                },
                                {
                                    icon: <FaMicrophoneAlt className="text-[#3f772f] text-xl" />,
                                    text: "Smart Voice Interview",
                                },
                                {
                                    icon: <FaChartLine className="text-[#3f772f] text-xl" />,
                                    text: "Performance Analytics",
                                },
                            ].map((item, index) => (
                                <motion.div key={index}
                                    initial={{ y: 30, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 + index * 0.15 }}
                                    whileHover={{ scale: 1.03 }}
                                    className='flex items-center space-x-4 bg-white/85 border border-white p-4 rounded-2xl shadow-[0_8px_20px_rgba(63,119,47,0.08)] cursor-pointer'>
                                    <span className='flex h-10 w-10 items-center justify-center rounded-xl bg-[#e9f9dd]'>{item.icon}</span>
                                    <span className='text-[#27362c] font-semibold'>{item.text}</span>

                                </motion.div>
                            ))
                        }
                    </div>



                </motion.div>



                <motion.div
                    initial={{ x: 80, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.7 }}
                    className="p-8 md:p-12 lg:p-14 bg-white">

                    <div className='flex items-start justify-between gap-4 mb-8'>
                        <div>
                            <p className='text-[#3f772f] text-xs font-bold tracking-[0.18em] mb-3'>YOUR NEXT SESSION</p>
                            <h2 className='text-3xl md:text-4xl font-extrabold tracking-[-0.04em] text-[#16201a]'>
                                Interview setup
                            </h2>
                        </div>
                        <span className='hidden sm:inline-flex items-center rounded-full bg-[#f1f7ec] px-3 py-1.5 text-xs font-semibold text-[#3f772f]'>
                            01 / 03
                        </span>
                    </div>

                    <div className='h-px bg-[#e7eee5] mb-8' />

                    <div className='space-y-5'>

                        <div className='relative'>
                            <FaUserTie className='absolute top-4 left-4 text-gray-400' />

                            <input type='text' placeholder='Enter role'
                                className='w-full pl-12 pr-4 py-3.5 border border-[#dce5d7] rounded-2xl bg-[#fbfdfb] focus:ring-2 focus:ring-[#9acb76] focus:border-[#9acb76] outline-none transition'
                                onChange={(e) => setRole(e.target.value)} value={role} />
                        </div>


                        <div className='relative'>
                            <FaBriefcase className='absolute top-4 left-4 text-gray-400' />

                            <input type='number' min='0' max='50' step='1' inputMode='numeric' placeholder='Years of experience (e.g. 2)'
                                className='w-full pl-12 pr-4 py-3.5 border border-[#dce5d7] rounded-2xl bg-[#fbfdfb] focus:ring-2 focus:ring-[#9acb76] focus:border-[#9acb76] outline-none transition'
                                onChange={(e) => setExperience(e.target.value.replace(/\D/g, ""))} value={experience} />



                        </div>

                        <select value={mode}
                            onChange={(e) => setMode(e.target.value)}
                            className='w-full py-3.5 px-4 border border-[#dce5d7] rounded-2xl bg-[#fbfdfb] focus:ring-2 focus:ring-[#9acb76] focus:border-[#9acb76] outline-none transition'>

                            <option value="Technical">Technical Interview</option>
                            <option value="HR">HR Interview</option>

                        </select>

                        <select value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value)}
                            aria-label='Difficulty level'
                            className='w-full py-3.5 px-4 border border-[#dce5d7] rounded-2xl bg-[#fbfdfb] focus:ring-2 focus:ring-[#9acb76] focus:border-[#9acb76] outline-none transition'>
                            <option value="easy">Easy difficulty</option>
                            <option value="medium">Medium difficulty</option>
                            <option value="hard">Hard difficulty</option>
                        </select>

                        <select value={questionCount}
                            onChange={(e) => setQuestionCount(e.target.value)}
                            aria-label='Number of questions'
                            className='w-full py-3.5 px-4 border border-[#dce5d7] rounded-2xl bg-[#fbfdfb] focus:ring-2 focus:ring-[#9acb76] focus:border-[#9acb76] outline-none transition'>
                            <option value="3">3 interview questions</option>
                            <option value="5">5 interview questions</option>
                            <option value="7">7 interview questions</option>
                            <option value="10">10 interview questions</option>
                        </select>

                        {!analysisDone && (
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                onClick={() => document.getElementById("resumeUpload").click()}
                                className='border-2 border-dashed border-[#cbdac8] rounded-2xl p-8 text-center cursor-pointer hover:border-[#3f772f] hover:bg-[#f1faed] transition'>

                                <span className='flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-[#e9f9dd] mb-3'>
                                    <FaFileUpload className='text-2xl text-[#3f772f]' />
                                </span>

                                <input type="file"
                                    accept="application/pdf"
                                    id="resumeUpload"
                                    className='hidden'
                                    onChange={(e) => setResumeFile(e.target.files[0])} />

                                <p className='text-gray-600 font-medium'>
                                    {resumeFile ? resumeFile.name : "Click to upload resume (Optional)"}
                                </p>

                                {resumeFile && (
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleUploadResume()
                                        }}

                                        className='mt-4 bg-[#16201a] text-white px-5 py-2 rounded-xl hover:bg-[#3f772f] transition'>
                                        {analyzing ? "Analyzing..." : "Analyze Resume"}



                                    </motion.button>)}

                            </motion.div>


                        )}

                        {analysisDone && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className='bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4'>
                                <h3 className='text-lg font-semibold text-gray-800'>
                                    Resume Analysis Result</h3>

                                {projects.length > 0 && (
                                    <div>
                                        <p className='font-medium text-gray-700 mb-1'>
                                            Projects:</p>

                                        <ul className='list-disc list-inside text-gray-600 space-y-1'>
                                            {projects.map((p, i) => (
                                                <li key={i}>{p}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {skills.length > 0 && (
                                    <div>
                                        <p className='font-medium text-gray-700 mb-1'>
                                            Skills:</p>

                                        <div className='flex flex-wrap gap-2'>
                                            {skills.map((s, i) => (
                                                <span key={i} className='bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm'>{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                            </motion.div>
                        )}


                        <motion.button
                        onClick={handleStart}
                            disabled={!role.trim() || !experience.trim() || loading}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.95 }}
                            className='w-full disabled:bg-[#aab5ae] bg-[#16201a] hover:bg-[#3f772f] text-white py-3.5 rounded-2xl text-base font-semibold transition duration-300 shadow-lg shadow-[#16201a]/15'>
                            {loading ? "Starting...":"Start Interview"}


                        </motion.button>

                        {errorMessage && (
                            <p className='text-sm text-red-600' role='alert'>
                                {errorMessage}
                            </p>
                        )}
                    </div>

                </motion.div>
            </div>

        </motion.div>
    )
}

export default Step1SetUp
