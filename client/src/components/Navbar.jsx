import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from "motion/react"
import { BsRobot, BsCoin, BsClockHistory, BsStars } from "react-icons/bs";
import { HiOutlineLogout } from "react-icons/hi";
import { FaUserAstronaut } from "react-icons/fa";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ServerUrl } from '../App';
import { setUserData } from '../redux/userSlice';
import AuthModel from './AuthModel';
function Navbar() {
    const {userData} = useSelector((state)=>state.user)
    const [showCreditPopup,setShowCreditPopup] = useState(false)
    const [showUserPopup,setShowUserPopup] = useState(false)
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const [showAuth, setShowAuth] = useState(false);

    const handleLogout = async () => {
        try {
            await axios.get(ServerUrl + "/api/auth/logout" , {withCredentials:true})
            dispatch(setUserData(null))
            setShowCreditPopup(false)
            setShowUserPopup(false)
            navigate("/")

        } catch (error) {
            console.log(error)
        }
    }
  return (
    <div className='flex justify-center px-4 pt-5 md:pt-7'>
        <motion.div 
        initial={{opacity:0 , y:-40}}
        animate={{opacity:1 , y:0}}
        transition={{duration: 0.3}}
        className='w-full max-w-6xl bg-[#16201a] text-white rounded-[22px] shadow-[0_14px_40px_rgba(22,32,26,0.16)] px-5 md:px-7 py-3.5 flex justify-between items-center relative'>
            <div onClick={() => navigate('/')} className='flex items-center gap-3 cursor-pointer min-w-fit'>
                <div className='bg-[#d7f36b] text-[#16201a] p-2 rounded-xl'>
                    <BsRobot size={18}/>

                </div>
                <div className='hidden md:block'>
                    <h1 className='font-semibold text-lg tracking-tight leading-none'>QuantumAI</h1>
                    <p className='text-[9px] text-white/45 tracking-[0.2em] uppercase mt-1'>Interview studio</p>
                </div>
            </div>

            <div className='hidden lg:flex items-center gap-1 absolute left-1/2 -translate-x-1/2 bg-white/6 border border-white/10 rounded-2xl p-1'>
                <button onClick={() => navigate('/interview')} className='flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-white/75 hover:bg-white/10 hover:text-white transition'>
                    <BsStars size={14} />
                    Practice
                </button>
                <button onClick={() => navigate('/history')} className='flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-white/75 hover:bg-white/10 hover:text-white transition'>
                    <BsClockHistory size={14} />
                    History
                </button>
                <button onClick={() => navigate('/pricing')} className='px-4 py-2 rounded-xl text-xs font-medium text-white/75 hover:bg-white/10 hover:text-white transition'>
                    Plans
                </button>
            </div>

            <div className='flex items-center gap-3 md:gap-5 relative ml-auto'>
                <div className='relative'>
                    <button onClick={()=>{
                        if(!userData){
                            setShowAuth(true)
                            return;
                        }
                        setShowCreditPopup(!showCreditPopup);
                        setShowUserPopup(false)
                    }} className='flex items-center gap-2 bg-white/10 border border-white/10 px-3 md:px-4 py-2 rounded-xl text-sm hover:bg-white/20 transition'>
                        <span className='flex items-center justify-center w-6 h-6 rounded-lg bg-[#d7f36b] text-[#16201a]'>
                            <BsCoin size={14}/>
                        </span>
                        <span className='hidden sm:inline text-white/50 text-xs'>Credits</span>
                        <span className='font-semibold'>{userData?.credits || 0}</span>
                    </button>

                    {showCreditPopup && (
                        <div className='absolute -right-12.5 mt-3 w-64 bg-white shadow-xl border border-gray-200 rounded-xl p-5 z-50'>
                            <p className='text-sm text-gray-600 mb-4'>Need more credits to continue interviews?</p>
                            <button onClick={()=>navigate("/pricing")} className='w-full bg-black text-white py-2 rounded-lg text-sm'>Buy more credits</button>

                        </div>
                    )}
                </div>

                <div className='relative'>
                    <button
                    onClick={()=>{
                         if(!userData){
                            setShowAuth(true)
                            return;
                        }
                        setShowUserPopup(!showUserPopup);
                        setShowCreditPopup(false)
                    }} className='w-10 h-10 bg-[#d7f36b] text-[#16201a] rounded-xl flex items-center justify-center font-semibold shadow-[0_0_0_4px_rgba(215,243,107,0.12)] hover:scale-105 transition'>
                        {userData ? userData?.name.slice(0,1).toUpperCase() : <FaUserAstronaut size={16}/>}
                        
                    </button>

                    {showUserPopup && (
                        <div className='absolute right-0 mt-3 w-48 bg-white shadow-xl border border-gray-200 rounded-xl p-4 z-50'>
                            <p className='text-md text-blue-500 font-medium mb-1'>{userData?.name}</p>

                            <button onClick={()=>navigate("/history")} className='w-full text-left text-sm py-2 hover:text-black text-gray-600'>InterView History</button>
                            <button onClick={()=>{
                                setShowUserPopup(false)
                                navigate("/profile")
                            }} className='w-full text-left text-sm py-2 hover:text-black text-gray-600'>Profile & sessions</button>
                            <button onClick={handleLogout} 
                            className='w-full text-left text-sm py-2 flex items-center gap-2 text-red-500'>
                                <HiOutlineLogout size={16}/>
                                Logout</button>
                        </div>
                    )}
                </div>

            </div>



        </motion.div>

        {showAuth && <AuthModel onClose={()=>setShowAuth(false)}/>}
      
    </div>
  )
}

export default Navbar
