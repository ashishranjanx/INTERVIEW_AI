import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { BsArrowLeft, BsLaptop, BsPhone, BsShieldCheck } from 'react-icons/bs'
import { FaSignOutAlt } from 'react-icons/fa'
import { motion } from 'motion/react'
import { ServerUrl } from '../App'

function Profile() {
    const navigate = useNavigate()
    const [sessions, setSessions] = useState([])
    const [loading, setLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState('')
    const [revoking, setRevoking] = useState('')

    const fetchSessions = async () => {
        try {
            const result = await axios.get(`${ServerUrl}/api/auth/sessions`, { withCredentials: true })
            setSessions(result.data)
        } catch (error) {
            if (error.response?.status === 400 || error.response?.status === 401) {
                navigate('/auth')
                return
            }
            setErrorMessage(error.response?.data?.message || 'Could not load your sessions.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSessions()
    }, [])

    const revokeSession = async (sessionId, isCurrent) => {
        setRevoking(sessionId)
        try {
            await axios.delete(`${ServerUrl}/api/auth/sessions/${sessionId}`, { withCredentials: true })
            if (isCurrent) {
                navigate('/')
                return
            }
            setSessions((currentSessions) => currentSessions.filter((session) => session.sessionId !== sessionId))
        } catch (error) {
            setErrorMessage(error.response?.data?.message || 'Could not revoke this session.')
        } finally {
            setRevoking('')
        }
    }

    const revokeOtherSessions = async () => {
        setRevoking('others')
        try {
            await axios.post(`${ServerUrl}/api/auth/sessions/revoke-others`, {}, { withCredentials: true })
            setSessions((currentSessions) => currentSessions.filter((session) => session.isCurrent))
        } catch (error) {
            setErrorMessage(error.response?.data?.message || 'Could not revoke other sessions.')
        } finally {
            setRevoking('')
        }
    }

    const formatDate = (date) => new Date(date).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    })

    return (
        <div className='min-h-screen bg-[#f5f7f2] px-4 py-8 md:py-12 overflow-hidden'>
            <div className='hero-grid relative max-w-4xl mx-auto rounded-4xl border border-[#dce5d7] p-5 md:p-10'>
                <div className='absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[#d7f36b]/30 blur-3xl' />

                <div className='relative flex items-start gap-4 mb-8'>
                    <button
                        onClick={() => navigate('/')}
                        title='Back to home'
                        className='mt-1 p-3.5 rounded-2xl bg-white border border-[#e1e9df] shadow-sm hover:shadow-md transition'
                    >
                        <BsArrowLeft className='text-[#526159]' />
                    </button>
                    <div>
                        <p className='text-[#3f772f] text-xs font-bold tracking-[0.18em] mb-2'>ACCOUNT SECURITY</p>
                        <h1 className='text-3xl md:text-5xl font-extrabold tracking-[-0.045em] text-[#16201a]'>Session management</h1>
                        <p className='text-[#526159] mt-3'>Review where your QuantumAI account is signed in.</p>
                    </div>
                </div>

                <div className='relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#16201a] text-white rounded-3xl p-5 md:p-6 mb-6'>
                    <div className='flex items-center gap-4'>
                        <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d7f36b] text-[#16201a]'>
                            <BsShieldCheck size={22} />
                        </div>
                        <div>
                            <h2 className='font-bold'>Your active sessions</h2>
                            <p className='text-sm text-white/55'>Keep your account access under control.</p>
                        </div>
                    </div>
                    <button
                        onClick={revokeOtherSessions}
                        disabled={revoking === 'others' || sessions.filter((session) => !session.isCurrent).length === 0}
                        className='rounded-2xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-40 transition'
                    >
                        {revoking === 'others' ? 'Signing out...' : 'Sign out other sessions'}
                    </button>
                </div>

                {errorMessage && <p className='relative mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600'>{errorMessage}</p>}

                {loading ? (
                    <div className='relative rounded-3xl bg-white p-10 text-center text-[#718078]'>Loading sessions...</div>
                ) : sessions.length === 0 ? (
                    <div className='relative rounded-3xl bg-white border border-[#e1e9df] p-10 text-center text-[#718078]'>No session history found.</div>
                ) : (
                    <div className='relative space-y-3'>
                        {sessions.map((session, index) => (
                            <motion.div
                                key={session.sessionId}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.06 }}
                                className='flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl border border-[#e1e9df] bg-white p-5 shadow-sm'
                            >
                                <div className='flex items-center gap-4 min-w-0'>
                                    <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eff9e8] text-[#3f772f]'>
                                        {session.deviceLabel === 'Mobile device' ? <BsPhone size={20} /> : <BsLaptop size={20} />}
                                    </div>
                                    <div className='min-w-0'>
                                        <div className='flex flex-wrap items-center gap-2'>
                                            <h3 className='font-bold text-[#16201a]'>{session.deviceLabel}</h3>
                                            {session.isCurrent && <span className='rounded-lg bg-[#d9f7e7] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#258054]'>Current session</span>}
                                        </div>
                                        <p className='mt-1 text-sm text-[#718078]'>Signed in {formatDate(session.createdAt)}</p>
                                        <p className='mt-1 text-xs text-[#9aa79e]'>Last active {formatDate(session.lastActiveAt)} · {session.ipAddress}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => revokeSession(session.sessionId, session.isCurrent)}
                                    disabled={revoking === session.sessionId}
                                    className='flex items-center justify-center gap-2 rounded-2xl border border-[#e1e9df] px-4 py-2.5 text-sm font-semibold text-[#b34b4b] hover:border-[#efb8b8] hover:bg-[#fff5f5] disabled:opacity-50 transition'
                                >
                                    <FaSignOutAlt size={13} />
                                    {revoking === session.sessionId ? 'Revoking...' : session.isCurrent ? 'Sign out' : 'Revoke'}
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Profile
