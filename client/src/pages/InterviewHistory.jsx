import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from "axios"
import { ServerUrl } from '../App'
import { motion } from 'motion/react'
import { FaArrowLeft, FaChartLine, FaRegClock } from 'react-icons/fa'
import { BsArrowUpRight } from 'react-icons/bs'
function InterviewHistory() {
    const [interviews, setInterviews] = useState([])
    const navigate = useNavigate()

    useEffect(() => {
        const getMyInterviews = async () => {
            try {
                const result = await axios.get(ServerUrl + "/api/interview/get-interview", { withCredentials: true })

                setInterviews(result.data)

            } catch (error) {
                console.log(error)
            }

        }

        getMyInterviews()

    }, [])


    return (
        <div className='min-h-screen bg-[#f5f7f2] py-8 md:py-12 px-4 overflow-hidden' >
            <div className='hero-grid relative w-full max-w-5xl mx-auto rounded-4xl border border-[#dce5d7] px-5 py-8 md:px-10 md:py-10'>
                <div className='absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#d7f36b]/35 blur-3xl' />

                <div className='relative mb-10 w-full flex items-start gap-4 flex-wrap'>
                    <button
                        onClick={() => navigate("/")}
                        title='Back to home'
                        className='mt-1 p-3.5 rounded-2xl bg-white border border-[#e1e9df] shadow-sm hover:shadow-md hover:-translate-x-0.5 transition'><FaArrowLeft className='text-[#526159]' /></button>

                    <div>
                        <p className='text-[#3f772f] text-xs font-bold tracking-[0.18em] mb-2'>YOUR PROGRESS</p>
                        <h1 className='text-3xl md:text-5xl font-extrabold tracking-[-0.045em] text-[#16201a]'>
                            Interview history
                        </h1>
                        <p className='text-[#526159] mt-3'>
                            Track your past interviews and performance reports
                        </p>
                    </div>

                    <div className='ml-auto hidden sm:flex items-center gap-2 rounded-2xl bg-[#16201a] text-white px-4 py-3 shadow-lg'>
                        <FaChartLine className='text-[#d7f36b]' />
                        <div>
                            <p className='text-[10px] text-white/50 uppercase tracking-wider'>Sessions</p>
                            <p className='font-bold leading-none'>{interviews.length}</p>
                        </div>
                    </div>
                </div>


                {interviews.length === 0 ?
                    <div className='relative bg-white p-12 rounded-3xl border border-[#e1e9df] shadow-sm text-center'>
                        <div className='mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e9f9dd] text-[#3f772f]'>
                            <FaChartLine size={22} />
                        </div>
                        <h2 className='text-xl font-bold text-[#16201a]'>Your story starts here</h2>
                        <p className='text-[#718078] mt-2'>No interviews found. Start your first practice session.</p>
                        <button onClick={() => navigate('/interview')} className='mt-6 rounded-2xl bg-[#16201a] px-6 py-3 text-sm font-semibold text-white hover:bg-[#3f772f] transition'>
                            Start an interview
                        </button>

                    </div>

                    :

                    <div className='relative grid gap-4'>
                        {interviews.map((item, index) => (
                            <motion.div key={index}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.08 }}
                            onClick={()=>navigate(`/report/${item._id}`)}
                             className='group relative bg-white p-5 md:p-6 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 cursor-pointer border border-[#e1e9df] overflow-hidden'>
                                <div className='absolute left-0 top-0 h-full w-1.5 bg-[#d7f36b] group-hover:bg-[#3f772f] transition-colors' />
                                <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-6 pl-2'>
                                    <div className='min-w-0'>
                                        <div className='flex items-center gap-3 mb-2'>
                                            <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eff9e8] text-[#3f772f]'>
                                                <FaChartLine size={15} />
                                            </span>
                                            <h3 className="text-lg md:text-xl font-bold text-[#16201a] truncate">
                                            {item.role}
                                            </h3>
                                        </div>

                                        <p className="text-[#718078] text-sm ml-12">
                                            {item.experience} years experience <span className='text-[#b0bbb3]'>•</span> {item.mode}
                                        </p>

                                        <p className="flex items-center gap-2 text-xs text-[#9aa79e] mt-3 ml-12">
                                            <FaRegClock size={11} />
                                            {new Date(item.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>

                                    <div className='flex items-center justify-between md:justify-end gap-5 md:gap-7'>

                                        {/* SCORE */}
                                        <div className="text-right">
                                            <p className="text-2xl font-extrabold text-[#3f9b63]">
                                                {Number(Number(item.finalScore || 0).toFixed(1))}/10
                                            </p>
                                            <p className="text-[11px] text-[#9aa79e] uppercase tracking-wide">
                                                Overall Score
                                            </p>
                                        </div>

                                        {/* STATUS BADGE */}
                                        <span
                                            className={`px-3.5 py-2 rounded-xl text-xs font-semibold ${item.status === "completed"
                                                    ? "bg-[#d9f7e7] text-[#258054]"
                                                    : "bg-[#fff4c2] text-[#a77917]"
                                                }`}
                                        >
                                            {item.status}
                                        </span>

                                        <BsArrowUpRight className='hidden sm:block text-[#a5b2a8] group-hover:text-[#3f772f] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition' size={16} />


                                    </div>
                                </div>

                            </motion.div>

                        ))
                        }

                    </div>
                }
            </div>

        </div>
    )
}

export default InterviewHistory
