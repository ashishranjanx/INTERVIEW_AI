import React from 'react'
import { BsRobot } from "react-icons/bs";
import { IoSparkles } from "react-icons/io5";
import { motion } from "motion/react"
import { FcGoogle } from "react-icons/fc";
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../utils/firebase';
import axios from 'axios';
import { ServerUrl } from '../App';
import { useDispatch } from 'react-redux';
import { setUserData } from '../redux/userSlice';
import { useEffect, useState } from 'react';
function Auth({isModel = false}) {
    const dispatch = useDispatch()
    const [authMode, setAuthMode] = useState('login')
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [otp, setOtp] = useState('')
    const [verificationEmail, setVerificationEmail] = useState('')
    const [resetToken, setResetToken] = useState('')
    const [resetUrl, setResetUrl] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const [successMessage, setSuccessMessage] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const token = new URLSearchParams(window.location.search).get('reset')
        if (token) {
            setResetToken(token)
            setAuthMode('reset')
        }
    }, [])

    const handlePasswordAuth = async (event) => {
        event.preventDefault()
        setErrorMessage('')
        setSuccessMessage('')
        setLoading(true)

        try {
            if (authMode === 'verify') {
                const result = await axios.post(`${ServerUrl}/api/auth/verify-email`, { email: verificationEmail, otp })
                dispatch(setUserData(result.data))
            } else if (authMode === 'forgot') {
                const result = await axios.post(`${ServerUrl}/api/auth/forgot-password`, { email })
                setResetUrl(result.data.resetUrl || '')
                setSuccessMessage(result.data.message)
            } else if (authMode === 'reset') {
                const result = await axios.post(`${ServerUrl}/api/auth/reset-password`, { token: resetToken, password })
                setSuccessMessage(result.data.message)
                setPassword('')
                setAuthMode('login')
            } else {
                const endpoint = authMode === 'register' ? '/api/auth/register' : '/api/auth/login'
                const payload = authMode === 'register' ? { name, email, password } : { email, password }
                const result = await axios.post(ServerUrl + endpoint, payload, { withCredentials: true })
                if (result.data.requiresVerification) {
                    setVerificationEmail(result.data.email || email)
                    setAuthMode('verify')
                    setSuccessMessage(result.data.message)
                } else {
                    dispatch(setUserData(result.data))
                }
            }
        } catch (error) {
            if (error.response?.data?.requiresVerification) {
                setVerificationEmail(error.response.data.email || email)
                setAuthMode('verify')
            }
            setErrorMessage(error.response?.data?.message || 'Authentication failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleResendVerification = async () => {
        setErrorMessage('')
        setSuccessMessage('')
        try {
            const result = await axios.post(`${ServerUrl}/api/auth/resend-verification`, { email: verificationEmail })
            setSuccessMessage(result.data.message)
        } catch (error) {
            setErrorMessage(error.response?.data?.message || 'Could not resend the verification code.')
        }
    }

    const handleGoogleAuth = async () => {
        try {
            const response = await signInWithPopup(auth,provider)
            let User = response.user
            let name = User.displayName
            let email = User.email
            const result = await axios.post(ServerUrl + "/api/auth/google" , {name , email} , {withCredentials:true})
            dispatch(setUserData(result.data))
            


            
        } catch (error) {
            console.log(error)
              dispatch(setUserData(null))
        }
    }
  return (
    <div className={`
      w-full 
      ${isModel ? "py-4" : "min-h-screen bg-[#f3f3f3] flex items-center justify-center px-6 py-20"}
    `}>
        <motion.div 
        initial={{opacity:0 , y:-40}} 
        animate={{opacity:1 , y:0}} 
        transition={{duration:1.05}}
        className={`
        w-full 
        ${isModel ? "max-w-md p-8 rounded-3xl" : "max-w-lg p-12 rounded-4xl"}
        bg-white shadow-2xl border border-gray-200
      `}>
            <div className='flex items-center justify-center gap-3 mb-6'>
                <div className='bg-black text-white p-2 rounded-lg'>
                    <BsRobot size={18}/>

                </div>
                <h2 className='font-semibold text-lg'>QuantumAI</h2>
            </div>

            <h1 className='text-2xl md:text-3xl font-extrabold text-center tracking-[-0.04em] leading-snug mb-4 text-[#16201a]'>
                {authMode === 'register' ? 'Create your account' : authMode === 'verify' ? 'Verify your email' : authMode === 'forgot' ? 'Reset your password' : authMode === 'reset' ? 'Choose a new password' : 'Welcome back'}
            </h1>

            <p className='text-gray-500 text-center text-sm md:text-base leading-relaxed mb-8'>
                {authMode === 'verify'
                    ? `Enter the six-digit code sent to ${verificationEmail}.`
                    : authMode === 'forgot' || authMode === 'reset'
                    ? 'Secure your QuantumAI account and get back to your interview practice.'
                    : 'Sign in to start AI-powered mock interviews, track progress, and unlock detailed performance insights.'}
            </p>

            {authMode !== 'forgot' && authMode !== 'reset' && authMode !== 'verify' && (
                <motion.button
                onClick={handleGoogleAuth}
                whileHover={{opacity:0.9 , scale:1.03}}
                whileTap={{opacity:1 , scale:0.98}}
                className='w-full flex items-center justify-center gap-3 py-3 bg-black text-white rounded-full shadow-md '>
                    <FcGoogle size={20}/>
                    Continue with Google
                </motion.button>
            )}

            {authMode !== 'forgot' && authMode !== 'reset' && authMode !== 'verify' && <div className='flex items-center gap-3 my-5 text-xs text-gray-400'><span className='h-px bg-gray-200 flex-1' />OR<span className='h-px bg-gray-200 flex-1' /></div>}

            <form onSubmit={handlePasswordAuth} className='space-y-3'>
                {authMode === 'register' && <input value={name} onChange={(event) => setName(event.target.value)} placeholder='Full name' required className='w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#9acb76] focus:ring-2 focus:ring-[#d9f7e7]' />}
                {authMode !== 'reset' && authMode !== 'verify' && <input type='email' value={email} onChange={(event) => setEmail(event.target.value)} placeholder='Email address' required className='w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#9acb76] focus:ring-2 focus:ring-[#d9f7e7]' />}
                {authMode === 'verify' && <input type='text' inputMode='numeric' pattern='\d{6}' maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder='6-digit verification code' required className='w-full rounded-2xl border border-gray-200 px-4 py-3 text-center text-xl tracking-[0.35em] outline-none focus:border-[#9acb76] focus:ring-2 focus:ring-[#d9f7e7]' />}
                {authMode !== 'forgot' && authMode !== 'verify' && <input type='password' value={password} onChange={(event) => setPassword(event.target.value)} placeholder='Password (8+ characters)' minLength={8} required className='w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-[#9acb76] focus:ring-2 focus:ring-[#d9f7e7]' />}
                <motion.button type='submit' disabled={loading} whileTap={{scale:0.98}} className='w-full rounded-full bg-[#16201a] py-3 font-semibold text-white transition hover:bg-[#3f772f] disabled:opacity-60'>
                    {loading ? 'Please wait...' : authMode === 'register' ? 'Create account' : authMode === 'verify' ? 'Verify email' : authMode === 'forgot' ? 'Send reset link' : authMode === 'reset' ? 'Reset password' : 'Sign in'}
                </motion.button>
            </form>

            {errorMessage && <p className='mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600'>{errorMessage}</p>}
            {successMessage && <p className='mt-4 rounded-xl bg-green-50 px-3 py-2 text-sm text-green-700'>{successMessage}</p>}
            {resetUrl && <a href={resetUrl} className='mt-3 block break-all text-xs text-[#3f772f] underline'>Open development reset link</a>}

            {authMode === 'verify' && <button type='button' onClick={handleResendVerification} className='mt-4 w-full text-sm text-[#3f772f] hover:underline'>Resend verification code</button>}
            {authMode === 'login' && <button type='button' onClick={() => { setAuthMode('forgot'); setErrorMessage(''); setSuccessMessage('') }} className='mt-4 w-full text-sm text-[#3f772f] hover:underline'>Forgot password?</button>}
            {authMode !== 'reset' && authMode !== 'verify' && <button type='button' onClick={() => { setAuthMode(authMode === 'register' ? 'login' : 'register'); setErrorMessage(''); setSuccessMessage('') }} className='mt-3 w-full text-sm text-gray-500 hover:text-[#16201a]'>
                {authMode === 'register' ? 'Already have an account? Sign in' : authMode === 'forgot' ? 'Back to sign in' : 'New to QuantumAI? Create an account'}
            </button>}
        </motion.div>

      
    </div>
  )
}

export default Auth
